const { CosmosClient } = require('@azure/cosmos');

let _client = null;
let _container = null;
let _teamsContainer = null;

/**
 * Get or create Cosmos client singleton.
 * Uses key-based auth (COSMOS_KEY) if available, otherwise DefaultAzureCredential.
 */
function getClient() {
  if (_client) return _client;

  const endpoint = process.env.COSMOS_ENDPOINT;
  if (!endpoint) return null;

  const key = process.env.COSMOS_KEY;
  if (key) {
    _client = new CosmosClient({ endpoint, key });
  } else {
    const { DefaultAzureCredential } = require('@azure/identity');
    _client = new CosmosClient({ endpoint, aadCredentials: new DefaultAzureCredential() });
  }
  return _client;
}

/**
 * Singleton Cosmos DB container client (user data).
 */
async function getContainer() {
  if (_container) return _container;

  const client = getClient();
  if (!client) return null;

  const database = process.env.COSMOS_DATABASE || 'golazo';
  const container = process.env.COSMOS_CONTAINER || 'golazo';

  const db = client.database(database);
  _container = db.container(container);
  return _container;
}

/**
 * Singleton Cosmos DB container for shared team registry.
 * Partition key: /country (ISO alpha-2).
 */
async function getTeamsContainer() {
  if (_teamsContainer) return _teamsContainer;

  const client = getClient();
  if (!client) return null;

  const database = process.env.COSMOS_DATABASE || 'golazo';
  const db = client.database(database);
  _teamsContainer = db.container('teams');
  return _teamsContainer;
}

/**
 * Extract authenticated user from SWA client principal header.
 * @param {import('@azure/functions').HttpRequest} req
 * @returns {{ userId: string, email: string } | null}
 */
function getUser(req) {
  const header = req.headers.get('x-ms-client-principal');
  if (!header) return null;

  try {
    const decoded = Buffer.from(header, 'base64').toString('utf-8');
    const principal = JSON.parse(decoded);
    return {
      userId: principal.userId,
      email: principal.userDetails || '',
    };
  } catch {
    return null;
  }
}

/**
 * Create a standard JSON response.
 */
function jsonResponse(body, status = 200) {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

module.exports = { getContainer, getTeamsContainer, getUser, jsonResponse };
