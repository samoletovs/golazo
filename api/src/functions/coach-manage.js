const { app } = require('@azure/functions');
const { getCoachContainer, getContainer, getUser, jsonResponse } = require('../cosmos');
const { randomUUID } = require('crypto');

/**
 * Coach management API.
 *
 * GET  /api/coach/squad/{squadId}/roster        — list players linked to squad
 * GET  /api/coach/squad/{squadId}/stats          — aggregated squad stats
 * GET  /api/coach/squad/{squadId}/announcements  — list announcements
 * POST /api/coach/squad/{squadId}/announce        — create announcement
 * GET  /api/coach/squad/{squadId}/evaluations    — list evaluations
 * POST /api/coach/squad/{squadId}/evaluation     — save evaluation
 * POST /api/coach/training-plan                  — create training plan
 * GET  /api/coach/squad/{squadId}/plans           — list training plans
 * POST /api/coach/squad/{squadId}/attendance     — save attendance
 */

/* ── Squad Roster ─────────────────────────────────────────── */

app.http('coach-roster', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'coach/squad/{squadId}/roster',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const squadId = req.params.squadId;
    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    try {
      // Find all players who have this squad in their teams (via registryId)
      const query = `SELECT c.id, c.name, c.jerseyNumber, c.positions, c.birthDate, c.photoUrl, c.createdAt
                     FROM c
                     WHERE c.type = 'profile'
                       AND c.role = 'player'
                       AND EXISTS(SELECT VALUE t FROM t IN c.teams WHERE t.registryId = @squadId AND t.active = true)`;
      const { resources } = await container.items.query({
        query,
        parameters: [{ name: '@squadId', value: squadId }],
      }).fetchAll();

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

/* ── Squad Stats ──────────────────────────────────────────── */

app.http('coach-stats', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'coach/squad/{squadId}/stats',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const squadId = req.params.squadId;

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
  route: 'coach/squad/{squadId}/announcements',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    if (req.method === 'GET') return handleGetAnnouncements(req);
    return handleCreateAnnouncement(req);
  },
});

// Separate route for POST /announce (different path suffix)
app.http('coach-announce', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'coach/squad/{squadId}/announce',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    return handleCreateAnnouncement(req);
  },
});

async function handleGetAnnouncements(req) {
  const container = await getCoachContainer();
  if (!container) return jsonResponse({ announcements: [] });

  const squadId = req.params.squadId;
  try {
    const { resources } = await container.items.query({
      query: 'SELECT * FROM c WHERE c.squadId = @squadId AND c.docType = "announcement" ORDER BY c.createdAt DESC',
      parameters: [{ name: '@squadId', value: squadId }],
    }).fetchAll();
    return jsonResponse({ announcements: resources });
  } catch {
    return jsonResponse({ announcements: [] });
  }
}

async function handleCreateAnnouncement(req) {
  const container = await getCoachContainer();
  if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

  const squadId = req.params.squadId;
  const body = await req.json();
  const now = new Date().toISOString();

  const announcement = {
    id: randomUUID(),
    squadId,
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
  route: 'coach/squad/{squadId}/evaluations',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ evaluations: [] });

    const squadId = req.params.squadId;
    try {
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.squadId = @squadId AND c.docType = "evaluation" ORDER BY c.createdAt DESC',
        parameters: [{ name: '@squadId', value: squadId }],
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
  route: 'coach/squad/{squadId}/evaluation',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const squadId = req.params.squadId;
    const body = await req.json();
    const now = new Date().toISOString();

    const evaluation = {
      id: randomUUID(),
      squadId,
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

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const body = await req.json();
    const now = new Date().toISOString();

    const plan = {
      id: randomUUID(),
      squadId: body.squadId,
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
  route: 'coach/squad/{squadId}/plans',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ plans: [] });

    const squadId = req.params.squadId;
    try {
      const { resources } = await container.items.query({
        query: 'SELECT * FROM c WHERE c.squadId = @squadId AND c.docType = "trainingPlan" ORDER BY c.date DESC',
        parameters: [{ name: '@squadId', value: squadId }],
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
  route: 'coach/squad/{squadId}/attendance',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getCoachContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const squadId = req.params.squadId;
    const body = await req.json();
    const now = new Date().toISOString();

    // Store attendance as a single doc per date+squad
    const doc = {
      id: `${squadId}-${body.date}`,
      squadId,
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
