import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return handleMessage(req);
}

export async function POST(req: NextRequest) {
  return handleMessage(req);
}

async function handleMessage(req: NextRequest) {
  const url = new URL(req.url);
  let message = url.searchParams.get('text');

  if (req.method === 'POST' && !message) {
    const contentType = req.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        const json = await req.json();
        message = json.text;
      } else if (contentType.includes('form') || contentType.includes('multipart')) {
        const formData = await req.formData();
        message = formData.get('text') as string;
      }
    } catch (e) {
      return new NextResponse('Invalid request body\n', { status: 400 });
    }
  }

  if (!message) return new NextResponse('Missing text\n', { status: 400 });

  const truncatedMessage = message.length > 1024 ? message.substring(0, 1021) + '...' : message;
  const alert = `*XSSless: Message Alert*\n\`\`\`\n${truncatedMessage}\n\`\`\`\n`;

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

  return new NextResponse('ok\n', { status: 200 });
}
