/**
 * @author Gary Simken <https://github.com/Gsimken>
 */

const {
	Extension,
	Platforms,
} = require('deckboard-kit');
const fetch = require('node-fetch');

const logger = typeof require('deckboard-kit').log === 'function'
	? require('deckboard-kit').log
	: (...args) => console.error(...args);

class YoutubeMusicDesktopExtension extends Extension {
	static ACTIONS = {
		'track-play-pause': {
			method: 'POST',
			path: '/track/toggle-play-state',
		},
		'track-next': {
			method: 'POST',
			path: '/track/next',
		},
		'track-previous': {
			method: 'POST',
			path: '/track/prev',
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

	static buildActionRequest(action, config = {}) {
		const route = YoutubeMusicDesktopExtension.ACTIONS[action];
		if (!route) return null;

		const baseUrl = YoutubeMusicDesktopExtension.normalizeBaseUrl(config.url);
		const token = (config.token || '').trim();
		const headers = {
			'Content-Type': 'application/json',
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		return {
			method: route.method,
			url: `${baseUrl}${route.path}`,
			headers,
			body: route.body ? JSON.stringify(route.body) : undefined,
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
				label: 'Track Play/Pause',
				value: 'track-play-pause',
				icon: 'play',
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
		this.initExtension();
	}

	initExtension() {
		this.url = YoutubeMusicDesktopExtension.normalizeBaseUrl(
			this.configs && this.configs.apiUrl ? this.configs.apiUrl.value : this.url
		);
		this.token = this.configs && this.configs.apiToken ? this.configs.apiToken.value : this.token;
		this.code = this.token;
	}

	async postQuery(command) {
		const request = YoutubeMusicDesktopExtension.buildActionRequest(command, {
			url: this.url,
			token: this.token,
		});

		if (!request) {
			return null;
		}

		try {
			const response = await fetch(request.url, {
				method: request.method,
				headers: request.headers,
				body: request.body,
			});

			if (!response.ok) {
				const errorText = await response.text();
				logger(`YTMD API error (${request.url}): ${response.status} ${errorText}`);
			}

			return response;
		} catch (error) {
			logger(error);
			return null;
		}
	}

	execute(action, args) {
		switch (action) {
			case 'track-play-pause':
			case 'track-next':
			case 'track-previous':
			case 'player-volume-up':
			case 'player-volume-down':
				this.postQuery(action);
				break;
			default:
				break;
		}
	}
}

module.exports = sendData => new YoutubeMusicDesktopExtension(sendData);
module.exports.YoutubeMusicDesktopExtension = YoutubeMusicDesktopExtension;
