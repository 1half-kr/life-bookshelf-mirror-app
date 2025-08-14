Module.register("chat", {
	defaults: {
		lottiePaths: {
			happy: "modules/default/chat/assets/happy_dog.json",
			angry: "modules/default/chat/assets/angry_dog.json",
			surprise: "modules/default/chat/assets/surprise_dog.json"
		},
		defaultExpression: "happy",
		defaultMessage: "안녕! 난 강아지야!"
	},

	currentExpression: null,
	currentMessage: null,
	animInstance: null,
	hasStarted: false,
	isListening: false,
	hasSavedChapter: false,
	chapterId: null,

	getScripts() {
		return ["https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.4/lottie.min.js"];
	},

	start() {
		this.currentExpression = this.config.defaultExpression;
		this.currentMessage = this.config.defaultMessage;
		this.user_id = null;
		this.hasSavedChapter = false;
		this.chapterId = null;
		//
		//console.log(speechSynthesize.getVoices());
	},

	async saveCurrentChapterOnce() {
		if (!this.user_id) return;

		try {
			// 서버 API는 예시입니다. 실제 엔드포인트에 맞춰 수정하세요.
			const response = await fetch(`http://15.165.32.26:3000/api/v2/user/current-chapter?userId=${encodeURIComponent(this.user_id)}`, {
				method: "GET",
				headers: { "Content-Type": "application/json" }
			});

			const data = await response.json();
			this.chapterId = data.chapterId; // 전역/인스턴스 변수에 저장
			this.hasSavedChapter = true;

			console.log("[chat] current_chapter 1회 저장 완료 chapter_id:", this.chapter_id);
		} catch (e) {
			console.error("[chat] current_chapter 저장 에러:", e);
		}
	},

	notificationReceived(notification, payload) {
		if (notification === "AAA") {
			// 현재 페이지가 chat 일 때에만 실행하기

			this.isListening = true;
			this.sendSocketNotification("LOAD_TOKEN");
			this.sendSocketNotification("RUN_PYTHON");
			console.log("됨??");
		}

		if (notification === "DOM_OBJECTS_CREATED") {
			const path = this.config.lottiePaths[this.currentExpression];
			this.loadLottie(path);
		}
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "TOKEN_RESULT") {
			this.user_id = payload;
			this.isListening = false;
			console.log("CHAT 모듈에서 받은 토큰:", this.user_id);

			if (!this.hasStarted) {
				this.hasStarted = true;

				(async () => {
					try {
						// 여기! chapterId 먼저 확보
						await this.saveCurrentChapterOnce();

						// 확보 후 첫 질문 호출
						/***
						 *
						 *
						 * 여기 "안녕" 대신 실제 질문 넣으면 됌 !!!!
						 *
						 *
						 */
						const question = await this.fetchNextQuestion("내 이름은 정은지야.", true, false);
						this.updateChat(question, "happy");
						this.playTTS(question);
					} catch (e) {
						// chapter 저장 실패 시 안내
						this.updateChat("초기 설정에 실패했어요. 잠시 후 다시 시도해 주세요.", "angry");
						this.playTTS("초기 설정에 실패했어요. 잠시 후 다시 시도해 주세요.");
					}
				})();
			}
		}

		if (notification === "TTS_DONE") {
			this.handleNextTurn();
		}

		if (notification === "VOICE_RESULT") {
			const userInput = payload;
			console.log("음성 인식 결과:", userInput);
			// 받아온 텍스트를 다음 질문 흐름에 반영
			this.handleNextTurn(userInput);
		}
	},

	async handleNextTurn(answer = "그렇군요!") {
		const question = await this.fetchNextQuestion(answer, false, true);
		this.updateChat(question, "happy");
		this.playTTS(question);
	},

	/**
	 *
	 *
	 * 여기 있는 answer에 실제 말을 넣으면 됌.
	 *
	 *
	 */
	async fetchNextQuestion(answer = "안녕", isFirst = false, isNext = true) {
		try {
			const response = await fetch(`http://15.165.32.26:3000/api/v2/conversation/${this.chapterId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					user_id: this.user_id,
					message: answer
				})
			});

			if (!response.ok) {
				throw new Error(`서버 응답 실패: ${response.status} ${response.statusText}`);
			}

			const data = await response.json(); // 먼저 데이터 파싱
			console.log("CHAT 서버 응답:", data.response, data.next_question.text); // 그 다음 로그
			return data.next_question.text; // 이게 돌아오는 대답 !!
		} catch (error) {
			console.error("질문 요청 실패:", error);
			// angry 표정으로 전환
			this.updateChat("질문을 불러오는 데 실패했어요.", "happy");

			// 음성 안내
			this.playTTS("질문을 불러오는 데 실패했어요.");

			return "질문을 불러오는 데 실패했어요.";
		}
	},

	// TTS 재생 함수
	playTTS(text) {
		//this.sendNotification("MMM-TTS", text);
	},

	getStyles() {
		return ["chat.css"];
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "wrapper";

		const messageEl = document.createElement("h1");
		messageEl.className = "chat-message";
		messageEl.textContent = this.currentMessage || this.config.defaultMessage;

		let animContainer = document.getElementById("lottieContainer");
		if (!animContainer) {
			animContainer = document.createElement("div");
			animContainer.id = "lottieContainer";
		}

		wrapper.appendChild(messageEl);
		wrapper.appendChild(animContainer);
		// 듣기 중 오버레이
		if (this.isListening) {
			const overlay = document.createElement("div");
			overlay.className = "chat-listening";
			overlay.textContent = "듣는중…";
			wrapper.appendChild(overlay);
		}
		return wrapper;
	},

	updateChat(message, expression) {
		// 메시지 변경
		this.currentMessage = message || this.config.defaultMessage;

		// 표정이 바뀌는 경우에만 애니메이션 변경
		if (expression && this.config.lottiePaths[expression] && this.currentExpression !== expression) {
			this.currentExpression = expression;
			const path = this.config.lottiePaths[expression];
			this.loadLottie(path);
		}

		this.updateDom(); // DOM을 업데이트하여 새 메시지를 반영
	},

	loadLottie(path, retryCount = 0) {
		const container = document.getElementById("lottieContainer");

		if (!container) {
			if (retryCount < 10) {
				console.warn("[chat] Lottie container not found. Retrying...", retryCount);
				setTimeout(() => this.loadLottie(path, retryCount + 1), 100);
			} else {
				console.error("[chat] Lottie container not found after multiple attempts.");
			}
			return;
		}

		container.innerHTML = "";
		// eslint-disable-next-line no-undef
		this.animInstance = lottie.loadAnimation({
			container: container,
			renderer: "svg",
			loop: true,
			autoplay: true,
			path: path
		});
	}
});
