const { app } = require('@azure/functions');
const { getContainer, getUser, jsonResponse } = require('../cosmos');

/**
 * Mentor management API.
 *
 * GET  /api/mentor/mentees?ids=id1,id2     — get mentee profiles by IDs
 * GET  /api/mentor/search-players?q=name   — search players by name
 */

/* ── Get Mentee Profiles ─────────────────────────────────── */

app.http('mentor-mentees', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentor/mentees',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const idsParam = new URL(req.url).searchParams.get('ids');
    if (!idsParam) return jsonResponse({ mentees: [] });

    const ids = idsParam.split(',').filter(Boolean).slice(0, 20);
    if (ids.length === 0) return jsonResponse({ mentees: [] });

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    try {
      const params = ids.map((id, i) => ({ name: `@id${i}`, value: id }));
      const inClause = params.map(p => p.name).join(', ');

      const { resources } = await container.items.query({
        query: `SELECT c.data.id AS id, c.data.name AS name, c.data.photoUrl AS photoUrl
                FROM c
                WHERE c.docType = 'profile'
                  AND c.data.role = 'player'
                  AND c.data.id IN (${inClause})`,
        parameters: params,
      }).fetchAll();

      return jsonResponse({
        mentees: resources.map(p => ({
          id: p.id,
          name: p.name,
          photoUrl: p.photoUrl,
        })),
      });
    } catch (err) {
      return jsonResponse({ error: 'Failed to load mentees' }, 500);
    }
  },
});

/* ── Search Players ──────────────────────────────────────── */

app.http('mentor-search-players', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'mentor/search-players',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const query = new URL(req.url).searchParams.get('q');
    if (!query || query.length < 2) return jsonResponse({ players: [] });

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    try {
      const { resources } = await container.items.query({
        query: `SELECT c.data.id AS id, c.data.name AS name, c.data.photoUrl AS photoUrl
                FROM c
                WHERE c.docType = 'profile'
                  AND c.data.role = 'player'
                  AND CONTAINS(LOWER(c.data.name), @search)
                OFFSET 0 LIMIT 10`,
        parameters: [{ name: '@search', value: query.toLowerCase() }],
      }).fetchAll();

      return jsonResponse({
        players: resources.map(p => ({
          id: p.id,
          name: p.name,
          photoUrl: p.photoUrl,
        })),
      });
    } catch (err) {
      return jsonResponse({ error: 'Search failed' }, 500);
    }
  },
});
