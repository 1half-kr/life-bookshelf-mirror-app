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
		console.log("[Chat] 🚀 Chat 모듈 시작 - 자연스러운 인터뷰 플로우");

		// 전역 에러 핸들러 추가
		window.addEventListener("error", (event) => {
			if (event.filename && event.filename.includes("chat")) {
				console.error("[Chat] 전역 에러 감지:", event.error);
				event.preventDefault();
			}
		});

		// === 상태 변수 초기화 ===
		this.userId = null; // 사용자 ID
		this.currentChapter = null; // 현재 챕터 정보
		this.previousChapterId = null; // 이전 챕터 ID (변경 감지용)
		this.conversationHistory = []; // 대화 히스토리
		this.isFirstTimeInChapter = false; // 챕터 첫 접근 여부

		// === WebSocket 관련 ===
		this.ws = null; // WebSocket 연결
		this.isConnected = false; // 연결 상태

		// === 음성 인식 관련 (node_helper 기반) ===
		this.isListening = false; // 음성 인식 중 여부

		// === UI 관련 ===
		this.lottieAnimation = null; // 강아지 애니메이션
		this.currentExpression = "happy"; // 현재 강아지 표정

		// Lottie 라이브러리 로드
		try {
			this.loadLottieLibrary();
		} catch (error) {
			console.error("[Chat] Lottie 라이브러리 로드 실패:", error);
		}

		// 시작 시 숨김
		this.hide();
		
		// 디버깅용 전역 함수 등록
		window.debugChat = () => {
			console.log("=== Chat Module Debug ===");
			const chatModule = document.querySelector('.module.chat');
			console.log("Chat 모듈 존재:", !!chatModule);
			if (chatModule) {
				console.log("클래스:", chatModule.className);
				console.log("인라인 스타일:", chatModule.style.cssText);
				console.log("Computed 스타일:", {
					display: getComputedStyle(chatModule).display,
					opacity: getComputedStyle(chatModule).opacity,
					visibility: getComputedStyle(chatModule).visibility,
					zIndex: getComputedStyle(chatModule).zIndex
				});
			}
		};
		
		window.forceShowChat = () => {
			console.log("=== 강제로 Chat 표시 ===");
			const chatModule = document.querySelector('.module.chat');
			if (chatModule) {
				chatModule.classList.add('visible');
				chatModule.style.cssText = `
					display: block !important;
					opacity: 1 !important;
					visibility: visible !important;
					z-index: 9999 !important;
					position: fixed !important;
					top: 0 !important;
					left: 0 !important;
					width: 100vw !important;
					height: 100vh !important;
					background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #90CAF9 70%, #64B5F6 100%) !important;
				`;
				console.log("Chat 모듈 강제 표시 완료");
			} else {
				console.log("Chat 모듈을 찾을 수 없음");
			}
		};
		
		console.log("[Chat] ✅ Chat 모듈 초기화 완료");
		console.log("[Chat] 💡 디버깅 함수: debugChat(), forceShowChat()");
	},

	/**
	 * 알림 수신 처리
	 */
	notificationReceived(notification, payload) {
		console.log("[Chat] 📨 알림 수신:", notification, "payload:", payload);

		if (notification === "START_INTERVIEW") {
        	console.log("[Chat] Start interview - showing chat module");

        	// 1. MagicMirror의 show 메서드 호출
        	this.show(0);

        	// 2. 모듈 강제 표시 - 여러 방법 시도
        	setTimeout(() => {
        		const moduleElement = document.querySelector(".module.chat");
        		if (moduleElement) {
            		console.log("[Chat] Found chat module element, applying all display methods");
            		
            		// 방법 1: 클래스 추가
            		moduleElement.classList.add("visible");
            		
            		// 방법 2: 인라인 스타일 강제 적용
            		moduleElement.style.cssText = `
            			display: block !important;
            			opacity: 1 !important;
            			visibility: visible !important;
            			z-index: 9999 !important;
            			position: fixed !important;
            			top: 0 !important;
            			left: 0 !important;
            			width: 100vw !important;
            			height: 100vh !important;
            			background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #90CAF9 70%, #64B5F6 100%) !important;
            		`;
            		
            		// 방법 3: 다른 모듈들 숨기기
            		const otherModules = document.querySelectorAll('.module:not(.chat)');
            		otherModules.forEach(module => {
            			module.style.display = 'none';
            		});
            		
            		console.log("[Chat] All display methods applied");
        		} else {
            		console.error("[Chat] Chat module element not found!");
            		
            		// DOM에서 직접 찾아보기
            		const allModules = document.querySelectorAll('.module');
            		console.log("[Chat] All modules found:", Array.from(allModules).map(m => m.className));
        		}
        	}, 100);

        	// 3. 인터뷰 초기화 시작
        	setTimeout(() => {
            	console.log("[Chat] Starting interview initialization");
            	this.initializeInterview();
        	}, 1000);
    	}

		if (notification === "AAA") {
			// 현재 페이지가 chat 일 때에만 실행하기
			this.isListening = true;
			this.sendSocketNotification("LOAD_TOKEN");
			this.sendSocketNotification("RUN_PYTHON");
		}
		/**
		 *
		 * [IOT] 여기서 음성 인식 결과를 가져옵니다 !!
		 * 
		*/
		if (notification === "VOICE_RESULT") {
			const userInput = payload;
			console.log("[Chat] 🗣️ 음성 인식 결과 수신:", userInput);
			
			// 마이크 상태를 준비 상태로 변경
			this.updateVoiceButton("ready");
			this.isListening = false;
			
			// 받아온 텍스트를 메시지 처리 플로우에 반영
			this.handleUserMessage(userInput);
		}

		/**
		 * [IOT] 음성 인식 오류 처리
		 */
		if (notification === "VOICE_ERROR") {
			const errorInfo = payload;
			console.log("[Chat] ❌ 음성 인식 오류 수신:", errorInfo);
			
			this.isListening = false;
			this.updateVoiceButton("error");
			this.setDogState("default");
			this.changeExpression("sad");
			
			// 오류 메시지 표시
			let errorMessage = "음성 인식 중 오류가 발생했어요.";
			if (errorInfo && errorInfo.type) {
				switch (errorInfo.type) {
					case "no-speech":
						errorMessage = "음성이 감지되지 않았어요. 다시 시도해주세요.";
						break;
					case "network":
						errorMessage = "네트워크 오류예요. 연결을 확인해주세요.";
						break;
					case "timeout":
						errorMessage = "시간이 초과되었어요. 다시 시도해주세요.";
						break;
				}
			}
			
			this.updateStatusMessage(errorMessage, false);
			this.displaySystemMessage(errorMessage);
		}

		/**
		 * [IOT] 음성 인식 시작 확인
		 */
		if (notification === "VOICE_STARTED") {
			console.log("[Chat] 🎤 음성 인식 시작 확인");
			this.isListening = true;
			this.updateVoiceButton("listening");
			this.setDogState("listening");
			this.updateStatusMessage("말씀해주세요...", false);
		}

		/**
		 * [IOT] 음성 인식 종료 확인
		 */
		if (notification === "VOICE_STOPPED") {
			console.log("[Chat] 🎤 음성 인식 종료 확인");
			this.isListening = false;
			this.updateVoiceButton("ready");
			this.updateStatusMessage("인터뷰 진행 중", false);
		}
		
		if (notification === "USER_REGISTERED") {
			// 사용자 등록 완료 시 사용자 ID 저장
			this.userId = payload.userId;
			console.log("[Chat] 👤 사용자 ID 설정:", this.userId);
		} else if (notification === "PAGE_CHANGED") {
			if (payload === 3) {
				// Chat 페이지로 전환 시
				console.log("[Chat] 🎯 Chat 페이지 활성화");
				this.show(1000);

				// 인터뷰 초기화 시작
				setTimeout(() => {
					this.initializeInterview();
				}, 1000);
			} else {
				// 다른 페이지로 전환 시
				console.log("[Chat] 🚪 Chat 페이지 비활성화, 페이지:", payload);
				this.hide(500);
				this.disconnectWebSocket();
			}
		}
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
		console.log("[Chat] 🎬 인터뷰 초기화 시작");

		// 1단계: 사용자 ID 확인
		if (!this.userId) {
			console.error("[Chat] ❌ 사용자 ID가 없습니다");
			this.updateConnectionStatus("사용자 ID 필요 ❌");
			return;
		}

		try {
			// 2단계: WebSocket 연결
			console.log("[Chat] 🔌 WebSocket 연결 시작");
			this.initializeWebSocket();

			// 3단계: 현재 진행 중인 챕터 조회
			console.log("[Chat] 📖 현재 챕터 조회 중...");
			const currentChapter = await this.getCurrentChapter();

			if (!currentChapter) {
				throw new Error("현재 챕터 정보를 가져올 수 없습니다");
			}

			this.currentChapter = currentChapter;
			console.log("[Chat] ✅ 현재 챕터:", this.currentChapter);

			// 4단계: 이전 대화 데이터 로드
			console.log("[Chat] 💬 이전 대화 데이터 로드 중...");
			await this.loadConversationHistory();

			// 5단계: 자연스러운 인사 및 인터뷰 시작
			console.log("[Chat] 👋 자연스러운 인사 시작");
			await this.startNaturalGreeting();

			console.log("[Chat] 🎉 인터뷰 초기화 완료");
			this.updateConnectionStatus("인터뷰 준비 완료 ✅");
		} catch (error) {
			console.error("[Chat] ❌ 인터뷰 초기화 실패:", error);
			this.updateConnectionStatus("인터뷰 준비 실패 ❌");
		}
	},

	/**
	 * === API 통신 메서드들 ===
	 */

	/**
	 * 현재 진행 중인 챕터 조회
	 * GET /user/current-chapter?userId={userId}
	 */
	async getCurrentChapter() {
		console.log("[Chat] 📡 현재 챕터 조회 API 호출");

		try {
			const url = `${this.config.apiBaseUrl}/user/current-chapter?userId=${this.userId}`;
			console.log("[Chat] 🌐 요청 URL:", url);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Accept: "application/json"
				}
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			console.log("[Chat] ✅ 챕터 조회 성공:", data);

			return {
				chapterId: data.chapter_id || data.chapterId,
				chapterNumber: data.chapter_number || data.chapterNumber,
				chapterTitle: data.chapter_title || data.chapterTitle,
				status: data.status || "new"
			};
		} catch (error) {
			console.error("[Chat] ❌ 챕터 조회 실패:", error);
			throw error;
		}
	},

	/**
	 * 이전 대화 데이터 로드
	 * GET /conversation/{chapter_id}/history?userId={userId}
	 */
	async loadConversationHistory() {
		console.log("[Chat] 📚 대화 히스토리 로드 시작");

		try {
			const url = `${this.config.apiBaseUrl}/conversation/${this.currentChapter.chapterId}/history?userId=${this.userId}`;
			console.log("[Chat] 🌐 히스토리 요청 URL:", url);

			const response = await fetch(url, {
				method: "GET",
				headers: {
					Accept: "application/json"
				}
			});

			if (!response.ok) {
				if (response.status === 404) {
					// 히스토리가 없는 경우 (첫 시작)
					console.log("[Chat] 📝 새로운 챕터 - 히스토리 없음");
					this.conversationHistory = [];
					this.isFirstTimeInChapter = true;
					return;
				}
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			console.log("[Chat] ✅ 히스토리 로드 성공:", data);

			// 새로운 API 응답 구조에 맞게 데이터 파싱
			if (data.messages && Array.isArray(data.messages)) {
				this.conversationHistory = data.messages;
				console.log("[Chat] 📊 로드된 메시지 수:", this.conversationHistory.length);
				
				// 통계 정보도 저장 (필요시 사용)
				if (data.statistics) {
					console.log("[Chat] 📈 대화 통계:", data.statistics);
				}
				
				// 챕터 정보도 저장 (필요시 사용)
				if (data.chapter) {
					console.log("[Chat] 📖 챕터 정보:", data.chapter);
				}
			} else {
				// 이전 형식 호환성 유지
				this.conversationHistory = data.messages || data || [];
			}

			this.isFirstTimeInChapter = this.conversationHistory.length === 0;

			// UI에 이전 대화 표시
			this.displayConversationHistory();
		} catch (error) {
			console.error("[Chat] ❌ 히스토리 로드 실패:", error);
			// 실패해도 계속 진행 (새 챕터로 간주)
			this.conversationHistory = [];
			this.isFirstTimeInChapter = true;
		}
	},

	/**
	 * 챕터 시작 API 호출
	 * POST /chapters/{chapter_number}/start
	 *
	 * 조건:
	 * - 첫 접근 시
	 * - WebSocket으로 챕터 변경이 감지된 경우
	 */
	async startChapter(chapterInfo) {
		console.log("[Chat] 🎬 챕터 시작 API 호출:", chapterInfo);

		try {
			const url = `${this.config.apiBaseUrl}/chapters/${chapterInfo.chapterNumber}/start`;
			console.log("[Chat] 🌐 챕터 시작 URL:", url);

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					user_id: this.userId
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			console.log("[Chat] ✅ 챕터 시작 성공:", data);

			return data;
		} catch (error) {
			console.error("[Chat] ❌ 챕터 시작 실패:", error);
			throw error;
		}
	},

	/**
	 * 대화 메시지 전송 및 응답 받기
	 * POST /conversation/{chapter_id}
	 *
	 * Request: { user_id, message }
	 * Response: { next_question: { id, text } }
	 */
	async sendMessageToAPI(message) {
		console.log("[Chat] 💌 메시지 전송 API 호출");
		console.log("[Chat] 📝 전송할 메시지:", message);

		try {
			const url = `${this.config.apiBaseUrl}/conversation/${this.currentChapter.chapterId}`;
			console.log("[Chat] 🌐 메시지 전송 URL:", url);

			const requestBody = {
				user_id: this.userId,
				message: message
			};
			console.log("[Chat] 📦 요청 데이터:", requestBody);

			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const data = await response.json();
			console.log("[Chat] ✅ 메시지 전송 성공");
			console.log("[Chat] 🤖 AI 응답:", data);

			// 응답 구조 검증
			if (data.next_question && data.next_question.text) {
				return {
					questionId: data.next_question.id,
					questionText: data.next_question.text
				};
			} else {
				throw new Error("응답 형식이 올바르지 않습니다");
			}
		} catch (error) {
			console.error("[Chat] ❌ 메시지 전송 실패:", error);
			throw error;
		}
	},

	/**
	 * === 자연스러운 인사 처리 ===
	 */

	/**
	 * 챕터 상태에 따른 자연스러운 인사
	 */
	async startNaturalGreeting() {
		console.log("[Chat] 👋 자연스러운 인사 시작");
		console.log("[Chat] 🔍 첫 접근 여부:", this.isFirstTimeInChapter);
		console.log("[Chat] 📊 대화 히스토리 길이:", this.conversationHistory.length);

		if (this.isFirstTimeInChapter) {
			// 첫 시작인 경우: 자기소개 + 이름 묻기
			console.log("[Chat] 🆕 첫 시작 - 자기소개 및 이름 질문");

			// 챕터 시작 API 호출 (첫 접근이므로)
			try {
				await this.startChapter(this.currentChapter);
			} catch (error) {
				console.warn("[Chat] ⚠️ 챕터 시작 API 실패, 계속 진행:", error.message);
			}

			// 자기소개 메시지
			const greetingMessage = "안녕하세요! 저는 여러분의 이야기를 듣고 기록하는 AI 강아지입니다. 🐕✨\n\n먼저 성함을 알려주시겠어요?";
			this.displayDogQuestion(greetingMessage);
		} else {
			// 진행 중인 경우: 반가운 인사 + 대기
			console.log("[Chat] 🔄 진행 중 - 반가운 인사");

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
		console.log("[Chat] 🔌 WebSocket 연결 초기화");

		try {
			const wsUrl = `${this.config.wsUrl}?userId=${this.userId}`;
			console.log("[Chat] 🌐 WebSocket URL:", wsUrl);

			this.ws = new WebSocket(wsUrl);

			// 연결 성공
			this.ws.onopen = () => {
				console.log("[Chat] ✅ WebSocket 연결 성공");
				this.isConnected = true;
				this.updateConnectionStatus("실시간 연결됨 ✅");
			};

			// 메시지 수신
			this.ws.onmessage = (event) => {
				console.log("[Chat] 📨 WebSocket 메시지 수신:", event.data);
				try {
					const data = JSON.parse(event.data);
					this.handleWebSocketMessage(data);
				} catch (error) {
					console.error("[Chat] ❌ WebSocket 메시지 파싱 실패:", error);
				}
			};

			// 연결 종료
			this.ws.onclose = (event) => {
				console.log("[Chat] 🚪 WebSocket 연결 종료:", event.code, event.reason);
				this.isConnected = false;

				if (event.code === 1006) {
					this.updateConnectionStatus("서버 오프라인 ⚠️");
				} else {
					this.updateConnectionStatus("연결 끊김 ❌");
				}
			};

			// 연결 오류
			this.ws.onerror = (error) => {
				console.error("[Chat] ❌ WebSocket 오류:", error);
				this.isConnected = false;
				this.updateConnectionStatus("실시간 연결 실패 ⚠️");
			};

			// 연결 타임아웃 (5초)
			setTimeout(() => {
				if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
					console.warn("[Chat] ⏰ WebSocket 연결 타임아웃");
					this.ws.close();
					this.updateConnectionStatus("연결 시간 초과 ⏰");
				}
			}, 5000);
		} catch (error) {
			console.error("[Chat] ❌ WebSocket 생성 실패:", error);
			this.updateConnectionStatus("WebSocket 생성 실패 ❌");
		}
	},

	/**
	 * WebSocket 메시지 처리
	 *
	 * 주요 기능: 챕터 변경 감지
	 */
	handleWebSocketMessage(data) {
		console.log("[Chat] 🔍 WebSocket 메시지 처리:", data);

		// 챕터 변경 감지
		if (data.type === "chapter_changed" && data.chapter_id) {
			console.log("[Chat] 📖 챕터 변경 감지");
			console.log("[Chat] 🔄 이전 챕터:", this.previousChapterId);
			console.log("[Chat] 🆕 새 챕터:", data.chapter_id);

			// 챕터가 실제로 변경된 경우에만 처리
			if (this.previousChapterId !== data.chapter_id) {
				this.handleChapterChange(data);
			}
		}

		// 기타 WebSocket 메시지 처리
		if (data.type === "ai_response" && data.message) {
			console.log("[Chat] 🤖 AI 응답 수신:", data.message);
			this.displayDogQuestion(data.message);
		}
	},

	/**
	 * 챕터 변경 처리
	 *
	 * WebSocket으로 챕터 변경이 감지된 경우에만 /chapters/{chapter_number}/start 호출
	 */
	async handleChapterChange(chapterData) {
		console.log("[Chat] 🔄 챕터 변경 처리 시작:", chapterData);

		try {
			// 새 챕터 정보 업데이트
			this.currentChapter = {
				chapterId: chapterData.chapter_id,
				chapterNumber: chapterData.chapter_number,
				chapterTitle: chapterData.chapter_title || `챕터 ${chapterData.chapter_number}`,
				status: "new"
			};

			console.log("[Chat] 📖 새 챕터 정보:", this.currentChapter);

			// 챕터 시작 API 호출 (WebSocket으로 변경 감지된 경우)
			await this.startChapter(this.currentChapter);

			// 새 챕터 시작 메시지
			const chapterStartMessage = `새로운 주제로 넘어가볼까요! 📖\n\n${this.currentChapter.chapterTitle}에 대해 이야기해보겠습니다.`;
			this.displayDogQuestion(chapterStartMessage);

			// 이전 챕터 ID 업데이트
			this.previousChapterId = this.currentChapter.chapterId;
		} catch (error) {
			console.error("[Chat] ❌ 챕터 변경 처리 실패:", error);
			this.displayDogQuestion("새로운 주제로 넘어가는 중 문제가 발생했습니다. 계속 대화해주세요.");
		}
	},

	/**
	 * WebSocket 연결 해제
	 */
	disconnectWebSocket() {
		console.log("[Chat] 🔌 WebSocket 연결 해제");

		if (this.ws) {
			this.ws.close();
			this.ws = null;
			this.isConnected = false;
			console.log("[Chat] ✅ WebSocket 연결 해제 완료");
		}
	},

	/**
	 * === 음성 입력 처리 ===
	 */

	/**
	 * 음성 인식 초기화 (node_helper 기반)
	 */
	initializeVoiceRecognition() {
		console.log("[Chat] 🎤 음성 인식 초기화 (node_helper 기반)");
		
		// node_helper 기반이므로 별도 초기화 불필요
		// 단지 상태 변수만 초기화
		this.isListening = false;
		
		console.log("[Chat] ✅ 음성 인식 초기화 완료 (node_helper 연동)");
		return true;
	},

	/**
	 * 음성 인식 시작/중지 토글 (node_helper 기반)
	 */
	toggleVoiceRecognition() {
		console.log("[Chat] 🎤 음성 인식 토글, 현재 상태:", this.isListening);

		if (this.isListening) {
			// 음성 인식 중지
			console.log("[Chat] ⏹️ 음성 인식 중지 요청");
			this.sendNotification("STOP_VOICE_RECOGNITION");
			this.isListening = false;
			this.updateVoiceButton("ready");
			this.setDogState("default");
			this.updateStatusMessage("인터뷰 진행 중", false);
		} else {
			// 음성 인식 시작
			console.log("[Chat] ▶️ 음성 인식 시작 요청");
			this.sendNotification("START_VOICE_RECOGNITION");
			this.isListening = true;
			this.updateVoiceButton("listening");
			this.setDogState("listening");
			this.updateStatusMessage("말씀해주세요...", false);
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
	 * 2. 강아지를 듣기 상태로 변경
	 * 3. 입력 중 표시 ("...")
	 * 4. API로 메시지 전송
	 * 5. AI 응답 받기
	 * 6. 강아지를 말하기 상태로 변경
	 * 7. AI 응답 UI에 표시
	 */
	async handleUserMessage(message) {
		console.log("[Chat] 💬 사용자 메시지 처리 시작");
		console.log("[Chat] 📝 메시지 내용:", message);

		if (!message || message.trim() === "") {
			console.warn("[Chat] ⚠️ 빈 메시지 무시");
			return;
		}

		try {
			// 1단계: 사용자 메시지 UI에 표시
			console.log("[Chat] 🖼️ 사용자 메시지 UI 표시");
			this.addUserMessage(message);

			// 2단계: 강아지를 듣기 상태로 변경
			this.setDogState("listening");
			this.updateStatusMessage("말씀을 듣고 있어요...", false);

			// 3단계: 입력 중 표시 ("...")
			setTimeout(() => {
				this.showTypingIndicator();
				this.updateStatusMessage("답변을 기다리고 있어요...", true);
			}, 1000);

			// 4단계: API로 메시지 전송 및 응답 받기
			console.log("[Chat] 📡 API로 메시지 전송");
			const aiResponse = await this.sendMessageToAPI(message);

			// 5단계: 입력 중 표시 제거
			this.hideTypingIndicator();

			// 6단계: 강아지를 말하기 상태로 변경
			this.setDogState("speaking");
			this.updateStatusMessage("답변 드리고 있어요...", false);

			// 7단계: AI 응답 UI에 표시 (약간의 지연으로 자연스럽게)
			setTimeout(() => {
				console.log("[Chat] 🤖 AI 응답 표시:", aiResponse.questionText);
				this.displayDogQuestion(aiResponse.questionText);
				
				// 응답 완료 후 기본 상태로
				setTimeout(() => {
					this.setDogState("default");
					this.updateStatusMessage("인터뷰 진행 중", false);
				}, 2000);
			}, 800);

			console.log("[Chat] ✅ 사용자 메시지 처리 완료");
		} catch (error) {
			console.error("[Chat] ❌ 사용자 메시지 처리 실패:", error);

			// 오류 시 처리
			this.hideTypingIndicator();
			this.addUserMessage(message); // 사용자 메시지는 표시
			this.setDogState("default");
			this.changeExpression("sad");
			this.updateStatusMessage("죄송해요, 다시 말씀해주세요", false);
			
			this.displayDogQuestion("죄송합니다. 잠시 문제가 있었어요. 다시 말씀해주시겠어요?");
		}
	},

	/**
	 * === UI 관련 메서드들 ===
	 */

	/**
	 * DOM 생성
	 */
	getDom() {
		console.log("[Chat] 🎨 DOM 생성 시작");

		const wrapper = document.createElement("div");
		wrapper.className = "chat-wrapper";

		// 메인 컨테이너 (좌우 배치)
		const mainContainer = document.createElement("div");
		mainContainer.className = "main-container";

		// 좌측: 채팅(인터뷰) 현황 영역
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

		// 우측: 강아지 말하는 애니메이션 영역
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

		// 메인 컨테이너에 좌우 영역 추가
		mainContainer.appendChild(chatSection);
		mainContainer.appendChild(dogSection);

		// 중앙 하단: 마이크 on/off (배경들과 겹치게)
		const microphoneSection = document.createElement("div");
		microphoneSection.className = "microphone-section";

		// 마이크 버튼
		const voiceButton = document.createElement("button");
		voiceButton.className = "voice-button";
		voiceButton.id = "voiceButton";
		voiceButton.innerHTML = `
			<span class="voice-icon">🎤</span>
		`;

		// 연결 상태 표시 (마이크 버튼 아래)
		const statusDisplay = document.createElement("div");
		statusDisplay.className = "status-display";
		statusDisplay.id = "statusDisplay";
		statusDisplay.textContent = "연결 중...";

		microphoneSection.appendChild(voiceButton);
		microphoneSection.appendChild(statusDisplay);

		// wrapper에 모든 섹션 추가
		wrapper.appendChild(mainContainer);
		wrapper.appendChild(microphoneSection);

		// 이벤트 리스너 설정
		setTimeout(() => {
			this.setupEventListeners();
			// 강아지 애니메이션 초기화 (Lottie가 로드된 후)
			if (typeof lottie !== "undefined") {
				this.initializeDogAnimation();
			}
		}, 100);

		console.log("[Chat] ✅ DOM 생성 완료");
		return wrapper;
	},

	/**
	 * 이벤트 리스너 설정
	 */
	setupEventListeners() {
		console.log("[Chat] 🔗 이벤트 리스너 설정");

		const voiceButton = document.getElementById("voiceButton");
		if (voiceButton) {
			voiceButton.addEventListener("click", () => {
				this.toggleVoiceRecognition();
			});
			console.log("[Chat] ✅ 음성 버튼 이벤트 리스너 설정 완료");
		}

		// 음성 인식 초기화
		this.initializeVoiceRecognition();
	},

	/**
	 * 이전 대화 히스토리 UI에 표시
	 */
	displayConversationHistory() {
		console.log("[Chat] 📚 대화 히스토리 표시");
		console.log("[Chat] 📊 히스토리 개수:", this.conversationHistory.length);

		const messagesContainer = document.getElementById("messagesContainer");
		if (!messagesContainer) {
			console.error("[Chat] ❌ 메시지 컨테이너를 찾을 수 없음");
			return;
		}

		// 환영 메시지 제거
		const welcomeMessage = messagesContainer.querySelector(".welcome-message");
		if (welcomeMessage) {
			welcomeMessage.remove();
		}

		// 히스토리 메시지들 추가
		this.conversationHistory.forEach((message, index) => {
			console.log(`[Chat] 📝 히스토리 메시지 ${index + 1}:`, message);

			// API 응답 구조에 맞게 role 필드 확인
			if (message.role === "user" || message.type === "user" || message.sender === "user") {
				const content = message.content || message.text || "";
				console.log(`[Chat] 👤 사용자 메시지 추가: ${content.substring(0, 50)}...`);
				this.addUserMessage(content, false);
			} else if (message.role === "ai" || message.role === "assistant" || message.type === "assistant" || message.sender === "assistant") {
				const content = message.content || message.text || "";
				console.log(`[Chat] 🤖 AI 메시지 추가: ${content.substring(0, 50)}...`);
				this.addAssistantMessage(content, false);
			} else {
				console.warn(`[Chat] ⚠️ 알 수 없는 메시지 타입:`, message);
			}
		});

		console.log("[Chat] ✅ 대화 히스토리 표시 완료");
	},

	/**
	 * 사용자 메시지 UI에 추가
	 */
	addUserMessage(message, scroll = true) {
		console.log("[Chat] 👤 사용자 메시지 추가:", message);

		const messagesContainer = document.getElementById("messagesContainer");
		if (!messagesContainer) return;

		const messageDiv = document.createElement("div");
		messageDiv.className = "message user-message";
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
		console.log("[Chat] 🤖 AI 메시지 추가:", message);

		const messagesContainer = document.getElementById("messagesContainer");
		if (!messagesContainer) return;

		const messageDiv = document.createElement("div");
		messageDiv.className = "message assistant-message";
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
		console.log("[Chat] 🐕 강아지 질문 표시:", question);
		this.addAssistantMessage(question);
	},

	/**
	 * 시스템 메시지 표시
	 */
	displaySystemMessage(message) {
		console.log("[Chat] ⚙️ 시스템 메시지 표시:", message);

		const messagesContainer = document.getElementById("messagesContainer");
		if (!messagesContainer) return;

		const messageDiv = document.createElement("div");
		messageDiv.className = "message system-message";
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
		const messagesContainer = document.getElementById("messagesContainer");
		if (messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	},

	/**
	 * 음성 버튼 상태 업데이트
	 */
	updateVoiceButton(state) {
		const voiceButton = document.getElementById("voiceButton");
		if (!voiceButton) return;

		const icon = voiceButton.querySelector(".voice-icon");

		switch (state) {
			case "listening":
				icon.textContent = "🔴";
				voiceButton.className = "voice-button listening";
				break;
			case "ready":
				icon.textContent = "🎤";
				voiceButton.className = "voice-button";
				break;
			case "error":
				icon.textContent = "❌";
				voiceButton.className = "voice-button error";
				break;
		}
	},

	/**
	 * 연결 상태 업데이트
	 */
	updateConnectionStatus(status) {
		console.log("[Chat] 📊 연결 상태 업데이트:", status);

		const statusDisplay = document.getElementById("statusDisplay");
		if (statusDisplay) {
			statusDisplay.textContent = status;
		}
	},

	/**
	 * 강아지 표정 변경
	 */
	changeExpression(expression) {
		console.log("[Chat] 😊 강아지 표정 변경:", expression);
		this.currentExpression = expression;

		// Lottie 애니메이션이 있으면 변경
		if (this.lottieAnimation) {
			// 표정에 따른 애니메이션 변경 로직
			// 실제 구현은 사용 가능한 애니메이션에 따라 달라집니다
		}
	},

	/**
	 * Lottie 라이브러리 로드 및 강아지 애니메이션 초기화
	 */
	loadLottieLibrary() {
		console.log("[Chat] 🎭 Lottie 라이브러리 로드 시도");

		// Lottie가 이미 로드되어 있는지 확인
		if (typeof lottie !== "undefined") {
			console.log("[Chat] ✅ Lottie 이미 로드됨");
			this.initializeDogAnimation();
			return;
		}

		// Lottie 라이브러리 동적 로드
		const script = document.createElement('script');
		script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
		script.onload = () => {
			console.log("[Chat] ✅ Lottie 라이브러리 로드 완료");
			this.initializeDogAnimation();
		};
		script.onerror = () => {
			console.error("[Chat] ❌ Lottie 라이브러리 로드 실패");
		};
		document.head.appendChild(script);
	},

	/**
	 * 강아지 애니메이션 초기화
	 */
	initializeDogAnimation() {
		console.log("[Chat] 🐕 강아지 애니메이션 초기화");

		// DOM이 준비될 때까지 대기
		setTimeout(() => {
			const dogContainer = document.getElementById("dogAnimation");
			if (!dogContainer) {
				console.error("[Chat] ❌ 강아지 애니메이션 컨테이너를 찾을 수 없음");
				return;
			}

			try {
				// 기본 happy_dog 애니메이션 로드
				this.lottieAnimation = lottie.loadAnimation({
					container: dogContainer,
					renderer: 'svg',
					loop: true,
					autoplay: true,
					path: './modules/default/chat/assets/happy_dog.json'
				});

				this.lottieAnimation.addEventListener('complete', () => {
					console.log("[Chat] 🎉 강아지 애니메이션 로드 완료");
				});

				this.lottieAnimation.addEventListener('error', (error) => {
					console.error("[Chat] ❌ 강아지 애니메이션 로드 실패:", error);
					this.showDogFallback();
				});

				// 폴백 이미지 숨기기
				const fallback = dogContainer.querySelector('.dog-fallback');
				if (fallback) {
					fallback.style.display = 'none';
				}

			} catch (error) {
				console.error("[Chat] ❌ 강아지 애니메이션 초기화 실패:", error);
				this.showDogFallback();
			}
		}, 1000);
	},

	/**
	 * 강아지 애니메이션 폴백 표시
	 */
	showDogFallback() {
		const dogContainer = document.getElementById("dogAnimation");
		if (dogContainer) {
			const fallback = dogContainer.querySelector('.dog-fallback');
			if (fallback) {
				fallback.style.display = 'block';
				fallback.style.fontSize = '120px';
				fallback.style.textAlign = 'center';
			}
		}
	},

	/**
	 * 입력 중 표시 ("..." 애니메이션)
	 */
	showTypingIndicator() {
		console.log("[Chat] 💭 입력 중 표시");
		
		const messagesContainer = document.getElementById("messagesContainer");
		if (!messagesContainer) return;

		// 기존 입력 중 표시 제거
		this.hideTypingIndicator();

		const typingDiv = document.createElement("div");
		typingDiv.className = "typing-indicator";
		typingDiv.id = "typingIndicator";
		typingDiv.innerHTML = `
			<div class="message-avatar">🤖</div>
			<div class="typing-content">
				<div class="typing-dots">
					<div class="typing-dot"></div>
					<div class="typing-dot"></div>
					<div class="typing-dot"></div>
				</div>
				<div class="typing-text">답변을 준비하고 있어요...</div>
			</div>
		`;

		messagesContainer.appendChild(typingDiv);
		this.scrollToBottom();
	},

	/**
	 * 입력 중 표시 숨기기
	 */
	hideTypingIndicator() {
		const typingIndicator = document.getElementById("typingIndicator");
		if (typingIndicator) {
			typingIndicator.remove();
		}
	},

	/**
	 * 강아지 상태 변경 (말하기/듣기)
	 */
	setDogState(state) {
		console.log("[Chat] 🐕 강아지 상태 변경:", state);
		
		const dogContainer = document.getElementById("dogAnimation");
		if (!dogContainer) return;

		// 기존 상태 클래스 제거
		dogContainer.classList.remove("speaking", "listening");

		// 새 상태 적용
		switch (state) {
			case "speaking":
				dogContainer.classList.add("speaking");
				this.changeExpression("happy");
				break;
			case "listening":
				dogContainer.classList.add("listening");
				this.changeExpression("listening");
				break;
			default:
				this.changeExpression("happy");
		}
	},

	/**
	 * 강아지 표정 변경
	 */
	changeExpression(expression) {
		console.log("[Chat] 😊 강아지 표정 변경:", expression);
		this.currentExpression = expression;

		if (!this.lottieAnimation) {
			console.warn("[Chat] ⚠️ 강아지 애니메이션이 로드되지 않음");
			return;
		}

		const dogContainer = document.getElementById("dogAnimation");
		if (!dogContainer) return;

		let animationPath = '';
		switch (expression) {
			case 'happy':
				animationPath = './modules/default/chat/assets/happy_dog.json';
				break;
			case 'thinking':
			case 'listening':
				animationPath = './modules/default/chat/assets/surprise_dog.json';
				break;
			case 'sad':
			case 'error':
				animationPath = './modules/default/chat/assets/angry_dog.json';
				break;
			default:
				animationPath = './modules/default/chat/assets/happy_dog.json';
		}

		try {
			// 기존 애니메이션 제거
			this.lottieAnimation.destroy();

			// 새 애니메이션 로드
			this.lottieAnimation = lottie.loadAnimation({
				container: dogContainer,
				renderer: 'svg',
				loop: true,
				autoplay: true,
				path: animationPath
			});

			console.log("[Chat] ✅ 강아지 표정 변경 완료:", expression);
		} catch (error) {
			console.error("[Chat] ❌ 강아지 표정 변경 실패:", error);
		}
	}
});
