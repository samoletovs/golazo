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
    recurringTrainings: [],
    specialChallenges: [],
    physicalProfile: null,
    xp: null,
    skillTree: null,
    checkIns: [],
    quizAnswers: [],
    readArticles: [],
    savedExercises: [],
    programProgress: [],
    userDrills: [],
    personalGoals: [],
    onboardingComplete: false,
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
      case 'checkIn': state.checkIns.push(doc.data); break;
      case 'quizAnswer': state.quizAnswers.push(doc.data); break;
      case 'readArticle': state.readArticles.push(doc.data); break;
      case 'savedExercises': state.savedExercises = doc.data; break;
      case 'programProgress': state.programProgress.push(doc.data); break;
      case 'recurringTraining': state.recurringTrainings.push(doc.data); break;
      case 'userDrill': state.userDrills.push(doc.data); break;
      case 'personalGoals':
        if (state.personalGoals.length === 0 && Array.isArray(doc.data)) state.personalGoals = doc.data;
        break;
      case 'onboardingComplete': state.onboardingComplete = doc.data; break;
    }
  }

  return jsonResponse(state);
}

async function handlePut(container, userId, req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Body must be an object' }, 400);
  }

  // Basic validation: reject oversized payloads (> 2MB stringified)
  const bodyStr = JSON.stringify(body);
  if (bodyStr.length > 2 * 1024 * 1024) {
    return jsonResponse({ error: 'Payload too large' }, 413);
  }

  // Validate profile if present
  if (body.profile) {
    if (typeof body.profile !== 'object' || !body.profile.name || typeof body.profile.name !== 'string') {
      return jsonResponse({ error: 'Invalid profile: name is required' }, 400);
    }
  }

  // Validate XP state if present
  if (body.xp) {
    if (typeof body.xp !== 'object' || typeof body.xp.totalXp !== 'number' || body.xp.totalXp < 0) {
      return jsonResponse({ error: 'Invalid XP state' }, 400);
    }
  }

  // Validate array fields: each item must have an id string
  const arrayFieldKeys = ['trainings', 'matches', 'tournaments', 'diary', 'schedule', 'recurringTrainings', 'specialChallenges', 'checkIns', 'quizAnswers', 'readArticles', 'programProgress', 'userDrills'];
  for (const key of arrayFieldKeys) {
    if (body[key] !== undefined && !Array.isArray(body[key])) {
      return jsonResponse({ error: `${key} must be an array` }, 400);
    }
    if (Array.isArray(body[key])) {
      for (const item of body[key]) {
        if (!item || typeof item !== 'object' || (typeof item.id !== 'string' && key !== 'readArticles' && key !== 'quizAnswers' && key !== 'programProgress')) {
          // readArticles/quizAnswers/programProgress may use different id fields
          if (key === 'readArticles' && (!item.articleId || typeof item.articleId !== 'string')) {
            return jsonResponse({ error: 'readArticles items must have articleId' }, 400);
          }
          if (key === 'quizAnswers' && (!item.questionId || typeof item.questionId !== 'string')) {
            return jsonResponse({ error: 'quizAnswers items must have questionId' }, 400);
          }
        }
      }
    }
  }

  // savedExercises is a string array
  if (body.savedExercises !== undefined) {
    if (!Array.isArray(body.savedExercises) || body.savedExercises.some(e => typeof e !== 'string')) {
      return jsonResponse({ error: 'savedExercises must be a string array' }, 400);
    }
  }

  // personalGoals is stored as a single ordered array so deletes sync cleanly
  if (body.personalGoals !== undefined) {
    if (!Array.isArray(body.personalGoals)) {
      return jsonResponse({ error: 'personalGoals must be an array' }, 400);
    }
    const validGoalMetrics = new Set(['trainings', 'matches', 'goals', 'assists', 'diary', 'xp', 'streak']);
    for (const goal of body.personalGoals) {
      if (!goal || typeof goal !== 'object' || typeof goal.id !== 'string' || typeof goal.title !== 'string' || typeof goal.target !== 'number' || goal.target < 1 || typeof goal.metric !== 'string') {
        return jsonResponse({ error: 'personalGoals items must have id, title, target, and metric' }, 400);
      }
      if (!validGoalMetrics.has(goal.metric)) {
        return jsonResponse({ error: 'personalGoals items must have a valid metric' }, 400);
      }
    }
  }

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
    { key: 'recurringTrainings', type: 'recurringTraining' },
    { key: 'checkIns', type: 'checkIn' },
    { key: 'programProgress', type: 'programProgress' },
    { key: 'userDrills', type: 'userDrill' },
  ];

  for (const { key, type } of arrayFields) {
    if (Array.isArray(body[key])) {
      for (const item of body[key]) {
        const itemId = item.id || item.articleId || item.questionId || item.programId || crypto.randomUUID()
        operations.push(container.items.upsert({
          id: `${userId}:${type}:${itemId}`,
          userId,
          docType: type,
          data: item,
          updatedAt: new Date().toISOString(),
        }));
      }
    }
  }

  // Upsert quizAnswers (keyed by questionId+date)
  if (Array.isArray(body.quizAnswers)) {
    for (const item of body.quizAnswers) {
      operations.push(container.items.upsert({
        id: `${userId}:quizAnswer:${item.questionId}:${item.date}`,
        userId,
        docType: 'quizAnswer',
        data: item,
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  // Upsert readArticles (keyed by articleId)
  if (Array.isArray(body.readArticles)) {
    for (const item of body.readArticles) {
      operations.push(container.items.upsert({
        id: `${userId}:readArticle:${item.articleId}`,
        userId,
        docType: 'readArticle',
        data: item,
        updatedAt: new Date().toISOString(),
      }));
    }
  }

  // Upsert savedExercises (single doc — string array)
  if (Array.isArray(body.savedExercises)) {
    operations.push(container.items.upsert({
      id: `${userId}:savedExercises`,
      userId,
      docType: 'savedExercises',
      data: body.savedExercises,
      updatedAt: new Date().toISOString(),
    }));
  }

  // Upsert personalGoals (single doc — ordered goal array)
  if (Array.isArray(body.personalGoals)) {
    operations.push(container.items.upsert({
      id: `${userId}:personalGoals`,
      userId,
      docType: 'personalGoals',
      data: body.personalGoals,
      updatedAt: new Date().toISOString(),
    }));
  }

  // Upsert onboardingComplete flag
  if (body.onboardingComplete !== undefined) {
    operations.push(container.items.upsert({
      id: `${userId}:onboardingComplete`,
      userId,
      docType: 'onboardingComplete',
      data: body.onboardingComplete,
      updatedAt: new Date().toISOString(),
    }));
  }

  await Promise.all(operations);

  return jsonResponse({ synced: true, count: operations.length });
}
