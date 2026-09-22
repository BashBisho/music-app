import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPOTIFY_CACHE_KEY = '@spotifyTrackIds';

const SPOTIFY = 'https://open.spotify.com';
const CLIENT_TOKEN = 'https://clienttoken.spotify.com/v1/clienttoken';
const PATHFINDER = 'https://api-partner.spotify.com/pathfinder/v2/query';
const SECRETS =
  'https://code.thetadev.de/ThetaDev/spotify-secrets/raw/branch/main/secrets/secretDict.json';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36';

let session = null;
let spotifyAuth = null;

const bytesToHex = bytes =>
  Array.from(bytes)
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');

const hexToBytes = hex => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
};

const concatBytes = (...arrays) => {
  const result = new Uint8Array(
    arrays.reduce((total, array) => total + array.length, 0)
  );

  let offset = 0;

  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }

  return result;
};

async function sha1(bytes) {
  return new Uint8Array(
    await Crypto.digest(
      Crypto.CryptoDigestAlgorithm.SHA1,
      bytes
    )
  );
}

async function hmacSha1(key, message) {
  const blockSize = 64;

  if (key.length > blockSize)
    key = await sha1(key);

  const padded = new Uint8Array(blockSize);
  padded.set(key);

  const inner = new Uint8Array(blockSize);
  const outer = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    inner[i] = padded[i] ^ 0x36;
    outer[i] = padded[i] ^ 0x5c;
  }

  const innerHash = await sha1(
    concatBytes(inner, message)
  );

  return sha1(
    concatBytes(outer, innerHash)
  );
}

function base32Encode(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      bits -= 5;
      output += alphabet[(buffer >> bits) & 31];
    }
  }

  if (bits)
    output += alphabet[(buffer << (5 - bits)) & 31];

  return output;
}

function base32Decode(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let buffer = 0;
  let bits = 0;
  const output = [];

  for (const char of value) {
    const n = alphabet.indexOf(char);

    if (n < 0)
      continue;

    buffer = (buffer << 5) | n;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 255);
    }
  }

  return new Uint8Array(output);
}

async function generateTotp(secret, timestamp) {
  const transformed = secret.map(
    (value, index) =>
      value ^ ((index % 33) + 9)
  );

  const joined = transformed.join('');
  const decimalBytes = new TextEncoder().encode(joined);
  const secretForTotp = hexToBytes(bytesToHex(decimalBytes));
  const encoded = base32Encode(secretForTotp);
  const key = base32Decode(encoded);

  const counter = Math.floor(timestamp / 30000);
  const counterBytes = new Uint8Array(8);

  let value = counter;

  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = value & 0xff;
    value = Math.floor(value / 256);
  }

  const hash = await hmacSha1(key, counterBytes);
  const offset = hash[hash.length - 1] & 15;

  const code =
    ((hash[offset] & 0x7f) << 24) |
    (hash[offset + 1] << 16) |
    (hash[offset + 2] << 8) |
    hash[offset + 3];

  return String(code % 1000000).padStart(6, '0');
}

async function getSpotifySession() {
  if (session)
    return session;

  const res = await fetch(SPOTIFY, {
    headers: {
      'User-Agent': USER_AGENT
    }
  });

  const html = await res.text();

  if (!res.ok)
    throw new Error(`Spotify homepage failed: ${res.status}`);

  const match = html.match(
    /<script id="appServerConfig" type="text\/plain">([^<]+)<\/script>/
  );

  if (!match)
    throw new Error('appServerConfig not found');

  const config = JSON.parse(atob(match[1]));

  session = {
    clientVersion: config.clientVersion,
    deviceId: Crypto.randomUUID()
  };

  return session;
}

async function getSpotifySecrets() {
  const res = await fetch(SECRETS);

  if (!res.ok)
    throw new Error(`Secret request failed: ${res.status}`);

  const data = await res.json();
  const version = Math.max(...Object.keys(data).map(Number));

  return {
    version,
    secret: new Uint8Array(data[version])
  };
}

async function getAccessToken() {
  const { clientVersion } = await getSpotifySession();
  const { version, secret } = await getSpotifySecrets();

  const timestamp = Date.now();
  const totp = await generateTotp(secret, timestamp);

  const params = new URLSearchParams({
    reason: 'init',
    productType: 'web-player',
    totp,
    totpVer: String(version),
    totpServer: totp
  });

  const res = await fetch(
    `${SPOTIFY}/api/token?${params}`,
    {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
        'Content-Type': 'application/json;charset=UTF-8',
        'App-Platform': 'WebPlayer',
        'Spotify-App-Version': clientVersion,
        Origin: SPOTIFY,
        Referer: `${SPOTIFY}/`
      }
    }
  );

  const text = await res.text();

  if (!res.ok)
    throw new Error(
      `Token request failed: ${res.status} ${text.slice(0, 300)}`
    );

  const data = JSON.parse(text);

  return {
    accessToken: data.accessToken,
    clientId: data.clientId
  };
}

async function getClientToken(access) {
  const { clientVersion, deviceId } =
    await getSpotifySession();

  const body = {
    client_data: {
      client_version: clientVersion,
      client_id: access.clientId,
      js_sdk_data: {
        device_brand: 'unknown',
        device_model: 'unknown',
        os: 'windows',
        os_version: 'NT 10.0',
        device_id: deviceId,
        device_type: 'computer'
      }
    }
  };

  const res = await fetch(CLIENT_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();

  if (!res.ok)
    throw new Error(
      `Client token failed: ${res.status} ${text.slice(0, 300)}`
    );

  const data = JSON.parse(text);
  const clientToken = data.granted_token?.token;

  if (!clientToken)
    throw new Error('No client token returned');

  return clientToken;
}

async function initializeSpotify() {
  if (spotifyAuth)
    return spotifyAuth;

  const access = await getAccessToken();
  const clientToken = await getClientToken(access);
  const { clientVersion } = await getSpotifySession();

  spotifyAuth = {
    accessToken: access.accessToken,
    clientToken,
    clientVersion
  };

  return spotifyAuth;
}


export async function findSpotifyTrackId(song) {
  const cache = JSON.parse(
    await AsyncStorage.getItem(SPOTIFY_CACHE_KEY) || '{}'
  );

  const key = `${song.artist} - ${song.name}`.toLowerCase();

  if (cache[key])
    return cache[key];

  const payload = {
    operationName: 'searchTracks',
    variables: {
      searchTerm: `${song.artist} ${song.name}`,
      offset: 0,
      limit: 10,
      numberOfTopResults: 10,
      includeAudiobooks: false,
      includePreReleases: false
    },
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash:
          'bc1ca2fcd0ba1013a0fc88e6cc4f190af501851e3dafd3e1ef85840297694428'
      }
    }
  };

  async function search(auth) {
    return fetch(PATHFINDER, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Client-Token': auth.clientToken,
        'Spotify-App-Version': auth.clientVersion,
        'App-Platform': 'WebPlayer',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': USER_AGENT
      },
      body: JSON.stringify(payload)
    });
  }

  let auth = await initializeSpotify();
  let res = await search(auth);

  if (res.status === 401 || res.status === 403) {
    session = null;
    spotifyAuth = null;

    auth = await initializeSpotify();
    res = await search(auth);
  }

  const text = await res.text();

  if (!res.ok)
    throw new Error(
      `Pathfinder failed: ${res.status} ${text.slice(0, 500)}`
    );

  const data = JSON.parse(text);
  const items = data?.data?.searchV2?.tracksV2?.items || [];
  const id = items[0]?.item?.data?.id || null;

  if (id) {
    cache[key] = id;
    await AsyncStorage.setItem(
      SPOTIFY_CACHE_KEY,
      JSON.stringify(cache)
    );
  }

  console.log(
    `Spotify search: "${song.artist} - ${song.name}" → ${id}`
  );

  return id;
}



export async function getLyrics(trackId) {

    const token = await AsyncStorage.getItem("@token");

    const res = await fetch(
        `https://api.spicylyrics.org/v1/lyrics/${trackId}`,
        {
        headers: {
            Authorization: token
        }
        }
    );

    if (!res.ok)
        throw new Error(`Lyrics request failed: ${res.status}`);

    const obj = await res.json();
    const body = obj.Body;

    return obj;
}