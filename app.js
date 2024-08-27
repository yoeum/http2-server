const http = require('http');
const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const url = require('url');

// HTTP/1.1 서버 설정
const http1Server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const fileName = parsedUrl.query.file || 'large-image.jpg'; // 쿼리 파라미터에서 파일 이름 가져오기

  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    fs.stat(filePath, (err, stat) => {
      if (err) {
        res.writeHead(404);
        res.end('File Not Found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': stat.size,
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } else {
    res.writeHead(400);
    res.end('Bad Request: File parameter missing');
  }
});

// HTTP/2 서버 설정
const http2Server = http2.createServer();

http2Server.on('stream', (stream, headers) => {
  const fileName = new URL(headers[':path'], `http://${headers[':authority']}`).searchParams.get('file') || 'large-image.jpg';

  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    fs.stat(filePath, (err, stat) => {
      if (err) {
        stream.respond({ ':status': 404 });
        stream.end('File Not Found');
        return;
      }

      stream.respond({
        'content-type': 'image/jpeg',
        'content-length': stat.size,
      });
      fs.createReadStream(filePath).pipe(stream);
    });
  } else {
    stream.respond({ ':status': 400 });
    stream.end('Bad Request: File parameter missing');
  }
});

// HTTP/1.1 서버와 HTTP/2 서버를 같은 포트에서 동작
const PORT = 8080;
http1Server.listen(PORT, () => {
  console.log(`HTTP/1.1 server running on http://localhost:${PORT}`);
});

http2Server.listen(PORT, () => {
  console.log(`HTTP/2 server running on http://localhost:${PORT}`);
});
