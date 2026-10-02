const assert = require('node:assert/strict');
const { readdirSync } = require('node:fs');
const Module = require('node:module');
const { join } = require('node:path');
const { after, before, mock, test } = require('node:test');
require('./no-network')();

const endpoint = process.env.COSMOS_ENDPOINT;
delete process.env.COSMOS_ENDPOINT;
after(() => {
  if (endpoint === undefined) delete process.env.COSMOS_ENDPOINT;
  else process.env.COSMOS_ENDPOINT = endpoint;
});

const registrations = new Map();
let programmingModel;
const worker = {
  setProgrammingModel(model) {
    programmingModel = model;
  },
  registerFunction(metadata, handler) {
    assert.ok(!registrations.has(metadata.name), `Duplicate function: ${metadata.name}`);
    registrations.set(metadata.name, { metadata, handler });
  },
};

before(() => {
  // Only the Functions worker is absent locally; app.http/app.timer stay real.
  const originalLoad = Module._load;
  const load = mock.method(Module, '_load', function (name, parent, isMain) {
    if (name === '@azure/functions-core') return worker;
    return originalLoad.call(this, name, parent, isMain);
  });
  try {
    const directory = join(__dirname, '..', 'src', 'functions');
    for (const file of readdirSync(directory).filter((name) => name.endsWith('.js')).sort()) {
      require(join(directory, file));
    }
  } finally {
    load.mock.restore();
  }
});

const { HttpRequest } = require('@azure/functions');
const cosmos = require('../src/cosmos');
const principal = {
  identityProvider: 'google',
  userId: 'fixture-player',
  userDetails: 'player@example.invalid',
  userRoles: ['authenticated'],
};
const encodedPrincipal = Buffer.from(JSON.stringify(principal)).toString('base64');
const malformedPrincipal = Buffer.from('{not-json').toString('base64');

function request(method = 'GET', header) {
  return new HttpRequest({
    method,
    url: 'https://golazo.example.invalid/api/fixture',
    headers: header === undefined ? {} : { 'x-ms-client-principal': header },
    ...(method === 'GET' ? {} : { body: { string: '{not-json' } }),
  });
}

test('registers every existing HTTP endpoint through the real Functions SDK', () => {
  assert.equal(require('../package.json').main, 'src/functions/*.js');
  assert.equal(programmingModel.name, '@azure/functions');
  assert.equal(programmingModel.version, require('../package-lock.json').packages['node_modules/@azure/functions'].version);
  const expected = [
    ['coach', 'coach', ['POST']],
    ['coach-announce', 'coach/team/{teamId}/announce', ['POST']],
    ['coach-announcements', 'coach/team/{teamId}/announcements', ['GET', 'POST']],
    ['coach-attendance', 'coach/team/{teamId}/attendance', ['POST']],
    ['coach-evaluation-create', 'coach/team/{teamId}/evaluation', ['POST']],
    ['coach-evaluations', 'coach/team/{teamId}/evaluations', ['GET']],
    ['coach-plans', 'coach/team/{teamId}/plans', ['GET']],
    ['coach-roster', 'coach/team/{teamId}/roster', ['GET']],
    ['coach-social-challenge-action', 'coach/team/{teamId}/social-challenges/{challengeId}', ['POST']],
    ['coach-social-challenges', 'coach/team/{teamId}/social-challenges', ['GET', 'POST']],
    ['coach-stats', 'coach/team/{teamId}/stats', ['GET']],
    ['coach-training-plan', 'coach/training-plan', ['POST']],
    ['invite-accept', 'invite/accept', ['POST']],
    ['invite-create', 'invite', ['POST']],
    ['leaderboard', 'leaderboard', ['GET']],
    ['mentor-mentees', 'mentor/mentees', ['GET']],
    ['mentor-search-players', 'mentor/search-players', ['GET']],
    ['profile', 'profile', ['GET', 'PUT']],
    ['shared-games-create', 'shared-games', ['POST']],
    ['shared-games-list', 'shared-games', ['GET']],
    ['shared-tournaments-create', 'shared-tournaments', ['POST']],
    ['shared-tournaments-get', 'shared-tournaments/{id}', ['GET']],
    ['shared-tournaments-join', 'shared-tournaments/{id}/join', ['POST']],
    ['shared-tournaments-list', 'shared-tournaments', ['GET']],
    ['social-challenge-join', 'social-challenges/join', ['POST']],
    ['social-challenge-progress', 'social-challenges/{challengeId}/progress', ['POST']],
    ['social-challenges', 'social-challenges', ['GET', 'POST']],
    ['squads', 'squads', ['GET', 'POST']],
    ['squads-item', 'squads/{id}', ['PUT', 'DELETE']],
    ['sync', 'sync', ['GET', 'PUT']],
    ['team-info', 'team-info', ['POST']],
    ['teams', 'teams', ['GET', 'POST']],
    ['tournament-import', 'tournament-import', ['POST']],
    ['trackLogin', 'track-login', ['POST']],
  ];
  const actual = [];
  for (const { metadata, handler } of registrations.values()) {
    const trigger = Object.values(metadata.bindings).find((binding) => binding.type === 'httpTrigger');
    if (!trigger) continue;
    assert.equal(typeof handler, 'function', metadata.name);
    assert.equal(trigger.authLevel, 'anonymous', `${metadata.name} must keep SWA-based authentication`);
    assert.equal(metadata.bindings.$return.type, 'http', metadata.name);
    actual.push([metadata.name, trigger.route, trigger.methods.map((method) => method.toUpperCase())]);
  }
  assert.deepEqual(actual.sort(), expected.sort());
  assert.equal(registrations.size, expected.length + 1);
});

test('preserves the tournament refresh timer registration', () => {
  const { metadata, handler } = registrations.get('tournament-refresh');
  const [trigger] = Object.values(metadata.bindings);
  assert.equal(trigger.type, 'timerTrigger');
  assert.equal(trigger.schedule, '0 */30 7-22 * * *');
  assert.equal(typeof handler, 'function');
});

test('keeps every Cosmos client lazy when the endpoint is absent', async () => {
  assert.equal(cosmos.getClient(), null);
  for (const getContainer of [
    cosmos.getContainer, cosmos.getTeamsContainer, cosmos.getTournamentsContainer,
    cosmos.getCoachContainer, cosmos.getSquadsContainer,
  ]) {
    assert.equal(await getContainer(), null);
  }
});

test('extracts the existing SWA user identity from a real HttpRequest', () => {
  assert.deepEqual(cosmos.getUser(request('GET', encodedPrincipal)), {
    userId: principal.userId,
    email: principal.userDetails,
  });
});

test('preserves the empty email fallback when SWA has no user details', () => {
  const header = Buffer.from(JSON.stringify({ userId: 'fixture-player' })).toString('base64');
  assert.deepEqual(cosmos.getUser(request('GET', header)), { userId: 'fixture-player', email: '' });
});

for (const [description, header] of [['missing', undefined], ['malformed', malformedPrincipal]]) {
  test(`rejects a ${description} principal in the shared auth helper`, () => {
    assert.equal(cosmos.getUser(request('GET', header)), null);
  });

  for (const [name, method] of [
    ['sync', 'GET'], ['sync', 'PUT'], ['profile', 'GET'], ['profile', 'PUT'],
    ['invite-create', 'POST'], ['invite-accept', 'POST'], ['leaderboard', 'GET'],
    ['coach', 'POST'], ['coach-roster', 'GET'], ['mentor-mentees', 'GET'],
  ]) {
    test(`${name} ${method} rejects a ${description} principal before body parsing or I/O`, async () => {
      const response = await registrations.get(name).handler(request(method, header));
      assert.equal(response.status, 401);
      assert.equal(response.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(response.body), { error: 'Unauthorized' });
    });
  }
}

for (const [name, method] of [
  ['sync', 'GET'], ['sync', 'PUT'], ['profile', 'GET'], ['profile', 'PUT'],
  ['invite-create', 'POST'], ['invite-accept', 'POST'], ['leaderboard', 'GET'],
]) {
  test(`${name} ${method} reports missing Cosmos configuration after authentication`, async () => {
    const response = await registrations.get(name).handler(request(method, encodedPrincipal));
    assert.equal(response.status, 503);
    assert.deepEqual(JSON.parse(response.body), { error: 'Database not configured' });
  });
}
