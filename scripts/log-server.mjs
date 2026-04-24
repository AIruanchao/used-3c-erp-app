import http from 'node:http';

const port = Number(process.env.PORT ?? '7242');

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/logs') {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks).toString('utf8');
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      json = { raw: body };
    }
    console.log(JSON.stringify({ receivedAt: new Date().toISOString(), json }, null, 2));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`log-server listening on http://0.0.0.0:${port}/logs`);
});
