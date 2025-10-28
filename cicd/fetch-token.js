// npm i jose node-fetch
import fs from 'node:fs';
import fetch from 'node-fetch';
import { importPKCS8, SignJWT } from 'jose';

const keyJson = JSON.parse(fs.readFileSync('../api-key.json', 'utf8'));

async function getAccessToken() {
  const privateKeyPem = keyJson.private_key;            // PKCS#8 PEM
  const privateKey = await importPKCS8(privateKeyPem, 'RS256');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: keyJson.client_email,                          // service account email
    scope: 'https://www.googleapis.com/auth/chromewebstore', // adjust scopes
    aud: keyJson.token_uri,                             // usually https://oauth2.googleapis.com/token
    iat: now,
    exp: now + 3600                                     // 1 hour
  };

  const assertion = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: keyJson.private_key_id, typ: 'JWT' })
    .sign(privateKey);

  const res = await fetch(keyJson.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token; // use as "Authorization: Bearer <token>"
}

getAccessToken().then(tok => console.log('access_token:', tok));