import { NextResponse } from 'next/server';

export async function GET() {
  const health_data = {
    imgbb_api_key_set: !!process.env.IMGBB_API_KEY,
    slack_webhook_set: !!process.env.SLACK_INCOMING_WEBHOOK,
  };

  let status = 200;
  if (!health_data.imgbb_api_key_set || !health_data.slack_webhook_set) {
    status = 503;
  }

  // Optional: Test ImgBB with a tiny PNG if key is set
  if (process.env.IMGBB_API_KEY) {
    const tiny_png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const formData = new FormData();
    formData.append("image", tiny_png);
    
    try {
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
      });
      if (!imgRes.ok) {
        (health_data as any).imgbb_response = `Error: ${imgRes.status}`;
        status = 503;
      } else {
        const imgOut = await imgRes.json();
        (health_data as any).imgbb_response = imgOut.data?.url_viewer || "Success";
      }
    } catch (e: any) {
      (health_data as any).imgbb_response = e.message;
      status = 503;
    }
  }

  return NextResponse.json(health_data, { status });
}
