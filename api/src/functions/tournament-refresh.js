const { app } = require('@azure/functions');
const { getTournamentsContainer, getContainer, jsonResponse } = require('../cosmos');

/**
 * Timer-triggered function: refresh live tournaments every 30 minutes.
 *
 * 1. Finds all shared tournaments with status='live'
 * 2. Re-scrapes the tournament URL for updated fixtures
 * 3. Detects new games (e.g. playoff bracket filled in after group stage)
 * 4. For each participant whose team has new games:
 *    → Auto-creates ScheduleEvent in their per-user data
 *
 * Schedule: every 30 min during typical tournament hours (07:00-22:00 UTC)
 * NCRONTAB: {second} {minute} {hour} {day} {month} {day-of-week}
 */
app.timer('tournament-refresh', {
  schedule: '0 */30 7-22 * * *',
  handler: async (_timer, context) => {
    const tournamentsContainer = await getTournamentsContainer();
    if (!tournamentsContainer) {
      context.log('Tournament refresh: Cosmos not configured, skipping');
      return;
    }

    try {
      // Find live tournaments
      const { resources: liveTournaments } = await tournamentsContainer.items.query({
        query: 'SELECT * FROM c WHERE c.status = @status',
        parameters: [{ name: '@status', value: 'live' }],
      }).fetchAll();

      context.log(`Tournament refresh: ${liveTournaments.length} live tournaments found`);

      for (const tournament of liveTournaments) {
        try {
          await refreshTournament(tournament, tournamentsContainer, context);
        } catch (err) {
          context.warn(`Failed to refresh ${tournament.name}: ${err.message}`);
        }
      }

      // Also check if any live tournaments should be marked completed
      const now = new Date();
      for (const tournament of liveTournaments) {
        const endDate = new Date(tournament.endDate);
        // Mark completed if end date was more than 1 day ago
        if (now > new Date(endDate.getTime() + 86400000)) {
          tournament.status = 'completed';
          await tournamentsContainer.item(tournament.id, tournament.sourceUrl).replace(tournament);
          context.log(`Marked tournament ${tournament.name} as completed`);
        }
      }
    } catch (err) {
      context.error(`Tournament refresh failed: ${err.message}`);
    }
  },
});

/**
 * Refresh a single live tournament: re-scrape, detect new games, update participants.
 */
async function refreshTournament(tournament, tournamentsContainer, context) {
  if (!tournament.sourceUrl) return;

  // Don't scrape more than once per 25 minutes
  if (tournament.lastScrapedAt) {
    const sinceLastScrape = Date.now() - new Date(tournament.lastScrapedAt).getTime();
    if (sinceLastScrape < 25 * 60 * 1000) return;
  }

  context.log(`Refreshing: ${tournament.name} (${tournament.sourceUrl})`);

  // Fetch the fixtures page
  let html;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(tournament.sourceUrl + '/fixtures', {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Golazo/1.0)', Accept: 'text/html' },
    });
    clearTimeout(timeout);
    if (!res.ok) return;
    html = await res.text();
  } catch {
    return; // network error — skip this cycle
  }

  // Parse all games from the page
  const newGames = parseGamesFromHtml(html);
  if (newGames.length === 0) return;

  // Detect truly new games (not in existing data)
  const existingGameKeys = new Set();
  for (const games of Object.values(tournament.games || {})) {
    for (const g of games) {
      existingGameKeys.add(`${g.date}|${g.time}|${g.home}|${g.away}`);
    }
  }

  const freshGames = newGames.filter((g) =>
    !existingGameKeys.has(`${g.date}|${g.time}|${g.home}|${g.away}`)
  );

  // Also check for score updates on existing games
  let scoresUpdated = 0;
  for (const [className, games] of Object.entries(tournament.games || {})) {
    for (const existing of games) {
      if (existing.finished) continue;
      const match = newGames.find((g) =>
        g.date === existing.date && g.time === existing.time &&
        g.home === existing.home && g.away === existing.away
      );
      if (match && match.finished && match.homeScore !== undefined) {
        existing.homeScore = match.homeScore;
        existing.awayScore = match.awayScore;
        existing.finished = true;
        scoresUpdated++;
      }
    }
  }

  if (freshGames.length === 0 && scoresUpdated === 0) return;

  // Add new games to the tournament
  if (freshGames.length > 0) {
    const defaultClass = tournament.classes?.[0] || 'default';
    if (!tournament.games) tournament.games = {};
    if (!tournament.games[defaultClass]) tournament.games[defaultClass] = [];
    tournament.games[defaultClass].push(...freshGames.map((g) => ({
      date: g.date, time: g.time, home: g.home, away: g.away,
      venue: g.venue, homeScore: g.homeScore, awayScore: g.awayScore,
      stage: 'unknown', finished: g.finished,
    })));
  }

  tournament.lastScrapedAt = new Date().toISOString();
  await tournamentsContainer.item(tournament.id, tournament.sourceUrl).replace(tournament);

  context.log(`Updated ${tournament.name}: ${freshGames.length} new games, ${scoresUpdated} scores updated`);

  // Auto-create schedule events for participants with new games
  if (freshGames.length > 0) {
    await syncNewGamesToParticipants(tournament, freshGames, context);
  }
}

/**
 * For each participant, check if new games involve their team → create ScheduleEvents.
 */
async function syncNewGamesToParticipants(tournament, newGames, context) {
  const userContainer = await getContainer();
  if (!userContainer) return;

  for (const participant of (tournament.participants || [])) {
    const norm = participant.teamName.toLowerCase();
    const myNewGames = newGames.filter((g) =>
      g.home?.toLowerCase().includes(norm) || g.away?.toLowerCase().includes(norm) ||
      norm.includes(g.home?.toLowerCase()) || norm.includes(g.away?.toLowerCase())
    );

    if (myNewGames.length === 0) continue;

    const currentYear = new Date().getFullYear();
    for (const game of myNewGames) {
      const [day, month] = (game.date || '').split('.');
      if (!day || !month) continue;
      const dateStr = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const isHome = game.home?.toLowerCase().includes(norm) || norm.includes(game.home?.toLowerCase());
      const opponent = isHome ? game.away : game.home;

      const eventId = `auto-${tournament.id}-${game.date}-${game.time}-${opponent}`.replace(/[^a-zA-Z0-9-]/g, '');

      const scheduleDoc = {
        id: `${participant.userId}:schedule:${eventId}`,
        userId: participant.userId,
        docType: 'schedule',
        data: {
          id: eventId,
          familyId: participant.userId,
          playerId: participant.playerId,
          type: 'match',
          title: `${game.home} vs ${game.away}`,
          date: dateStr,
          startTime: game.time || '00:00',
          location: game.venue || tournament.location || '',
          opponent,
          competition: tournament.name,
          tournamentId: tournament.id,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      try {
        await userContainer.items.upsert(scheduleDoc);
      } catch (err) {
        context.warn(`Failed to create schedule event for ${participant.userId}: ${err.message}`);
      }
    }

    context.log(`Created ${myNewGames.length} schedule events for ${participant.teamName} (${participant.userId})`);
  }
}

/**
 * Simple HTML table parser for tournament fixtures.
 * Handles turniir.ee format: "DD.MM HH:MM (F) | HOME - AWAY | VENUE | SCORE"
 */
function parseGamesFromHtml(html) {
  const games = [];
  // Match table rows with date/time, teams, and optional score
  const rowRegex = /(\d{2}\.\d{2})\s+(\d{2}:\d{2})\s*(?:\(F\))?\s*\|\s*([^|]+?)\s*-\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*(\d+\s*-\s*\d+)?/g;

  // Also try HTML table patterns
  const tdRegex = /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
  let match;

  // Try raw text pattern first (turniir.ee renders tables as text-like)
  const textLines = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const linePattern = /(\d{2}\.\d{2})\s+(\d{2}:\d{2})\s*\(F\)\s+([^-\d][^-]*?)\s+-\s+([^|]*?)\s+([A-Z][A-Z\s]+\d?)\s+(\d+\s*-\s*\d+)/g;

  while ((match = linePattern.exec(textLines)) !== null) {
    const [, date, time, home, away, venue, score] = match;
    const [hs, as] = score ? score.split(/\s*-\s*/).map(Number) : [undefined, undefined];
    games.push({
      date, time: time.trim(),
      home: home.trim(), away: away.trim(),
      venue: venue.trim(),
      homeScore: isNaN(hs) ? undefined : hs,
      awayScore: isNaN(as) ? undefined : as,
      finished: true,
    });
  }

  // If text parsing found nothing, try simpler score-update pattern
  if (games.length === 0) {
    const simplePattern = /(\d{2}\.\d{2})\s+(\d{2}:\d{2})/g;
    // Fallback — can't parse this format, leave empty
  }

  return games;
}
