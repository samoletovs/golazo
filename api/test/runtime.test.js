const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const semver = require('semver');
require('./no-network')();

const apiRoot = join(__dirname, '..');
const manifest = require('../package.json');
const lock = require('../package-lock.json');
const config = require('../../staticwebapp.config.json');

test('targets SWA Node 22 while permitting Node 24 only as a local alternative', () => {
  assert.deepEqual(config.platform, { apiRuntime: 'node:22' });
  assert.equal(semver.satisfies('20.0.0', manifest.engines.node), false);
  for (const version of ['22.0.0', '24.0.0', process.versions.node]) {
    assert.ok(semver.satisfies(version, manifest.engines.node), `API engines reject Node ${version}`);
  }
  assert.match(readFileSync(join(apiRoot, '.npmrc'), 'utf8'), /^engine-strict=true$/m);
});

test('locks the manifest and installed dependency tree to Node 22-compatible packages', () => {
  assert.equal(lock.lockfileVersion, 3);
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
  assert.deepEqual(lock.packages[''].engines, manifest.engines);

  for (const name of Object.keys(manifest.dependencies)) {
    const version = lock.packages[`node_modules/${name}`]?.version;
    assert.ok(version && semver.satisfies(version, manifest.dependencies[name]), `${name} is not locked`);
  }

  for (const [path, entry] of Object.entries(lock.packages)) {
    if (!path) continue;
    assert.ok(entry.integrity, `${path} has no integrity hash`);
    const installed = JSON.parse(readFileSync(join(apiRoot, path, 'package.json'), 'utf8'));
    assert.equal(installed.version, entry.version, `${path} differs from the lockfile`);
    assert.deepEqual(installed.engines, entry.engines, `${path} engine metadata differs`);
    if (!entry.engines?.node) continue;
    for (const version of ['22.0.0', '24.0.0', process.versions.node]) {
      assert.ok(
        semver.satisfies(version, entry.engines.node),
        `${path}@${entry.version} requires ${entry.engines.node}, incompatible with Node ${version}`,
      );
    }
  }
});

test('loads and constructs the real CommonJS Azure SDKs without contacting services', () => {
  const { CosmosClient } = require('@azure/cosmos');
  const { DefaultAzureCredential } = require('@azure/identity');
  const { app, HttpRequest } = require('@azure/functions');
  const client = new CosmosClient({
    endpoint: 'https://cosmos.example.invalid',
    key: Buffer.alloc(64, 1).toString('base64'),
  });
  assert.equal(client.database('fixture').container('fixture').id, 'fixture');
  assert.equal(typeof new DefaultAzureCredential().getToken, 'function');
  assert.equal(typeof app.http, 'function');
  assert.equal(typeof app.timer, 'function');
  assert.equal(new HttpRequest({ method: 'GET', url: 'https://golazo.example.invalid/api/profile' }).method, 'GET');
});

test('preserves SWA authentication, routing and security headers', () => {
  const { platform, ...unchanged } = config;
  assert.deepEqual(unchanged, {
    routes: [
      { route: '/.auth/login/github', statusCode: 404 },
      { route: '/.auth/login/twitter', statusCode: 404 },
      { route: '/.auth/login/aad', statusCode: 404 },
      { route: '/api/*', allowedRoles: ['authenticated'] },
      { route: '/*', allowedRoles: ['authenticated'] },
    ],
    responseOverrides: {
      '401': { redirect: '/.auth/login/google?post_login_redirect_uri=/' },
    },
    navigationFallback: {
      rewrite: '/index.html',
      exclude: ['/api/*', '/.auth/*', '/assets/*'],
    },
    globalHeaders: {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
});
