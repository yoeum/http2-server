const http = require('http');
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

// 요청을 처리하는 함수
function onRequest(req, res) {
  // 요청 헤더를 콘솔에 로깅
  console.log('1 Received request headers:', req.headers);

  // 요청된 파일 이름을 추출
  const filename = req.url.substring(1) || 'default.jpg';
   console.log('Requested file name:', filename);
  // 이미지 파일 경로 설정
  const filePath = path.join(__dirname, 'images', filename);
  console.log('Requested file path:', filePath);

  // 파일이 존재하는지 확인
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    // 파일을 읽어서 응답
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// 기본 HTTP/1.1 서버 생성
const server = http.createServer((req, res) => {
  // 'Upgrade' 헤더를 통해 HTTP/2(H2C) 업그레이드 요청을 처리
  if (req.headers['upgrade'] && req.headers['upgrade'] === 'h2c') {
    const http2Server = http2.createServer();
    http2Server.emit('connection', req.socket);
  } else {
    // HTTP/1.1 요청 처리
    onRequest(req, res);
  }
});

// 포트에서 서버 실행
server.listen(8080, () => {
  console.log('Server running on port 8080');
});
