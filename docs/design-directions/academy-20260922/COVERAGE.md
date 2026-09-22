# Whole-app surface inventory

Source baseline: `1a0b81b80ca7c0bdf73b1074a8c5bc7fdbb8dcfc` (fresh `origin/master`, PR #10).

**60 named surface/treatment groups:** 29 representative interactive concepts, 31 individually mapped treatments. The static scan covers all 73 TSX files: 65 in the App import graph and 8 explicitly unimported. Import-graph reachability is not the same as an exposed navigation path. No production code changes are included.

## Reading the inventory

- **Interactive concept:** representative controls/data rendered in A and B; not a production implementation or complete schema/permission test.
- **Mapped treatment:** a specific future layout/state/behavior plan, visible through the prototype inventory. Not a blank legacy page or a claim that the feature works.
- **Behavior unchanged:** production source, permissions, schemas, XP rules and persistence remain untouched; proposed visual integration is not authorization to change them.
- A surface can have a representative interactive parent and individually planned specialist dialogs. Those dialogs have their own rows.

## Route reconciliation

| Production entry | Concept treatment |
|---|---|
| Player dashboard / activity | Home weekboard or journal; activity capabilities distributed explicitly across the five tabs |
| Log selector | Log; training/match/reflection, skip treatment and tournament path |
| Learn / exercises / challenges | Learn with exercise/article/program drillthroughs; challenge treatment |
| Progress | Activity charts, sparse-state behavior, match review, measurement example, skill/evaluation treatments |
| Profile | Academy identity, goals, teams, settings/onboarding, photos/export/friends treatments |
| Schedule / FootballPortal | Calendar/events, tournaments and directory treatment |
| Coach dashboard | Coach workspace with roster/planner/attendance and specific announcement/evaluation/challenge/filter treatments |
| Mentor dashboard | Aggregate activity/check-ins, no diary text, linked-player and wellbeing treatments |
| leaderboard branch | Render branch exists, but no inbound player navigation found; proposed explicit Profile entry is marked as a design proposal |
| coach / squads Page values | Declared but not rendered in App; not counted as functioning production routes. Prototype coach is a role-preview alias. |

## Surface-by-surface disposition

### shell — Home

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#home)

A: persistent academy rail and working canvas. B: horizontal matchday navigation and journal spreads. All five player tabs are redesigned; role navigation changes with the role.

*LV:* A: akadēmijas sānu navigācija un darba laukums. B: horizontāla navigācija un dienasgrāmatas atvērumi. Pārveidotas visas piecas spēlētāja sadaļas; lomas maina navigāciju.

**Behavior boundary:** App Page union, role branches and BottomNav are the baseline. No production routing edits.

**Source:** [src/App.tsx](../../../src/App.tsx), [src/main.tsx](../../../src/main.tsx), [src/components/BottomNav.tsx](../../../src/components/BottomNav.tsx)

### home — Home

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#home)

A organizes the week spatially; B opens from the latest match and next practice. Neither is a greeting, jersey and metric-card dashboard.

*LV:* A telpiski sakārto nedēļu; B sāk ar pēdējo spēli un nākamo treniņu. Neviens nav sveiciens ar kreklu un metriku kartītēm.

**Behavior boundary:** Same synthetic schedule, logs and player in both directions.

**Source:** [src/pages/Clubhouse.tsx](../../../src/pages/Clubhouse.tsx), [src/components/training/ClubhouseHeader.tsx](../../../src/components/training/ClubhouseHeader.tsx)

### activity — All football spaces

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#home)

The old activity-dashboard capabilities are integrated into Home, Schedule, Learn and Profile rather than linked to an untouched legacy page. Check-in, quiz, announcements and advice remain explicitly mapped below.

*LV:* Agrākā aktivitāšu pārskata iespējas ir Sākumā, Kalendārā, Mācībās un Profilā, nevis saitē uz veco lapu. Pašsajūta, jautājumi, paziņojumi un padomi ir kartēti zemāk.

**Behavior boundary:** Optional goals and quote placement change visually; progression rules are not redefined.

**Source:** [src/pages/Dashboard.tsx](../../../src/pages/Dashboard.tsx), [src/components/QuoteCard.tsx](../../../src/components/QuoteCard.tsx), [src/components/WeeklyGoalRing.tsx](../../../src/components/WeeklyGoalRing.tsx)

### log — Log

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#log)

A uses a log selector beside recent records. B uses a date-indexed journal with clear entry tools. Pending schedule items open prefilled training.

*LV:* A savieno ieraksta izvēli ar vēsturi. B izmanto datētu dienasgrāmatu un skaidrus ierakstu rīkus. Plānotais treniņš atver aizpildītu formu.

**Behavior boundary:** Training, match, diary and tournament import remain distinct.

**Source:** [src/pages/LogPage.tsx](../../../src/pages/LogPage.tsx)

### training — Training

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#training)

Native fields, optional focus/notes, visible validation, failed-save retry and an explicit simulated completion. Both layouts preserve answers.

*LV:* Dabiskas vadīklas, fokuss/piezīmes pēc izvēles, validācija, kļūdas atkārtošana un skaidri simulēts rezultāts. Abi izkārtojumi saglabā atbildes.

**Behavior boundary:** Date, type, minutes, energy, mood, focus, notes. U13 demo +20 XP; not a persistence/API test.

**Source:** [src/pages/TrainingLog.tsx](../../../src/pages/TrainingLog.tsx), [src/components/training/TrainingFields.tsx](../../../src/components/training/TrainingFields.tsx), [src/components/training/TrainingCompletion.tsx](../../../src/components/training/TrainingCompletion.tsx)

### match — Match

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#match)

A is a match sheet; B is a match-journal entry. Score, opponent, minutes, goals, assists and reflection are usable. Advanced match fields share the expandable detail treatment.

*LV:* A ir spēles lapa; B ir spēles dienasgrāmatas ieraksts. Darbojas rezultāts, pretinieks, minūtes, vārti, piespēles un pārdomas. Papildu lauki ir izvēršami.

**Behavior boundary:** MatchEntry stays the authority, including position, shots, key passes, tackles and selfRating 1–10. Search uses synthetic choices, not a team API.

**Source:** [src/pages/MatchLog.tsx](../../../src/pages/MatchLog.tsx), [src/components/TeamSearch.tsx](../../../src/components/TeamSearch.tsx)

### reflection — Reflection

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#reflection)

A quiet private writing space within the same shell, with mood and a separate AI-consent control. Mentor screens never render the text.

*LV:* Mierīga personīga rakstīšanas vieta kopējā lietotnē, ar noskaņojumu un atsevišķu MI atļauju. Mentora skatā teksta nav.

**Behavior boundary:** Current DiaryPage initializes aiConsent=true. The concept mirrors that state and sends nothing; changing the default requires a separate decision.

**Source:** [src/pages/DiaryPage.tsx](../../../src/pages/DiaryPage.tsx)

### skip — A pause is part of the week.

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/skip)

A small nonjudgmental action on a scheduled event, with the existing age-filtered reasons in a sheet. Keep the event and reason visible after acknowledgement.

*LV:* Neliela, nevērtējoša darbība pie notikuma; esošie vecumam atbilstošie iemesli atveras panelī. Pēc apstiprinājuma redzams notikums un iemesls.

**Behavior boundary:** Existing skipped-event IDs/reasons, no training entry or inactivity XP. No invented rest-day API.

**Source:** [src/pages/LogPage.tsx](../../../src/pages/LogPage.tsx)

### progress — Progress

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#progress)

A uses an inspectable training histogram; B uses a wide activity trace. Minutes/sessions/matches use the same dated fixture entries. Sparse mode has no invented trend.

*LV:* A izmanto aplūkojamu treniņu histogrammu; B — plašu aktivitātes līkni. Minūtes/treniņi/spēles izriet no tiem pašiem datētajiem ierakstiem. Tukšumā nav izdomātas tendences.

**Behavior boundary:** No talent score, predictive readiness, improvement percentage or new analytics API.

**Source:** [src/pages/ProgressPage.tsx](../../../src/pages/ProgressPage.tsx), [src/components/training/TrainingProgress.tsx](../../../src/components/training/TrainingProgress.tsx), [src/components/EmptyState.tsx](../../../src/components/EmptyState.tsx)

### skills — Skill history

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/skills)

An expandable skill-history section after activity charts, with category explanation and the existing rating origin. It is not the player’s headline identity.

*LV:* Izvēršama prasmju vēsture aiz aktivitātes grafikiem, ar kategoriju skaidrojumu un vērtējuma izcelsmi. Tā nav spēlētāja galvenā identitāte.

**Behavior boundary:** Existing SkillTree/rating computation retained; no new ability metric.

**Source:** [src/components/SkillRadar.tsx](../../../src/components/SkillRadar.tsx)

### evaluations — Coach evaluations

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/evaluations)

A dated coach-feedback timeline with expandable strengths, improvements and goals. Desktop gives the note room; mobile uses an accordion, not six tiny score cards.

*LV:* Datēta trenera atsauksmju virkne ar stiprajām pusēm, uzlabojumiem un mērķiem. Datorā vieta piezīmēm, tālrunī izvēršami ieraksti.

**Behavior boundary:** Existing PlayerEvaluation fields and access; absence is shown honestly.

**Source:** [src/components/EvaluationHistory.tsx](../../../src/components/EvaluationHistory.tsx)

### measurements — Measurements

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#measurements)

A voluntary measurement sheet and record list; the example uses juggleRecord only. The field-picker treatment groups the existing age-aware measures.

*LV:* Brīvprātīga mērījumu forma un vēsture; piemērs izmanto tikai bumbas žonglēšanas rekordu. Lauku izvēlē grupēti esošie vecumam atbilstošie mērījumi.

**Behavior boundary:** Other physical fields remain mapped to the grouped editor; no body target or diagnosis is invented.

**Source:** [src/components/PhysicalUpdateFlow.tsx](../../../src/components/PhysicalUpdateFlow.tsx), [src/components/TrackedFieldsEditor.tsx](../../../src/components/TrackedFieldsEditor.tsx)

### learn — Learn

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#learn)

A filtered practice library; B a visual practice shelf and reading column. Exercises, articles and programs have distinct compositions but a shared navigation grammar.

*LV:* A ir filtrējama bibliotēka; B — vizuāls vingrinājumu plaukts un lasīšanas sleja. Vingrinājumiem, rakstiem un programmām ir atšķirīgi izkārtojumi un vienota navigācija.

**Behavior boundary:** Existing age-tier filtering and catalog categories remain the implementation constraint.

**Source:** [src/pages/LearnPage.tsx](../../../src/pages/LearnPage.tsx)

### exercises — Exercises

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#learn)

Search and saved filtering work on three synthetic entries. Duration/equipment/category stay legible. Detail opens a full workspace, not an old modal skin.

*LV:* Meklēšana un saglabāto filtrs darbojas trim izdomātiem ierakstiem. Ilgums, inventārs un kategorija ir lasāmi. Detaļas atver darba skatu, nevis veco modāli.

**Behavior boundary:** Existing sort/difficulty/category filters map to the same filter band; the concept is not the full curated catalog.

**Source:** [src/pages/Exercises.tsx](../../../src/pages/Exercises.tsx)

### exercise — Practice notes

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#exercise)

Original tactical geometry explains the first-touch example; step selection, save/remove and one-time demo completion work. No commercial video thumbnails.

*LV:* Oriģināla taktiskā shēma skaidro pirmā pieskāriena piemēru; darbojas soļi, saglabāšana/noņemšana un vienreizēja demo pabeigšana. Nav komerciālu video attēlu.

**Behavior boundary:** Production video and external-source attribution remain planned in the same media region; no external player is loaded.

**Source:** [src/pages/Exercises.tsx](../../../src/pages/Exercises.tsx), [src/components/VideoPlayer.tsx](../../../src/components/VideoPlayer.tsx)

### submit-drill — Add your own drill

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/submit-drill)

A field-based editor using the exercise-detail layout: title, instructions, category, difficulty, duration, equipment and optional video URL. Preview before adding.

*LV:* Vingrinājuma skata redaktors: nosaukums, norādes, kategorija, grūtība, ilgums, inventārs un video saite pēc izvēles. Priekšskatījums pirms pievienošanas.

**Behavior boundary:** Existing UserDrill fields; no generated coach content or upload service.

**Source:** [src/pages/Exercises.tsx](../../../src/pages/Exercises.tsx)

### article — Read & understand

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#article)

A readable lesson with a diagram and one mark-read action. No chart-like decorative data or forced quiz gate.

*LV:* Lasāma nodarbība ar shēmu un vienu izlasīšanas darbību. Nav dekoratīvu datu vai obligāta jautājuma.

**Behavior boundary:** ReadArticle and existing reward semantics are only simulated once.

**Source:** [src/pages/LearnPage.tsx](../../../src/pages/LearnPage.tsx)

### program — Programs

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#program)

Program overview, start, workout steps and completion are clickable. The day/rating sheet maps to the existing week/day model.

*LV:* Programmas pārskats, sākšana, vingrinājumi un pabeigšana ir klikšķināmi. Dienas/vērtējuma panelis atbilst esošajam nedēļas/dienas modelim.

**Behavior boundary:** No new training-program generator. Repeated demo completion does not accumulate rewards.

**Source:** [src/pages/LearnPage.tsx](../../../src/pages/LearnPage.tsx), [src/components/WorkoutView.tsx](../../../src/components/WorkoutView.tsx)

### challenges — Team challenges

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/challenges)

Separate daily, weekly and special-track sections inside Learn. Show activity completed and remaining options without streak-loss messaging.

*LV:* Atsevišķas dienas, nedēļas un īpašo programmu sadaļas Mācībās. Redzams paveiktais un izvēles, bez biedēšanas par sērijas zaudēšanu.

**Behavior boundary:** Existing challenge targets, gates and XP computations remain unchanged; not a new challenge API.

**Source:** [src/pages/Challenges.tsx](../../../src/pages/Challenges.tsx)

### profile — Profile

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#profile)

A uses an academy registration card; B uses a player dossier. Position, team and personal choices lead instead of the existing FUT-style overall rating.

*LV:* A izmanto akadēmijas reģistrācijas karti; B — spēlētāja dosjē. Priekšplānā pozīcija, komanda un izvēles, nevis FUT stila kopējais reitings.

**Behavior boundary:** PlayerProfile fields preserved. Skill metrics are mapped separately, not deleted from the data model.

**Source:** [src/pages/Profile.tsx](../../../src/pages/Profile.tsx)

### goals — A goal of your own

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#goals)

Optional goal editor beside the actual recorded count. It is the player’s choice, not an app quota.

*LV:* Mērķa redaktors pēc izvēles blakus reālajam ierakstu skaitam. Tā ir spēlētāja izvēle, nevis lietotnes norma.

**Behavior boundary:** The concept renders the trainings metric; matches/goals/assists/diary/XP/streak metrics map to the same editor.

**Source:** [src/components/PersonalGoals.tsx](../../../src/components/PersonalGoals.tsx)

### achievements — Achievements

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/achievements)

A collected-record shelf in Profile, plus one bounded completion signal. XP/rank remain secondary; no giant rating or perpetual reward animation.

*LV:* Paveiktā plaukts Profilā un viens īss pabeigšanas signāls. XP/rangs ir pakārtots; nav milzu reitinga vai pastāvīgas balvu animācijas.

**Behavior boundary:** Existing awards/levels/ranks; healthy presentation does not silently change calculation.

**Source:** [src/components/AchievementsList.tsx](../../../src/components/AchievementsList.tsx), [src/components/XpBar.tsx](../../../src/components/XpBar.tsx), [src/components/LevelUpCelebration.tsx](../../../src/components/LevelUpCelebration.tsx), [src/components/ConfettiBurst.tsx](../../../src/components/ConfettiBurst.tsx)

### export — Player card export

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/export)

Export preview becomes an original academy credential using existing profile/activity fields. Share and download are explicit alternatives.

*LV:* Eksporta priekšskatījums kļūst par oriģinālu akadēmijas apliecību ar esošajiem profila/aktivitāšu laukiem. Kopīgošana un lejupielāde ir atsevišķas darbības.

**Behavior boundary:** Current renderFifaCard/share/download capability exists; no commercial card assets are copied and no export is faked here.

**Source:** [src/pages/Profile.tsx](../../../src/pages/Profile.tsx)

### photo — Profile photo

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/photo)

A contained optional photo picker with preview/remove/error states in identity settings. Synthetic concepts use geometry instead of children’s photos.

*LV:* Neliela foto izvēle pēc vēlēšanās ar priekšskatījumu/noņemšanu/kļūdām identitātes iestatījumos. Koncepts izmanto ģeometriju, nevis bērnu foto.

**Behavior boundary:** Existing compression/upload/removal semantics; no real photos or new upload endpoint.

**Source:** [src/components/PhotoUpload.tsx](../../../src/components/PhotoUpload.tsx)

### settings — Settings

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#settings)

Language, theme explanation, account/privacy links and the first-time setup are one deliberate settings surface rather than an endless profile column.

*LV:* Valoda, tēmas skaidrojums, konts/privātums un pirmā iestatīšana ir vienā skaidrā iestatījumu skatā, nevis bezgalīgā profila slejā.

**Behavior boundary:** EN/LV work in the concept. RU/ES/LT/ET and existing theme presets retain the same planned control treatment.

**Source:** [src/components/ThemePicker.tsx](../../../src/components/ThemePicker.tsx), [src/pages/Profile.tsx](../../../src/pages/Profile.tsx)

### teams — My teams

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#teams)

Current teams and an add/select-club dialog demonstrate identity without recoloring every surface. Club → age squad → role/position steps are explicitly preserved.

*LV:* Komandu saraksts un kluba izvēles dialogs demonstrē identitāti, nepārkrāsojot visas virsmas. Saglabāti soļi klubs → vecuma komanda → loma/pozīcija.

**Behavior boundary:** Synthetic choices only; duplicate detection/new registry team and coach-role details are mapped to the same sheet, not live calls.

**Source:** [src/components/TeamPicker.tsx](../../../src/components/TeamPicker.tsx), [src/components/AddTeamDialog.tsx](../../../src/components/AddTeamDialog.tsx)

### schedule — Schedule

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#schedule)

A spatial weekboard with month switch; B a day-indexed session list with month overview. Add-event form and event drillthrough work.

*LV:* A ir telpiska nedēļa ar mēneša slēdzi; B — dienu notikumu saraksts un mēneša pārskats. Darbojas notikuma pievienošana un atvēršana.

**Behavior boundary:** Training/match/tournament events; times/location/notes use the existing ScheduleEvent model.

**Source:** [src/pages/SchedulePage.tsx](../../../src/pages/SchedulePage.tsx)

### recurring — Weekly training setup

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/recurring)

A weekly row editor for day, time range, type and venue, with squad selection for coaches and a clear remove confirmation.

*LV:* Nedēļas rindu redaktors dienai, laikam, veidam un vietai, ar komandas izvēli treneriem un skaidru noņemšanas apstiprinājumu.

**Behavior boundary:** RecurringTraining fields and coach multi-squad filtering remain; no calendar integration is invented.

**Source:** [src/pages/SchedulePage.tsx](../../../src/pages/SchedulePage.tsx)

### tournament — Tournament

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#tournament)

Fixture board, age class, source/import treatment and links into match/reflection. Result rows distinguish finished and upcoming games.

*LV:* Spēļu saraksts, vecuma grupa, avots/importa pieeja un saites uz spēli/pārdomām. Atšķirti noslēgti un gaidāmi mači.

**Behavior boundary:** SharedTournament/participant/per-player reflection model, not live scraping in this concept.

**Source:** [src/components/TournamentImport.tsx](../../../src/components/TournamentImport.tsx), [src/pages/FootballPortal.tsx](../../../src/pages/FootballPortal.tsx)

### tournament-import — Import treatment

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/tournament-import)

URL → fetch status → team/age-class choice → preview fixtures → confirm; error and retry stay in the same sheet with typed input intact.

*LV:* Saite → ielādes statuss → komanda/vecuma grupa → spēļu priekšskatījums → apstiprinājums; kļūda/atkārtošana saglabā ievadi tajā pašā panelī.

**Behavior boundary:** Existing importer and source URL semantics; no network request or invented extraction capability.

**Source:** [src/components/TournamentImport.tsx](../../../src/components/TournamentImport.tsx), [src/components/TeamSearch.tsx](../../../src/components/TeamSearch.tsx)

### portal — All football spaces

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/portal)

Football directory and tournaments enter through Schedule/Profile. Club detail has parent club, sibling squads, factual links and a clear return path.

*LV:* Futbola katalogs un turnīri ir sasniedzami no Kalendāra/Profila. Kluba detaļās vecākklubs, citas komandas, faktiskās saites un atgriešanās.

**Behavior boundary:** Current directory/hierarchy/calendar/results capability; external links are deliberately not followed in concepts.

**Source:** [src/pages/FootballPortal.tsx](../../../src/pages/FootballPortal.tsx), [src/components/TeamProfile.tsx](../../../src/components/TeamProfile.tsx)

### friends — Friends & shared challenges

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/friends)

An opt-in friends space with invite/join, period-labeled results and separate create/join/progress challenge forms. Proposed clear entry from Profile.

*LV:* Draugu telpa pēc izvēles: uzaicināt/pievienoties, rezultāti ar periodu un atsevišķas izaicinājumu formas. Plānota skaidra saite no Profila.

**Behavior boundary:** A leaderboard render branch exists, but static navigation tracing found no inbound player link. This gap is explicit, not silently presented as working production navigation.

**Source:** [src/pages/LeaderboardPage.tsx](../../../src/pages/LeaderboardPage.tsx), [src/components/SocialChallenges.tsx](../../../src/components/SocialChallenges.tsx)

### checkin — How are you feeling?

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#checkin)

A short mood/energy sheet from Home, with optional note and no attendance guilt. Both directions use native scales.

*LV:* Īss noskaņojuma/enerģijas panelis no Sākuma, ar piezīmi pēc izvēles un bez vainošanas. Abos virzienos dabiskas skalas.

**Behavior boundary:** Existing 1–5 check-in fields; no diagnostic interpretation or new health metric.

**Source:** [src/components/DailyCheckIn.tsx](../../../src/components/DailyCheckIn.tsx)

### quiz — One football question

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#quiz)

One readable question, keyboard-selectable answers and explanation. No timed pressure or heart-loss mechanism.

*LV:* Viens lasāms jautājums, ar tastatūru izvēlamas atbildes un skaidrojums. Bez laika spiediena vai dzīvību zaudēšanas.

**Behavior boundary:** Existing age-aware quiz model; one original synthetic question, not the full catalog.

**Source:** [src/components/DailyQuiz.tsx](../../../src/components/DailyQuiz.tsx)

### routine — How are you feeling?

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/routine)

Check-in → challenge → quiz sequence with visible skip/close and completed steps. It opens from Home without becoming a forced daily entry gate.

*LV:* Pašsajūta → izaicinājums → jautājums ar redzamu aizvēršanu un paveiktajiem soļiem. Atveras no Sākuma, nevis kļūst par obligātu dienas ieejas vārteju.

**Behavior boundary:** Existing routine steps/rewards; no new urgency or loss state.

**Source:** [src/components/MorningRoutine.tsx](../../../src/components/MorningRoutine.tsx)

### advice — Coach advice

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/advice)

A secondary advice panel with clear source, loading/offline/error treatment and an exercise link. No synthetic text is presented as live AI advice.

*LV:* Pakārtots padoma panelis ar skaidru avotu, ielādi/bezsaisti/kļūdu un saiti uz vingrinājumu. Izdomāts teksts netiek pasniegts kā īsts MI padoms.

**Behavior boundary:** Existing /api/coach and fallback advice only. No new recommendation API.

**Source:** [src/components/CoachCard.tsx](../../../src/components/CoachCard.tsx)

### announcements-feed — From the team

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/announcements-feed)

Team notices sit alongside the week with priority and time, expandable body and original links clearly labelled.

*LV:* Komandas ziņas ir blakus nedēļai, ar prioritāti, laiku, izvēršamu tekstu un skaidrām saitēm.

**Behavior boundary:** Existing team/role visibility; synthetic message examples only.

**Source:** [src/components/AnnouncementFeed.tsx](../../../src/components/AnnouncementFeed.tsx)

### coach — Coach workspace

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#coach)

A uses a session-control workspace; B uses a session brief with squad context. Roster, planner, attendance, announcements, evaluations and challenges each have a path.

*LV:* A ir treniņa darba telpa; B — treniņa plāna atvērums ar sastāvu. Katram sarakstam, plānam, apmeklējumam, ziņai, vērtējumam un izaicinājumam ir ceļš.

**Behavior boundary:** Coach role navigation/squad filters remain separate from the player experience.

**Source:** [src/pages/CoachDashboard.tsx](../../../src/pages/CoachDashboard.tsx), [src/components/CoachSquadFilter.tsx](../../../src/components/CoachSquadFilter.tsx)

### roster — Squad

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#roster)

A readable squad table on desktop and compact player rows on mobile, with player-detail/evaluation drillthroughs; no invented rank.

*LV:* Datorā lasāma sastāva tabula, tālrunī spēlētāju rindas ar detaļu/vērtējuma saitēm; nav izdomāta reitinga.

**Behavior boundary:** RosterPlayer and selected-player detail remain; fixture identifiers replace names/photos.

**Source:** [src/pages/SquadRoster.tsx](../../../src/pages/SquadRoster.tsx)

### planner — Plan training

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#planner)

Objectives and ordered drills share one session canvas; adding an existing library drill updates the demo plan.

*LV:* Mērķi un sakārtoti vingrinājumi vienā treniņa laukumā; bibliotēkas vingrinājuma pievienošana atjaunina demo plānu.

**Behavior boundary:** TrainingPlan/TrainingDrill fields. Save is simulated, not published to squads.

**Source:** [src/pages/TrainingPlanner.tsx](../../../src/pages/TrainingPlanner.tsx)

### attendance — Attendance

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#attendance)

Date-specific attendance rows with explicit present/absent/excused/late/not-recorded states, mark-all-present and a clear save acknowledgement.

*LV:* Datētas apmeklējuma rindas ar stāvokļiem klāt/nav/attaisnots/kavēja/nav ieraksta, kopīgu atzīmēšanu un saglabāšanas apstiprinājumu.

**Behavior boundary:** Existing attendance states, no player messages or activity rewards.

**Source:** [src/components/AttendanceGrid.tsx](../../../src/components/AttendanceGrid.tsx)

### coach-announcements — Team announcements

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/coach-announcements)

Compose panel beside the sent-notice list: title, body, priority, audience and link. Mobile uses the same labeled form rather than a cramped modal.

*LV:* Rakstīšanas panelis blakus ziņu sarakstam: nosaukums, teksts, prioritāte, auditorija un saite. Tālrunī tā pati marķētā forma.

**Behavior boundary:** Existing Announcement API/model; no actual send in the concept.

**Source:** [src/pages/AnnouncementsPage.tsx](../../../src/pages/AnnouncementsPage.tsx)

### coach-evaluation — Player evaluation

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/coach-evaluation)

Select player/period, then grouped ratings, strengths, improvements, notes and goals. Separate saved history from unsaved assessment.

*LV:* Izvēlies spēlētāju/periodu, tad grupēti vērtējumi, stiprās puses, uzlabojumi, piezīmes un mērķi. Atšķir saglabātu vēsturi no melnraksta.

**Behavior boundary:** Existing six category ratings/attendance/feedback fields; no automated talent prediction.

**Source:** [src/pages/EvaluationPage.tsx](../../../src/pages/EvaluationPage.tsx)

### coach-challenges — Team challenges

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/coach-challenges)

A challenge ledger with create/invite, accept/decline and session-progress states. Team context remains visible throughout.

*LV:* Izaicinājumu saraksts ar izveidi/ielūgumu, pieņemšanu/noraidīšanu un progresu. Komandas konteksts vienmēr redzams.

**Behavior boundary:** Existing TeamChallenge status machine/API; no fabricated team rivalry data.

**Source:** [src/pages/TeamChallenges.tsx](../../../src/pages/TeamChallenges.tsx)

### coach-stats — Team overview

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#stats)

An honest data-unavailable overview with squad context and links to the records that can support later reporting.

*LV:* Godīgs datu nepieejamības pārskats ar komandas kontekstu un saitēm uz ierakstiem, kas nākotnē var pamatot statistiku.

**Behavior boundary:** Production currently contains placeholder zeros/equal focus bars, not wired aggregate analytics. The concept explicitly exposes that limitation.

**Source:** [src/pages/CoachStatsPage.tsx](../../../src/pages/CoachStatsPage.tsx)

### mentor — Supporting a player

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#mentor)

Shared activity and recorded check-in trends, a linked-player chooser, team notices and a supportive conversation cue. Never diary contents.

*LV:* Kopīgotā aktivitāte, pašsajūtas tendences, spēlētāja izvēle, komandas ziņas un sarunas ierosme. Nekad pārdomu saturs.

**Behavior boundary:** Existing menteeIds/list and aggregate-only privacy. No extra surveillance, health diagnosis or access-granting UI.

**Source:** [src/pages/MentorDashboard.tsx](../../../src/pages/MentorDashboard.tsx)

### mentor-link — Linking treatment

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/mentor-link)

Explicit no-linked-player guidance; preserve the existing linking mechanism rather than inventing an invite endpoint.

*LV:* Skaidrs skaidrojums, ja spēlētājs nav saistīts; saglabāt esošo sasaisti, neizdomājot ielūgumu API.

**Behavior boundary:** Current mentee selection/list is represented; permission and linking behavior needs implementation review, not concept assertions.

**Source:** [src/pages/MentorDashboard.tsx](../../../src/pages/MentorDashboard.tsx)

### onboarding — First-time setup

**Interactive concept (representative)** · [Open local view](http://127.0.0.1:4321/#onboarding)

Role → basics → football → optional measures → self-assessment → ready; coach path is role/basics/ready. Clear back/continue, no account creation.

*LV:* Loma → pamatdati → futbols → mērījumi pēc izvēles → pašvērtējums → gatavs; trenerim loma/pamatdati/gatavs. Skaidri soļi, konts netop.

**Behavior boundary:** Existing OnboardingData/assessment fields and branch lengths. Representative fields, not live onboarding.

**Source:** [src/pages/OnboardingPage.tsx](../../../src/pages/OnboardingPage.tsx)

### auth — Account & privacy

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/auth)

A focused academy sign-in screen with existing provider choices, loading, error and return-to-task treatment. No concept button initiates real auth.

*LV:* Skaidrs akadēmijas ieejas skats ar esošo pakalpojumu, ielādi, kļūdu un atgriešanos uzdevumā. Koncepts neuzsāk īstu autentifikāciju.

**Behavior boundary:** Production Google/SWA auth, logout and local-dev exceptions unchanged.

**Source:** [src/pages/LoginPage.tsx](../../../src/pages/LoginPage.tsx), [src/contexts/AuthContext.tsx](../../../src/contexts/AuthContext.tsx)

### feedback — Support & feedback

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/feedback)

A labeled feedback sheet in Settings, with type/text, sending/error/retry and close. It should not float over training controls.

*LV:* Atsauksmju panelis Iestatījumos ar veidu/tekstu, sūtīšanu/kļūdu/atkārtošanu un aizvēršanu. Tas neaizsedz treniņa vadīklas.

**Behavior boundary:** Existing feedback behavior; concept does not send messages.

**Source:** [src/components/FeedbackButton.tsx](../../../src/components/FeedbackButton.tsx)

### states — Behavior boundary

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/states)

Common waiting/empty/failure/confirmation language, retained inputs, and a retry that does not duplicate entries. Local save and cloud sync remain distinct.

*LV:* Vienota gaidīšana/tukšums/kļūda/apstiprinājums, saglabāta ievade un atkārtošana bez dubultiem ierakstiem. Ierīces saglabāšana nav mākoņa sinhronizācija.

**Behavior boundary:** No backend/auth/storage-schema/XP-rule changes. Prototype state is ephemeral, synthetic and explicitly simulated.

**Source:** [src/components/ErrorBoundary.tsx](../../../src/components/ErrorBoundary.tsx), [src/contexts/AppContext.tsx](../../../src/contexts/AppContext.tsx), [src/contexts/ToastContext.tsx](../../../src/contexts/ToastContext.tsx)

### wellbeing-alerts — Recorded check-ins

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/wellbeing-alerts)

Recorded low-mood/energy patterns and missing-data notices have a visible data basis, gentle copy and a route back to the underlying check-ins. They are not a health diagnosis.

*LV:* Zema noskaņojuma/enerģijas un trūkstošu datu paziņojumiem redzams pamatojums, saudzīgs teksts un saite uz ierakstiem. Tā nav veselības diagnoze.

**Behavior boundary:** Existing conditional wellbeing/burnout-style indicators are mapped explicitly. No new predictive score or medical capability is introduced.

**Source:** [src/pages/MentorDashboard.tsx](../../../src/pages/MentorDashboard.tsx), [src/pages/ProgressPage.tsx](../../../src/pages/ProgressPage.tsx)

### reset-data — Account & privacy

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/reset-data)

A destructive-reset confirmation names exactly which local/account data is affected before confirmation. It is separate from the harmless Reset demo control.

*LV:* Pirms dzēšanas skaidri nosaukti skartie ierīces/konta dati. Tas nav tas pats, kas drošā demo atiestatīšana.

**Behavior boundary:** Current confirmingReset/resetState behavior; no real reset, delete or logout is executed.

**Source:** [src/pages/Profile.tsx](../../../src/pages/Profile.tsx)

### role-switch — View as

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/role-switch)

Role choices explain the next workspace and its capabilities. Preview-role controls are explicitly not authorization.

*LV:* Lomas izvēle skaidro nākamo darba telpu un iespējas. Koncepta lomu slēdzis nav autorizācija.

**Behavior boundary:** Current PlayerProfile.role and role-aware navigation; server permissions unchanged.

**Source:** [src/pages/Profile.tsx](../../../src/pages/Profile.tsx)

### tracked-fields — Measurements

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/tracked-fields)

A grouped field-selection sheet with defaults/reset and a save action. Mobile uses labels plus checkboxes, not miniature metric chips.

*LV:* Grupēta lauku izvēle ar noklusējumiem/atiestatīšanu un saglabāšanu. Tālrunī marķētas izvēles rūtiņas, nevis sīkas metrikas.

**Behavior boundary:** Existing age-aware PhysicalFieldKey selection; not all fields are rendered by the juggling example.

**Source:** [src/components/TrackedFieldsEditor.tsx](../../../src/components/TrackedFieldsEditor.tsx)

### team-add — My teams

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/team-add)

Create club/team form with name/country/city, duplicate match, use-existing choice, saving and error states in the same sheet.

*LV:* Kluba/komandas izveide ar nosaukumu/valsti/pilsētu, dublikātu un esošās izvēli, saglabāšanu un kļūdu tajā pašā panelī.

**Behavior boundary:** Existing registry mutations only; no new registry or real lookup in the concept.

**Source:** [src/components/AddTeamDialog.tsx](../../../src/components/AddTeamDialog.tsx)

### team-search — My teams

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/team-search)

One accessible autocomplete treatment shared by match, schedule and tournament fields, escaping scroll clipping and preserving entered text on failure.

*LV:* Viena pieejama automātiskās pabeigšanas pieeja spēļu, kalendāra un turnīru laukiem; panelis netiek apgriezts un kļūda nezaudē tekstu.

**Behavior boundary:** Existing team-search source and alias matching; static concept choices are not API proof.

**Source:** [src/components/TeamSearch.tsx](../../../src/components/TeamSearch.tsx)

### workout-rating — Today’s workout

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/workout-rating)

Optional 1–5 post-workout rating sheet, with explicit skip and completion summary. No rating is silently inferred from completion.

*LV:* Pēc nodarbības vērtējums 1–5 pēc izvēles, ar skaidru izlaišanu un kopsavilkumu. Pabeigšana neizdomā vērtējumu.

**Behavior boundary:** Current rating bonus and once-per-day completion rules are preserved for later implementation.

**Source:** [src/components/WorkoutView.tsx](../../../src/components/WorkoutView.tsx)

### roster-player — Player

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/roster-player)

Selected player detail opens alongside the roster on desktop and as a full sheet on mobile. Evaluation is a separate action.

*LV:* Izvēlētā spēlētāja detaļas datorā atveras blakus sastāvam, tālrunī pilnā panelī. Vērtējums ir atsevišķa darbība.

**Behavior boundary:** Existing RosterPlayer fields only; fixture numbers replace children’s names and photos.

**Source:** [src/pages/SquadRoster.tsx](../../../src/pages/SquadRoster.tsx)

### squad-filter — North Academy U13

**Mapped treatment (not implemented)** · [Open local view](http://127.0.0.1:4321/#surface/squad-filter)

Persistent selected-squad context plus a multi-select filter sheet, shared by coach home, statistics, schedule and multi-squad planning.

*LV:* Pastāvīgs izvēlētās komandas konteksts un vairāku komandu filtra panelis trenera sākumam, statistikai, kalendāram un plānošanai.

**Behavior boundary:** Existing selectedTeamIds/ManagedTeam relationships, not a new cross-club data capability.

**Source:** [src/components/CoachSquadFilter.tsx](../../../src/components/CoachSquadFilter.tsx), [src/components/TeamPicker.tsx](../../../src/components/TeamPicker.tsx)

## Explicitly unimported baseline files

- [src/components/ui/BackButton.tsx](../../../src/components/ui/BackButton.tsx): Unimported UI helper in baseline; shared back treatment is covered by shell.
- [src/components/ui/Card.tsx](../../../src/components/ui/Card.tsx): Unimported UI helper; not a user-facing route.
- [src/components/ui/FormInput.tsx](../../../src/components/ui/FormInput.tsx): Unimported UI helper; native concept forms have explicit labels.
- [src/components/ui/PageContainer.tsx](../../../src/components/ui/PageContainer.tsx): Unimported UI helper; shell composition is covered.
- [src/components/ui/SectionHeader.tsx](../../../src/components/ui/SectionHeader.tsx): Unimported UI helper; section hierarchy is covered.
- [src/components/ui/StatDisplay.tsx](../../../src/components/ui/StatDisplay.tsx): Unimported UI helper; no independent surface.
- [src/components/WeeklySummary.tsx](../../../src/components/WeeklySummary.tsx): Not imported from App dependency graph. Its summary concept is represented in Progress; do not claim a reachable production page.
- [src/pages/TournamentPage.tsx](../../../src/pages/TournamentPage.tsx): Not imported from App dependency graph. Tournament import/portal are the reachable baseline; the proposed tournament workspace maps to those capabilities.

## Evidence and limits

The [source scan](source-map.json) records imports, JSX component usage, state names and local component functions. The [executable registry](inventory.mjs) and [tests](concept.test.mjs) require a disposition for every scanned file. They do not certify aesthetics or discover every possible runtime defect.

The comparison never imports or navigates into the old React UI. All rendered prototype routes stay in the new shell. Real auth, remote sources, recommendations, permissions, health judgments and production sync are not exercised. The owner still decides whether either direction meets the brief.
