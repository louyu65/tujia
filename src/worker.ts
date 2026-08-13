/**
 * HiddenBox Cloudflare Worker Edge API Entrypoint
 * Environment-Agnostic Steganography Engine for Cloudflare Workers (workerd)
 */

import { embedZeroWidthText, smartExtractTextBytes } from './core/textStego';
import { packPayload, unpackPayload, PayloadType } from './core/protocol';
import { extractImageContainer } from './core/imageStego';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API: Encode Text Steganography
      if (url.pathname === '/api/text/encode' && request.method === 'POST') {
        const body = await request.json() as any;
        const coverText = body.coverText || '今天天气真好';
        const secretText = body.secretText || '';
        const password = body.password || '';

        const packet = await packPayload(secretText, PayloadType.TEXT, password);
        const stegoText = embedZeroWidthText(coverText, packet);

        return new Response(JSON.stringify({ success: true, stegoText }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // API: Decode Text Steganography
      if (url.pathname === '/api/text/decode' && request.method === 'POST') {
        const body = await request.json() as any;
        const stegoText = body.stegoText || '';
        const password = body.password || '';

        const bytes = smartExtractTextBytes(stegoText);
        if (!bytes || bytes.length === 0) {
          return new Response(JSON.stringify({ success: false, error: '未检测到隐藏的二进制码流，请确认隐写文本' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const unpacked = await unpackPayload(bytes, password);
        return new Response(JSON.stringify({ success: true, text: unpacked.payloadText }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // API: Unpack Image Binder
      if (url.pathname === '/api/binder/unpack' && request.method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const password = (formData.get('password') as string) || '';

        if (!file) {
          return new Response(JSON.stringify({ success: false, error: '缺少图片文件' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const containerBytes = extractImageContainer(bytes);

        if (!containerBytes) {
          return new Response(JSON.stringify({ success: false, error: '未在图片中检测到有效的 HiddenBox 图夹封装数据' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const unpacked = await unpackPayload(containerBytes, password);
        const manifest = JSON.parse(unpacked.payloadText || JSON.stringify(unpacked.payloadJson));

        return new Response(JSON.stringify({ success: true, manifest }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ name: 'HiddenBox Cloudflare Worker Edge API', version: '2.0.0' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
