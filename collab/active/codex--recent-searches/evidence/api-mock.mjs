import http from 'node:http';
const requests = [];
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  res.setHeader('Content-Type', 'application/json');
  if (url.pathname === '/requests') { res.end(JSON.stringify(requests)); return; }
  if (url.pathname !== '/news') { res.writeHead(404); res.end('{}'); return; }
  const keyword = url.searchParams.get('keyword');
  requests.push(keyword);
  if (keyword === '오류검색') { res.writeHead(503); res.end('{}'); return; }
  if (keyword === '느린검색') await new Promise(r => setTimeout(r, 1000));
  res.end(JSON.stringify({total: 0, items: []}));
}).listen(3820, '127.0.0.1', () => console.log('recent search QA API http://127.0.0.1:3820'));
