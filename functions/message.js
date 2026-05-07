export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let message = url.searchParams.get("text");

  if (request.method === "POST" && !message) {
    const contentType = request.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const json = await request.json();
        message = json.text;
      } else if (contentType.includes("form") || contentType.includes("multipart")) {
        const formData = await request.formData();
        message = formData.get("text");
      }
    } catch (e) {
      return new Response("Invalid request body\n", { status: 400 });
    }
  }

  if (!message) return new Response("Missing text\n", { status: 400 });

  // Truncate to avoid Slack limits
  const truncatedMessage = message.length > 1024 ? message.substring(0, 1021) + "..." : message;
  const alert = `*XSSless: Message Alert*\n\`\`\`\n${truncatedMessage}\n\`\`\`\n`;

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
