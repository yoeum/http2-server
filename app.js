const http = require('http');
const http2 = require('http2');
const fs = require('fs');
const path = require('path');
const url = require('url');


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


http2Server.listen(PORT, () => {
  console.log(`HTTP/2 server running on http://localhost:${PORT}`);
});
