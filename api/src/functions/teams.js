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

  try {
    // Fetch teams from Cosmos (small dataset, ~100 teams — safe to fetch all per country)
    const query = country && /^[A-Z]{2}$/.test(country)
      ? 'SELECT * FROM c WHERE c.country = @country ORDER BY c.name'
      : 'SELECT * FROM c ORDER BY c.name';
    const params = country && /^[A-Z]{2}$/.test(country)
      ? [{ name: '@country', value: country }]
      : [];

    const { resources } = await container.items.query({ query, parameters: params }).fetchAll();

    // Client-side search with accent-stripping for proper Baltic name matching
    let results = resources;
    if (q) {
      const normQ = normalize(q);
      results = resources.filter((t) =>
        normalize(t.name || '').includes(normQ) ||
        normalize(t.abbreviation || '').includes(normQ) ||
        normalize(t.city || '').includes(normQ) ||
        (t.aliases || []).some((a) => normalize(a).includes(normQ))
      );
    }

    return jsonResponse({ teams: results.slice(0, limit), count: Math.min(results.length, limit) });
  } catch (err) {
    console.error('Teams search failed:', err.message);
    return jsonResponse({ error: 'Search failed' }, 500);
  }
}

/** Strip accents and uppercase for Baltic-friendly search */
function normalize(s) {
  return s.toLowerCase()
    .replace(/[āàâä]/g, 'a').replace(/[čć]/g, 'c').replace(/[ēėèêë]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[īìîï]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[ōõöò]/g, 'o')
    .replace(/[šś]/g, 's').replace(/[ūùûü]/g, 'u').replace(/[žź]/g, 'z');
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
