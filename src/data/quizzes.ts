import type { QuizQuestion } from '../engine/types'

/**
 * Static quiz question bank — football knowledge for all age tiers.
 * Questions use plain text (English) — i18n can wrap these later.
 * 10 questions per difficulty tier × 5 categories = 50+ questions.
 */
export const quizQuestions: QuizQuestion[] = [
  // ── U10 (Foundation) ──────────────────────────────────────
  { id: 'u10-rules-1', questionKey: 'How many players per team on a full-size pitch?', options: ['9', '10', '11', '12'], correctIndex: 2, category: 'rules', difficulty: 'u10' },
  { id: 'u10-rules-2', questionKey: 'What happens when the ball fully crosses the sideline?', options: ['Goal kick', 'Throw-in', 'Corner kick', 'Free kick'], correctIndex: 1, category: 'rules', difficulty: 'u10' },
  { id: 'u10-rules-3', questionKey: 'Which player can use their hands inside the penalty area?', options: ['Captain', 'Any defender', 'Goalkeeper', 'Referee'], correctIndex: 2, category: 'rules', difficulty: 'u10' },
  { id: 'u10-players-1', questionKey: 'Which country is Lionel Messi from?', options: ['Brazil', 'Spain', 'Argentina', 'Portugal'], correctIndex: 2, category: 'players', difficulty: 'u10' },
  { id: 'u10-players-2', questionKey: 'Which player is known as "CR7"?', options: ['Neymar', 'Messi', 'Mbappé', 'Cristiano Ronaldo'], correctIndex: 3, category: 'players', difficulty: 'u10' },
  { id: 'u10-nutrition-1', questionKey: 'What should you drink most during training?', options: ['Juice', 'Cola', 'Water', 'Milk'], correctIndex: 2, category: 'nutrition', difficulty: 'u10' },
  { id: 'u10-nutrition-2', questionKey: 'When is the best time to eat before a match?', options: ['5 minutes before', '2-3 hours before', 'During warm-up', 'Right after'], correctIndex: 1, category: 'nutrition', difficulty: 'u10' },
  { id: 'u10-history-1', questionKey: 'Which tournament is the biggest in world football?', options: ['Champions League', 'World Cup', 'Euro', 'Copa América'], correctIndex: 1, category: 'history', difficulty: 'u10' },
  { id: 'u10-history-2', questionKey: 'What color cards does a referee use?', options: ['Red and blue', 'Yellow and red', 'Green and red', 'Yellow and blue'], correctIndex: 1, category: 'history', difficulty: 'u10' },
  { id: 'u10-tactics-1', questionKey: 'What does a defender mainly do?', options: ['Score goals', 'Stop the other team from scoring', 'Take throw-ins', 'Coach the team'], correctIndex: 1, category: 'tactics', difficulty: 'u10' },

  // ── U12 (Development) ─────────────────────────────────────
  { id: 'u12-rules-1', questionKey: 'What is the offside rule?', options: ['You can\'t be behind the last defender when the ball is passed', 'You can\'t stand in the penalty area', 'You can\'t be near the goalkeeper', 'You must stay on your half'], correctIndex: 0, category: 'rules', difficulty: 'u12' },
  { id: 'u12-rules-2', questionKey: 'How long is a standard adult football match?', options: ['60 minutes', '80 minutes', '90 minutes', '120 minutes'], correctIndex: 2, category: 'rules', difficulty: 'u12' },
  { id: 'u12-rules-3', questionKey: 'What is a penalty kick awarded for?', options: ['Any foul', 'A foul inside the penalty area', 'Offside', 'Handball anywhere'], correctIndex: 1, category: 'rules', difficulty: 'u12' },
  { id: 'u12-players-1', questionKey: 'Which player won the Ballon d\'Or the most times?', options: ['Ronaldo', 'Messi', 'Pelé', 'Maradona'], correctIndex: 1, category: 'players', difficulty: 'u12' },
  { id: 'u12-players-2', questionKey: 'Luka Modrić plays for which national team?', options: ['Serbia', 'Slovenia', 'Croatia', 'Bosnia'], correctIndex: 2, category: 'players', difficulty: 'u12' },
  { id: 'u12-tactics-1', questionKey: 'What does "4-3-3" mean in football?', options: ['4 defenders, 3 midfielders, 3 forwards', 'Score 4, concede 3, draw 3', '4 goals in 3 matches', 'Play area zones'], correctIndex: 0, category: 'tactics', difficulty: 'u12' },
  { id: 'u12-tactics-2', questionKey: 'What is "pressing" in football?', options: ['Ironing kit', 'Closing down the opponent when they have the ball', 'Pushing the referee', 'Playing long balls'], correctIndex: 1, category: 'tactics', difficulty: 'u12' },
  { id: 'u12-nutrition-1', questionKey: 'Which food is best for energy before a match?', options: ['Chocolate', 'Pasta or rice', 'Pizza', 'Ice cream'], correctIndex: 1, category: 'nutrition', difficulty: 'u12' },
  { id: 'u12-history-1', questionKey: 'Which country hosted the first FIFA World Cup in 1930?', options: ['Brazil', 'England', 'Uruguay', 'Italy'], correctIndex: 2, category: 'history', difficulty: 'u12' },
  { id: 'u12-history-2', questionKey: 'What is the Champions League?', options: ['A youth tournament', 'Europe\'s top club competition', 'A national league', 'A friendly series'], correctIndex: 1, category: 'history', difficulty: 'u12' },

  // ── U14 (Youth) ───────────────────────────────────────────
  { id: 'u14-rules-1', questionKey: 'When can a substitute enter the pitch?', options: ['Anytime', 'Only at half-time', 'When the referee signals', 'Only after a goal'], correctIndex: 2, category: 'rules', difficulty: 'u14' },
  { id: 'u14-rules-2', questionKey: 'What is the "advantage rule"?', options: ['Better team gets extra time', 'Referee lets play continue if stopping would disadvantage the fouled team', 'Home team advantage', 'Top scorer gets a bonus'], correctIndex: 1, category: 'rules', difficulty: 'u14' },
  { id: 'u14-tactics-1', questionKey: 'What is a "false 9"?', options: ['A striker who drops deep to create space', 'A defender who wears #9', 'An illegal formation', 'A goalkeeper playing outfield'], correctIndex: 0, category: 'tactics', difficulty: 'u14' },
  { id: 'u14-tactics-2', questionKey: 'What does "transition" mean in football?', options: ['Changing kits', 'Switching between attack and defense', 'Transferring to a new club', 'Substituting a player'], correctIndex: 1, category: 'tactics', difficulty: 'u14' },
  { id: 'u14-tactics-3', questionKey: 'What is a "high press"?', options: ['Pressing the opponent in their own half', 'Heading the ball high', 'Making the pitch wet', 'Playing with high energy'], correctIndex: 0, category: 'tactics', difficulty: 'u14' },
  { id: 'u14-players-1', questionKey: 'At what age did Mbappé win the World Cup?', options: ['17', '19', '21', '23'], correctIndex: 1, category: 'players', difficulty: 'u14' },
  { id: 'u14-players-2', questionKey: 'Which club did Modrić play for before Real Madrid?', options: ['Barcelona', 'Tottenham', 'Bayern Munich', 'Juventus'], correctIndex: 1, category: 'players', difficulty: 'u14' },
  { id: 'u14-nutrition-1', questionKey: 'Why is protein important for young athletes?', options: ['It gives instant energy', 'It helps muscle recovery and growth', 'It makes you taller', 'It replaces water'], correctIndex: 1, category: 'nutrition', difficulty: 'u14' },
  { id: 'u14-history-1', questionKey: 'Which team won the most Champions League titles?', options: ['Barcelona', 'AC Milan', 'Real Madrid', 'Bayern Munich'], correctIndex: 2, category: 'history', difficulty: 'u14' },
  { id: 'u14-history-2', questionKey: 'What was the "Hand of God" goal?', options: ['Pelé\'s bicycle kick', 'Maradona\'s handball goal vs England', 'Zidane\'s volley', 'Ronaldo\'s free kick'], correctIndex: 1, category: 'history', difficulty: 'u14' },

  // ── U16+ (Senior Youth) ───────────────────────────────────
  { id: 'u16-tactics-1', questionKey: 'What is "gegenpressing"?', options: ['German for counter-pressing — immediately pressing after losing the ball', 'A type of defensive wall', 'Playing from the back', 'A set-piece strategy'], correctIndex: 0, category: 'tactics', difficulty: 'u16' },
  { id: 'u16-tactics-2', questionKey: 'What is the purpose of an "inverted full-back"?', options: ['To play as a striker', 'To tuck inside and control midfield', 'To replace the goalkeeper', 'To take all set pieces'], correctIndex: 1, category: 'tactics', difficulty: 'u16' },
  { id: 'u16-tactics-3', questionKey: 'In possession-based play, what is "positional superiority"?', options: ['Having more players in a zone than the opponent', 'Being taller than opponents', 'Playing on the home pitch', 'Having better rankings'], correctIndex: 0, category: 'tactics', difficulty: 'u16' },
  { id: 'u16-rules-1', questionKey: 'What is IFAB and what do they do?', options: ['International Football Association Board — they make the Laws of the Game', 'A doping agency', 'FIFA\'s marketing team', 'A youth development program'], correctIndex: 0, category: 'rules', difficulty: 'u16' },
  { id: 'u16-rules-2', questionKey: 'Under current rules, when is a handball NOT an offence for a defender?', options: ['Never', 'When the ball hits a hand that is next to the body', 'When the score is 0-0', 'In extra time'], correctIndex: 1, category: 'rules', difficulty: 'u16' },
  { id: 'u16-nutrition-1', questionKey: 'What is the recommended carb intake for matchday?', options: ['1-2g per kg body weight', '5-7g per kg body weight', '10g per kg', 'None — fasting is best'], correctIndex: 1, category: 'nutrition', difficulty: 'u16' },
  { id: 'u16-nutrition-2', questionKey: 'What is the "recovery window" after intense exercise?', options: ['First 30-60 minutes', 'Next day', '5 minutes', '3 hours'], correctIndex: 0, category: 'nutrition', difficulty: 'u16' },
  { id: 'u16-players-1', questionKey: 'Who is considered the youngest player to score in a World Cup final?', options: ['Mbappé', 'Pelé', 'Ronaldo', 'Owen'], correctIndex: 1, category: 'players', difficulty: 'u16' },
  { id: 'u16-history-1', questionKey: 'What tactical innovation did Johan Cruyff bring to Barcelona?', options: ['Catenaccio', 'Total Football / positional play', 'Route one', 'Park the bus'], correctIndex: 1, category: 'history', difficulty: 'u16' },
  { id: 'u16-history-2', questionKey: 'Which country has won the most World Cups?', options: ['Germany', 'Italy', 'Argentina', 'Brazil'], correctIndex: 3, category: 'history', difficulty: 'u16' },

  // ── Additional questions (5 per tier) ─────────────────────
  // U10 extra
  { id: 'u10-rules-4', questionKey: 'What shape is a football pitch?', options: ['Circle', 'Rectangle', 'Square', 'Triangle'], correctIndex: 1, category: 'rules', difficulty: 'u10' },
  { id: 'u10-players-3', questionKey: 'Which player is nicknamed "The Egyptian King"?', options: ['Messi', 'Salah', 'Neymar', 'Benzema'], correctIndex: 1, category: 'players', difficulty: 'u10' },
  { id: 'u10-tactics-2', questionKey: 'What does a goalkeeper mainly do?', options: ['Score goals', 'Stop the ball going in the net', 'Take corners', 'Sub players'], correctIndex: 1, category: 'tactics', difficulty: 'u10' },
  { id: 'u10-history-3', questionKey: 'How often is the FIFA World Cup held?', options: ['Every year', 'Every 2 years', 'Every 4 years', 'Every 5 years'], correctIndex: 2, category: 'history', difficulty: 'u10' },
  { id: 'u10-nutrition-3', questionKey: 'Which fruit is a great snack before training?', options: ['Lemon', 'Banana', 'Onion', 'Chili'], correctIndex: 1, category: 'nutrition', difficulty: 'u10' },

  // U12 extra
  { id: 'u12-rules-4', questionKey: 'What is a direct free kick awarded for?', options: ['Offside', 'A foul involving contact', 'Goalkeeper holds ball too long', 'Ball goes out of play'], correctIndex: 1, category: 'rules', difficulty: 'u12' },
  { id: 'u12-players-3', questionKey: 'Which club did Erling Haaland join before Manchester City?', options: ['Barca', 'Dortmund', 'PSG', 'Juventus'], correctIndex: 1, category: 'players', difficulty: 'u12' },
  { id: 'u12-tactics-3', questionKey: 'What is a "through ball"?', options: ['A ball kicked very hard', 'A pass played into space behind defenders', 'A header', 'A long goal kick'], correctIndex: 1, category: 'tactics', difficulty: 'u12' },
  { id: 'u12-nutrition-2', questionKey: 'Why should you avoid fizzy drinks on match day?', options: ['They are expensive', 'Sugar causes energy crash and bloating', 'They taste bad', 'The coach said so'], correctIndex: 1, category: 'nutrition', difficulty: 'u12' },
  { id: 'u12-history-3', questionKey: 'Which country won Euro 2024?', options: ['England', 'France', 'Spain', 'Germany'], correctIndex: 2, category: 'history', difficulty: 'u12' },

  // U14 extra
  { id: 'u14-rules-3', questionKey: 'What happens if a match is drawn in a knockout tournament?', options: ['Replay next week', 'Extra time and penalties', 'Coin flip', 'Both teams go through'], correctIndex: 1, category: 'rules', difficulty: 'u14' },
  { id: 'u14-players-3', questionKey: 'Who is the top scorer in Champions League history?', options: ['Messi', 'Lewandowski', 'Cristiano Ronaldo', 'Benzema'], correctIndex: 2, category: 'players', difficulty: 'u14' },
  { id: 'u14-tactics-4', questionKey: 'What is "parking the bus"?', options: ['Arriving late to the match', 'Defending deep with all players behind the ball', 'Playing only forwards', 'A training drill'], correctIndex: 1, category: 'tactics', difficulty: 'u14' },
  { id: 'u14-nutrition-2', questionKey: 'How much water should a young athlete drink per day?', options: ['1 glass', '1-2 liters', '5 liters', 'Only during training'], correctIndex: 1, category: 'nutrition', difficulty: 'u14' },
  { id: 'u14-history-3', questionKey: 'Which country invented modern football?', options: ['Brazil', 'Spain', 'England', 'Italy'], correctIndex: 2, category: 'history', difficulty: 'u14' },

  // U16 extra
  { id: 'u16-tactics-4', questionKey: 'What is the "half-space" in positional play?', options: ['The area between centre and wing — a channel between CBs and fullbacks', 'Half the pitch', 'The bench area', 'Behind the goal'], correctIndex: 0, category: 'tactics', difficulty: 'u16' },
  { id: 'u16-rules-3', questionKey: 'What is the "triple punishment" rule that was abolished?', options: ['Red card + penalty + suspension was considered too harsh, so IFAB removed auto-red for denying a goal-scoring opportunity in the box if the foul was an attempt to play the ball', 'Three yellow cards in a tournament', 'Fouling three times', 'Missing three penalties'], correctIndex: 0, category: 'rules', difficulty: 'u16' },
  { id: 'u16-players-2', questionKey: 'Which player holds the record for most international goals?', options: ['Messi', 'Ronaldo', 'Ali Daei', 'Pelé'], correctIndex: 1, category: 'players', difficulty: 'u16' },
  { id: 'u16-nutrition-3', questionKey: 'What is "periodized nutrition" in football?', options: ['Eating differently based on training load — more carbs on match days, more protein on recovery days', 'Only eating at certain times', 'A diet brand', 'Eating the same thing every day'], correctIndex: 0, category: 'nutrition', difficulty: 'u16' },
  { id: 'u16-history-3', questionKey: 'What year did VAR (Video Assistant Referee) debut at a World Cup?', options: ['2014', '2016', '2018', '2022'], correctIndex: 2, category: 'history', difficulty: 'u16' },
]

/** Get today's quiz question — deterministic by date + age tier */
export function getQuizOfTheDay(date: string, difficulty: QuizQuestion['difficulty']): QuizQuestion {
  const tierQuestions = quizQuestions.filter((q) => q.difficulty === difficulty)
  if (tierQuestions.length === 0) return quizQuestions[0] // fallback
  const dayIndex = Math.floor(new Date(date).getTime() / 86400000)
  return tierQuestions[dayIndex % tierQuestions.length]
}
