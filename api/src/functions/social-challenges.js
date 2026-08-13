const { app } = require('@azure/functions');
const { randomInt } = require('crypto');
const { getContainer, getUser, jsonResponse } = require('../cosmos');

/**
 * Player-facing social challenges — create a challenge, share a code,
 * and let friends or teammates join and race on progress.
 *
 * GET  /api/social-challenges                       — list challenges the user takes part in
 * POST /api/social-challenges                       — create a challenge (returns the join code)
 * POST /api/social-challenges/join                  — join a challenge with a share code
 * POST /api/social-challenges/{challengeId}/progress — log one session of progress
 */

const CODE_LENGTH = 6;
const TITLE_MAX_LENGTH = 80;
const NAME_MAX_LENGTH = 40;
const MAX_PARTICIPANTS = 20;

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[randomInt(chars.length)];
  }
  return code;
}

function sanitizeName(value) {
  if (typeof value !== 'string') return 'Player';
  const trimmed = value.trim().slice(0, NAME_MAX_LENGTH);
  return trimmed.length > 0 ? trimmed : 'Player';
}

/** Strip internal Cosmos fields before returning a challenge to the client */
function toPublicChallenge(challenge) {
  return {
    id: challenge.id,
    code: challenge.code,
    title: challenge.title,
    target: challenge.target,
    unit: challenge.unit,
    createdBy: challenge.createdBy,
    createdByName: challenge.createdByName,
    createdAt: challenge.createdAt,
    endsAt: challenge.endsAt,
    participants: challenge.participants,
  };
}

async function findChallengeById(container, challengeId) {
  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.docType = "friendChallenge" AND c.id = @id',
      parameters: [{ name: '@id', value: challengeId }],
    })
    .fetchAll();
  return resources[0] ?? null;
}

app.http('social-challenges', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'social-challenges',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    if (req.method === 'GET') return listChallenges(container, user);
    return createChallenge(req, container, user);
  },
});

async function listChallenges(container, user) {
  try {
    const { resources } = await container.items
      .query({
        query: `SELECT * FROM c WHERE c.docType = "friendChallenge"
                AND ARRAY_CONTAINS(c.participantIds, @userId) ORDER BY c.createdAt DESC`,
        parameters: [{ name: '@userId', value: user.userId }],
      })
      .fetchAll();
    return jsonResponse({ challenges: resources.map(toPublicChallenge) });
  } catch {
    return jsonResponse({ error: 'Failed to load challenges' }, 500);
  }
}

async function createChallenge(req, container, user) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  if (!title || title.length > TITLE_MAX_LENGTH) return jsonResponse({ error: 'Invalid challenge title' }, 400);
  if (!Number.isInteger(body.target) || body.target < 1 || body.target > 50) {
    return jsonResponse({ error: 'Invalid challenge target' }, 400);
  }
  if (!Number.isInteger(body.days) || body.days < 1 || body.days > 31) {
    return jsonResponse({ error: 'Invalid challenge duration' }, 400);
  }

  const now = new Date();
  const challenge = {
    id: `friendChallenge:${user.userId}:${now.getTime()}`,
    userId: user.userId,
    docType: 'friendChallenge',
    code: generateCode(),
    title,
    target: body.target,
    unit: 'sessions',
    createdBy: user.userId,
    createdByName: sanitizeName(body.name),
    createdAt: now.toISOString(),
    endsAt: new Date(now.getTime() + body.days * 86400000).toISOString(),
    participantIds: [user.userId],
    participants: [{ userId: user.userId, name: sanitizeName(body.name), progress: 0 }],
  };

  try {
    const { resource } = await container.items.create(challenge);
    return jsonResponse(toPublicChallenge(resource), 201);
  } catch {
    return jsonResponse({ error: 'Failed to create challenge' }, 500);
  }
}

app.http('social-challenge-join', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'social-challenges/join',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (code.length !== CODE_LENGTH) return jsonResponse({ error: 'Invalid challenge code' }, 400);

    try {
      const { resources } = await container.items
        .query({
          query: 'SELECT * FROM c WHERE c.docType = "friendChallenge" AND c.code = @code',
          parameters: [{ name: '@code', value: code }],
        })
        .fetchAll();

      const challenge = resources[0];
      if (!challenge) return jsonResponse({ error: 'Challenge not found' }, 404);
      if (new Date(challenge.endsAt) < new Date()) return jsonResponse({ error: 'Challenge has ended' }, 410);
      if (challenge.participantIds.includes(user.userId)) return jsonResponse(toPublicChallenge(challenge));
      if (challenge.participantIds.length >= MAX_PARTICIPANTS) return jsonResponse({ error: 'Challenge is full' }, 409);

      challenge.participantIds.push(user.userId);
      challenge.participants.push({ userId: user.userId, name: sanitizeName(body.name), progress: 0 });

      const { resource } = await container.item(challenge.id, challenge.userId).replace(challenge, {
        accessCondition: { type: 'IfMatch', condition: challenge._etag },
      });
      return jsonResponse(toPublicChallenge(resource));
    } catch (error) {
      if (error.code === 412) return jsonResponse({ error: 'Challenge changed, please try again' }, 409);
      return jsonResponse({ error: 'Failed to join challenge' }, 500);
    }
  },
});

app.http('social-challenge-progress', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'social-challenges/{challengeId}/progress',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    try {
      const challenge = await findChallengeById(container, req.params.challengeId);
      if (!challenge) return jsonResponse({ error: 'Not found' }, 404);

      const participant = challenge.participants.find((p) => p.userId === user.userId);
      if (!participant) return jsonResponse({ error: 'Forbidden' }, 403);
      if (new Date(challenge.endsAt) < new Date()) return jsonResponse({ error: 'Challenge has ended' }, 410);

      participant.progress = Math.min(participant.progress + 1, challenge.target);

      const { resource } = await container.item(challenge.id, challenge.userId).replace(challenge, {
        accessCondition: { type: 'IfMatch', condition: challenge._etag },
      });
      return jsonResponse(toPublicChallenge(resource));
    } catch (error) {
      if (error.code === 412) return jsonResponse({ error: 'Challenge changed, please try again' }, 409);
      return jsonResponse({ error: 'Failed to update challenge' }, 500);
    }
  },
});
