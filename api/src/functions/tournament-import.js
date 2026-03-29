const { app } = require('@azure/functions');
const { getUser, jsonResponse } = require('../cosmos');

/**
 * POST /api/tournament-import — fetch a tournament URL and parse fixtures.
 *
 * Body: { url: string, teamName: string }
 * Returns: { tournament: string, games: Array<{ date, time, home, away, venue }> }
 *
 * This is a stateless parsing endpoint — the client decides what to save.
 * No auth required for the parse itself, but we check user for rate limiting.
 */
app.http('tournament-import', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'tournament-import',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { url, teamName } = body;
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      return jsonResponse({ error: 'Valid HTTPS URL is required' }, 400);
    }
    if (!teamName || typeof teamName !== 'string' || teamName.length > 100) {
      return jsonResponse({ error: 'Team name is required (max 100 chars)' }, 400);
    }

    try {
      const html = await fetchPage(url);
      const tournamentName = extractTournamentName(html, url);
      const allGames = parseFixtures(html);

      if (allGames.length === 0) {
        return jsonResponse({ error: 'No fixtures found on this page. The format may not be supported.' }, 422);
      }

      // Filter by team name (fuzzy, accent-insensitive)
      const filtered = allGames.filter((g) =>
        teamMatches(`${g.home} - ${g.away}`, teamName)
      );

      // Export all team names for helpful error messages
      const allTeams = [...new Set(allGames.flatMap((g) => [g.home, g.away]))].sort();

      return jsonResponse({
        tournament: tournamentName,
        totalGames: allGames.length,
        matchedGames: filtered.length,
        games: filtered,
        allTeams,
      });
    } catch (err) {
      console.error('Tournament import failed:', err.message);
      return jsonResponse({ error: `Failed to fetch page: ${err.message}` }, 502);
    }
  },
});

/* ── HTML fetching ────────────────────────────────────────── */

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Golazo/1.0)',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Tournament name extraction ───────────────────────────── */

function extractTournamentName(html, url) {
  // Try <title> tag first
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    let title = titleMatch[1].trim();
    // Clean common suffixes
    title = title.replace(/\s*[|\-–—]\s*(Turniir|Tournament Manager|SportData|Tournify).*$/i, '').trim();
    title = title.replace(/\s*-\s*Fixtures.*$/i, '').trim();
    if (title.length > 3 && title.length < 100) return title;
  }

  // Fallback: <h1> or <h2>
  const headingMatch = html.match(/<h[12][^>]*>([^<]{3,80})<\/h[12]>/i);
  if (headingMatch) return headingMatch[1].trim();

  // Last resort: domain name
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname.split('.')[0];
  } catch {
    return 'Tournament';
  }
}

/* ── Fixture table parsing ────────────────────────────────── */

/**
 * Parse HTML fixture tables. Supports multiple formats:
 * - turniir.ee: <table> with date | teams | venue | score columns
 * - Generic: any <table> with recognizable date/time + "team - team" patterns
 */
function parseFixtures(html) {
  const games = [];

  // Extract <tr> rows
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let rowMatch;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = [];
    let cellMatch;
    // Reset lastIndex for cell regex
    cellRe.lastIndex = 0;
    while ((cellMatch = cellRe.exec(rowHtml)) !== null) {
      // Strip HTML tags, collapse whitespace
      let text = cellMatch[1].replace(/<[^>]+>/g, ' ').trim();
      text = text.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
      text = text.replace(/&#?\w+;/g, '').replace(/\s+/g, ' ').trim();
      cells.push(text);
    }

    if (cells.length < 3) continue;

    // Try to match fixture pattern in cells
    const game = tryParseFixtureRow(cells);
    if (game) games.push(game);
  }

  return games;
}

/**
 * Try to parse a table row as a fixture.
 * Expects: [dateTime, teams, venue, score?] or similar patterns.
 */
function tryParseFixtureRow(cells) {
  // Look for a cell with date+time pattern: "28.03 14:40" or "28.03 14:40 (F)"
  let dateCell = null;
  let dateCellIdx = -1;
  for (let i = 0; i < Math.min(cells.length, 3); i++) {
    if (/\d{1,2}\.\d{1,2}\s+\d{1,2}:\d{2}/.test(cells[i])) {
      dateCell = cells[i];
      dateCellIdx = i;
      break;
    }
  }
  if (!dateCell) return null;

  // Parse date and time
  const dtMatch = dateCell.match(/(\d{1,2}\.\d{1,2})\s+(\d{1,2}:\d{2})\s*(\(F\))?/);
  if (!dtMatch) return null;

  const date = dtMatch[1]; // "28.03"
  const time = dtMatch[2]; // "14:40"
  const finished = !!dtMatch[3];

  // Teams cell: next cell after date
  const teamsCell = cells[dateCellIdx + 1] || '';
  const teamMatch = teamsCell.match(/^(.+?)\s*-\s*(.+)$/);
  if (!teamMatch) return null;

  const home = teamMatch[1].trim();
  const away = teamMatch[2].trim();
  if (!home || !away) return null;

  // Venue: next cell
  const venue = (cells[dateCellIdx + 2] || '').trim();

  // Score: next cell if exists
  const score = (cells[dateCellIdx + 3] || '-').trim();

  return { date, time, home, away, venue, score, finished };
}

/* ── Team name matching (fuzzy, accent-insensitive) ───────── */

function normalizeTeam(name) {
  let n = name.toLowerCase().trim();
  const accents = { 'ā': 'a', 'č': 'c', 'ē': 'e', 'ģ': 'g', 'ī': 'i', 'ķ': 'k', 'ļ': 'l', 'ņ': 'n', 'š': 's', 'ū': 'u', 'ž': 'z', 'ö': 'o', 'ä': 'a', 'ü': 'u', 'õ': 'o' };
  for (const [src, dst] of Object.entries(accents)) {
    n = n.replaceAll(src, dst);
  }
  return n.replace(/\s+/g, ' ').trim();
}

function teamMatches(gameTeams, filter) {
  const normFilter = normalizeTeam(filter);
  const normGame = normalizeTeam(gameTeams);
  const parts = normGame.split(/\s*-\s*/);
  for (const part of parts) {
    if (normFilter.includes(part.trim()) || part.trim().includes(normFilter)) return true;
  }
  return normFilter.includes(normGame) || normGame.includes(normFilter);
}
