const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');

let _container = null;
let _teamsContainer = null;

/**
 * Singleton Cosmos DB container client.
 * Uses DefaultAzureCredential in Azure, falls back to no-op if not configured.
 */
async function getContainer() {
  if (_container) return _container;

  const endpoint = process.env.COSMOS_ENDPOINT;
  if (!endpoint) return null;

  const database = process.env.COSMOS_DATABASE || 'golazo';
  const container = process.env.COSMOS_CONTAINER || 'golazo';

  const client = new CosmosClient({
    endpoint,
    aadCredentials: new DefaultAzureCredential(),
  });

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

  const endpoint = process.env.COSMOS_ENDPOINT;
  if (!endpoint) return null;

  const database = process.env.COSMOS_DATABASE || 'golazo';

  const client = new CosmosClient({
    endpoint,
    aadCredentials: new DefaultAzureCredential(),
  });

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
