// Temporary script to seed content queue with mixed content types
const fs = require('fs')
const existing = JSON.parse(fs.readFileSync('data/content-queue.json', 'utf8'))

const newItems = [
  // ── New quiz questions ──
  {
    type: 'quiz', id: 'u10-tactics-3', status: 'queued',
    category: 'tactics', difficulty: 'u10',
    en: { question: 'What should a forward do when their teammate has the ball?' },
    options: ['Stand still', 'Run into space to receive a pass', 'Sit down', 'Walk to the sideline'],
    correctIndex: 1
  },
  {
    type: 'quiz', id: 'u12-nutrition-3', status: 'queued',
    category: 'nutrition', difficulty: 'u12',
    en: { question: 'What is chocolate milk good for after training?' },
    options: ['Nothing — it is junk food', 'Recovery — it has the right mix of carbs and protein', 'Making you run faster', 'Replacing water'],
    correctIndex: 1
  },
  {
    type: 'quiz', id: 'u14-tactics-5', status: 'queued',
    category: 'tactics', difficulty: 'u14',
    en: { question: 'What is a "rondo" in football training?' },
    options: ['A bicycle kick', 'A keep-away drill where players in a circle pass while defenders try to win it', 'A type of free kick', 'A defensive formation'],
    correctIndex: 1
  },

  // ── New quotes ──
  {
    type: 'quote', id: 'putellas-1', status: 'queued',
    player: 'Alexia Putellas', themes: ['motivation', 'mentalStrength'],
    en: { text: 'The path did not exist. I had to create it myself' },
    ru: { text: 'Пути не было. Мне пришлось создать его самой' },
    lv: { text: 'Ceļa nebija. Man tas bija jāizveido pašai' },
    es: { text: 'El camino no existía. Tuve que crearlo yo misma' },
    et: { text: 'Teed ei olnud. Pidin selle ise looma' },
    lt: { text: 'Kelio nebuvo. Turėjau jį susikurti pati' }
  },
  {
    type: 'quote', id: 'haaland-1', status: 'queued',
    player: 'Erling Haaland', themes: ['hardWork', 'motivation'],
    en: { text: 'I just want to score goals. Every single day I think about scoring goals' },
    ru: { text: 'Я просто хочу забивать голы. Каждый день я думаю о том, как забить' },
    lv: { text: 'Es vienkārši gribu gūt vārtus. Katru dienu es domāju par vārtu gūšanu' },
    es: { text: 'Solo quiero marcar goles. Cada día pienso en marcar goles' },
    et: { text: 'Ma tahan lihtsalt väravaid lüüa. Iga päev mõtlen väravate löömisele' },
    lt: { text: 'Aš tiesiog noriu pelnyti įvarčius. Kiekvieną dieną galvoju apie įvarčių mušimą' }
  },
  {
    type: 'quote', id: 'mbappe-1', status: 'queued',
    player: 'Kylian Mbappé', themes: ['motivation', 'fun'],
    en: { text: 'Dream big, stay humble, and never forget where you came from' },
    ru: { text: 'Мечтай по-крупному, оставайся скромным и никогда не забывай, откуда ты' },
    lv: { text: 'Sapņo lielus sapņus, paliec pieticīgs un nekad neaizmirsti, no kurienes tu nāc' },
    es: { text: 'Sueña en grande, mantente humilde y nunca olvides de dónde vienes' },
    et: { text: 'Unista suurelt, jää tagasihoidlikuks ja ära kunagi unusta, kust sa tuled' },
    lt: { text: 'Svajok drąsiai, likk kuklus ir niekada nepamiršk, iš kur atėjai' }
  },
  {
    type: 'quote', id: 'pedri-1', status: 'queued',
    player: 'Pedri', themes: ['technique', 'mentalStrength'],
    en: { text: 'Football is about making good decisions. Speed means nothing if you run in the wrong direction' },
    ru: { text: 'Футбол — это правильные решения. Скорость ничего не значит, если бежишь не туда' },
    lv: { text: 'Futbols ir par labiem lēmumiem. Ātrums nenozīmē neko, ja skrien nepareizā virzienā' },
    es: { text: 'El fútbol es tomar buenas decisiones. La velocidad no significa nada si corres en la dirección equivocada' },
    et: { text: 'Jalgpall on head otsused. Kiirus ei tähenda midagi, kui jooksed vales suunas' },
    lt: { text: 'Futbolas — tai geri sprendimai. Greitis nieko nereiškia, jei bėgi ne ta kryptimi' }
  },

  // ── New exercises ──
  {
    type: 'exercise', id: 'tech-06', status: 'queued',
    category: 'technical', subSkill: 'heading', difficulty: 2, durationMinutes: 10,
    equipment: ['ballOnly', 'partner'], positions: ['ST', 'CB'], methodology: 'coerver',
    en: { name: 'Heading Technique', desc: 'Partner throws ball softly, you head it back. Focus on forehead contact, eyes open, neck firm. Start from 2m, gradually increase. 3 sets of 10.' },
    ru: { name: 'Техника игры головой', desc: 'Партнёр мягко подбрасывает мяч, ты отбиваешь головой назад. Фокус на контакте лбом, глаза открыты, шея напряжена. Начни с 2 м, постепенно увеличивай. 3 серии по 10.' },
    lv: { name: 'Galvas sitienu tehnika', desc: 'Partneris maigi iemet bumbu, tu sit ar galvu atpakaļ. Fokuss uz kontaktu ar pieri, acis atvērtas, kakls stingrs. Sāc no 2m, pakāpeniski palielini. 3 sērijas pa 10.' },
    es: { name: 'Técnica de cabeceo', desc: 'Tu compañero lanza el balón suavemente, tú lo cabeceas de vuelta. Enfócate en el contacto con la frente, ojos abiertos, cuello firme. Empieza desde 2m, aumenta gradualmente. 3 series de 10.' },
    et: { name: 'Peaga mängu tehnika', desc: 'Partner viskab palli õrnalt, sa pead tagasi. Keskendu otsaesise kontaktile, silmad lahti, kael pingul. Alusta 2m, suurenda järk-järgult. 3 seeriat 10 korda.' },
    lt: { name: 'Galvos smūgio technika', desc: 'Partneris švelniai meta kamuolį, tu muši galva atgal. Koncentruokis į kontaktą kakta, akys atviros, kaklas tvirtas. Pradėk nuo 2m, palaipsniui didink. 3 serijos po 10.' }
  },
  {
    type: 'exercise', id: 'phys-06', status: 'queued',
    category: 'physical', subSkill: 'strength', difficulty: 2, durationMinutes: 15,
    equipment: ['none'], positions: [], methodology: 'uefa',
    en: { name: 'Bodyweight Football Circuit', desc: '4 exercises, 30 sec each, 15 sec rest: (1) Squats, (2) Push-ups, (3) Lunges, (4) Plank. Repeat 3 rounds. Focus on form over speed. Builds the strength base that makes you faster and more resistant to injury.' },
    ru: { name: 'Круговая тренировка с весом тела', desc: '4 упражнения по 30 сек, отдых 15 сек: (1) Приседания, (2) Отжимания, (3) Выпады, (4) Планка. 3 круга. Фокус на технике, не на скорости. Строит силовую базу, которая делает тебя быстрее.' },
    lv: { name: 'Ķermeņa svara futbola treniņš', desc: '4 vingrojumi pa 30 sek, atpūta 15 sek: (1) Pietupieni, (2) Atspiešanās, (3) Izsoļi, (4) Planka. Atkārto 3 apļus. Fokuss uz formu, ne ātrumu. Ceļ spēka bāzi, kas padara tevi ātrāku.' },
    es: { name: 'Circuito de peso corporal', desc: '4 ejercicios, 30 seg cada uno, 15 seg descanso: (1) Sentadillas, (2) Flexiones, (3) Zancadas, (4) Plancha. Repite 3 rondas. Enfócate en la forma, no en la velocidad.' },
    et: { name: 'Kehakaaluga jalgpalli ring', desc: '4 harjutust, 30 sek igaüks, 15 sek puhkus: (1) Kükid, (2) Kätekõverdused, (3) Väljaasted, (4) Plank. Korda 3 ringi. Keskendu tehnikale.' },
    lt: { name: 'Kūno svorio futbolo treniruotė', desc: '4 pratimai po 30 sek, poilsis 15 sek: (1) Pritūpimai, (2) Atsispaudimai, (3) Išpuoliai, (4) Planka. Kartok 3 ratus. Dėmesys technikai.' }
  }
]

existing.push(...newItems)
fs.writeFileSync('data/content-queue.json', JSON.stringify(existing, null, 2) + '\n', 'utf8')
console.log('Added', newItems.length, 'new items to content queue')
console.log('Types:', [...new Set(newItems.map(i => i.type))].join(', '))
