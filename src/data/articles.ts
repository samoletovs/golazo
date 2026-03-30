import type { Article } from '../engine/types'

/** Initial article batch — football development content for all age tiers. */
export const articles: Article[] = [
  // ── Tactics ───────────────────────────────────────────────
  {
    id: 'art-tac-01',
    titleKey: 'What is "Pressing" and Why Do Coaches Love It?',
    bodyKey: 'Pressing means closing down the opponent quickly when they have the ball. The idea is simple: win the ball back as high up the pitch as possible. Modern coaches like Guardiola and Klopp built their teams around pressing. For young players, pressing starts with discipline — the moment you lose the ball, sprint toward it. Start with 3-second pressing: after losing possession, you have 3 seconds to win it back or get into a press position. This develops the habit without exhausting you.',
    category: 'tactics',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '🏃',
  },
  {
    id: 'art-tac-02',
    titleKey: 'Understanding Your Position: What Does a Midfielder Really Do?',
    bodyKey: 'A midfielder is the engine of the team — you connect defense to attack. Your main jobs: receive the ball under pressure, look for forward passes, support both defense and attack. The best midfielders (Modrić, De Bruyne, Pedri) share one trait: they always know where teammates are BEFORE receiving the ball. Practice "shoulder checking" — glance over your shoulder every few seconds during games. This one habit separates good midfielders from great ones.',
    category: 'tactics',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '⚽',
  },
  {
    id: 'art-tac-03',
    titleKey: 'Why Passing Is More Important Than Dribbling',
    bodyKey: 'The ball moves faster than any player. A pass covers 20 meters in under a second — the fastest dribbler needs 3-4 seconds. That is why the best teams pass more than they dribble. But passing is not just about accuracy — it is about timing and weight. A "heavy" pass is too hard for your teammate to control. A "soft" pass arrives too slowly and gets intercepted. Practice wall passes at different distances: 5m, 10m, 15m. Feel the difference in how hard you need to hit it.',
    category: 'tactics',
    ageTiers: ['u10', 'u12', 'u14'],
    readingTimeMin: 2,
    imageEmoji: '🎯',
  },

  // ── Nutrition ─────────────────────────────────────────────
  {
    id: 'art-nut-01',
    titleKey: 'What to Eat Before a Match',
    bodyKey: 'Your matchday meal should be 2-3 hours before kickoff. Focus on carbohydrates — they are your fuel. Good options: pasta with light sauce, rice with chicken, a banana sandwich, or oatmeal with fruit. Avoid heavy, fatty foods (pizza, burgers) — they sit in your stomach and slow you down. Drink water throughout the day, not just at the match. If you feel thirsty during warm-up, you started too late.',
    category: 'nutrition',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '🍝',
  },
  {
    id: 'art-nut-02',
    titleKey: 'Recovery Nutrition: What to Eat After Training',
    bodyKey: 'The 30-60 minutes after intense training is your "recovery window" — your body absorbs nutrients most efficiently. You need two things: protein (for muscle repair) and carbs (to refuel energy). Great post-training snacks: chocolate milk (surprisingly good!), a banana with peanut butter, yogurt with granola, or a simple sandwich. Do not skip this — players who refuel properly recover faster and train better the next day.',
    category: 'nutrition',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '🥛',
  },
  {
    id: 'art-nut-03',
    titleKey: 'Water: Your Secret Weapon',
    bodyKey: 'Even 2% dehydration (that is just losing 1kg of water weight for a 50kg player) drops your performance by 10-20%. Your brain slows down, your muscles fatigue faster, and your decision making gets worse. Drink water throughout the day — do not wait until you are thirsty. A good rule: drink a glass of water with every meal and bring a bottle to every training session.',
    category: 'nutrition',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    readingTimeMin: 1,
    imageEmoji: '💧',
  },

  // ── Mental ────────────────────────────────────────────────
  {
    id: 'art-men-01',
    titleKey: 'How to Handle a Bad Match',
    bodyKey: 'Every player has bad matches — even Messi. The difference is what you do after. Step 1: Allow yourself to feel disappointed (it is normal). Step 2: Within 24 hours, write down ONE thing you did well and ONE thing to improve. Step 3: In your next training, focus only on that one improvement. Do not try to fix everything. The worst thing you can do is replay the bad match in your head over and over. Learn, then move forward.',
    category: 'mental',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '💪',
  },
  {
    id: 'art-men-02',
    titleKey: 'Pre-Match Nerves: They Are Actually Good',
    bodyKey: 'Feeling nervous before a match is not a problem — it is your body preparing for performance. Those butterflies in your stomach mean adrenaline is flowing, your focus is sharpening, and your muscles are getting ready. Top athletes reframe nervousness as excitement: instead of "I am nervous," say "I am excited." Try a simple breathing routine before matches: breathe in for 4 counts, hold for 4, breathe out for 4. Do this 5 times. You will feel calmer but still energized.',
    category: 'mental',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '🧘',
  },
  {
    id: 'art-men-03',
    titleKey: 'The Power of Visualization',
    bodyKey: 'Olympic athletes spend time imagining their perfect performance before competing. You can do the same. Before a match or training, close your eyes for 2 minutes and imagine: receiving the ball, making a great pass, scoring a goal, defending well. Be specific — imagine the feeling of the ball on your foot, the sound of teammates cheering. Studies show visualization activates the same brain pathways as actually performing the skill. It is like a free extra training session.',
    category: 'mental',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '👁️',
  },

  // ── Rules ─────────────────────────────────────────────────
  {
    id: 'art-rul-01',
    titleKey: 'The Offside Rule Explained Simply',
    bodyKey: 'You are offside if ALL of these are true at the moment the ball is passed to you: (1) You are in the opponent half, (2) You are closer to the goal than the second-to-last defender (usually the last outfield player), (3) You are closer to the goal than the ball. You are NOT offside if: you receive the ball from a throw-in, goal kick, or corner kick. The key word is "at the moment the ball is PASSED" — you can run offside after the pass is made. Practice watching the defensive line and timing your runs.',
    category: 'rules',
    ageTiers: ['u10', 'u12', 'u14'],
    readingTimeMin: 2,
    imageEmoji: '🚩',
  },
  {
    id: 'art-rul-02',
    titleKey: 'Handball: When Is It a Foul?',
    bodyKey: 'The handball rule changed in 2021. It is a foul if: your hand/arm is in an unnatural position AND makes your body bigger, OR you deliberately touch the ball. It is NOT a foul if: the ball hits your hand when it is next to your body, or you are falling and use your hand to support yourself, or the ball bounces off your own body to your hand. For attackers, ANY handball that leads directly to a goal is disallowed, even if accidental.',
    category: 'rules',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '✋',
  },

  // ── Stories (Player Youth Stories) ────────────────────────
  {
    id: 'art-story-01',
    titleKey: 'Luka Modrić: The Boy from the War Zone',
    bodyKey: 'Luka Modrić grew up during the Croatian War of Independence. His family was displaced, and his grandfather was killed. As a child, he practiced football in hotel parking lots where refugees lived. When he tried out for Hajduk Split at age 16, they rejected him — "too small, too weak." He did not give up. He went to Dinamo Zagreb instead, worked harder than everyone, and eventually became the best midfielder in the world, winning the Ballon d\'Or in 2018. His lesson: your circumstances do not define your ceiling. Hard work does.',
    category: 'stories',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    readingTimeMin: 3,
    imageEmoji: '🇭🇷',
  },
  {
    id: 'art-story-02',
    titleKey: 'Lionel Messi: Too Small to Play?',
    bodyKey: 'At age 11, Messi was diagnosed with a growth hormone deficiency. He was much smaller than other kids his age. His local club in Argentina could not afford his treatment. Barcelona saw his talent and offered to pay for his medical treatment if he moved to Spain — at age 13, alone, far from family. He was homesick, small, and spoke with an accent kids mocked. But every single day he trained harder than anyone. By 17, he was in Barcelona\'s first team. By 22, he had his first Ballon d\'Or. Size never mattered — heart did.',
    category: 'stories',
    ageTiers: ['u10', 'u12', 'u14', 'u16'],
    readingTimeMin: 3,
    imageEmoji: '🇦🇷',
  },
  {
    id: 'art-story-03',
    titleKey: 'Erling Haaland: The Machine Was Once Just a Kid',
    bodyKey: 'Haaland was not always the goal machine you see today. As a teenager at Bryne FK in Norway, he was tall but uncoordinated. His father (a former pro) gave him a strict individual training plan on top of team training. Haaland did not complain — he added extra shooting sessions, sprint work, and strength training. By 16, he moved to Molde. By 19, he scored a hat-trick in the Champions League. The secret was never natural talent alone — it was the daily grind nobody saw.',
    category: 'stories',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '🇳🇴',
  },
  {
    id: 'art-story-04',
    titleKey: 'Pedri: From a Tiny Island to Barcelona',
    bodyKey: 'Pedri grew up in Tegueste, a small town on the island of Tenerife with 11,000 people. He trained at a local academy, not a big-city super club. Barcelona signed him at 16, but he went on loan to Las Palmas first. At 17, playing in Spain\'s second division, he showed something rare: calm. While others rushed, Pedri slowed the game down, found pockets of space, and made everyone around him better. At 18, he was starting for Barcelona and Spain. You do not need to come from a big city. You need patience, vision, and the willingness to be different.',
    category: 'stories',
    ageTiers: ['u12', 'u14', 'u16'],
    readingTimeMin: 2,
    imageEmoji: '🇪🇸',
  },
]
