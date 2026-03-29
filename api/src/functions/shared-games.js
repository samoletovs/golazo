const { app } = require('@azure/functions');
const { getClient, getUser, jsonResponse } = require('../cosmos');
const { randomUUID } = require('crypto');

let _gamesContainer = null;

async function getGamesContainer() {
  if (_gamesContainer) return _gamesContainer;
  const client = getClient();
  if (!client) return null;
  const database = process.env.COSMOS_DATABASE || 'golazo';
  const db = client.database(database);
  _gamesContainer = db.container('shared-games');
  return _gamesContainer;
}

/**
 * GET  /api/shared-games?team=RFS&from=2026-03-01&to=2026-04-30
 *   → Returns shared games for a team within date range
 *
 * POST /api/shared-games
 *   → Create a shared game (planned match) visible to team members
 */

/* ── GET /api/shared-games ─────────────────────────────────── */
app.http('shared-games-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shared-games',
  handler: async (req) => {
    const container = await getGamesContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const url = new URL(req.url);
    const team = (url.searchParams.get('team') || '').trim();
    const from = url.searchParams.get('from') || '';
    const to = url.searchParams.get('to') || '';

    if (!team) return jsonResponse({ error: 'team parameter is required' }, 400);

    try {
      // Query games where this team is involved (as home team name match)
      // Partition key is teamKey (normalized team name)
      const teamKey = normalizeTeamKey(team);
      let query = 'SELECT * FROM c WHERE c.teamKey = @teamKey';
      const params = [{ name: '@teamKey', value: teamKey }];

      if (from) {
        query += ' AND c.date >= @from';
        params.push({ name: '@from', value: from });
      }
      if (to) {
        query += ' AND c.date <= @to';
        params.push({ name: '@to', value: to });
      }

      query += ' ORDER BY c.date ASC';

      const { resources } = await container.items.query({
        query,
        parameters: params,
      }).fetchAll();

      return jsonResponse({ games: resources, count: resources.length });
    } catch (err) {
      console.error('Shared games list failed:', err.message);
      return jsonResponse({ error: 'Failed to list games' }, 500);
    }
  },
});

/* ── POST /api/shared-games ────────────────────────────────── */
app.http('shared-games-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shared-games',
  handler: async (req) => {
    const user = getUser(req);
    // Allow anonymous for now (SWA auth optional)
    const userId = user?.userId || 'anonymous';

    const container = await getGamesContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const { teamName, opponent, date, startTime, endTime, location, matchType, competition, title } = body;

    if (!teamName || !date) {
      return jsonResponse({ error: 'teamName and date are required' }, 400);
    }

    const teamKey = normalizeTeamKey(teamName);

    // Check for duplicate (same team + opponent + date + time)
    try {
      const { resources: existing } = await container.items.query({
        query: 'SELECT c.id FROM c WHERE c.teamKey = @teamKey AND c.date = @date AND c.opponent = @opponent AND c.startTime = @startTime',
        parameters: [
          { name: '@teamKey', value: teamKey },
          { name: '@date', value: date },
          { name: '@opponent', value: opponent || '' },
          { name: '@startTime', value: startTime || '' },
        ],
      }).fetchAll();

      if (existing.length > 0) {
        // Game already exists — just add this user as participant
        const gameId = existing[0].id;
        const { resource: game } = await container.item(gameId, teamKey).read();
        if (game && !game.participants?.some((p) => p.userId === userId)) {
          game.participants = [...(game.participants || []), { userId, joinedAt: new Date().toISOString() }];
          await container.item(gameId, teamKey).replace(game);
        }
        return jsonResponse({ existing: true, game: game || existing[0] });
      }
    } catch (err) {
      console.warn('Dedup check failed, proceeding:', err.message);
    }

    // Create new shared game
    const game = {
      id: randomUUID(),
      teamKey,
      teamName: teamName.trim(),
      opponent: (opponent || '').trim(),
      date,
      startTime: startTime || '',
      endTime: endTime || '',
      location: (location || '').trim(),
      matchType: matchType || 'friendly',
      competition: (competition || '').trim(),
      title: (title || '').trim(),
      participants: [{ userId, joinedAt: new Date().toISOString() }],
      createdBy: userId,
      createdAt: new Date().toISOString(),
    };

    try {
      await container.items.create(game);
      return jsonResponse(game, 201);
    } catch (err) {
      // If container doesn't exist yet, return gracefully
      if (err.code === 404) {
        console.warn('shared-games container does not exist yet');
        return jsonResponse({ error: 'Shared games not available yet' }, 503);
      }
      console.error('Shared game create failed:', err.message);
      return jsonResponse({ error: 'Failed to create game' }, 500);
    }
  },
});

/** Normalize team name for partition key: lowercase, strip accents, trim */
function normalizeTeamKey(name) {
  return name.toLowerCase().trim()
    .replace(/[āàâä]/g, 'a').replace(/[čć]/g, 'c').replace(/[ēėèêë]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[īìîï]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[ōõöò]/g, 'o')
    .replace(/[šś]/g, 's').replace(/[ūùûü]/g, 'u').replace(/[žź]/g, 'z')
    .replace(/\s+/g, ' ');
}
