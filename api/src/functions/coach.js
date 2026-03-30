const { app } = require('@azure/functions');
const { getUser, jsonResponse } = require('../cosmos');

/**
 * POST /api/coach — AI coaching recommendation.
 * Uses Azure OpenAI to generate personalized, holistic coaching advice.
 * Analyzes skills, matches, trainings, mood trends, and diary patterns.
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
    const userId = user?.userId || 'anonymous';

    // Rate limit check
    const lastRequest = rateLimitMap.get(userId);
    if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
      return jsonResponse({ error: 'Rate limited — one coaching session per day' }, 429);
    }

    const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const openaiKey = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

    if (!openaiEndpoint || !openaiKey) {
      return jsonResponse({
        greeting: '',
        recommendation: 'AI Coach is not yet configured. Keep training and logging your sessions — the AI Coach will be available soon!',
        insights: [],
        drills: [],
        focusArea: 'general',
        weeklyGoal: '',
      });
    }

    const body = await req.json();
    const { skillTree, recentMatches, recentTrainings, recentDiary, recentCheckIns, physicalProfile } = body;

    const prompt = buildPrompt(skillTree, recentMatches, recentTrainings, recentDiary, recentCheckIns, physicalProfile);

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
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 800,
            response_format: { type: 'json_object' },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI returned ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      rateLimitMap.set(userId, Date.now());
      return jsonResponse(result);
    } catch (_error) {
      return jsonResponse({
        greeting: '',
        recommendation: 'Could not generate coaching advice right now. Focus on your weakest skill category and train consistently!',
        insights: [],
        drills: [],
        focusArea: 'general',
        weeklyGoal: '',
      });
    }
  },
});

const SYSTEM_PROMPT = `You are a caring, professional youth football development coach. You know the player personally through their training logs, match performances, and general progress patterns.

Your role is to:
1. Give specific, actionable advice across ALL areas: technical, physical, tactical, mental, and football knowledge
2. Be the player's emotional support — notice when they might be struggling and offer encouragement WITHOUT ever saying "I noticed your mood was low" or mentioning any data directly. Just be naturally supportive
3. Provide practical tips: how to improve specific skills, recovery advice, pre-match routines, nutrition basics, tactical awareness
4. Share football knowledge: rules, formations, famous player habits, training methodology insights
5. Help build confidence and resilience — especially after losses or tough periods

CRITICAL RULES:
- NEVER mention that you analyzed their mood, diary, or data. Just be naturally helpful
- If the player seems to be going through a tough time, be warm and encouraging — talk about how setbacks are normal, share how pros handle them
- Keep language age-appropriate (8-18 year olds), encouraging, and specific
- Each insight should be a standalone useful piece of advice

Respond in JSON format:
{
  "greeting": "string (warm, personalized 1-sentence greeting)",
  "recommendation": "string (2-3 sentences, main focus area advice)",
  "insights": [
    { "category": "technical|physical|tactical|mental|knowledge|wellbeing", "icon": "emoji", "text": "string (1-2 sentences, specific actionable advice)" }
  ],
  "drills": ["drill1", "drill2", "drill3"],
  "focusArea": "technical|physical|tactical|mental",
  "weeklyGoal": "string (1 motivating sentence)"
}

Include 4-6 insights covering different categories. Always include at least one "wellbeing" insight if there are signs of low mood or tough period.`;

function buildPrompt(skillTree, recentMatches, recentTrainings, recentDiary, recentCheckIns, physicalProfile) {
  const parts = ['Here is the player data for a personalized weekly coaching session:'];

  if (skillTree?.ratings) {
    const avgByCategory = {};
    for (const r of skillTree.ratings) {
      if (!avgByCategory[r.category]) avgByCategory[r.category] = [];
      avgByCategory[r.category].push(r.rating);
    }
    const summary = Object.entries(avgByCategory)
      .map(([cat, ratings]) => `${cat}: ${(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)}/10`)
      .join(', ');
    parts.push(`\nSkill ratings: ${summary}`);
  }

  if (recentMatches?.length > 0) {
    const goals = recentMatches.reduce((s, m) => s + m.goals, 0);
    const assists = recentMatches.reduce((s, m) => s + m.assists, 0);
    const avgRating = (recentMatches.reduce((s, m) => s + m.selfRating, 0) / recentMatches.length).toFixed(1);
    const avgMood = (recentMatches.reduce((s, m) => s + (m.mood || 3), 0) / recentMatches.length).toFixed(1);
    const results = recentMatches.map(m => {
      const result = m.scoreUs > m.scoreThem ? 'W' : m.scoreUs < m.scoreThem ? 'L' : 'D';
      return `${result} ${m.scoreUs}-${m.scoreThem}`;
    }).join(', ');
    parts.push(`\nLast ${recentMatches.length} matches: ${goals} goals, ${assists} assists, self-rating ${avgRating}/10, mood ${avgMood}/5`);
    parts.push(`Results: ${results}`);

    // Include improvement notes (without identifying as data)
    const improvements = recentMatches.filter(m => m.toImprove).map(m => m.toImprove);
    if (improvements.length > 0) {
      parts.push(`Areas player wants to improve: ${improvements.slice(-3).join('; ')}`);
    }
  }

  if (recentTrainings?.length > 0) {
    const focusCounts = {};
    for (const tr of recentTrainings) {
      for (const f of tr.focusAreas) {
        focusCounts[f] = (focusCounts[f] || 0) + 1;
      }
    }
    const avgEnergy = (recentTrainings.reduce((s, tr) => s + tr.energy, 0) / recentTrainings.length).toFixed(1);
    const avgMood = (recentTrainings.reduce((s, tr) => s + tr.mood, 0) / recentTrainings.length).toFixed(1);
    parts.push(`\nTraining (last ${recentTrainings.length}): focus ${JSON.stringify(focusCounts)}, avg energy ${avgEnergy}/5, avg mood ${avgMood}/5`);
  }

  if (recentDiary?.length > 0) {
    const avgMood = (recentDiary.reduce((s, d) => s + (d.mood || 3), 0) / recentDiary.length).toFixed(1);
    parts.push(`\nGeneral wellbeing indicator: ${avgMood}/5 (from ${recentDiary.length} recent check-ins)`);
  }

  if (recentCheckIns?.length > 0) {
    const avgMood = (recentCheckIns.reduce((s, c) => s + c.mood, 0) / recentCheckIns.length).toFixed(1);
    const avgEnergy = (recentCheckIns.reduce((s, c) => s + c.energy, 0) / recentCheckIns.length).toFixed(1);
    const last3 = recentCheckIns.slice(-3);
    const decliningEnergy = last3.length >= 3 && last3.every(c => c.energy <= 2);
    parts.push(`\nDaily check-ins (last ${recentCheckIns.length} days): avg mood ${avgMood}/5, avg energy ${avgEnergy}/5`);
    if (decliningEnergy) {
      parts.push('WARNING: Energy has been consistently low (≤2/5) for the last 3 days — possible overtraining or fatigue');
    }
  }

  if (physicalProfile?.measurements?.length > 0) {
    const latest = physicalProfile.measurements[physicalProfile.latestIndex];
    const physParts = [`${latest.heightCm}cm, ${latest.weightKg}kg`];
    if (latest.sprintTime100m) physParts.push(`100m: ${latest.sprintTime100m}s`);
    if (latest.juggleRecord) physParts.push(`juggle record: ${latest.juggleRecord}`);
    parts.push(`\nPhysical: ${physParts.join(', ')}`);
  }

  return parts.join('\n');
}
