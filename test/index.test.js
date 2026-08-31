const test = require('node:test');
const assert = require('node:assert/strict');
const { YoutubeMusicDesktopExtension } = require('../index.js');

test('buildActionRequest maps Deckboard actions to local API routes', () => {
  const toggleRequest = YoutubeMusicDesktopExtension.getActionRequest('track-play-pause', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  const statusRequest = YoutubeMusicDesktopExtension.getActionRequest('track-status', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  const playRequest = YoutubeMusicDesktopExtension.getActionRequest('track-play', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  const pauseRequest = YoutubeMusicDesktopExtension.getActionRequest('track-pause', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  const repeatRequest = YoutubeMusicDesktopExtension.getActionRequest('track-repeat', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  const shuffleRequest = YoutubeMusicDesktopExtension.getActionRequest('track-shuffle', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  const forwardRequest = YoutubeMusicDesktopExtension.getActionRequest('track-forward', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token',
    time: 15,
  });

  const backwardRequest = YoutubeMusicDesktopExtension.getActionRequest('track-backward', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token',
    time: 10,
  });

  const homeRequest = YoutubeMusicDesktopExtension.getActionRequest('nav-home', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  const queueClearRequest = YoutubeMusicDesktopExtension.getActionRequest('nav-queue-clear', {
    url: 'http://127.0.0.1:13091',
    token: 'test-token'
  });

  assert.deepEqual(toggleRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/toggle-play-state',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });

  assert.deepEqual(statusRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/toggle-play-state',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });

  assert.deepEqual(playRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/play',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });

  assert.deepEqual(pauseRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/pause',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });

  assert.deepEqual(repeatRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/repeat',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });

  assert.deepEqual(shuffleRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/shuffle',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });

  assert.deepEqual(forwardRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/forward',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token'
    },
    body: JSON.stringify({ time: 15 })
  });

  assert.deepEqual(backwardRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/track/backward',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-token'
    },
    body: JSON.stringify({ time: 10 })
  });

  assert.deepEqual(homeRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/nav/home',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });

  assert.deepEqual(queueClearRequest, {
    method: 'POST',
    url: 'http://127.0.0.1:13091/nav/queue/clear',
    headers: {
      Authorization: 'Bearer test-token'
    },
    body: undefined
  });
});

test('refreshPlaybackState writes a readable live status for the status button and toggles', async () => {
  let fetchCalls = 0;
  const fetchStub = async (url, options) => {
    fetchCalls += 1;
    return {
      ok: true,
      async json() {
        return { playing: true };
      }
    };
  };

  const original = globalThis.fetch;
  globalThis.fetch = fetchStub;

  let ext;
  try {
    ext = new YoutubeMusicDesktopExtension({
      dialog: null,
      setValue: (state) => {
        ext.lastState = state;
      }
    });

    await ext.refreshPlaybackState();
    assert.equal(fetchCalls, 2);
    assert.deepEqual(ext.lastState, {
      'track-play-pause': 'Playing',
      'track-status': 'Playing',
    });
  } finally {
    globalThis.fetch = original;
  }
});

test('postQuery sends play and pause requests directly', async () => {
  const original = globalThis.fetch;
  const calledUrls = [];

  globalThis.fetch = async (url, options) => {
    calledUrls.push(url);
    if (url.endsWith('/track/state')) {
      return {
        ok: true,
        status: 200,
        async json() {
          return { playing: true };
        },
      };
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return '';
      },
    };
  };

  try {
    const ext = new YoutubeMusicDesktopExtension({ dialog: null, setValue: () => {} });
    await ext.postQuery('track-play');
    await ext.postQuery('track-pause');

    assert.equal(calledUrls.includes('http://127.0.0.1:13091/track/play'), true);
    assert.equal(calledUrls.includes('http://127.0.0.1:13091/track/pause'), true);
  } finally {
    globalThis.fetch = original;
  }
});
