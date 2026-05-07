export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let message = url.searchParams.get("text");

  if (request.method === "POST") {
    try {
      const body = await request.formData();
      message = message || body.get("text");
    } catch (e) {
      // Fallback if not form data
      try {
        const json = await request.json();
        message = message || json.text;
      } catch (e2) {}
    }
  }

  if (!message) return new Response("Missing text\n", { status: 400 });

  const alert = `*XSSless: Message Alert*\n\`\`\`\n${message}\n\`\`\`\n`;

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

  return new Response("ok\n");
}
