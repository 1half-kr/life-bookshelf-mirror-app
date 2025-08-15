# MagicMirror² 프로젝트 실행 가이드

이 프로젝트는 **인터뷰 기반 자서전 생성 시스템**과 연동된 MagicMirror² 스마트 미러 애플리케이션입니다.

## 📋 시스템 요구사항

- **Node.js**: 22.14.0 이상
- **npm**: Node.js와 함께 설치됨
- **운영체제**: macOS, Linux, Windows
- **메모리**: 최소 2GB RAM 권장
- **API 서버**: 인터뷰 시스템 백엔드 서버 (localhost:3000)

## 🚀 설치 및 실행 방법

### 1. 저장소 클론
```bash
git clone [YOUR_GITHUB_REPOSITORY_URL]
cd MagicMirror
```

### 2. 환경변수 설정 (선택사항)
```bash
# .env 파일 생성 (필요시)
cp .env.sample .env

# API 서버 URL 수정 (기본값: http://localhost:3000/api/v2)
# MM_API_BASE_URL=http://your-api-server.com/api/v2
# MM_WS_BASE_URL=ws://your-api-server.com/ws
```

### 3. 의존성 설치
```bash
# 메인 의존성 설치 (자동으로 fonts, vendor도 설치됨)
npm install

# 만약 위 명령어가 실패하면 개별적으로 설치
npm run install-mm:dev
npm run install-vendor
npm run install-fonts
```

### 4. API 서버 확인
**중요**: 이 애플리케이션은 별도의 API 서버와 통신합니다.
- 기본 API 서버 주소: `http://localhost:3000/api/v2`
- WebSocket 서버 주소: `ws://localhost:3000/ws`
- API 서버가 실행 중인지 확인하세요!

### 5. 애플리케이션 실행

#### 개발 모드 (권장)
```bash
npm run start:dev
```
- DevTools가 자동으로 열립니다
- 코드 변경 시 디버깅이 용이합니다

#### 일반 실행 모드
```bash
npm start
```

#### 서버만 실행 (브라우저에서 접속)
```bash
npm run server
```
그 후 브라우저에서 `http://localhost:8080` 접속

### 6. 운영체제별 실행 방법

#### macOS/Linux
```bash
npm run start:x11:dev    # X11 환경
npm run start:wayland:dev # Wayland 환경 (Linux)
```

#### Windows
```bash
npm run start:windows:dev
```

## 🎯 주요 기능 및 사용법

### 📱 인터뷰 시스템 플로우
1. **Device ID 등록** → 시스템에 기기 등록
2. **사용자 정보 입력** → 나이, 성별, 학력, 결혼여부
3. **음성 인터뷰** → STT로 음성 인식, 실시간 대화
4. **WebSocket 실시간 업데이트** → 주제 추출, 인터뷰 진행상황
5. **자서전 생성** → AI가 답변을 바탕으로 자서전 작성

### 🎤 음성 인터뷰 기능
- **STT (Speech-to-Text)**: 브라우저 내장 음성 인식
- **TTS (Text-to-Speech)**: 질문을 음성으로 출력
- **실시간 대화**: 강아지 캐릭터와 자연스러운 대화
- **WebSocket 연동**: 실시간 상태 업데이트

### 🐕 강아지 캐릭터 상태
- **Happy**: 기본 대기 상태
- **Listening**: 사용자 음성 듣는 중
- **Thinking**: 답변 처리 중
- **Speaking**: 질문 말하는 중

### 📊 실시간 피드백
- **주제 추출**: 대화에서 키워드 실시간 분석
- **진행률 표시**: 인터뷰 충분도 판정
- **연결 상태**: WebSocket 연결 상태 표시

## 🔧 문제 해결

### 일반적인 문제들

#### 1. Node.js 버전 문제
```bash
# Node.js 버전 확인
node --version

# 22.14.0 이상이 아니라면 업데이트 필요
```

#### 2. 권한 문제 (Linux/macOS)
```bash
# npm 전역 권한 문제 시
sudo npm install -g npm
```

#### 3. Electron 실행 문제
```bash
# Electron 재설치
npm uninstall electron
npm install electron
```

#### 4. 포트 충돌
기본 포트 8080이 사용 중이라면:
```bash
# 환경변수로 포트 변경
MM_PORT=3000 npm start
```

#### 5. 모듈 로딩 실패
일부 커스텀 모듈이 로드되지 않는다면:
```bash
# 캐시 정리 후 재설치
npm cache clean --force
rm -rf node_modules
npm install
```

### 개발자 도구 사용
개발 모드에서 실행하면 DevTools가 열립니다:
- **Console**: 에러 메시지 확인
- **Network**: API 호출 상태 확인
- **Elements**: DOM 구조 확인

## 📁 프로젝트 구조

```
MagicMirror/
├── config/
│   └── config.js          # 메인 설정 파일
├── modules/
│   ├── default/           # 기본 모듈들
│   │   ├── register/      # 등록 모듈
│   │   ├── chat/          # 채팅 모듈
│   │   ├── metadata/      # 메타데이터 모듈
│   │   └── ...
│   ├── MMM-pages/         # 페이지 전환 모듈
│   ├── MMM-TTS/           # TTS 모듈
│   └── MMM-auto-refresh/  # 자동 새로고침 모듈
├── js/                    # 코어 JavaScript 파일들
├── css/                   # 스타일시트
└── package.json           # 의존성 정보
```

## 🎨 커스터마이징

### 설정 변경
`config/config.js` 파일에서 다음을 수정할 수 있습니다:
- 포트 번호
- 언어 설정
- 모듈 활성화/비활성화
- 페이지 전환 시간

### 새 모듈 추가
1. `modules/default/` 디렉토리에 새 모듈 폴더 생성
2. `config.js`의 modules 배열에 추가
3. 애플리케이션 재시작

## 🐛 버그 리포트

문제가 발생하면 다음 정보와 함께 이슈를 등록해주세요:
- 운영체제 및 버전
- Node.js 버전
- 에러 메시지 (콘솔 로그)
- 재현 단계

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 🚨 중요 참고사항

- 일부 커스텀 모듈들은 이 프로젝트에 특화되어 있어 다른 MagicMirror 설치에서는 작동하지 않을 수 있습니다
- 인터넷 연결이 필요한 기능들이 있습니다 (TTS, 자동 새로고침 등)
- 처음 실행 시 모든 의존성이 설치될 때까지 시간이 걸릴 수 있습니다

실행에 문제가 있으시면 위의 문제 해결 섹션을 참고하시거나 이슈를 등록해주세요!
