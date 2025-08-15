Module.register("register", {
	defaults: {
		title: "인생 이야기를 들려주세요",
		subtitle: "소중한 추억과 경험을 기록하여 가족에게 전해드립니다",
		welcomeMessage: "어르신의 귀중한 인생 이야기를 듣고 싶습니다",
		actionText: "지금 시작해보세요",
		guideText: "버튼을 눌러 소중한 이야기를 기록해보세요",
		retryText: "다시 한번 시도해보세요"
	},

	start() {
		console.log('[Register] ===== REGISTER MODULE STARTING =====');
		console.log('[Register] Module name:', this.name);
		console.log('[Register] Module identifier:', this.identifier);
		console.log('[Register] Module position:', this.data.position);
		
		this.serialID = this.generateReadableSerialID();
		this.isRegistering = false;
		this.registrationStep = 'ready'; // ready, registering, success, error
		
		// register는 첫 페이지이므로 바로 표시
		console.log('[Register] Calling this.show() immediately');
		this.show();
		
		// DOM이 준비된 후 강제로 표시
		setTimeout(() => {
			console.log('[Register] Force showing register module');
			this.show(0, {force: true});
		}, 100);
		
		// API 클라이언트 초기화 확인
		setTimeout(() => {
			this.checkAPIClient();
		}, 1000);
		
		// 페이지 시스템을 사용하지 않으므로 PAGE_CHANGED 알림 제거
		// setTimeout(() => {
		//	console.log('[Register] Setting initial page to 0');
		//	this.sendNotification("PAGE_CHANGED", 0);
		// }, 1000);
		
		console.log('[Register] ===== REGISTER START COMPLETED =====');
	},

	// API 클라이언트 상태 확인
	checkAPIClient() {
		if (window.apiClient && typeof window.apiClient.registerDevice === 'function') {
			console.log('[Register] ✅ API client is ready');
			
			// 서버 상태도 확인
			setTimeout(async () => {
				try {
					console.log('[Register] 🔍 Testing server connection...');
					const isOnline = await window.apiClient.testServerConnection();
					console.log('[Register] Server online:', isOnline);
				} catch (error) {
					console.warn('[Register] Server test failed:', error.message);
				}
			}, 1000);
		} else {
			console.warn('[Register] ⚠️ API client not found, will wait during registration');
		}
	},

	notificationReceived(notification, payload) {
		console.log('[Register] Notification received:', notification, 'payload:', payload);
		// 모든 알림 무시 - 페이지 시스템 사용하지 않음
		return;
	},

	getScripts() {
		return [
			"modules/default/shared/config.js",
			"modules/default/shared/api-client.js"
		];
	},

	// 읽기 쉬운 Serial ID 생성 (고령자 친화적)
	generateReadableSerialID() {
		const today = new Date();
		const year = today.getFullYear().toString().slice(-2);
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const randomNum = Math.floor(Math.random() * 999) + 1;
		return `LB${year}${month}${String(randomNum).padStart(3, '0')}`;
	},

	// API 호출 - 고령자를 위한 친절한 메시지
	async registerDevice() {
		if (this.isRegistering) return;
		
		this.isRegistering = true;
		this.registrationStep = 'registering';
		this.updateDom();

		try {
			console.log('[Register] Starting device registration with ID:', this.serialID);
			
			// API 클라이언트 로딩 대기
			await this.waitForAPIClient();
			
			console.log('[Register] API client loaded, making request...');
			
			// API 호출
			const response = await window.apiClient.registerDevice(this.serialID);
			console.log('[Register] ===== REGISTRATION RESPONSE =====');
			console.log('[Register] Full response:', response);
			console.log('[Register] Response type:', typeof response);
			console.log('[Register] Response keys:', response ? Object.keys(response) : 'null');
			console.log('[Register] user_id exists:', !!response?.user_id);
			console.log('[Register] user_id value:', response?.user_id);
			console.log('[Register] profile_completed exists:', !!response?.profile_completed);
			console.log('[Register] profile_completed value:', response?.profile_completed);
			console.log('[Register] =====================================');
			
			if (response && response.user_id) {
				console.log('[Register] ✅ Valid response with user_id');
				
				// 바로 로딩 화면으로 전환
				this.registrationStep = 'transitioning';
				this.updateDom();
				
				// profile_completed 체크하여 페이지 결정
				const nextPage = response.profile_completed ? 3 : 1; // true면 chat(3), false면 metadata(1)
				console.log('[Register] Profile completed:', response.profile_completed, 'Next page:', nextPage);
				
				// userId를 다른 모듈들에게 전달
				this.sendNotification("USER_REGISTERED", {
					userId: response.user_id,
					profileCompleted: response.profile_completed
				});
				
				// 등록 완료 후 처리 (페이지 시스템 사용하지 않음)
				setTimeout(() => {
					console.log('[Register] ✅ Registration completed successfully');
					console.log('[Register] 📝 User can now proceed to other modules');
					
					// register 모듈 숨기기 (사용자가 직접 다른 모듈로 이동)
					this.hide(500);
					
					// 페이지 시스템 사용하지 않으므로 PAGE_CHANGED 제거
					// this.sendNotification("PAGE_CHANGED", nextPage);
					
					// register 상태를 ready로 리셋 (다음 사용을 위해)
					setTimeout(() => {
						this.isRegistering = false;
						this.registrationStep = 'ready';
					}, 1000);
				}, 2000);
			} else {
				console.error('[Register] ❌ Invalid response - missing user_id');
				console.error('[Register] Expected: { user_id: string, profile_completed: boolean }');
				console.error('[Register] Received:', response);
				throw new Error('서버 응답이 올바르지 않습니다.\n\n관리자에게 문의해주세요.');
			}

		} catch (error) {
			console.error('[Register] Registration failed:', error);
			this.registrationStep = 'error';
			
			// 더 구체적인 에러 메시지 설정
			if (error.message.includes('오프라인')) {
				this.errorMessage = '서버가 현재 오프라인 상태입니다.\n관리자에게 문의해주세요.';
			} else if (error.message.includes('네트워크')) {
				this.errorMessage = '인터넷 연결을 확인하고\n다시 시도해주세요.';
			} else if (error.message.includes('서버')) {
				this.errorMessage = '서버에 일시적인 문제가 있습니다.\n잠시 후 다시 시도해주세요.';
			} else {
				this.errorMessage = error.message || '등록 중 오류가 발생했습니다.\n다시 시도해주세요.';
			}
			
			this.updateDom();
			
			// 10초 후 다시 시도 가능 (서버 오프라인 시 충분한 시간)
			setTimeout(() => {
				this.isRegistering = false;
				this.registrationStep = 'ready';
				this.updateDom();
			}, 10000);
		}
	},

	// API 클라이언트 로딩 대기
	async waitForAPIClient(maxAttempts = 20) {
		console.log('[Register] Waiting for API client to load...');
		
		for (let i = 0; i < maxAttempts; i++) {
			// 현재 상태 로깅
			console.log(`[Register] Attempt ${i + 1}/${maxAttempts}:`);
			console.log('  - window.apiClient exists:', !!window.apiClient);
			
			if (window.apiClient) {
				console.log('  - registerDevice method exists:', typeof window.apiClient.registerDevice);
				
				if (typeof window.apiClient.registerDevice === 'function') {
					console.log('[Register] ✅ API client found and ready');
					return true;
				}
			}
			
			console.log(`[Register] ⏳ Waiting for API client... (${i + 1}/${maxAttempts})`);
			await new Promise(resolve => setTimeout(resolve, 500));
		}
		
		// 최종 상태 로깅
		console.error('[Register] ❌ API client loading failed');
		console.error('Final state:');
		console.error('  - window.apiClient:', window.apiClient);
		console.error('  - Available window properties:', Object.keys(window).filter(key => key.includes('api') || key.includes('API')));
		
		throw new Error('API 클라이언트를 로드할 수 없습니다.\n\n페이지를 새로고침하거나 관리자에게 문의해주세요.');
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "register-container";

		// 헤더 섹션
		const header = document.createElement("div");
		header.className = "register-header";
		
		const welcomeIcon = document.createElement("div");
		welcomeIcon.className = "welcome-icon";
		welcomeIcon.innerHTML = "📖";
		header.appendChild(welcomeIcon);

		const title = document.createElement("h1");
		title.className = "register-title";
		title.textContent = this.config.title;
		header.appendChild(title);

		const subtitle = document.createElement("p");
		subtitle.className = "register-subtitle";
		subtitle.textContent = this.config.subtitle;
		header.appendChild(subtitle);

		const welcomeMsg = document.createElement("p");
		welcomeMsg.className = "welcome-message";
		welcomeMsg.textContent = this.config.welcomeMessage;
		header.appendChild(welcomeMsg);

		wrapper.appendChild(header);

		// 기기 ID 카드 (간소화)
		const deviceCard = document.createElement("div");
		deviceCard.className = "device-card";
		
		const deviceLabel = document.createElement("div");
		deviceLabel.className = "device-label";
		deviceLabel.textContent = "기기 번호";
		deviceCard.appendChild(deviceLabel);

		const deviceValue = document.createElement("div");
		deviceValue.className = "device-value";
		deviceValue.textContent = this.serialID;
		deviceCard.appendChild(deviceValue);

		wrapper.appendChild(deviceCard);

		// 상태별 컨텐츠
		const contentArea = document.createElement("div");
		contentArea.className = "content-area";

		if (this.registrationStep === 'registering') {
			contentArea.innerHTML = `
				<div class="status-container registering">
					<div class="loading-dots">
						<div class="dot"></div>
						<div class="dot"></div>
						<div class="dot"></div>
					</div>
					<div class="status-text">시스템에 등록하고 있습니다</div>
					<div class="status-subtext">잠시만 기다려주세요</div>
				</div>
			`;
		} else if (this.registrationStep === 'success') {
			contentArea.innerHTML = `
				<div class="status-container success">
					<div class="success-icon">✓</div>
					<div class="status-text">등록이 완료되었습니다</div>
					<div class="status-subtext">잠시만 기다려주세요</div>
				</div>
			`;
		} else if (this.registrationStep === 'transitioning') {
			contentArea.innerHTML = `
				<div class="loading-screen">
					<div class="loading-animation">
						<div class="floating-elements">
							<div class="element element-1">📖</div>
							<div class="element element-2">✨</div>
							<div class="element element-3">🌟</div>
							<div class="element element-4">💫</div>
						</div>
					</div>
					<div class="loading-text">다음 단계로 이동합니다</div>
					<div class="loading-subtext">소중한 이야기를 들려주세요</div>
				</div>
			`;
		} else if (this.registrationStep === 'error') {
			contentArea.innerHTML = `
				<div class="status-container error">
					<div class="error-icon">🔌</div>
					<div class="status-text">서버 연결 오류</div>
					<div class="status-subtext" style="white-space: pre-line; line-height: 1.5;">${this.errorMessage || '알 수 없는 오류가 발생했습니다'}</div>
					<div class="retry-hint">10초 후 다시 시도할 수 있습니다</div>
				</div>
			`;
		} else {
			// 기본 상태 - 등록 버튼
			const actionArea = document.createElement("div");
			actionArea.className = "action-area";

			// 메인 등록 버튼 (행동 유도적)
			const registerButton = document.createElement("button");
			registerButton.className = "register-button";
			registerButton.innerHTML = `
				<span class="button-text">${this.config.actionText}</span>
			`;
			registerButton.onclick = () => this.registerDevice();
			actionArea.appendChild(registerButton);

			// 안내 텍스트 (행동 유도적)
			const guideText = document.createElement("p");
			guideText.className = "guide-text";
			guideText.textContent = this.config.guideText;
			actionArea.appendChild(guideText);

			// 정보 버튼 (최소화)
			const infoButton = document.createElement("button");
			infoButton.className = "info-button";
			infoButton.innerHTML = `<span class="info-text">기기 번호가 궁금하세요?</span>`;
			infoButton.onclick = () => this.showInfoModal();
			actionArea.appendChild(infoButton);

			contentArea.appendChild(actionArea);
		}

		wrapper.appendChild(contentArea);

		// 정보 모달 (간소화)
		const modal = document.createElement("div");
		modal.className = "info-modal hidden";
		modal.innerHTML = `
			<div class="modal-overlay"></div>
			<div class="modal-content">
				<div class="modal-header">
					<h2>기기 번호 안내</h2>
					<button class="modal-close">×</button>
				</div>
				<div class="modal-body">
					<div class="info-item">
						<h3>자동으로 만들어집니다</h3>
						<p>기기 번호는 시스템에서 자동으로 생성하는 고유한 번호입니다.</p>
					</div>
					<div class="info-item">
						<h3>개인정보는 포함되지 않습니다</h3>
						<p>이름이나 주소 등은 전혀 포함되지 않는 안전한 번호입니다.</p>
					</div>
					<div class="info-item">
						<h3>소중한 이야기 보관용입니다</h3>
						<p>어르신의 귀중한 인생 이야기를 안전하게 보관하기 위한 번호입니다.</p>
					</div>
				</div>
				<div class="modal-footer">
					<button class="modal-confirm">네, 이해했습니다</button>
				</div>
			</div>
		`;
		wrapper.appendChild(modal);

		return wrapper;
	},

	showInfoModal() {
		const modal = document.querySelector('.info-modal');
		if (modal) {
			modal.classList.remove('hidden');
			modal.classList.add('show');

			// 모달 닫기 이벤트
			const closeBtn = modal.querySelector('.modal-close');
			const confirmBtn = modal.querySelector('.modal-confirm');
			const overlay = modal.querySelector('.modal-overlay');

			const closeModal = () => {
				modal.classList.remove('show');
				modal.classList.add('hidden');
			};

			closeBtn.onclick = closeModal;
			confirmBtn.onclick = closeModal;
			overlay.onclick = closeModal;
		}
	},

	getStyles() {
		return ["register.css"];
	}
});
