# Red Hat Universal Base Image 9 사용
FROM registry.access.redhat.com/ubi9/ubi:latest

# Node.js와 필수 패키지 설치
RUN dnf install -y nodejs npm \
    && dnf clean all

# 작업 디렉토리 설정
WORKDIR /opt/app-root/src

# 애플리케이션 소스 복사
COPY . .

# 의존성 설치
RUN npm install

# 애플리케이션 실행
CMD ["node", "app.js"]
