const test = require('node:test');
const assert = require('node:assert/strict');
const { YoutubeMusicDesktopExtension } = require('../index.js');

test('buildActionRequest maps Deckboard actions to local API routes', () => {
  const request = YoutubeMusicDesktopExtension.getActionRequest('track-play-pause', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  assert.deepEqual(request, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/toggle-play-state',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });
});

test('buildActionRequest preserves custom URL and token', () => {
  const request = YoutubeMusicDesktopExtension.getActionRequest('track-next', {
    url: 'http://localhost:13091',
    token: 'abc123',
    appId: 'myapp'
  });

  assert.equal(request.url, 'http://localhost:13091/track/next');
  assert.equal(request.headers.Authorization, 'Bearer abc123');
});
