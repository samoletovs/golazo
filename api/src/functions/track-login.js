const { app } = require('@azure/functions');

const TELEGRAM_NOTIFY_URL = process.env.TELEGRAM_NOTIFY_URL || '';

app.http('trackLogin', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'track-login',
  handler: async (req) => {
    try {
      const header = req.headers.get('x-ms-client-principal');
      if (!header) return { status: 401, jsonBody: { error: 'Not authenticated' } };

      const principal = JSON.parse(Buffer.from(header, 'base64').toString('utf-8'));
      const email = principal.userDetails || principal.userId || 'unknown';
      const provider = principal.identityProvider || 'unknown';
      const timestamp = new Date().toISOString();

      // Skip notifications for the owner
      if (email === 'owner@example.com') return { status: 200, jsonBody: { ok: true } };

      await fetch(TELEGRAM_NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `👤 golazo login\n\nUser: ${email}\nProvider: ${provider}\nTime: ${timestamp}`
        })
      }).catch(() => {});

      return { status: 200, jsonBody: { ok: true } };
    } catch {
      return { status: 200, jsonBody: { ok: false } };
    }
  }
});
