const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function getAccessToken() {
  const clientId = process.env.GDRIVE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GDRIVE_OAUTH_CLIENT_SECRET;
  // Always read from process.env at call time — never cache at module level (breaks Vercel serverless)
  const currentRefreshToken = process.env.GDRIVE_OAUTH_REFRESH_TOKEN;

  if (currentRefreshToken && clientId && clientSecret) {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: currentRefreshToken,
        grant_type: 'refresh_token'
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenRes.ok && tokenData.access_token) {
      return tokenData.access_token;
    } else {
      throw new Error(`Google OAuth token exchange failed: ${tokenData.error_description || tokenData.error || JSON.stringify(tokenData)}`);
    }
  }

  throw new Error(`Missing OAuth credentials on server. GDRIVE_OAUTH_REFRESH_TOKEN set? ${!!currentRefreshToken}, GDRIVE_OAUTH_CLIENT_ID set? ${!!clientId}, GDRIVE_OAUTH_CLIENT_SECRET set? ${!!clientSecret}`);

  privateKey = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const encHeader = base64UrlEncode(header);
  const encClaims = base64UrlEncode(claimSet);
  const signatureInput = `${encHeader}.${encClaims}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(privateKey, 'base64url');
  const jwt = `${signatureInput}.${signature}`;

  const saTokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const saTokenData = await saTokenRes.json();
  if (!saTokenRes.ok) {
    throw new Error(`Google OAuth token exchange failed: ${saTokenData.error_description || saTokenData.error}`);
  }

  return saTokenData.access_token;
}

async function uploadFileToDrive(fileBuffer, mimeType, filename) {
  const accessToken = await getAccessToken();
  const folderId = process.env.GDRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('GDRIVE_FOLDER_ID environment variable is missing.');
  }

  const metadata = {
    name: filename || `product_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`,
    parents: [folderId]
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = Buffer.concat([
    Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata)),
    Buffer.from(delimiter + `Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`),
    Buffer.from(fileBuffer.toString('base64')),
    Buffer.from(closeDelimiter)
  ]);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&supportsTeamDrives=true', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartBody
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    throw new Error(`Google Drive API upload failed: ${uploadData.error?.message || JSON.stringify(uploadData)}`);
  }

  const fileId = uploadData.id;

  // Set file permissions to public reader
  const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions?supportsAllDrives=true&supportsTeamDrives=true`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  if (!permRes.ok) {
    const permData = await permRes.json();
    console.warn('Google Drive set permission warning:', permData);
  }

  // Direct image URL for <img> tags
  const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  return { fileId, url: directUrl };
}

async function uploadRoutes(fastify, opts) {
  // OAuth Status Diagnostic Endpoint
  fastify.get('/status', async (request, reply) => {
    const clientId = process.env.GDRIVE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GDRIVE_OAUTH_REFRESH_TOKEN;
    const folderId = process.env.GDRIVE_FOLDER_ID;

    return {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken,
      hasFolderId: !!folderId,
      refreshTokenPrefix: refreshToken ? `${refreshToken.substring(0, 10)}...` : null
    };
  });

  // OAuth 2.0 Authorization Link Endpoint
  fastify.get('/auth', async (request, reply) => {
    const clientId = process.env.GDRIVE_OAUTH_CLIENT_ID;
    const redirectUri = process.env.GDRIVE_OAUTH_REDIRECT_URI;
    
    if (!clientId) {
      return reply.code(500).send({ error: 'GDRIVE_OAUTH_CLIENT_ID missing in environment variables.' });
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent`;
    
    return reply.redirect(authUrl);
  });

  // OAuth 2.0 Callback Endpoint
  fastify.get('/oauth2callback', async (request, reply) => {
    const { code } = request.query || {};
    if (!code) {
      return reply.code(400).type('text/html').send('<h2>Missing authorization code from Google.</h2>');
    }

    const clientId = process.env.GDRIVE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GDRIVE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.GDRIVE_OAUTH_REDIRECT_URI;

    if (!clientId || !clientSecret) {
      return reply.code(500).type('text/html').send('<h2>OAuth configuration missing in environment variables.</h2>');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenRes.ok && tokenData.refresh_token) {
      // NOTE: On Vercel (serverless), we cannot write to .env or persist env vars at runtime.
      // The refresh token is displayed below — copy it to Vercel Environment Variables manually.

      return reply.type('text/html').send(`
        <div style="font-family: system-ui, sans-serif; padding: 40px; max-width: 700px; margin: 40px auto; border-radius: 24px; border: 2px solid #10b981; background: #f0fdf4;">
          <h1 style="color: #065f46; font-size: 24px; margin-bottom: 8px;">Google Drive Authorization Successful! 🎉</h1>
          <p style="color: #047857; font-size: 14px;">Your account has authorized Google Drive photo uploads for Ninjaro.</p>
          
          <div style="margin-top: 24px; padding: 20px; background: #fff; border: 2px solid #d1fae5; border-radius: 12px;">
            <p style="font-weight: bold; color: #065f46; margin: 0 0 8px 0; font-size: 13px;">⚠️ IMPORTANT: Copy this Refresh Token and add it to Vercel Environment Variables</p>
            <p style="font-size: 11px; color: #6b7280; margin: 0 0 12px 0;">Variable name: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">GDRIVE_OAUTH_REFRESH_TOKEN</code></p>
            <textarea readonly style="width:100%;height:80px;font-family:monospace;font-size:11px;padding:10px;border:1px solid #d1d5db;border-radius:8px;background:#f9fafb;resize:none;box-sizing:border-box;">${tokenData.refresh_token}</textarea>
            <p style="font-size: 11px; color: #6b7280; margin: 12px 0 0 0;">After adding to Vercel → Redeploy the backend → You're done!</p>
          </div>
        </div>
      `);
    } else {
      return reply.code(500).type('text/html').send(`<h2>Failed to exchange OAuth code: ${tokenData.error_description || JSON.stringify(tokenData)}</h2>`);
    }
  });

  // Fastify upload route
  fastify.post('/drive', { bodyLimit: 20 * 1024 * 1024 }, async (request, reply) => {
    try {
      const { images } = request.body || {};
      if (!images) {
        return reply.code(400).send({ error: 'No image data provided.' });
      }

      const itemsToUpload = Array.isArray(images) ? images : [images];
      const uploadedUrls = [];

      for (const item of itemsToUpload) {
        let base64Data = typeof item === 'string' ? item : item.base64 || item.data;
        let mimeType = (typeof item === 'object' && item.mimeType) ? item.mimeType : 'image/jpeg';
        let fileName = (typeof item === 'object' && item.fileName) ? item.fileName : `prod_${Date.now()}.jpg`;

        if (base64Data.includes(';base64,')) {
          const parts = base64Data.split(';base64,');
          mimeType = parts[0].replace('data:', '');
          base64Data = parts[1];
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const res = await uploadFileToDrive(buffer, mimeType, fileName);
        uploadedUrls.push(res.url);
      }

      return { success: true, urls: uploadedUrls, url: uploadedUrls[0] };
    } catch (err) {
      console.error('Google Drive Upload Route Error:', err);
      return reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = uploadRoutes;
