const http = require('http');
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

// 현재 날짜와 시간을 반환하는 함수
function getCurrentDateTime() {
  const now = new Date();
  return now.toISOString(); // ISO 8601 형식의 날짜와 시간
}

// 요청을 처리하는 함수
function handleRequest(req, res) {
  // 현재 날짜와 시간
  const dateTime = getCurrentDateTime();

  // 요청 헤더와 프로토콜을 콘솔에 로깅
  console.log(`[${dateTime}] Protocol: ${req.httpVersion || '2.0'}`);
  console.log(`[${dateTime}] Received request headers:`, req.headers);

  // 요청된 파일 이름을 추출
  const filename = req.url.substring(1) || 'default.jpg';

  // 이미지 파일 경로 설정 (/opt/app-root/src 디렉토리에서 파일 찾기)
  const filePath = path.join('/opt/app-root/src', filename);

  // 파일 경로를 콘솔에 로깅
  console.log(`[${dateTime}] Requested file path:`, filePath);

  // 파일이 존재하는지 확인
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 파일이 존재하지 않는 경우 404 응답
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      console.log(`[${dateTime}] File not found: ${filePath}`);
      return;
    }

    // 파일을 읽어서 응답
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    fs.createReadStream(filePath).pipe(res);
    console.log(`[${dateTime}] Serving file: ${filePath}`);
  });
}

// HTTP/1.1 및 HTTP/2 서버를 생성하고 요청을 처리하는 함수
function createServer() {
  const server = http.createServer((req, res) => {
    // 클라이언트가 HTTP/2를 지원하는 경우 H2C 업그레이드
    if (req.headers['upgrade'] && req.headers['upgrade'] === 'h2c') {
      // HTTP/2 처리
      const http2Server = http2.createServer();
      http2Server.on('stream', (stream, headers) => {
        handleRequest({
          headers: headers,
          httpVersion: '2.0',
          url: headers[':path']
        }, stream);
      });
      http2Server.emit('connection', req.socket);
    } else {
      // HTTP/1.1 처리
      handleRequest(req, res);
    }
  });

  return server;
}

// 포트에서 서버 실행
const server = createServer();
server.listen(8080, () => {
  console.log('Server running on port 8080');
});
