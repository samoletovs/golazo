const { app } = require('@azure/functions');
const { getContainer, getUser, jsonResponse } = require('../cosmos');

/**
 * GET /api/profile — get user profile.
 * PUT /api/profile — update user profile.
 */
app.http('profile', {
  methods: ['GET', 'PUT'],
  authLevel: 'anonymous',
  route: 'profile',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    if (req.method === 'GET') {
      try {
        const { resource } = await container.item(`${user.userId}:profile`, user.userId).read();
        return jsonResponse(resource?.data ?? null);
      } catch (e) {
        if (e.code === 404) return jsonResponse(null);
        throw e;
      }
    }

    // PUT
    const data = await req.json();

    // Normalize legacy team entries: squadLabel → teamLabel, ensure clubId
    if (Array.isArray(data.teams)) {
      for (const t of data.teams) {
        if (t.squadLabel && !t.teamLabel) {
          t.teamLabel = t.squadLabel;
        }
        delete t.squadLabel;
        if (!t.clubId && t.registryId) {
          t.clubId = t.registryId;
        }
      }
    }

    await container.items.upsert({
      id: `${user.userId}:profile`,
      userId: user.userId,
      docType: 'profile',
      data,
      updatedAt: new Date().toISOString(),
    });

    return jsonResponse({ updated: true });
  },
});
