/**
 * Chat 모듈 - 자연스러운 인터뷰 플로우
 * 
 * 주요 기능:
 * 1. 현재 진행 중인 챕터 조회
 * 2. 이전 인터뷰 데이터 로드 및 표시
 * 3. 챕터 상태에 따른 자연스러운 인사
 * 4. WebSocket을 통한 실시간 챕터 변경 감지
 * 5. 음성 입력 및 API 통신
 */

Module.register("chat", {
	defaults: {
		wsUrl: "ws://15.165.32.26:3000/ws",
		apiBaseUrl: "http://15.165.32.26:3000/api/v2"
	},

	/**
	 * 모듈 시작 - 초기 설정
	 */
	start() {
		console.log('[Chat] 🚀 Chat 모듈 시작 - 자연스러운 인터뷰 플로우');
		
		// 전역 에러 핸들러 추가
		window.addEventListener('error', (event) => {
			if (event.filename && event.filename.includes('chat')) {
				console.error('[Chat] 전역 에러 감지:', event.error);
				event.preventDefault();
			}
		});
		
		// === 상태 변수 초기화 ===
		this.userId = null;                    // 사용자 ID
		this.currentChapter = null;            // 현재 챕터 정보
		this.previousChapterId = null;         // 이전 챕터 ID (변경 감지용)
		this.conversationHistory = [];        // 대화 히스토리
		this.isFirstTimeInChapter = false;     // 챕터 첫 접근 여부
		
		// === WebSocket 관련 ===
		this.ws = null;                        // WebSocket 연결
		this.isConnected = false;              // 연결 상태
		
		// === 음성 인식 관련 ===
		this.isListening = false;              // 음성 인식 중 여부
		this.recognition = null;               // 음성 인식 객체
		
		// === UI 관련 ===
		this.lottieAnimation = null;           // 강아지 애니메이션
		this.currentExpression = "happy";      // 현재 강아지 표정
		
		// Lottie 라이브러리 로드
		try {
			this.loadLottieLibrary();
		} catch (error) {
			console.error('[Chat] Lottie 라이브러리 로드 실패:', error);
		}
		
		// 시작 시 숨김
		this.hide();
		console.log('[Chat] ✅ Chat 모듈 초기화 완료');
	},

	/**
	 * 알림 수신 처리
	 */
	notificationReceived(notification, payload) {
		console.log('[Chat] 📨 알림 수신:', notification, 'payload:', payload);
		
		if (notification === "USER_REGISTERED") {
			// 사용자 등록 완료 시 사용자 ID 저장
			this.userId = payload.userId;
			console.log('[Chat] 👤 사용자 ID 설정:', this.userId);
			
			// profile_completed가 true인 경우에만 chat 모듈 표시 및 인터뷰 시작
			if (payload.profileCompleted) {
				console.log('[Chat] 🎯 Profile completed - showing chat module and starting interview');
				
				// CSS 클래스 추가로 표시
				const moduleElement = document.querySelector('.module.chat');
				if (moduleElement) {
					moduleElement.classList.add('visible');
				}
				
				// 즉시 표시
				this.show(0);
				
				// 강제 활성화
				setTimeout(() => {
					this.forceActivate();
				}, 50);
				
				// 인터뷰 초기화 시작
				setTimeout(() => {
					console.log('[Chat] 🚀 인터뷰 초기화 시작');
					this.initializeInterview();
				}, 200);
			} else {
				console.log('[Chat] 📝 Profile not completed - hiding chat module');
				this.hide(500);
			}
		} else if (notification === "PREPARE_CHAT") {
			// info 모듈에서 chat 준비 요청
			console.log('[Chat] 🔧 Preparing chat module for interview');
			
			// 사용자 ID 설정
			if (payload.userId) {
				this.userId = payload.userId;
				console.log('[Chat] 👤 사용자 ID 설정 (준비):', this.userId);
			}
			
			// chat 모듈을 백그라운드에서 준비 (아직 표시하지 않음)
			console.log('[Chat] ✅ Chat module prepared and ready for START_INTERVIEW');
			
		} else if (notification === "START_INTERVIEW") {
			// info 모듈에서 인터뷰 시작 버튼을 눌렀을 때
			console.log('[Chat] 🎯 Starting interview from info module - IMMEDIATE RESPONSE');
			
			// 사용자 ID 설정 (혹시 없다면)
			if (!this.userId && payload.userId) {
				this.userId = payload.userId;
			}
			
			// CSS 클래스 추가로 표시
			const moduleElement = document.querySelector('.module.chat');
			if (moduleElement) {
				moduleElement.classList.add('visible');
			}
			
			// 즉시 표시 (지연 없음)
			this.show(0);
			
			// 즉시 강제 활성화
			this.forceActivate();
			
			// 즉시 인터뷰 초기화 시작
			setTimeout(() => {
				console.log('[Chat] 🚀 인터뷰 초기화 시작 - IMMEDIATE');
				this.initializeInterview();
			}, 50);
		}
		// 다른 모든 알림 무시 - 페이지 시스템 사용하지 않음
		/*
		} else if (notification === "PAGE_CHANGED") {
			if (payload === 3) {
				// Chat 페이지로 전환 시
				console.log('[Chat] 🎯 Chat 페이지 활성화 - 강제 표시');
				
				// 즉시 표시
				this.show(0);
				
				// 강제 활성화
				setTimeout(() => {
					this.forceActivate();
				}, 50);
				
				// 인터뷰 초기화 시작
				setTimeout(() => {
					console.log('[Chat] 🚀 인터뷰 초기화 시작 예약');
					this.initializeInterview();
				}, 200);
				
			} else {
				// 다른 페이지로 전환 시
				console.log('[Chat] 🚪 Chat 페이지 비활성화, 페이지:', payload);
				this.hide(500);
				this.disconnectWebSocket();
			}
		}
		*/
	},

	/**
	 * === 메인 초기화 플로우 ===
	 * 1. 사용자 ID 확인
	 * 2. WebSocket 연결
	 * 3. 현재 챕터 조회
	 * 4. 이전 대화 데이터 로드
	 * 5. 자연스러운 인사
	 */
	async initializeInterview() {
		console.log('[Chat] 🎬 인터뷰 초기화 시작');
		
		// 1단계: 사용자 ID 확인
		if (!this.userId) {
			console.error('[Chat] ❌ 사용자 ID가 없습니다');
			this.updateConnectionStatus('사용자 ID 필요 ❌');
			return;
		}
		
		try {
			// 2단계: WebSocket 연결
			console.log('[Chat] 🔌 WebSocket 연결 시작');
			this.initializeWebSocket();
			
			// 3단계: 현재 진행 중인 챕터 조회
			console.log('[Chat] 📖 현재 챕터 조회 중...');
			const currentChapter = await this.getCurrentChapter();
			
			if (!currentChapter) {
				throw new Error('현재 챕터 정보를 가져올 수 없습니다');
			}
			
			this.currentChapter = currentChapter;
			console.log('[Chat] ✅ 현재 챕터:', this.currentChapter);
			
			// 4단계: 이전 대화 데이터 로드
			console.log('[Chat] 💬 이전 대화 데이터 로드 중...');
			await this.loadConversationHistory();
			
			// 5단계: 자연스러운 인사 및 인터뷰 시작
			console.log('[Chat] 👋 자연스러운 인사 시작');
			await this.startNaturalGreeting();
			
			console.log('[Chat] 🎉 인터뷰 초기화 완료');
			this.updateConnectionStatus('인터뷰 준비 완료 ✅');

		} catch (error) {
			console.error('[Chat] ❌ 인터뷰 초기화 실패:', error);
			this.updateConnectionStatus('인터뷰 준비 실패 ❌');
		}
	},

	/**
	 * === API 통신 메서드들 (재시도 로직 포함) ===
	 */

	/**
	 * 공통 API 재시도 래퍼
	 * @param {Function} apiFunction - 실행할 API 함수
	 * @param {string} apiName - API 이름 (로깅용)
	 * @param {number} maxRetries - 최대 재시도 횟수 (기본 1회)
	 * @param {number} retryDelay - 재시도 대기 시간 (기본 5초)
	 */
	async withRetry(apiFunction, apiName, maxRetries = 1, retryDelay = 5000) {
		console.log(`[Chat] 🔄 ${apiName} API 시작 (최대 ${maxRetries + 1}회 시도)`);
		
		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				if (attempt > 0) {
					console.log(`[Chat] 🔄 ${apiName} 재시도 ${attempt}/${maxRetries}`);
					this.showLoadingState(`${apiName} 재시도 중... (${attempt}/${maxRetries})`);
				} else {
					this.showLoadingState(`${apiName} 중...`);
				}
				
				const result = await apiFunction();
				this.hideLoadingState();
				console.log(`[Chat] ✅ ${apiName} 성공 (시도 ${attempt + 1}/${maxRetries + 1})`);
				return result;
				
			} catch (error) {
				console.error(`[Chat] ❌ ${apiName} 실패 (시도 ${attempt + 1}/${maxRetries + 1}):`, error);
				
				if (attempt < maxRetries) {
					// 재시도 대기
					console.log(`[Chat] ⏰ ${retryDelay/1000}초 후 ${apiName} 재시도...`);
					this.showLoadingState(`연결 실패. ${retryDelay/1000}초 후 재시도...`);
					await this.delay(retryDelay);
				} else {
					// 최종 실패
					console.error(`[Chat] 💥 ${apiName} 최종 실패`);
					this.hideLoadingState();
					this.showServerError(apiName, error.message);
					throw error;
				}
			}
		}
	},

	/**
	 * 지연 함수
	 */
	delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	},

	/**
	 * 현재 진행 중인 챕터 조회 (재시도 포함)
	 * GET /user/current-chapter?userId={userId}
	 */
	async getCurrentChapter() {
		return await this.withRetry(async () => {
			console.log('[Chat] 📡 현재 챕터 조회 API 호출');
			
			const url = `${this.config.apiBaseUrl}/user/current-chapter?userId=${this.userId}`;
			console.log('[Chat] 🌐 요청 URL:', url);
			
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Accept': 'application/json'
				}
			});
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			console.log('[Chat] ✅ 챕터 조회 성공:', data);
			
			return {
				chapterId: data.chapter_id || data.chapterId,
				chapterNumber: data.chapter_number || data.chapterNumber,
				chapterTitle: data.chapter_title || data.chapterTitle,
				status: data.status || 'new'
			};
		}, '현재 챕터 조회');
	},

	/**
	 * 이전 대화 데이터 로드 (재시도 포함)
	 * GET /conversation/{chapter_id}/history?userId={userId}
	 */
	async loadConversationHistory() {
		console.log('[Chat] 📚 대화 히스토리 로드 시작');
		
		try {
			await this.withRetry(async () => {
				const url = `${this.config.apiBaseUrl}/conversation/${this.currentChapter.chapterId}/history?userId=${this.userId}`;
				console.log('[Chat] 🌐 히스토리 요청 URL:', url);
				
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						'Accept': 'application/json'
					}
				});
				
				if (!response.ok) {
					if (response.status === 404) {
						// 히스토리가 없는 경우 (첫 시작)
						console.log('[Chat] 📝 새로운 챕터 - 히스토리 없음');
						this.conversationHistory = [];
						this.isFirstTimeInChapter = true;
						return;
					}
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}
				
				const data = await response.json();
				console.log('[Chat] ✅ 히스토리 로드 성공:', data);
				
				// 대화 히스토리 저장
				this.conversationHistory = data.messages || [];
				this.isFirstTimeInChapter = this.conversationHistory.length === 0;
				
				// UI에 이전 대화 표시
				this.displayConversationHistory();
			}, '대화 히스토리 로드');
			
		} catch (error) {
			console.error('[Chat] ❌ 히스토리 로드 최종 실패:', error);
			// 실패해도 계속 진행 (새 챕터로 간주)
			this.conversationHistory = [];
			this.isFirstTimeInChapter = true;
		}
	},

	/**
	 * 챕터 시작 API 호출 (재시도 포함)
	 * POST /chapters/{chapter_number}/start
	 */
	async startChapter(chapterInfo) {
		return await this.withRetry(async () => {
			console.log('[Chat] 🎬 챕터 시작 API 호출:', chapterInfo);
			
			const url = `${this.config.apiBaseUrl}/chapters/${chapterInfo.chapterNumber}/start`;
			console.log('[Chat] 🌐 챕터 시작 URL:', url);
			
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					user_id: this.userId
				})
			});
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			console.log('[Chat] ✅ 챕터 시작 성공:', data);
			
			return data;
		}, '챕터 시작');
	},

	/**
	 * 대화 메시지 전송 및 응답 받기 (재시도 포함)
	 * POST /conversation/{chapter_id}
	 */
	async sendMessageToAPI(message) {
		return await this.withRetry(async () => {
			console.log('[Chat] 💌 메시지 전송 API 호출');
			console.log('[Chat] 📝 전송할 메시지:', message);
			
			const url = `${this.config.apiBaseUrl}/conversation/${this.currentChapter.chapterId}`;
			console.log('[Chat] 🌐 메시지 전송 URL:', url);
			
			const requestBody = {
				user_id: this.userId,
				message: message
			};
			console.log('[Chat] 📦 요청 데이터:', requestBody);
			
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			const data = await response.json();
			console.log('[Chat] ✅ 메시지 전송 성공');
			console.log('[Chat] 🤖 AI 응답:', data);
			
			// 응답 구조 검증
			if (data.next_question && data.next_question.text) {
				return {
					questionId: data.next_question.id,
					questionText: data.next_question.text
				};
			} else {
				throw new Error('응답 형식이 올바르지 않습니다');
			}
	/**
	 * === 로딩 및 에러 상태 UI ===
	 */

	/**
	 * 로딩 상태 표시
	 */
	showLoadingState(message = '로딩 중...') {
		console.log('[Chat] ⏳ 로딩 상태 표시:', message);
		
		// 기존 로딩 오버레이 제거
		this.hideLoadingState();
		
		const chatWrapper = document.getElementById('chatWrapper') || document.querySelector('.chat-wrapper');
		if (!chatWrapper) return;
		
		const loadingOverlay = document.createElement('div');
		loadingOverlay.className = 'loading-overlay';
		loadingOverlay.id = 'loadingOverlay';
		loadingOverlay.innerHTML = `
			<div class="loading-content">
				<div class="loading-spinner">
					<div class="spinner-ring"></div>
					<div class="spinner-ring"></div>
					<div class="spinner-ring"></div>
				</div>
				<div class="loading-text">${message}</div>
				<div class="loading-subtext">잠시만 기다려주세요...</div>
			</div>
		`;
		
		chatWrapper.appendChild(loadingOverlay);
		
		// 애니메이션 시작
		setTimeout(() => {
			loadingOverlay.classList.add('show');
		}, 10);
	},

	/**
	 * 로딩 상태 숨김
	 */
	hideLoadingState() {
		const loadingOverlay = document.getElementById('loadingOverlay');
		if (loadingOverlay) {
			loadingOverlay.classList.add('hide');
			setTimeout(() => {
				loadingOverlay.remove();
			}, 300);
		}
	},

	/**
	 * 서버 에러 표시 및 화면 초기화
	 */
	showServerError(apiName, errorMessage) {
		console.log('[Chat] 💥 서버 에러 표시:', apiName, errorMessage);
		
		// 로딩 상태 숨김
		this.hideLoadingState();
		
		const chatWrapper = document.getElementById('chatWrapper') || document.querySelector('.chat-wrapper');
		if (!chatWrapper) return;
		
		// 기존 에러 오버레이 제거
		const existingError = document.getElementById('errorOverlay');
		if (existingError) {
			existingError.remove();
		}
		
		const errorOverlay = document.createElement('div');
		errorOverlay.className = 'error-overlay';
		errorOverlay.id = 'errorOverlay';
		errorOverlay.innerHTML = `
			<div class="error-content">
				<div class="error-icon">⚠️</div>
				<div class="error-title">서버 연결 오류</div>
				<div class="error-message">${apiName} 중 문제가 발생했습니다</div>
				<div class="error-details">${errorMessage}</div>
				<div class="error-actions">
					<button class="error-btn retry-btn" onclick="window.chatModule.retryConnection()">
						🔄 다시 시도
					</button>
					<button class="error-btn reset-btn" onclick="window.chatModule.resetToHome()">
						🏠 처음으로
					</button>
				</div>
				<div class="error-footer">
					<p>문제가 지속되면 관리자에게 문의해주세요</p>
				</div>
			</div>
		`;
		
		chatWrapper.appendChild(errorOverlay);
		
		// 전역 참조 설정 (버튼 이벤트용)
		window.chatModule = this;
		
		// 애니메이션 시작
		setTimeout(() => {
			errorOverlay.classList.add('show');
		}, 10);
		
		// 10초 후 자동으로 처음으로 이동
		setTimeout(() => {
			console.log('[Chat] ⏰ 10초 경과, 자동으로 처음 화면으로 이동');
			this.resetToHome();
		}, 10000);
	},

	/**
	 * 연결 재시도
	 */
	async retryConnection() {
		console.log('[Chat] 🔄 연결 재시도 시작');
		
		// 에러 오버레이 제거
		const errorOverlay = document.getElementById('errorOverlay');
		if (errorOverlay) {
			errorOverlay.remove();
		}
		
		// 인터뷰 다시 초기화
		try {
			await this.initializeInterview();
		} catch (error) {
			console.error('[Chat] ❌ 재시도 실패:', error);
			// 재시도도 실패하면 처음으로
			setTimeout(() => {
				this.resetToHome();
			}, 2000);
		}
	},

	/**
	 * 처음 화면으로 초기화
	 */
	resetToHome() {
		console.log('[Chat] 🏠 처음 화면으로 초기화');
		
		// 에러 오버레이 제거
		const errorOverlay = document.getElementById('errorOverlay');
		if (errorOverlay) {
			errorOverlay.remove();
		}
		
		// WebSocket 연결 해제
		this.disconnectWebSocket();
		
		// 상태 초기화
		this.currentChapter = null;
		this.conversationHistory = [];
		this.isFirstTimeInChapter = false;
		
		// 페이지 시스템 사용하지 않으므로 PAGE_CHANGED 제거
		// this.sendNotification("PAGE_CHANGED", 0);
		
		// 성공 메시지
		setTimeout(() => {
			this.updateConnectionStatus('화면이 초기화되었습니다 🔄');
		}, 1000);
	},

	/**
	 * === 자연스러운 인사 처리 ===
	 */

	/**
	 * 챕터 상태에 따른 자연스러운 인사
	 */
	async startNaturalGreeting() {
		console.log('[Chat] 👋 자연스러운 인사 시작');
		console.log('[Chat] 🔍 첫 접근 여부:', this.isFirstTimeInChapter);
		console.log('[Chat] 📊 대화 히스토리 길이:', this.conversationHistory.length);
		
		if (this.isFirstTimeInChapter) {
			// 첫 시작인 경우: 자기소개 + 이름 묻기
			console.log('[Chat] 🆕 첫 시작 - 자기소개 및 이름 질문');
			
			// 챕터 시작 API 호출 (첫 접근이므로)
			try {
				await this.startChapter(this.currentChapter);
			} catch (error) {
				console.warn('[Chat] ⚠️ 챕터 시작 API 실패, 계속 진행:', error.message);
			}
			
			// 자기소개 메시지
			const greetingMessage = "안녕하세요! 저는 여러분의 이야기를 듣고 기록하는 AI 강아지입니다. 🐕✨\n\n먼저 성함을 알려주시겠어요?";
			this.displayDogQuestion(greetingMessage);
			
		} else {
			// 진행 중인 경우: 반가운 인사 + 대기
			console.log('[Chat] 🔄 진행 중 - 반가운 인사');
			
			const welcomeBackMessage = "오랜만이에요! 😊\n\n이어서 대화를 나눠볼까요? 편안하게 말씀해주세요.";
			this.displayDogQuestion(welcomeBackMessage);
		}
		
		// 이전 챕터 ID 저장 (변경 감지용)
		this.previousChapterId = this.currentChapter.chapterId;
	},

	/**
	 * === WebSocket 처리 ===
	 */

	/**
	 * WebSocket 연결 초기화
	 */
	initializeWebSocket() {
		console.log('[Chat] 🔌 WebSocket 연결 초기화');
		
		try {
			const wsUrl = `${this.config.wsUrl}?userId=${this.userId}`;
			console.log('[Chat] 🌐 WebSocket URL:', wsUrl);
			
			this.ws = new WebSocket(wsUrl);
			
			// 연결 성공
			this.ws.onopen = () => {
				console.log('[Chat] ✅ WebSocket 연결 성공');
				this.isConnected = true;
				this.updateConnectionStatus('실시간 연결됨 ✅');
			};
			
			// 메시지 수신
			this.ws.onmessage = (event) => {
				console.log('[Chat] 📨 WebSocket 메시지 수신:', event.data);
				try {
					const data = JSON.parse(event.data);
					this.handleWebSocketMessage(data);
				} catch (error) {
					console.error('[Chat] ❌ WebSocket 메시지 파싱 실패:', error);
				}
			};
			
			// 연결 종료
			this.ws.onclose = (event) => {
				console.log('[Chat] 🚪 WebSocket 연결 종료:', event.code, event.reason);
				this.isConnected = false;
				
				if (event.code === 1006) {
					this.updateConnectionStatus('서버 오프라인 ⚠️');
				} else {
					this.updateConnectionStatus('연결 끊김 ❌');
				}
			};
			
			// 연결 오류
			this.ws.onerror = (error) => {
				console.error('[Chat] ❌ WebSocket 오류:', error);
				this.isConnected = false;
				this.updateConnectionStatus('실시간 연결 실패 ⚠️');
			};
			
			// 연결 타임아웃 (5초)
			setTimeout(() => {
				if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
					console.warn('[Chat] ⏰ WebSocket 연결 타임아웃');
					this.ws.close();
					this.updateConnectionStatus('연결 시간 초과 ⏰');
				}
			}, 5000);
			
		} catch (error) {
			console.error('[Chat] ❌ WebSocket 생성 실패:', error);
			this.updateConnectionStatus('WebSocket 생성 실패 ❌');
		}
	},

	/**
	 * WebSocket 메시지 처리
	 * 
	 * 주요 기능: 챕터 변경 감지
	 */
	handleWebSocketMessage(data) {
		console.log('[Chat] 🔍 WebSocket 메시지 처리:', data);
		
		// 챕터 변경 감지
		if (data.type === 'chapter_changed' && data.chapter_id) {
			console.log('[Chat] 📖 챕터 변경 감지');
			console.log('[Chat] 🔄 이전 챕터:', this.previousChapterId);
			console.log('[Chat] 🆕 새 챕터:', data.chapter_id);
			
			// 챕터가 실제로 변경된 경우에만 처리
			if (this.previousChapterId !== data.chapter_id) {
				this.handleChapterChange(data);
			}
		}
		
		// 기타 WebSocket 메시지 처리
		if (data.type === 'ai_response' && data.message) {
			console.log('[Chat] 🤖 AI 응답 수신:', data.message);
			this.displayDogQuestion(data.message);
		}
	},

	/**
	 * 챕터 변경 처리
	 * 
	 * WebSocket으로 챕터 변경이 감지된 경우에만 /chapters/{chapter_number}/start 호출
	 */
	async handleChapterChange(chapterData) {
		console.log('[Chat] 🔄 챕터 변경 처리 시작:', chapterData);
		
		try {
			// 새 챕터 정보 업데이트
			this.currentChapter = {
				chapterId: chapterData.chapter_id,
				chapterNumber: chapterData.chapter_number,
				chapterTitle: chapterData.chapter_title || `챕터 ${chapterData.chapter_number}`,
				status: 'new'
			};
			
			console.log('[Chat] 📖 새 챕터 정보:', this.currentChapter);
			
			// 챕터 시작 API 호출 (WebSocket으로 변경 감지된 경우)
			await this.startChapter(this.currentChapter);
			
			// 새 챕터 시작 메시지
			const chapterStartMessage = `새로운 주제로 넘어가볼까요! 📖\n\n${this.currentChapter.chapterTitle}에 대해 이야기해보겠습니다.`;
			this.displayDogQuestion(chapterStartMessage);
			
			// 이전 챕터 ID 업데이트
			this.previousChapterId = this.currentChapter.chapterId;
			
		} catch (error) {
			console.error('[Chat] ❌ 챕터 변경 처리 실패:', error);
			this.displayDogQuestion("새로운 주제로 넘어가는 중 문제가 발생했습니다. 계속 대화해주세요.");
		}
	},

	/**
	 * WebSocket 연결 해제
	 */
	disconnectWebSocket() {
		console.log('[Chat] 🔌 WebSocket 연결 해제');
		
		if (this.ws) {
			this.ws.close();
			this.ws = null;
			this.isConnected = false;
			console.log('[Chat] ✅ WebSocket 연결 해제 완료');
		}
	},

	/**
	 * === 음성 입력 처리 ===
	 */

	/**
	 * 음성 인식 초기화
	 */
	initializeVoiceRecognition() {
		console.log('[Chat] 🎤 음성 인식 초기화');
		
		if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
			console.error('[Chat] ❌ 음성 인식을 지원하지 않는 브라우저');
			return false;
		}
		
		try {
			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			this.recognition = new SpeechRecognition();
			
			// 음성 인식 설정
			this.recognition.continuous = false;        // 연속 인식 비활성화
			this.recognition.interimResults = false;    // 중간 결과 비활성화
			this.recognition.lang = 'ko-KR';           // 한국어 설정
			
			// 음성 인식 시작
			this.recognition.onstart = () => {
				console.log('[Chat] 🎤 음성 인식 시작');
				this.isListening = true;
				this.updateVoiceButton('listening');
				this.changeExpression('listening');
			};
			
			// 음성 인식 결과
			this.recognition.onresult = (event) => {
				const transcript = event.results[0][0].transcript;
				console.log('[Chat] 🗣️ 음성 인식 결과:', transcript);
				
				// 사용자 메시지 처리
				this.handleUserMessage(transcript);
			};
			
			// 음성 인식 종료
			this.recognition.onend = () => {
				console.log('[Chat] 🎤 음성 인식 종료');
				this.isListening = false;
				this.updateVoiceButton('ready');
				this.changeExpression('happy');
			};
			
			// 음성 인식 오류
			this.recognition.onerror = (event) => {
				console.error('[Chat] ❌ 음성 인식 오류:', event.error);
				this.isListening = false;
				this.updateVoiceButton('error');
				
				// 오류 메시지 표시
				let errorMessage = '음성 인식 중 오류가 발생했습니다.';
				if (event.error === 'no-speech') {
					errorMessage = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
				} else if (event.error === 'network') {
					errorMessage = '네트워크 오류입니다. 연결을 확인해주세요.';
				}
				
				this.displaySystemMessage(errorMessage);
			};
			
			console.log('[Chat] ✅ 음성 인식 초기화 완료');
			return true;
			
		} catch (error) {
			console.error('[Chat] ❌ 음성 인식 초기화 실패:', error);
			return false;
		}
	},

	/**
	 * 음성 인식 시작/중지 토글
	 */
	toggleVoiceRecognition() {
		console.log('[Chat] 🎤 음성 인식 토글, 현재 상태:', this.isListening);
		
		if (!this.recognition) {
			console.error('[Chat] ❌ 음성 인식이 초기화되지 않음');
			return;
		}
		
		if (this.isListening) {
			// 음성 인식 중지
			console.log('[Chat] ⏹️ 음성 인식 중지');
			this.recognition.stop();
		} else {
			// 음성 인식 시작
			console.log('[Chat] ▶️ 음성 인식 시작');
			try {
				this.recognition.start();
			} catch (error) {
				console.error('[Chat] ❌ 음성 인식 시작 실패:', error);
				this.displaySystemMessage('음성 인식을 시작할 수 없습니다.');
			}
		}
	},

	/**
	 * === 사용자 메시지 처리 플로우 ===
	 */

	/**
	 * 사용자 메시지 처리 (음성 또는 텍스트)
	 * 
	 * 플로우:
	 * 1. 사용자 메시지 UI에 표시
	 * 2. API로 메시지 전송
	 * 3. AI 응답 받기
	 * 4. AI 응답 UI에 표시
	 */
	async handleUserMessage(message) {
		console.log('[Chat] 💬 사용자 메시지 처리 시작');
		console.log('[Chat] 📝 메시지 내용:', message);
		
		if (!message || message.trim() === '') {
			console.warn('[Chat] ⚠️ 빈 메시지 무시');
			return;
		}
		
		// 1단계: 사용자 메시지 UI에 표시
		console.log('[Chat] 🖼️ 사용자 메시지 UI 표시');
		this.addUserMessage(message);
		
		// 2단계: 강아지 표정 변경 (생각 중)
		this.changeExpression('thinking');
		
		try {
			// 3단계: API로 메시지 전송 및 응답 받기 (재시도 포함)
			console.log('[Chat] 📡 API로 메시지 전송');
			const aiResponse = await this.sendMessageToAPI(message);
			
			// 4단계: AI 응답 UI에 표시
			console.log('[Chat] 🤖 AI 응답 표시:', aiResponse.questionText);
			this.displayDogQuestion(aiResponse.questionText);
			
			// 5단계: 강아지 표정 복원
			this.changeExpression('happy');
			
			console.log('[Chat] ✅ 사용자 메시지 처리 완료');
			
		} catch (error) {
			console.error('[Chat] ❌ 사용자 메시지 처리 최종 실패:', error);
			
			// 재시도 로직에서 이미 에러 처리가 되었으므로
			// 여기서는 추가 처리 없이 표정만 변경
			this.changeExpression('sad');
		}
	},
			this.displayDogQuestion("죄송합니다. 응답을 생성하는 중 문제가 발생했습니다. 다시 말씀해주시겠어요?");
			this.changeExpression('sad');
			
		}
	},

	/**
	 * === UI 관련 메서드들 ===
	 */

	/**
	 * DOM 생성
	 */
	getDom() {
		console.log('[Chat] 🎨 DOM 생성 시작');
		
		const wrapper = document.createElement("div");
		wrapper.className = "chat-wrapper";
		wrapper.id = "chatWrapper";
		
		// 메인 컨테이너
		const container = document.createElement("div");
		container.className = "chat-container";
		
		// 강아지 애니메이션 영역
		const dogSection = document.createElement("div");
		dogSection.className = "dog-section";
		
		const dogContainer = document.createElement("div");
		dogContainer.className = "dog-container";
		dogContainer.id = "dogAnimation";
		
		const dogFallback = document.createElement("div");
		dogFallback.className = "dog-fallback";
		dogFallback.textContent = "🐕";
		dogContainer.appendChild(dogFallback);
		
		dogSection.appendChild(dogContainer);
		
		// 채팅 영역
		const chatSection = document.createElement("div");
		chatSection.className = "chat-section";
		
		// 채팅 메시지 컨테이너
		const messagesContainer = document.createElement("div");
		messagesContainer.className = "messages-container";
		messagesContainer.id = "messagesContainer";
		
		// 환영 메시지
		const welcomeMessage = document.createElement("div");
		welcomeMessage.className = "welcome-message";
		welcomeMessage.innerHTML = `
			<div class="welcome-icon">🎙️</div>
			<div class="welcome-text">인터뷰를 준비하고 있습니다...</div>
		`;
		messagesContainer.appendChild(welcomeMessage);
		
		chatSection.appendChild(messagesContainer);
		
		// 컨트롤 영역
		const controlsSection = document.createElement("div");
		controlsSection.className = "controls-section";
		
		// 음성 버튼
		const voiceButton = document.createElement("button");
		voiceButton.className = "voice-button";
		voiceButton.id = "voiceButton";
		voiceButton.innerHTML = `
			<span class="voice-icon">🎤</span>
			<span class="voice-text">말하기</span>
		`;
		
		// 연결 상태 표시
		const statusDisplay = document.createElement("div");
		statusDisplay.className = "status-display";
		statusDisplay.id = "statusDisplay";
		statusDisplay.textContent = "연결 중...";
		
		controlsSection.appendChild(voiceButton);
		controlsSection.appendChild(statusDisplay);
		
		// 컨테이너에 모든 섹션 추가
		container.appendChild(dogSection);
		container.appendChild(chatSection);
		container.appendChild(controlsSection);
		
		wrapper.appendChild(container);
		
		// 이벤트 리스너 설정
		setTimeout(() => {
			this.setupEventListeners();
		}, 100);
		
		console.log('[Chat] ✅ DOM 생성 완료');
		return wrapper;
	},

	/**
	 * Chat 모듈 강제 활성화
	 */
	forceActivate() {
		console.log('[Chat] 💪 Chat 모듈 강제 활성화');
		
		const chatWrapper = document.getElementById('chatWrapper') || document.querySelector('.chat-wrapper');
		if (chatWrapper) {
			chatWrapper.classList.add('active');
			chatWrapper.style.cssText = `
				position: fixed !important;
				top: 0 !important;
				left: 0 !important;
				width: 100vw !important;
				height: 100vh !important;
				display: flex !important;
				visibility: visible !important;
				opacity: 1 !important;
				z-index: 2000 !important;
			`;
			console.log('[Chat] ✅ Chat 모듈 강제 활성화 완료');
		} else {
			console.error('[Chat] ❌ Chat wrapper를 찾을 수 없음');
		}
	},

	/**
	 * 이벤트 리스너 설정
	 */
	setupEventListeners() {
		console.log('[Chat] 🔗 이벤트 리스너 설정');
		
		const voiceButton = document.getElementById('voiceButton');
		if (voiceButton) {
			voiceButton.addEventListener('click', () => {
				this.toggleVoiceRecognition();
			});
			console.log('[Chat] ✅ 음성 버튼 이벤트 리스너 설정 완료');
		}
	},

	/**
	 * 이전 대화 히스토리 UI에 표시
	 */
	displayConversationHistory() {
		console.log('[Chat] 📚 대화 히스토리 표시');
		console.log('[Chat] 📊 히스토리 개수:', this.conversationHistory.length);
		
		const messagesContainer = document.getElementById('messagesContainer');
		if (!messagesContainer) {
			console.error('[Chat] ❌ 메시지 컨테이너를 찾을 수 없음');
			return;
		}
		
		// 환영 메시지 제거
		const welcomeMessage = messagesContainer.querySelector('.welcome-message');
		if (welcomeMessage) {
			welcomeMessage.remove();
		}
		
		// 히스토리 메시지들 추가
		this.conversationHistory.forEach((message, index) => {
			console.log(`[Chat] 📝 히스토리 메시지 ${index + 1}:`, message);
			
			if (message.type === 'user' || message.sender === 'user') {
				this.addUserMessage(message.content || message.text, false);
			} else if (message.type === 'assistant' || message.sender === 'assistant') {
				this.addAssistantMessage(message.content || message.text, false);
			}
		});
		
		console.log('[Chat] ✅ 대화 히스토리 표시 완료');
	},

	/**
	 * 사용자 메시지 UI에 추가
	 */
	addUserMessage(message, scroll = true) {
		console.log('[Chat] 👤 사용자 메시지 추가:', message);
		
		const messagesContainer = document.getElementById('messagesContainer');
		if (!messagesContainer) return;
		
		const messageDiv = document.createElement('div');
		messageDiv.className = 'message user-message';
		messageDiv.innerHTML = `
			<div class="message-content">
				<div class="message-text">${message}</div>
				<div class="message-time">${new Date().toLocaleTimeString()}</div>
			</div>
			<div class="message-avatar">👤</div>
		`;
		
		messagesContainer.appendChild(messageDiv);
		
		if (scroll) {
			this.scrollToBottom();
		}
	},

	/**
	 * AI 응답 메시지 UI에 추가
	 */
	addAssistantMessage(message, scroll = true) {
		console.log('[Chat] 🤖 AI 메시지 추가:', message);
		
		const messagesContainer = document.getElementById('messagesContainer');
		if (!messagesContainer) return;
		
		const messageDiv = document.createElement('div');
		messageDiv.className = 'message assistant-message';
		messageDiv.innerHTML = `
			<div class="message-avatar">🐕</div>
			<div class="message-content">
				<div class="message-text">${message}</div>
				<div class="message-time">${new Date().toLocaleTimeString()}</div>
			</div>
		`;
		
		messagesContainer.appendChild(messageDiv);
		
		if (scroll) {
			this.scrollToBottom();
		}
	},

	/**
	 * 강아지 질문 표시 (AI 응답과 동일)
	 */
	displayDogQuestion(question) {
		console.log('[Chat] 🐕 강아지 질문 표시:', question);
		this.addAssistantMessage(question);
	},

	/**
	 * 시스템 메시지 표시
	 */
	displaySystemMessage(message) {
		console.log('[Chat] ⚙️ 시스템 메시지 표시:', message);
		
		const messagesContainer = document.getElementById('messagesContainer');
		if (!messagesContainer) return;
		
		const messageDiv = document.createElement('div');
		messageDiv.className = 'message system-message';
		messageDiv.innerHTML = `
			<div class="system-content">
				<div class="system-icon">ℹ️</div>
				<div class="system-text">${message}</div>
			</div>
		`;
		
		messagesContainer.appendChild(messageDiv);
		this.scrollToBottom();
	},

	/**
	 * 채팅 영역 스크롤을 맨 아래로
	 */
	scrollToBottom() {
		const messagesContainer = document.getElementById('messagesContainer');
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	},

	/**
	 * 음성 버튼 상태 업데이트
	 */
	updateVoiceButton(state) {
		const voiceButton = document.getElementById('voiceButton');
		if (!voiceButton) return;
		
		const icon = voiceButton.querySelector('.voice-icon');
		const text = voiceButton.querySelector('.voice-text');
		
		switch (state) {
			case 'listening':
				icon.textContent = '🔴';
				text.textContent = '듣는 중...';
				voiceButton.className = 'voice-button listening';
				break;
			case 'ready':
				icon.textContent = '🎤';
				text.textContent = '말하기';
				voiceButton.className = 'voice-button';
				break;
			case 'error':
				icon.textContent = '❌';
				text.textContent = '오류';
				voiceButton.className = 'voice-button error';
				break;
		}
	},

	/**
	 * 연결 상태 업데이트
	 */
	updateConnectionStatus(status) {
		console.log('[Chat] 📊 연결 상태 업데이트:', status);
		
		const statusDisplay = document.getElementById('statusDisplay');
		if (statusDisplay) {
			statusDisplay.textContent = status;
		}
	},

	/**
	 * 강아지 표정 변경
	 */
	changeExpression(expression) {
		console.log('[Chat] 😊 강아지 표정 변경:', expression);
		this.currentExpression = expression;
		
		// Lottie 애니메이션이 있으면 변경
		if (this.lottieAnimation) {
			// 표정에 따른 애니메이션 변경 로직
			// 실제 구현은 사용 가능한 애니메이션에 따라 달라집니다
		}
	},

	/**
	 * Lottie 라이브러리 로드
	 */
	loadLottieLibrary() {
		console.log('[Chat] 🎭 Lottie 라이브러리 로드 시도');
		
		if (typeof lottie !== 'undefined') {
			console.log('[Chat] ✅ Lottie 이미 로드됨');
			return;
		}
		
		// Lottie 라이브러리 로드 로직
		// 실제 애니메이션 파일 경로에 맞게 수정 필요
	}
});
