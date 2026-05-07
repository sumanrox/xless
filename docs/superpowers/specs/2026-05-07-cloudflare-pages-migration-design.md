# Design: Migrating Xless to Cloudflare Pages

## Overview
Xless is currently a Node.js Express application designed for Vercel. This design outlines the migration to Cloudflare Pages, utilizing Pages Functions (Cloudflare Workers) for the backend.

## Proposed Approaches

### Approach 1: Pages Functions (Full Rewrite) - RECOMMENDED
Rewrite the Express logic into native Cloudflare Pages Functions. This approach offers the best performance and smallest bundle size, fully utilizing the Workers runtime.

- **Pros:** Native performance, better compatibility with Workers runtime, easy deployment.
- **Cons:** Requires rewriting the Express middleware/routing logic.

### Approach 2: Using an Express-to-Worker adapter
Use a library like `@hono/node-server` or a custom adapter to run Express on Workers.

- **Pros:** Minimal changes to `index.js`.
- **Cons:** Express has many Node.js dependencies (like `http`, `zlib`) that may not be fully compatible with the Workers environment without significant polyfilling.

## Recommended Approach Details (Pages Functions)

### 1. Project Structure
- Move `payload.js` to a `public/` directory (static assets).
- Create a `functions/` directory for the backend logic.

### 2. Implementation Strategy
- **Functions Routing:**
    - `functions/[[path]].js`: A catch-all route to handle the logic previously in `index.js`.
    - Alternatively, specific files for `/c`, `/message`, `/health`, and `/examples`.
- **Dependency Replacement:**
    - Replace `request` with the native `fetch` API.
    - Replace `body-parser` with `request.json()` or `request.formData()`.
    - Replace `cors` middleware with manual CORS header handling in the response.
- **Environment Variables:**
    - Map `IMGBB_API_KEY` and `SLACK_INCOMING_WEBHOOK` via the Cloudflare Pages dashboard or `wrangler.toml`.

### 3. Data Flow
1. **User requests `<script src="https://your-pages-app.pages.dev"></script>`:**
   - The catch-all function triggers.
   - It sends an OOB callback alert to Slack.
   - It returns the `payload.js` file content.
2. **`payload.js` runs on target:**
   - Collects data.
   - Sends `POST` to `/c`.
3. **`/c` endpoint in Functions:**
   - Receives data.
   - Uploads screenshot to IMGBB (if key exists).
   - Sends Blind XSS alert to Slack.

## Success Criteria
- [ ] OOB callbacks trigger Slack notifications.
- [ ] Blind XSS reports (including screenshots) are delivered to Slack.
- [ ] `/health` endpoint correctly reports configuration status.
- [ ] `/examples` endpoint serves the example payloads.
- [ ] `payload.js` is served correctly.
