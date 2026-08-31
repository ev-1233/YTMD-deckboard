# YTMD-deckboard

A Deckboard extension for controlling YouTube Music Desktop through the current local API instead of the old remote-control server.

## Setup

### Requirements

* Install [Deckboard](https://deckboard.app/)
* Install [YouTube Music Desktop](https://ytmdesktop.app/)

### Local API setup in YTMD

1. Open YTMD Settings.
2. Go to API & .
3. Generate a pairing code or request a token through the local API flow.
4. Copy the resulting bearer token.
5. Use that value in the Deckboard extension configuration.

Default API URL:

`http://127.0.0.1:13091`

### Installing

#### Download prebuilt version

* Download the released [YTMD-deckboard.asar](https://github.com/Gsimken/YTMD-deckboard/releases) file.
* Save it to your `{USERNAME}\deckboard\extensions` folder.

#### Compile from source

* Clone the repository.
* Run `npm install`.
* Run `npm run install` to build the extension package.

##### Requirements

* [Node.js® & npm](https://nodejs.org/en/)

## Configure

### Deckboard

* Open Config (Cog) > Extensions > Configs.
* Set Local API URL to `http://127.0.0.1:13091`.
* Paste the YTMD bearer token into Authorization token.

The extension now calls the local YTMD routes such as:

* `POST /track/toggle-play-state`
* `POST /track/next`
* `POST /track/prev`
* `POST /track/volume-up`
* `POST /track/volume-down`

## Notes

The previous remote-control server flow (`/query` + password code) is no longer compatible with current YTMD builds. This extension uses the new token-based local API instead.

# Contribute

If you want to contribute, open a pull request and it will be reviewed when possible.

Donations can be made through Ko-fi.

<a href='https://ko-fi.com/gsimken' target='_blank'><img height='35' style='border:0px;height:46px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' />
