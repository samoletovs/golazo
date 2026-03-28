const { app } = require('@azure/functions');
const { getContainer, getUser, jsonResponse } = require('../cosmos');

/**
 * GET /api/sync — fetch all user data from Cosmos.
 * PUT /api/sync — bulk upsert user data (offline sync).
 *
 * Partition key: userId. All docs for a user live in one partition.
 */
app.http('sync', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'sync',
  handler: async (req, context) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) {
      return jsonResponse({ error: 'Database not configured' }, 503);
    }

    if (req.method === 'GET') {
      return handleGet(container, user.userId);
    }
    return handlePut(container, user.userId, req);
  },
});

async function handleGet(container, userId) {
  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    })
    .fetchAll();

  const state = {
    profile: null,
    trainings: [],
    matches: [],
    tournaments: [],
    diary: [],
    schedule: [],
    specialChallenges: [],
    physicalProfile: null,
    xp: null,
    skillTree: null,
  };

  for (const doc of resources) {
    switch (doc.docType) {
      case 'profile': state.profile = doc.data; break;
      case 'training': state.trainings.push(doc.data); break;
      case 'match': state.matches.push(doc.data); break;
      case 'tournament': state.tournaments.push(doc.data); break;
      case 'diary': state.diary.push(doc.data); break;
      case 'schedule': state.schedule.push(doc.data); break;
      case 'challenge': state.specialChallenges.push(doc.data); break;
      case 'physical': state.physicalProfile = doc.data; break;
      case 'xp': state.xp = doc.data; break;
      case 'skillTree': state.skillTree = doc.data; break;
    }
  }

  return jsonResponse(state);
}

async function handlePut(container, userId, req) {
  const body = await req.json();
  const operations = [];

  // Upsert profile
  if (body.profile) {
    operations.push(container.items.upsert({
      id: `${userId}:profile`,
      userId,
      docType: 'profile',
      data: body.profile,
      updatedAt: new Date().toISOString(),
    }));
  }

  // Upsert XP state
  if (body.xp) {
    operations.push(container.items.upsert({
      id: `${userId}:xp`,
      userId,
      docType: 'xp',
      data: body.xp,
      updatedAt: new Date().toISOString(),
    }));
  }

  // Upsert skill tree
  if (body.skillTree) {
    operations.push(container.items.upsert({
      id: `${userId}:skillTree`,
      userId,
      docType: 'skillTree',
      data: body.skillTree,
      updatedAt: new Date().toISOString(),
    }));
  }

  // Upsert physical profile
  if (body.physicalProfile) {
    operations.push(container.items.upsert({
      id: `${userId}:physical`,
      userId,
      docType: 'physical',
      data: body.physicalProfile,
      updatedAt: new Date().toISOString(),
    }));
  }

  // Upsert arrays (trainings, matches, etc.)
  const arrayFields = [
    { key: 'trainings', type: 'training' },
    { key: 'matches', type: 'match' },
    { key: 'tournaments', type: 'tournament' },
    { key: 'diary', type: 'diary' },
    { key: 'schedule', type: 'schedule' },
    { key: 'specialChallenges', type: 'challenge' },
  ];

  for (const { key, type } of arrayFields) {
    if (Array.isArray(body[key])) {
      for (const item of body[key]) {
        operations.push(container.items.upsert({
          id: `${userId}:${type}:${item.id}`,
          userId,
          docType: type,
          data: item,
          updatedAt: new Date().toISOString(),
        }));
      }
    }
  }

  await Promise.all(operations);

  return jsonResponse({ synced: true, count: operations.length });
}
