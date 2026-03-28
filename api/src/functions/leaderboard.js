const { app } = require('@azure/functions');
const { getContainer, getUser, jsonResponse } = require('../cosmos');

/**
 * GET /api/leaderboard — friend-based leaderboard.
 * Returns XP rankings for all linked family members.
 */
app.http('leaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaderboard',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    // Find all family links where this user is involved
    const { resources: links } = await container.items
      .query({
        query: `SELECT * FROM c WHERE c.docType = "familyLink" 
                AND (c.playerId = @userId OR c.mentorId = @userId)`,
        parameters: [{ name: '@userId', value: user.userId }],
      })
      .fetchAll();

    // Gather all unique user IDs in the family
    const userIds = new Set([user.userId]);
    for (const link of links) {
      userIds.add(link.playerId);
      userIds.add(link.mentorId);
    }

    // Fetch profiles and XP for each user
    const leaderboard = [];
    for (const uid of userIds) {
      try {
        const [profileRes, xpRes] = await Promise.all([
          container.item(`${uid}:profile`, uid).read(),
          container.item(`${uid}:xp`, uid).read(),
        ]);
        const profile = profileRes.resource?.data;
        const xp = xpRes.resource?.data;
        if (profile && xp) {
          leaderboard.push({
            userId: uid,
            name: profile.name,
            level: xp.level,
            totalXp: xp.totalXp,
            streakDays: xp.streakDays,
          });
        }
      } catch {
        // User may not have profile/xp yet — skip
      }
    }

    // Sort by totalXp descending
    leaderboard.sort((a, b) => b.totalXp - a.totalXp);

    return jsonResponse(leaderboard);
  },
});
