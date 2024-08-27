const http = require('http');
const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 현재 날짜와 시간을 반환하는 함수
function getCurrentDateTime() {
  const now = new Date();
  return now.toISOString(); // ISO 8601 형식의 날짜와 시간
}

// HTTP/2 서버 설정
const http2Server = http2.createServer();

http2Server.on('stream', (stream, headers) => {
  // HTTP/2 요청의 프로토콜과 헤더를 로깅
  const dateTime = getCurrentDateTime();
  console.log(`[${dateTime}] Protocol: HTTP/2`);
  console.log(`[${dateTime}] Received request headers:`, headers);

  const fileName = new URL(headers[':path'], `http://${headers[':authority']}`).searchParams.get('file') || 'large-image.jpg';

  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    fs.stat(filePath, (err, stat) => {
      if (err) {
        stream.respond({ ':status': 404 });
        stream.end('File Not Found');
        console.log(`[${dateTime}] File not found: ${filePath}`);
        return;
      }

      stream.respond({
        'content-type': 'image/jpeg',
        'content-length': stat.size,
      });
      fs.createReadStream(filePath).pipe(stream);
      console.log(`[${dateTime}] Serving file: ${filePath}`);
    });
  } else {
    stream.respond({ ':status': 400 });
    stream.end('Bad Request: File parameter missing');
    console.log(`[${dateTime}] Bad Request: File parameter missing`);
  }
});

// HTTP/1.1 서버 설정
const http1Server = http.createServer((req, res) => {
  // HTTP/1.1 요청의 프로토콜과 헤더를 로깅
  const dateTime = getCurrentDateTime();
  console.log(`[${dateTime}] Protocol: HTTP/1.1`);
  console.log(`[${dateTime}] Received request headers:`, req.headers);

  // 요청 URL에서 파일 이름을 추출
  const parsedUrl = url.parse(req.url, true);
  const fileName = parsedUrl.query.file || 'large-image.jpg';
  
  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    fs.stat(filePath, (err, stat) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
        console.log(`[${dateTime}] File not found: ${filePath}`);
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': stat.size,
      });
      fs.createReadStream(filePath).pipe(res);
      console.log(`[${dateTime}] Serving file: ${filePath}`);
    });
  } else {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request: File parameter missing');
    console.log(`[${dateTime}] Bad Request: File parameter missing`);
  }
});

// 포트에서 서버 실행
const PORT = 8080;
http1Server.listen(PORT, () => {
  console.log(`HTTP/1.1 server running on http://localhost:${PORT}`);
});

http2Server.listen(PORT, () => {
  console.log(`HTTP/2 server running on http://localhost:${PORT}`);
});
