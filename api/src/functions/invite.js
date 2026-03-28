const { app } = require('@azure/functions');
const { getContainer, getUser, jsonResponse } = require('../cosmos');

/**
 * POST /api/invite — create an invite code for mentor linking.
 * POST /api/invite/accept — accept an invite code and link mentor to player.
 */
app.http('invite-create', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'invite',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    // Generate a 6-character alphanumeric code
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await container.items.upsert({
      id: `invite:${code}`,
      userId: user.userId,
      docType: 'invite',
      code,
      createdBy: user.userId,
      createdByEmail: user.email,
      expiresAt,
      accepted: false,
      createdAt: new Date().toISOString(),
    });

    return jsonResponse({ code, expiresAt });
  },
});

app.http('invite-accept', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'invite/accept',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    const container = await getContainer();
    if (!container) return jsonResponse({ error: 'Database not configured' }, 503);

    const { code } = await req.json();
    if (!code || typeof code !== 'string' || code.length !== 6) {
      return jsonResponse({ error: 'Invalid invite code' }, 400);
    }

    // Find the invite (query by code)
    const { resources } = await container.items
      .query({
        query: 'SELECT * FROM c WHERE c.docType = "invite" AND c.code = @code AND c.accepted = false',
        parameters: [{ name: '@code', value: code.toUpperCase() }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return jsonResponse({ error: 'Invalid or expired invite code' }, 404);
    }

    const invite = resources[0];

    // Check expiry
    if (new Date(invite.expiresAt) < new Date()) {
      return jsonResponse({ error: 'Invite code has expired' }, 410);
    }

    // Link mentor to player — update the invite
    invite.accepted = true;
    invite.acceptedBy = user.userId;
    invite.acceptedByEmail = user.email;
    invite.acceptedAt = new Date().toISOString();
    await container.items.upsert(invite);

    // Create a family link document
    await container.items.upsert({
      id: `family:${invite.createdBy}:${user.userId}`,
      userId: invite.createdBy,
      docType: 'familyLink',
      playerId: invite.createdBy,
      mentorId: user.userId,
      createdAt: new Date().toISOString(),
    });

    return jsonResponse({
      linked: true,
      playerId: invite.createdBy,
      playerEmail: invite.createdByEmail,
    });
  },
});

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
  let code = '';
  const bytes = require('crypto').randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}
