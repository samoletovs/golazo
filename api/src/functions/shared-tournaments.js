const { app } = require('@azure/functions');
const { getTournamentsContainer, getUser, jsonResponse } = require('../cosmos');
const { randomUUID } = require('crypto');

/**
 * GET  /api/shared-tournaments?team=RĪGAS+FS — discover tournaments by team name
 * GET  /api/shared-tournaments/:id — get a specific shared tournament
 * POST /api/shared-tournaments — create or join a shared tournament
 * POST /api/shared-tournaments/:id/join — join an existing shared tournament
 */

/* ── GET /api/shared-tournaments ─────────────────────────── */
app.http('shared-tournaments-list', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shared-tournaments',
  handler: async (req) => {
    const container = await getTournamentsContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const url = new URL(req.url);
    const teamFilter = (url.searchParams.get('team') || '').trim();
    const statusFilter = url.searchParams.get('status') || '';

    try {
      let query = 'SELECT * FROM c';
      const conditions = [];
      const params = [];

      if (statusFilter && ['upcoming', 'live', 'completed'].includes(statusFilter)) {
        conditions.push('c.status = @status');
        params.push({ name: '@status', value: statusFilter });
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY c.startDate DESC';

      const { resources } = await container.items.query({ query, parameters: params }).fetchAll();

      let results = resources;

      // Filter by team name if provided (check participants + game team names)
      if (teamFilter) {
        const norm = teamFilter.toLowerCase();
        results = results.filter((t) =>
          t.participants?.some((p) => p.teamName.toLowerCase().includes(norm)) ||
          Object.values(t.games || {}).flat().some((g) =>
            g.home?.toLowerCase().includes(norm) || g.away?.toLowerCase().includes(norm)
          )
        );
      }

      // Strip heavy game data from list response (send only metadata)
      const lite = results.map((t) => ({
        id: t.id,
        name: t.name,
        sourceUrl: t.sourceUrl,
        classes: t.classes,
        startDate: t.startDate,
        endDate: t.endDate,
        location: t.location,
        status: t.status,
        participantCount: t.participants?.length || 0,
        teams: [...new Set(
          Object.values(t.games || {}).flat().flatMap((g) => [g.home, g.away])
        )].sort(),
      }));

      return jsonResponse({ tournaments: lite, count: lite.length });
    } catch (err) {
      console.error('Shared tournaments list failed:', err.message);
      return jsonResponse({ error: 'Failed to list tournaments' }, 500);
    }
  },
});

/* ── GET /api/shared-tournaments/:id ─────────────────────── */
app.http('shared-tournaments-get', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'shared-tournaments/{id}',
  handler: async (req) => {
    const container = await getTournamentsContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const id = req.params.id;
    try {
      // Query by id (we don't know the partition key value from the route)
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      }).fetchAll();

      if (resources.length === 0) {
        return jsonResponse({ error: 'Tournament not found' }, 404);
      }
      return jsonResponse(resources[0]);
    } catch (err) {
      console.error('Shared tournament get failed:', err.message);
      return jsonResponse({ error: 'Failed to get tournament' }, 500);
    }
  },
});

/* ── POST /api/shared-tournaments — create shared tournament ── */
app.http('shared-tournaments-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shared-tournaments',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getTournamentsContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const { sourceUrl, name, classes, startDate, endDate, location, games, teamName, className, rules } = body;

    if (!sourceUrl || !name) {
      return jsonResponse({ error: 'sourceUrl and name are required' }, 400);
    }

    // Check if shared tournament already exists for this URL
    const { resources: existing } = await container.items.query({
      query: 'SELECT c.id, c.sourceUrl FROM c WHERE c.sourceUrl = @url',
      parameters: [{ name: '@url', value: sourceUrl }],
    }).fetchAll();

    if (existing.length > 0) {
      // Tournament exists — return it (caller should use /join endpoint)
      return jsonResponse({ existing: true, id: existing[0].id }, 409);
    }

    // Determine status from dates
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    let status = 'upcoming';
    if (now >= start && now <= new Date(end.getTime() + 86400000)) status = 'live';
    else if (now > end) status = 'completed';

    const tournament = {
      id: randomUUID(),
      sourceUrl,
      name: name.trim(),
      classes: Array.isArray(classes) ? classes : [],
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || startDate || new Date().toISOString().slice(0, 10),
      location: location?.trim() || '',
      status,
      rules: rules || undefined,
      games: games || {},
      participants: teamName ? [{
        userId: user.userId,
        playerId: user.userId,
        teamName: teamName.trim(),
        className: className || '',
        joinedAt: new Date().toISOString(),
      }] : [],
      lastScrapedAt: undefined,
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
    };

    await container.items.create(tournament);
    return jsonResponse(tournament, 201);
  },
});

/* ── POST /api/shared-tournaments/:id/join ───────────────── */
app.http('shared-tournaments-join', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'shared-tournaments/{id}/join',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getTournamentsContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const id = req.params.id;
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const { teamName, className, playerId } = body;
    if (!teamName) {
      return jsonResponse({ error: 'teamName is required' }, 400);
    }

    try {
      // Find the tournament
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id',
        parameters: [{ name: '@id', value: id }],
      }).fetchAll();

      if (resources.length === 0) {
        return jsonResponse({ error: 'Tournament not found' }, 404);
      }

      const tournament = resources[0];

      // Check if already joined
      const alreadyJoined = tournament.participants?.some(
        (p) => p.userId === user.userId && p.teamName === teamName
      );
      if (alreadyJoined) {
        return jsonResponse({ message: 'Already joined', tournament }, 200);
      }

      // Add participant
      const participant = {
        userId: user.userId,
        playerId: playerId || user.userId,
        teamName: teamName.trim(),
        className: className || '',
        joinedAt: new Date().toISOString(),
      };

      tournament.participants = [...(tournament.participants || []), participant];

      // Upsert
      await container.item(tournament.id, tournament.sourceUrl).replace(tournament);

      // Return games for this team so client can create ScheduleEvents
      const teamGames = [];
      for (const [cls, games] of Object.entries(tournament.games || {})) {
        if (className && cls !== className) continue;
        const norm = teamName.trim().toLowerCase();
        for (const game of games) {
          if (game.home?.toLowerCase().includes(norm) || game.away?.toLowerCase().includes(norm)) {
            teamGames.push({ ...game, className: cls });
          }
        }
      }

      return jsonResponse({
        joined: true,
        participant,
        tournament: {
          id: tournament.id,
          name: tournament.name,
          startDate: tournament.startDate,
          endDate: tournament.endDate,
          location: tournament.location,
        },
        games: teamGames,
      });
    } catch (err) {
      console.error('Join tournament failed:', err.message);
      return jsonResponse({ error: 'Failed to join tournament' }, 500);
    }
  },
});
