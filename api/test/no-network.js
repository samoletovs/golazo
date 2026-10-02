const assert = require('node:assert/strict');
const { Socket } = require('node:net');
const { after, mock } = require('node:test');

module.exports = function blockNetwork() {
  const rejectNetwork = () => {
    throw new Error('API tests must not make network requests');
  };
  const fetch = mock.method(globalThis, 'fetch', rejectNetwork);
  const connect = mock.method(Socket.prototype, 'connect', rejectNetwork);

  after(() => {
    try {
      // Also catch attempted I/O that an application handler swallowed.
      assert.equal(fetch.mock.callCount(), 0, 'Unexpected fetch call');
      assert.equal(connect.mock.callCount(), 0, 'Unexpected socket connection');
    } finally {
      fetch.mock.restore();
      connect.mock.restore();
    }
  });
};
