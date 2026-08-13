/**
 * Cloudflare Pages _worker.js Entrypoint
 * Handles /api/* Serverless endpoints and delegates static frontend UI requests to Cloudflare Pages Assets
 */

import { embedZeroWidthText, smartExtractTextBytes } from '../src/core/textStego';
import { packPayload, unpackPayload, PayloadType } from '../src/core/protocol';
import { extractImageContainer } from '../src/core/imageStego';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    // Serverless API Routes
    if (url.pathname.startsWith('/api/')) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      };

      try {
        if (url.pathname === '/api/text/encode' && request.method === 'POST') {
          const body = await request.json();
          const packet = await packPayload(body.secretText || '', PayloadType.TEXT, body.password || '');
          const stegoText = embedZeroWidthText(body.coverText || '今天天气真好', packet);
          return new Response(JSON.stringify({ success: true, stegoText }), { headers: corsHeaders });
        }

        if (url.pathname === '/api/text/decode' && request.method === 'POST') {
          const body = await request.json();
          const bytes = smartExtractTextBytes(body.stegoText || '');
          if (!bytes || bytes.length === 0) {
            return new Response(JSON.stringify({ success: false, error: '未检测到隐藏的二进制码流' }), { status: 400, headers: corsHeaders });
          }
          const unpacked = await unpackPayload(bytes, body.password || '');
          return new Response(JSON.stringify({ success: true, text: unpacked.payloadText }), { headers: corsHeaders });
        }
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
      }
    }

    // Delegate non-API requests to Cloudflare Pages static assets (renders dist/index.html SPA)
    return env.ASSETS.fetch(request);
  }
};
