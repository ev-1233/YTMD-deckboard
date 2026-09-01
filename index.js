// SPDX-FileCopyrightText: 2026 Evan McKeown
// SPDX-License-Identifier: Apache-2.0

const { Extension, Platforms } = require('deckboard-kit');
const fetch = require('node-fetch');
const runtimeFetch = (...args) => (globalThis.fetch || fetch)(...args);

const logger =
  typeof require('deckboard-kit').log === 'function'
    ? require('deckboard-kit').log
    : (...args) => console.error(...args);

const debugLog = (...args) => console.log('[YTMD DEBUG]', ...args);

class YoutubeMusicDesktopExtension extends Extension {
  static ACTIONS = {
    'track-status': {
      method: 'POST',
      path: '/track/toggle-play-state',
    },
    'track-play-pause': {
      method: 'POST',
      path: '/track/toggle-play-state',
    },
    'track-play': {
      method: 'POST',
      path: '/track/play',
    },
    'track-pause': {
      method: 'POST',
      path: '/track/pause',
    },
    'track-repeat': {
      method: 'POST',
      path: '/track/repeat',
    },
    'track-shuffle': {
      method: 'POST',
      path: '/track/shuffle',
    },
    'track-forward': {
      method: 'POST',
      path: '/track/forward',
      body: (config = {}) => ({ time: Number(config.time) || 10 }),
    },
    'track-backward': {
      method: 'POST',
      path: '/track/backward',
      body: (config = {}) => ({ time: Number(config.time) || 10 }),
    },
    'track-next': {
      method: 'POST',
      path: '/track/next',
    },
    'track-previous': {
      method: 'POST',
      path: '/track/prev',
    },
    'nav-home': {
      method: 'POST',
      path: '/nav/home',
    },
    'nav-open-home': {
      method: 'POST',
      path: '/nav/open',
      body: { url: 'ytmd://music.youtube.com/' },
    },
    'nav-queue-clear': {
      method: 'POST',
      path: '/nav/queue/clear',
    },
    'player-volume-up': {
      method: 'POST',
      path: '/track/volume-up',
      body: { amount: 5 },
    },
    'player-volume-down': {
      method: 'POST',
      path: '/track/volume-down',
      body: { amount: 5 },
    },
  };

  static normalizeBaseUrl(urlValue) {
    const rawUrl = typeof urlValue === 'string' ? urlValue.trim() : '';
    if (!rawUrl) return 'http://127.0.0.1:13091';
    return rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
  }

  static sanitizeHeaders(headers = {}) {
    const safeHeaders = { ...headers };
    if (safeHeaders.Authorization) safeHeaders.Authorization = '[REDACTED]';
    return safeHeaders;
  }

  static sanitizeUrl(url = '') {
    return url.replace(/([?&]token=)[^&]+/i, '$1[REDACTED]');
  }

  static buildActionRequest(action, config = {}) {
    const route = YoutubeMusicDesktopExtension.ACTIONS[action];
    if (!route) return null;

    const baseUrl = YoutubeMusicDesktopExtension.normalizeBaseUrl(config.url);
    const token = (config.token || '').trim();

    const payload = typeof route.body === 'function' ? route.body(config) : route.body;

    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (payload !== undefined) headers['Content-Type'] = 'application/json';

    return {
      method: route.method,
      url: `${baseUrl}${route.path}`,
      headers,
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    };
  }

  static getActionRequest(action, config = {}) {
    return YoutubeMusicDesktopExtension.buildActionRequest(action, config);
  }

  constructor(props) {
    super(props);
    this.dialog = props.dialog;
    this.setValue = props.setValue;
    this.name = 'Youtube Music Desktop App';
    this.platforms = [Platforms.windows, Platforms.mac, Platforms.linux];
    this.code = '';
    this.url = 'http://127.0.0.1:13091';
    this.token = '';
    this.inputs = [
      {
        label: 'Track live status',
        value: 'track-status',
        icon: 'play-circle',
        mode: 'custom-value',
        color: '#FF0000',
      },
      {
        label: 'Track play',
        value: 'track-play',
        icon: 'play',
        color: '#FF0000',
      },
      {
        label: 'Track pause',
        value: 'track-pause',
        icon: 'pause',
        color: '#FF0000',
      },
      {
        label: 'Track repeat',
        value: 'track-repeat',
        icon: 'repeat',
        color: '#FF0000',
      },
      {
        label: 'Track shuffle',
        value: 'track-shuffle',
        icon: 'random',
        color: '#FF0000',
      },
      {
        label: 'Forward 10s',
        value: 'track-forward',
        icon: 'forward',
        color: '#FF0000',
      },
      {
        label: 'Back 10s',
        value: 'track-backward',
        icon: 'backward',
        color: '#FF0000',
      },
      {
        label: 'Track Play/Pause',
        value: 'track-play-pause',
        icon: 'toggle-on',
        mode: 'custom-value',
        color: '#FF0000',
      },
      {
        label: 'Track next',
        value: 'track-next',
        icon: 'step-forward',
        color: '#FF0000',
      },
      {
        label: 'Track previous',
        value: 'track-previous',
        icon: 'step-backward',
        color: '#FF0000',
      },
      {
        label: 'Home',
        value: 'nav-home',
        icon: 'home',
        color: '#FF0000',
      },
      {
        label: 'Clear queue',
        value: 'nav-queue-clear',
        icon: 'trash',
        color: '#FF0000',
      },
      {
        label: 'Volume up',
        value: 'player-volume-up',
        icon: 'volume-up',
        color: '#FF0000',
      },
      {
        label: 'Volume down',
        value: 'player-volume-down',
        icon: 'volume-down',
        color: '#FF0000',
      },
    ];
    this.configs = {
      apiUrl: {
        type: 'text',
        name: 'Local API URL:',
        description: 'YTMD local API base URL [Default: http://127.0.0.1:13091]',
        value: 'http://127.0.0.1:13091',
      },
      apiToken: {
        type: 'text',
        name: 'Authorization token:',
        description: 'Paste the Bearer token from YTMD authentication or /auth/request',
        value: '',
      },
    };
    this._stateTimer = null;
    this.initExtension();
  }

  initExtension() {
    this.url = YoutubeMusicDesktopExtension.normalizeBaseUrl(
      this.configs && this.configs.apiUrl ? this.configs.apiUrl.value : this.url
    );
    this.token = this.configs && this.configs.apiToken ? this.configs.apiToken.value : this.token;
    this.code = this.token;
    debugLog('Extension initialized', {
      url: this.url,
      hasToken: Boolean(this.token),
      inputCount: this.inputs.length,
    });
    this.refreshPlaybackState();
    if (!this._stateTimer) {
      this._stateTimer = setInterval(() => this.refreshPlaybackState(), 1000);
    }
  }

  async getPlaybackState() {
    const request = {
      method: 'GET',
      url: `${this.url}/track/state`,
      headers: { 'Content-Type': 'application/json' },
    };

    if (this.token) request.headers.Authorization = `Bearer ${this.token}`;

    try {
      const response = await runtimeFetch(request.url, {
        method: request.method,
        headers: request.headers,
      });

      if (!response.ok) return null;
      const payload = await response.json();
      return payload && typeof payload === 'object' ? payload : null;
    } catch (error) {
      logger(error);
      return null;
    }
  }

  async getCurrentTrack() {
    const request = {
      method: 'GET',
      url: `${this.url}/track`,
      headers: {},
    };

    if (this.token) request.headers.Authorization = `Bearer ${this.token}`;

    try {
      const response = await runtimeFetch(request.url, {
        method: request.method,
        headers: request.headers,
      });

      if (!response.ok) return null;
      const payload = await response.json();
      return payload;
    } catch (error) {
      logger(error);
      return null;
    }
  }

  async getApiInfo() {
    try {
      const response = await runtimeFetch(`${this.url}/`, { method: 'GET' });
      if (!response.ok) return null;
      const payload = await response.json();
      return payload && typeof payload === 'object' ? payload : null;
    } catch (error) {
      logger(error);
      return null;
    }
  }

  async logFailureDiagnostics(command) {
    const [apiInfo, track, state] = await Promise.all([
      this.getApiInfo(),
      this.getCurrentTrack(),
      this.getPlaybackState(),
    ]);

    const routeList = Array.isArray(apiInfo && apiInfo.routes) ? apiInfo.routes : [];
    const normalizeRoute = (route) => (typeof route === 'string' ? route.replace(/^\/+/, '') : '');
    const hasRoute = (suffix) => routeList.some((route) => normalizeRoute(route).endsWith(suffix));

    debugLog('Failure diagnostics', {
      command,
      apiName: apiInfo && apiInfo.name,
      apiAuthRequired: apiInfo && apiInfo.authRequired,
      apiRouteCount: routeList.length,
      hasPlayRoute: hasRoute('api/track/play'),
      hasPauseRoute: hasRoute('api/track/pause'),
      hasToggleRoute: hasRoute('api/track/toggle-play-state'),
      hasNextRoute: hasRoute('api/track/next'),
      hasPrevRoute: hasRoute('api/track/prev'),
      hasVolumeUpRoute: hasRoute('api/track/volume-up'),
      hasVolumeDownRoute: hasRoute('api/track/volume-down'),
      trackLoaded: Boolean(track),
      trackId: track && (track.id || (track.video && track.video.videoId) || null),
      stateLoaded: Boolean(state),
      statePlaying: state && state.playing,
      stateProgress: state && state.progress,
      stateDuration: state && state.duration,
    });
  }

  async refreshPlaybackState() {
    const state = await this.getPlaybackState();
    const status =
      state && typeof state.playing === 'boolean'
        ? state.playing
          ? 'Playing'
          : 'Paused'
        : 'Unknown';

    if (typeof this.setValue === 'function') {
      this.setValue({
        'track-status': status,
        'track-play-pause': status,
      });
    }
  }

  async postQuery(command) {
    const request = YoutubeMusicDesktopExtension.buildActionRequest(command, {
      url: this.url,
      token: this.token,
    });

    if (!request) return null;

    debugLog('YTMD action request', {
      command,
      method: request.method,
      url: YoutubeMusicDesktopExtension.sanitizeUrl(request.url),
      headers: YoutubeMusicDesktopExtension.sanitizeHeaders(request.headers),
      body: request.body,
    });

    try {
      const response = await runtimeFetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      debugLog('YTMD action response', {
        command,
        url: YoutubeMusicDesktopExtension.sanitizeUrl(request.url),
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorText = await response.text();
        debugLog('YTMD action error body', {
          command,
          status: response.status,
          errorText,
        });
        logger(`YTMD API error (${request.url}): ${response.status} ${errorText}`);

        const authFallbackResponse = await this.tryAuthFallback(request, command);
        if (authFallbackResponse && authFallbackResponse.ok) {
          return authFallbackResponse;
        }

        const fallbackResponse = await this.tryCommandFallback(command);
        if (fallbackResponse) return fallbackResponse;

        if (response.status === 500) {
          this.logFailureDiagnostics(command);
        }
      }

      if (
        [
          'track-status',
          'track-play-pause',
          'track-play',
          'track-pause',
          'track-repeat',
          'track-shuffle',
          'track-forward',
          'track-backward',
        ].includes(command)
      ) {
        this.refreshPlaybackState();
      }
      return response;
    } catch (error) {
      logger(error);
      return null;
    }
  }

  async tryAuthFallback(request, command) {
    if (!this.token) return null;

    const rawTokenHeaders = {
      ...request.headers,
      Authorization: this.token,
    };

    debugLog('Trying auth fallback (raw token header)', {
      command,
      method: request.method,
      url: YoutubeMusicDesktopExtension.sanitizeUrl(request.url),
      headers: YoutubeMusicDesktopExtension.sanitizeHeaders(rawTokenHeaders),
      body: request.body,
    });

    const rawTokenResponse = await runtimeFetch(request.url, {
      method: request.method,
      headers: rawTokenHeaders,
      body: request.body,
    });

    debugLog('Auth fallback response (raw token header)', {
      command,
      status: rawTokenResponse.status,
      ok: rawTokenResponse.ok,
    });

    if (rawTokenResponse.ok) return rawTokenResponse;

    const queryUrl = `${request.url}${request.url.includes('?') ? '&' : '?'}token=${encodeURIComponent(this.token)}`;
    const queryTokenHeaders = { ...request.headers };
    delete queryTokenHeaders.Authorization;

    debugLog('Trying auth fallback (query token)', {
      command,
      method: request.method,
      url: YoutubeMusicDesktopExtension.sanitizeUrl(queryUrl),
      headers: YoutubeMusicDesktopExtension.sanitizeHeaders(queryTokenHeaders),
      body: request.body,
    });

    const queryTokenResponse = await runtimeFetch(queryUrl, {
      method: request.method,
      headers: queryTokenHeaders,
      body: request.body,
    });

    debugLog('Auth fallback response (query token)', {
      command,
      status: queryTokenResponse.status,
      ok: queryTokenResponse.ok,
    });

    return queryTokenResponse;
  }

  async tryCommandFallback(command) {
    if (command === 'nav-home') {
      const fallback = YoutubeMusicDesktopExtension.buildActionRequest('nav-open-home', {
        url: this.url,
        token: this.token,
      });

      if (!fallback) return null;
      debugLog('Running nav-home fallback', {
        method: fallback.method,
        url: fallback.url,
        headers: YoutubeMusicDesktopExtension.sanitizeHeaders(fallback.headers),
        body: fallback.body,
      });

      const response = await runtimeFetch(fallback.url, {
        method: fallback.method,
        headers: fallback.headers,
        body: fallback.body,
      });

      debugLog('Nav-home fallback response', {
        status: response.status,
        ok: response.ok,
      });
      return response;
    }

    if (command === 'track-forward' || command === 'track-backward') {
      const state = await this.getPlaybackState();
      if (!state || typeof state.progress !== 'number') return null;

      const delta = command === 'track-forward' ? 10 : -10;
      const seekRequest = {
        method: 'POST',
        url: `${this.url}/track/seek`,
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: JSON.stringify({ time: Math.max(0, state.progress + delta) }),
      };

      debugLog('Running seek fallback', {
        command,
        method: seekRequest.method,
        url: seekRequest.url,
        headers: YoutubeMusicDesktopExtension.sanitizeHeaders(seekRequest.headers),
        body: seekRequest.body,
      });

      const response = await runtimeFetch(seekRequest.url, {
        method: seekRequest.method,
        headers: seekRequest.headers,
        body: seekRequest.body,
      });

      debugLog('Seek fallback response', {
        command,
        status: response.status,
        ok: response.ok,
      });
      return response;
    }

    return null;
  }

  execute(action, args) {
    debugLog('Execute action', { action, args: args || null });
    switch (action) {
      case 'track-status':
      case 'track-play':
      case 'track-pause':
      case 'track-repeat':
      case 'track-shuffle':
      case 'track-forward':
      case 'track-backward':
      case 'track-play-pause':
      case 'track-next':
      case 'track-previous':
      case 'nav-home':
      case 'nav-queue-clear':
      case 'player-volume-up':
      case 'player-volume-down':
        this.postQuery(action);
        break;
      default:
        break;
    }
  }
}

module.exports = (sendData) => new YoutubeMusicDesktopExtension(sendData);
module.exports.YoutubeMusicDesktopExtension = YoutubeMusicDesktopExtension;
