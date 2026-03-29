const { app } = require('@azure/functions');
const { getTeamsContainer, getUser, jsonResponse } = require('../cosmos');
const { randomUUID } = require('crypto');

/**
 * GET  /api/teams?country=LV&q=search — search/browse shared teams
 * POST /api/teams — add a new team (auth required, auto-verifies)
 */
app.http('teams', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'teams',
  handler: async (req) => {
    if (req.method === 'GET') return handleSearch(req);
    return handleCreate(req);
  },
});

/* ── GET /api/teams?country=LV&q=RFS&limit=20 ──────────── */

async function handleSearch(req) {
  const container = await getTeamsContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  const url = new URL(req.url);
  const country = (url.searchParams.get('country') || '').toUpperCase();
  const q = (url.searchParams.get('q') || '').trim();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

  // Build query
  let query = 'SELECT * FROM c';
  const params = [];
  const conditions = [];

  if (country && /^[A-Z]{2}$/.test(country)) {
    conditions.push('c.country = @country');
    params.push({ name: '@country', value: country });
  }

  if (q) {
    // Search in name and abbreviation (case-insensitive via CONTAINS)
    conditions.push(
      '(CONTAINS(UPPER(c.name), @q) OR CONTAINS(UPPER(c.abbreviation ?? ""), @q))'
    );
    params.push({ name: '@q', value: q.toUpperCase() });
  }

  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY c.name';

  try {
    const { resources } = await container.items.query({
      query,
      parameters: params,
    }).fetchAll();
    // Client-side: also match aliases + limit
    let results = resources;
    if (q) {
      const normQ = q.toUpperCase();
      results = resources.filter((t) =>
        t.name?.toUpperCase().includes(normQ) ||
        t.abbreviation?.toUpperCase().includes(normQ) ||
        t.aliases?.some((a) => a.toUpperCase().includes(normQ))
      );
    }
    return jsonResponse({ teams: results.slice(0, limit), count: Math.min(results.length, limit) });
  } catch (err) {
    console.error('Teams search failed:', err.message);

    // Fallback: fetch all teams in country (simple query)
    try {
      const simpleQuery = country
        ? 'SELECT * FROM c WHERE c.country = @country ORDER BY c.name'
        : 'SELECT * FROM c ORDER BY c.name';
      const simpleParams = country ? [{ name: '@country', value: country }] : [];
      const { resources } = await container.items.query({ query: simpleQuery, parameters: simpleParams }).fetchAll();
      
      let results = resources;
      if (q) {
        const normQ = q.toUpperCase();
        results = resources.filter((t) =>
          t.name?.toUpperCase().includes(normQ) ||
          t.abbreviation?.toUpperCase().includes(normQ) ||
          t.aliases?.some((a) => a.toUpperCase().includes(normQ))
        );
      }
      return jsonResponse({ teams: results.slice(0, limit), count: Math.min(results.length, limit) });
    } catch (err2) {
      return jsonResponse({ error: 'Search failed' }, 500);
    }
  }
}

/* ── POST /api/teams ────────────────────────────────────── */

async function handleCreate(req) {
  const user = getUser(req);
  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const container = await getTeamsContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { name, country, city, website, logoUrl, abbreviation, league, aliases } = body;
  if (!name || typeof name !== 'string' || name.length > 100) {
    return jsonResponse({ error: 'Name is required (max 100 chars)' }, 400);
  }
  if (!country || !/^[A-Z]{2}$/.test(country)) {
    return jsonResponse({ error: 'Country must be ISO alpha-2 (e.g. LV, EE, LT)' }, 400);
  }

  // Check for duplicates (same name + country)
  const { resources: existing } = await container.items.query({
    query: 'SELECT c.id FROM c WHERE c.country = @country AND UPPER(c.name) = @name',
    parameters: [
      { name: '@country', value: country },
      { name: '@name', value: name.toUpperCase() },
    ],
  }).fetchAll();

  if (existing.length > 0) {
    return jsonResponse({ error: 'Team already exists', existingId: existing[0].id }, 409);
  }

  const now = new Date().toISOString();
  const verified = !!(website || logoUrl);
  const team = {
    id: randomUUID(),
    country,
    name: name.trim(),
    abbreviation: abbreviation?.trim() || undefined,
    aliases: Array.isArray(aliases) ? aliases.map((a) => String(a).trim()).filter(Boolean) : [],
    city: city?.trim() || undefined,
    website: website?.trim() || undefined,
    logoUrl: logoUrl?.trim() || undefined,
    league: league?.trim() || undefined,
    parentClubId: undefined,
    verified,
    verifiedAt: verified ? now : undefined,
    addedBy: 'user',
    createdAt: now,
    updatedAt: now,
  };

  await container.items.create(team);
  return jsonResponse(team, 201);
}
