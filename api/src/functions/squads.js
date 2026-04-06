const { app } = require('@azure/functions');
const { getSquadsContainer, getUser, jsonResponse } = require('../cosmos');
const { randomUUID } = require('crypto');

/**
 * Squad CRUD — FIFA Tier 3 (season-bound rosters).
 *
 * GET    /api/squads?teamId=xxx                 — list all squads for a team
 * GET    /api/squads?teamId=xxx&season=2025/26  — get specific season squad
 * POST   /api/squads                            — create new squad
 * PUT    /api/squads/:id?teamId=xxx             — update squad (add/remove players, change season)
 * DELETE /api/squads/:id?teamId=xxx             — delete squad
 */
app.http('squads', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'squads',
  handler: async (req) => {
    if (req.method === 'GET') return handleList(req);
    return handleCreate(req);
  },
});

app.http('squads-item', {
  methods: ['PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'squads/{id}',
  handler: async (req) => {
    if (req.method === 'PUT') return handleUpdate(req);
    return handleDelete(req);
  },
});

/* ── GET /api/squads?teamId=xxx&season=2025/26 ──────────── */

async function handleList(req) {
  const user = getUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const container = await getSquadsContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  const url = new URL(req.url);
  const teamId = url.searchParams.get('teamId');
  const season = url.searchParams.get('season');

  if (!teamId) {
    return jsonResponse({ error: 'teamId is required' }, 400);
  }

  try {
    let query = 'SELECT * FROM c WHERE c.teamId = @teamId';
    const params = [{ name: '@teamId', value: teamId }];

    if (season) {
      query += ' AND c.season = @season';
      params.push({ name: '@season', value: season });
    }

    query += ' ORDER BY c.season DESC';

    const { resources } = await container.items.query({
      query,
      parameters: params,
    }).fetchAll();

    return jsonResponse({ squads: resources, count: resources.length });
  } catch (err) {
    console.error('Squads list failed:', err.message);
    return jsonResponse({ error: 'List failed' }, 500);
  }
}

/* ── POST /api/squads ───────────────────────────────────── */

async function handleCreate(req) {
  const user = getUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const container = await getSquadsContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { teamId, teamName, clubId, clubName, season, maxSize, players } = body;

  if (!teamId || typeof teamId !== 'string') {
    return jsonResponse({ error: 'teamId is required' }, 400);
  }
  if (!season || typeof season !== 'string' || season.length > 20) {
    return jsonResponse({ error: 'season is required (max 20 chars)' }, 400);
  }

  // Check for duplicate season
  const { resources: existing } = await container.items.query({
    query: 'SELECT c.id FROM c WHERE c.teamId = @teamId AND c.season = @season',
    parameters: [
      { name: '@teamId', value: teamId },
      { name: '@season', value: season },
    ],
  }).fetchAll();

  if (existing.length > 0) {
    return jsonResponse({ error: 'Squad for this season already exists', existingId: existing[0].id }, 409);
  }

  const now = new Date().toISOString();
  const squad = {
    id: randomUUID(),
    teamId,
    teamName: teamName || '',
    clubId: clubId || undefined,
    clubName: clubName || undefined,
    season,
    players: Array.isArray(players) ? validatePlayers(players) : [],
    maxSize: Number.isInteger(maxSize) && maxSize > 0 && maxSize <= 50 ? maxSize : 25,
    coachId: user.userId,
    coachName: body.coachName || undefined,
    registeredAt: undefined,
    createdAt: now,
    updatedAt: now,
  };

  await container.items.create(squad);
  return jsonResponse(squad, 201);
}

/* ── PUT /api/squads/:id?teamId=xxx ─────────────────────── */

async function handleUpdate(req) {
  const user = getUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const container = await getSquadsContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  const id = req.params.id;
  const url = new URL(req.url);
  const teamId = url.searchParams.get('teamId');

  if (!teamId) return jsonResponse({ error: 'teamId query param required (partition key)' }, 400);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  try {
    const { resource: existing } = await container.item(id, teamId).read();
    if (!existing) return jsonResponse({ error: 'Squad not found' }, 404);

    const now = new Date().toISOString();
    const updated = {
      ...existing,
      players: body.players !== undefined ? validatePlayers(body.players) : existing.players,
      maxSize: body.maxSize !== undefined && Number.isInteger(body.maxSize) ? body.maxSize : existing.maxSize,
      season: body.season || existing.season,
      coachName: body.coachName !== undefined ? body.coachName : existing.coachName,
      registeredAt: body.registeredAt !== undefined ? body.registeredAt : existing.registeredAt,
      updatedAt: now,
    };

    await container.item(id, teamId).replace(updated);
    return jsonResponse(updated);
  } catch (err) {
    if (err.code === 404) return jsonResponse({ error: 'Squad not found' }, 404);
    console.error('Squad update failed:', err.message);
    return jsonResponse({ error: 'Update failed' }, 500);
  }
}

/* ── DELETE /api/squads/:id?teamId=xxx ──────────────────── */

async function handleDelete(req) {
  const user = getUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const container = await getSquadsContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  const id = req.params.id;
  const url = new URL(req.url);
  const teamId = url.searchParams.get('teamId');

  if (!teamId) return jsonResponse({ error: 'teamId query param required' }, 400);

  try {
    await container.item(id, teamId).delete();
    return jsonResponse({ deleted: true });
  } catch (err) {
    if (err.code === 404) return jsonResponse({ error: 'Squad not found' }, 404);
    console.error('Squad delete failed:', err.message);
    return jsonResponse({ error: 'Delete failed' }, 500);
  }
}

/* ── Helpers ────────────────────────────────────────────── */

const VALID_STATUS = ['active', 'injured', 'suspended', 'released'];

function validatePlayers(players) {
  if (!Array.isArray(players)) return [];
  return players
    .filter((p) => p && typeof p.playerId === 'string' && typeof p.playerName === 'string')
    .map((p) => ({
      playerId: p.playerId,
      playerName: String(p.playerName).trim().substring(0, 100),
      jerseyNumber: Number.isInteger(p.jerseyNumber) && p.jerseyNumber > 0 && p.jerseyNumber <= 99 ? p.jerseyNumber : undefined,
      positions: Array.isArray(p.positions) ? p.positions.filter((pos) => typeof pos === 'string').slice(0, 5) : [],
      birthDate: typeof p.birthDate === 'string' ? p.birthDate : '',
      photoUrl: typeof p.photoUrl === 'string' ? p.photoUrl : undefined,
      joinedAt: typeof p.joinedAt === 'string' ? p.joinedAt : new Date().toISOString(),
      leftAt: typeof p.leftAt === 'string' ? p.leftAt : undefined,
      status: VALID_STATUS.includes(p.status) ? p.status : 'active',
    }))
    .slice(0, 50); // Safety cap
}
