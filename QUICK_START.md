# 🚀 Quick Start Guide

## 최소 3단계로 실행하기

### 1️⃣ 클론 & 설치
```bash
git clone [YOUR_REPO_URL]
cd MagicMirror
npm install
```

### 2️⃣ 실행
```bash
npm run start:dev
```

### 3️⃣ 접속
- Electron 창이 자동으로 열립니다
- 또는 브라우저에서 `http://localhost:8080` 접속

## ⚡ 빠른 문제 해결

### 실행이 안 될 때
```bash
# Node.js 버전 확인 (22.14.0+ 필요)
node --version

# 의존성 재설치
rm -rf node_modules
npm install

# 포트 변경해서 실행
MM_PORT=3000 npm run start:dev
```

### 모듈 에러가 날 때
```bash
# 캐시 정리
npm cache clean --force
npm install
```

## 📱 사용법
- 페이지는 자동으로 전환됩니다
- 하단 네비게이션으로 수동 전환 가능
- 30초마다 자동 새로고침
- 개발 모드에서는 F12로 DevTools 열기

---
**문제가 있으면 SETUP_README.md를 참고하세요!**
