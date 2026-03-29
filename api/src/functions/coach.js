const { app } = require('@azure/functions');
const { getUser, jsonResponse } = require('../cosmos');

/**
 * POST /api/coach — AI coaching recommendation.
 * Uses Azure OpenAI to generate personalized training advice.
 * Rate-limited: 1 request per user per day.
 */

const rateLimitMap = new Map();
const RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours

app.http('coach', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'coach',
  handler: async (req) => {
    const user = getUser(req);
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

    // Rate limit check
    const lastRequest = rateLimitMap.get(user.userId);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
      return jsonResponse({ error: 'Rate limited — one coaching session per day' }, 429);
    }

    const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const openaiKey = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

    if (!openaiEndpoint || !openaiKey) {
      return jsonResponse({
        recommendation: 'AI Coach is not yet configured. Keep training and logging your sessions — the AI Coach will be available soon!',
        drills: [],
        focusArea: 'general',
      });
    }

    const body = await req.json();
    const { skillTree, recentMatches, recentTrainings, physicalProfile } = body;

    const prompt = buildPrompt(skillTree, recentMatches, recentTrainings, physicalProfile);

    try {
      const response = await fetch(
        `${openaiEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': openaiKey,
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are a professional football development coach. Give specific, actionable advice based on the player's data. Be encouraging but honest. Respond in JSON format: { "recommendation": "string (2-3 sentences)", "drills": ["drill1", "drill2", "drill3"], "focusArea": "technical|physical|tactical|mental", "weeklyGoal": "string (1 sentence)" }`,
              },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 300,
            response_format: { type: 'json_object' },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI returned ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      rateLimitMap.set(user.userId, Date.now());
      return jsonResponse(result);
    } catch (error) {
      return jsonResponse({
        recommendation: 'Could not generate coaching advice right now. Focus on your weakest skill category and train consistently!',
        drills: [],
        focusArea: 'general',
      });
    }
  },
});

function buildPrompt(skillTree, recentMatches, recentTrainings, physicalProfile) {
  const parts = ['Analyze this football player data and give a weekly recommendation:'];

  if (skillTree?.ratings) {
    const avgByCategory = {};
    for (const r of skillTree.ratings) {
      if (!avgByCategory[r.category]) avgByCategory[r.category] = [];
      avgByCategory[r.category].push(r.rating);
    }
    const summary = Object.entries(avgByCategory)
      .map(([cat, ratings]) => `${cat}: ${(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)}/10`)
      .join(', ');
    parts.push(`Skills: ${summary}`);
  }

  if (recentMatches?.length > 0) {
    const goals = recentMatches.reduce((s, m) => s + m.goals, 0);
    const assists = recentMatches.reduce((s, m) => s + m.assists, 0);
    const avgRating = (recentMatches.reduce((s, m) => s + m.selfRating, 0) / recentMatches.length).toFixed(1);
    parts.push(`Last ${recentMatches.length} matches: ${goals} goals, ${assists} assists, avg rating ${avgRating}/10`);
  }

  if (recentTrainings?.length > 0) {
    const focusCounts = {};
    for (const t of recentTrainings) {
      for (const f of t.focusAreas) {
        focusCounts[f] = (focusCounts[f] || 0) + 1;
      }
    }
    parts.push(`Training focus: ${JSON.stringify(focusCounts)}`);
  }

  if (physicalProfile?.measurements?.length > 0) {
    const latest = physicalProfile.measurements[physicalProfile.latestIndex];
    parts.push(`Physical: ${latest.heightCm}cm, ${latest.weightKg}kg`);
    if (latest.sprintTime100m) parts.push(`100m sprint: ${latest.sprintTime100m}s`);
    if (latest.juggleRecord) parts.push(`Juggle record: ${latest.juggleRecord}`);
  }

  return parts.join('\n');
}
