const { app } = require('@azure/functions');
const { getCoachContainer, getContainer, getUser, jsonResponse } = require('../cosmos');
const { randomUUID } = require('crypto');

/**
 * Coach management API.
 *
 * GET  /api/coach/team/{teamId}/roster        — list players linked to team
 * GET  /api/coach/team/{teamId}/stats          — aggregated team stats
 * GET  /api/coach/team/{teamId}/announcements  — list announcements
 * POST /api/coach/team/{teamId}/announce        — create announcement
 * GET  /api/coach/team/{teamId}/evaluations    — list evaluations
 * POST /api/coach/team/{teamId}/evaluation     — save evaluation
 * POST /api/coach/training-plan                  — create training plan
 * GET  /api/coach/team/{teamId}/plans           — list training plans
 * POST /api/coach/team/{teamId}/attendance     — save attendance
 * GET  /api/coach/team/{teamId}/social-challenges — list sent and received challenges
 * POST /api/coach/team/{teamId}/social-challenges — challenge another team
 * POST /api/coach/team/{teamId}/social-challenges/{challengeId} — accept, decline, or log progress
 */

/* ── Authorization helper ─────────────────────────────────── */

/**
 * Verify that the authenticated user is a coach of the requested team.
 * Returns the ManagedTeam object if found, or null if not authorized.
 */
async function verifyCoachOwnsTeam(userId, teamId) {
  const container = await getContainer();
  if (!container) return null;
  try {
    const { resources } = await container.items.query({
      query: 'SELECT c.data.managedTeams FROM c WHERE c.userId = @userId AND c.docType = "profile"',
      parameters: [{ name: '@userId', value: userId }],
    }).fetchAll();
    if (!resources.length || !resources[0]?.managedTeams) return null;
    return resources[0].managedTeams.find((t) => t.teamId === teamId) ?? null;
  } catch {
    return null;
  }
}

/* ── Social Team Challenges ────────────────────────────────── */

  app.http('coach-social-challenges', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    route: 'coach/team/{teamId}/social-challenges',
    handler: async (req) => {
      const user = getUser(req);
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const teamId = req.params.teamId;
      const managedTeam = await verifyCoachOwnsTeam(user.userId, teamId);
      if (!managedTeam) return jsonResponse({ error: 'Forbidden' }, 403);
      if (req.method === 'GET') return getSocialChallenges(teamId);
      return createSocialChallenge(req, managedTeam, user.userId);
    },
  });

  app.http('coach-social-challenge-action', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'coach/team/{teamId}/social-challenges/{challengeId}',
    handler: async (req) => {
      const user = getUser(req);
      if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
      const teamId = req.params.teamId;
      if (!await verifyCoachOwnsTeam(user.userId, teamId)) return jsonResponse({ error: 'Forbidden' }, 403);
      return updateSocialChallenge(req, teamId);
    },
  });

  async function getSocialChallenges(teamId) {
    const container = await getCoachContainer();
    if (!container) return jsonResponse({ challenges: [] });
    try {
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.docType = "socialChallenge" AND (c.teamId = @teamId OR c.opponentTeamId = @teamId) ORDER BY c.createdAt DESC',
        parameters: [{ name: '@teamId', value: teamId }],
      }).fetchAll();
      return jsonResponse({ challenges: resources });
    } catch {
      return jsonResponse({ challenges: [] });
    }
  }

  async function createSocialChallenge(req, managedTeam, userId) {
    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
    const fields = ['opponentTeamId', 'opponentTeamName', 'title'];
    if (!body || fields.some((field) => typeof body[field] !== 'string' || body[field].trim().length === 0 || body[field].length > 100)) {
      return jsonResponse({ error: 'Invalid challenge details' }, 400);
    }
    if (body.opponentTeamId === managedTeam.teamId) return jsonResponse({ error: 'Opponent must be another team' }, 400);
    if (!Number.isInteger(body.target) || body.target < 1 || body.target > 50 || !Number.isInteger(body.days) || body.days < 1 || body.days > 31) {
      return jsonResponse({ error: 'Invalid challenge target or duration' }, 400);
    }
    const now = new Date();
    const challenge = {
      id: randomUUID(),
      teamId: managedTeam.teamId,
      teamName: managedTeam.teamName,
      opponentTeamId: body.opponentTeamId.trim(),
      opponentTeamName: body.opponentTeamName.trim(),
      title: body.title.trim(),
      target: body.target,
      unit: 'trainingSessions',
      teamProgress: 0,
      opponentProgress: 0,
      status: 'pending',
      createdBy: userId,
      createdAt: now.toISOString(),
      endsAt: new Date(now.getTime() + body.days * 86400000).toISOString(),
      docType: 'socialChallenge',
    };
    try {
      const { resource } = await container.items.create(challenge);
      return jsonResponse(resource, 201);
    } catch {
      return jsonResponse({ error: 'Failed to create challenge' }, 500);
    }
  }

  async function updateSocialChallenge(req, teamId) {
    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
    if (!['accept', 'decline', 'progress'].includes(body?.action)) return jsonResponse({ error: 'Invalid action' }, 400);
    try {
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.id = @id AND c.docType = "socialChallenge"',
        parameters: [{ name: '@id', value: req.params.challengeId }],
      }).fetchAll();
      const challenge = resources[0];
      if (!challenge || (challenge.teamId !== teamId && challenge.opponentTeamId !== teamId)) return jsonResponse({ error: 'Not found' }, 404);
      const isOpponent = challenge.opponentTeamId === teamId;
      if ((body.action === 'accept' || body.action === 'decline') && (!isOpponent || challenge.status !== 'pending')) {
        return jsonResponse({ error: 'Challenge cannot be updated' }, 409);
      }
      if (body.action === 'accept') challenge.status = 'active';
      if (body.action === 'decline') challenge.status = 'declined';
      if (body.action === 'progress') {
        if (challenge.status !== 'active' || new Date(challenge.endsAt) < new Date()) return jsonResponse({ error: 'Challenge is not active' }, 409);
        const progressKey = isOpponent ? 'opponentProgress' : 'teamProgress';
        challenge[progressKey] = Math.min(challenge[progressKey] + 1, challenge.target);
        if (challenge[progressKey] >= challenge.target) challenge.status = 'completed';
      }
      const { resource } = await container.item(challenge.id, challenge.teamId).replace(challenge, {
        accessCondition: { type: 'IfMatch', condition: challenge._etag },
      });
      return jsonResponse(resource);
    } catch (error) {
      if (error.code === 412) return jsonResponse({ error: 'Challenge changed, please try again' }, 409);
      return jsonResponse({ error: 'Failed to update challenge' }, 500);
    }
  }
/* ── Team Roster ──────────────────────────────────────────── */

app.http('coach-roster', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/roster',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const teamId = req.params.teamId;
    const managedTeam = await verifyCoachOwnsTeam(user.userId, teamId);
    if (!managedTeam) return jsonResponse({ error: 'Forbidden' }, 403);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    try {
      // Match players by clubId + birthYear + teamLabel (not teamId which is a random UUID)
      // Players store: t.clubId = SharedTeam.id, t.birthYear, t.teamLabel
      // Legacy data may use "squadLabel" instead of "teamLabel" — check both
      const clubId = managedTeam.clubId;
      const birthYear = managedTeam.birthYear;
      const teamLabel = managedTeam.teamLabel;

      let query, params;
      if (clubId && birthYear) {
        // Full match: club + birth year + optional team label (supports legacy "squadLabel" field)
        const labelClause = teamLabel
          ? 'AND (t.teamLabel = @teamLabel OR t.squadLabel = @teamLabel)'
          : '';
        query = `SELECT c.data.id AS id, c.data.name AS name, c.data.jerseyNumber AS jerseyNumber,
                        c.data.positions AS positions, c.data.birthDate AS birthDate,
                        c.data.photoUrl AS photoUrl, c.updatedAt AS createdAt
                 FROM c
                 WHERE c.docType = 'profile'
                   AND c.data.role = 'player'
                   AND EXISTS(SELECT VALUE t FROM t IN c.data.teams
                              WHERE t.clubId = @clubId
                                AND t.birthYear = @birthYear
                                ${labelClause}
                                AND t.active = true)`;
        params = [
          { name: '@clubId', value: clubId },
          { name: '@birthYear', value: birthYear },
        ];
        if (teamLabel) params.push({ name: '@teamLabel', value: teamLabel });
      } else {
        // Fallback: match by registryId or clubId directly
        query = `SELECT c.data.id AS id, c.data.name AS name, c.data.jerseyNumber AS jerseyNumber,
                        c.data.positions AS positions, c.data.birthDate AS birthDate,
                        c.data.photoUrl AS photoUrl, c.updatedAt AS createdAt
                 FROM c
                 WHERE c.docType = 'profile'
                   AND c.data.role = 'player'
                   AND EXISTS(SELECT VALUE t FROM t IN c.data.teams
                              WHERE (t.registryId = @id OR t.clubId = @id) AND t.active = true)`;
        params = [{ name: '@id', value: clubId || teamId }];
      }

      const { resources } = await container.items.query({ query, parameters: params }).fetchAll();

      const players = resources.map((p) => ({
        playerId: p.id,
        playerName: p.name,
        jerseyNumber: p.jerseyNumber,
        positions: p.positions || [],
        birthDate: p.birthDate,
        photoUrl: p.photoUrl,
        joinedAt: p.createdAt,
        active: true,
      }));

      return jsonResponse({ players });
    } catch (err) {
      return jsonResponse({ error: 'Failed to load roster' }, 500);
    }
  },
});

/* ── Team Stats ───────────────────────────────────────────── */

app.http('coach-stats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/stats',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const teamId = req.params.teamId;
    if (!await verifyCoachOwnsTeam(user.userId, teamId)) return jsonResponse({ error: 'Forbidden' }, 403);

    // Return placeholder stats — real aggregation will be built incrementally
    return jsonResponse({
      rosterCount: 0,
      avgMood: null,
      attendanceRate: null,
      nextEventTitle: null,
      nextEventDate: null,
      alerts: [],
      recentAnnouncements: [],
    });
  },
});

/* ── Announcements ────────────────────────────────────────── */

app.http('coach-announcements', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/announcements',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!await verifyCoachOwnsTeam(user.userId, req.params.teamId)) return jsonResponse({ error: 'Forbidden' }, 403);

    if (req.method === 'GET') return handleGetAnnouncements(req);
    return handleCreateAnnouncement(req);
  },
});

// Separate route for POST /announce (different path suffix)
app.http('coach-announce', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/announce',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!await verifyCoachOwnsTeam(user.userId, req.params.teamId)) return jsonResponse({ error: 'Forbidden' }, 403);
    return handleCreateAnnouncement(req);
  },
});

async function handleGetAnnouncements(req) {
  const container = await getCoachContainer();
  if (!container) return jsonResponse({ announcements: [] });

  const teamId = req.params.teamId;
  try {
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.teamId = @teamId AND c.docType = "announcement" ORDER BY c.createdAt DESC',
      parameters: [{ name: '@teamId', value: teamId }],
    }).fetchAll();
    return jsonResponse({ announcements: resources });
  } catch {
    return jsonResponse({ announcements: [] });
  }
}

async function handleCreateAnnouncement(req) {
  const container = await getCoachContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  const teamId = req.params.teamId;
  const body = await req.json();
  const now = new Date().toISOString();

  const announcement = {
    id: randomUUID(),
    teamId,
    docType: 'announcement',
    authorId: body.authorId,
    authorName: body.authorName,
    title: body.title,
    body: body.body,
    priority: body.priority || 'normal',
    audience: body.audience || 'all',
    linkUrl: body.linkUrl,
    readBy: [],
    createdAt: now,
  };

  try {
    const { resource } = await container.items.create(announcement);
    return jsonResponse(resource, 201);
  } catch (err) {
    return jsonResponse({ error: 'Failed to create announcement' }, 500);
  }
}

/* ── Evaluations ──────────────────────────────────────────── */

app.http('coach-evaluations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/evaluations',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!await verifyCoachOwnsTeam(user.userId, req.params.teamId)) return jsonResponse({ error: 'Forbidden' }, 403);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ evaluations: [] });

    const teamId = req.params.teamId;
    try {
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.teamId = @teamId AND c.docType = "evaluation" ORDER BY c.createdAt DESC',
        parameters: [{ name: '@teamId', value: teamId }],
      }).fetchAll();
      return jsonResponse({ evaluations: resources });
    } catch {
      return jsonResponse({ evaluations: [] });
    }
  },
});

app.http('coach-evaluation-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/evaluation',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!await verifyCoachOwnsTeam(user.userId, req.params.teamId)) return jsonResponse({ error: 'Forbidden' }, 403);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const teamId = req.params.teamId;
    const body = await req.json();
    const now = new Date().toISOString();

    const evaluation = {
      id: randomUUID(),
      teamId,
      docType: 'evaluation',
      playerId: body.playerId,
      coachId: body.coachId,
      coachName: body.coachName,
      date: body.date || now.slice(0, 10),
      period: body.period,
      technicalRating: body.technicalRating,
      tacticalRating: body.tacticalRating,
      physicalRating: body.physicalRating,
      mentalRating: body.mentalRating,
      performanceRating: body.performanceRating,
      knowledgeRating: body.knowledgeRating,
      attendance: body.attendance,
      strengths: body.strengths || [],
      areasToImprove: body.areasToImprove || [],
      coachNotes: body.coachNotes,
      goalsForNextPeriod: body.goalsForNextPeriod || [],
      createdAt: now,
    };

    try {
      const { resource } = await container.items.create(evaluation);
      return jsonResponse(resource, 201);
    } catch {
      return jsonResponse({ error: 'Failed to save evaluation' }, 500);
    }
  },
});

/* ── Training Plans ───────────────────────────────────────── */

app.http('coach-training-plan', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'coach/training-plan',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    if (!body.teamId || !await verifyCoachOwnsTeam(user.userId, body.teamId)) return jsonResponse({ error: 'Forbidden' }, 403);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const now = new Date().toISOString();

    const plan = {
      id: randomUUID(),
      teamId: body.teamId,
      docType: 'trainingPlan',
      coachId: body.coachId,
      title: body.title,
      date: body.date,
      startTime: body.startTime,
      location: body.location,
      durationMinutes: body.durationMinutes,
      objectives: body.objectives || [],
      warmUp: body.warmUp,
      drills: body.drills || [],
      coolDown: body.coolDown,
      notes: body.notes,
      createdAt: now,
    };

    try {
      const { resource } = await container.items.create(plan);
      return jsonResponse(resource, 201);
    } catch {
      return jsonResponse({ error: 'Failed to save training plan' }, 500);
    }
  },
});

app.http('coach-plans', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/plans',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!await verifyCoachOwnsTeam(user.userId, req.params.teamId)) return jsonResponse({ error: 'Forbidden' }, 403);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ plans: [] });

    const teamId = req.params.teamId;
    try {
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.teamId = @teamId AND c.docType = "trainingPlan" ORDER BY c.date DESC',
        parameters: [{ name: '@teamId', value: teamId }],
      }).fetchAll();
      return jsonResponse({ plans: resources });
    } catch {
      return jsonResponse({ plans: [] });
    }
  },
});

/* ── Attendance ───────────────────────────────────────────── */

app.http('coach-attendance', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'coach/team/{teamId}/attendance',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!await verifyCoachOwnsTeam(user.userId, req.params.teamId)) return jsonResponse({ error: 'Forbidden' }, 403);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const teamId = req.params.teamId;
    const body = await req.json();
    const now = new Date().toISOString();

    // Store attendance as a single doc per date+team
    const doc = {
      id: `${teamId}-${body.date}`,
      teamId,
      docType: 'attendance',
      date: body.date,
      coachId: body.coachId,
      records: body.records || [],
      createdAt: now,
    };

    try {
      await container.items.upsert(doc);
      return jsonResponse({ ok: true }, 201);
    } catch {
      return jsonResponse({ error: 'Failed to save attendance' }, 500);
    }
  },
});
