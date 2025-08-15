Module.register("metadata", {
	defaults: {
		enumMappings: [
			{
				// step 0: 연령대
				"20대": "YOUNG_ADULT",
				"30대": "ADULT",
				"40대": "MIDDLE_AGED",
				"50대": "MIDDLE_AGED",
				"60대": "SENIOR",
				"70대 이상": "ELDERLY"
			},
			{
				// step 1: 성별
				여자: "FEMALE",
				남자: "MALE"
			},
			{
				// step 2: 학력
				"초등학교 졸업": "ELEMENTARY_GRADUATE",
				"중학교 졸업": "MIDDLE_GRADUATE",
				"고등학교 졸업": "HIGH_GRADUATE",
				"대학교 졸업": "UNIVERSITY_GRADUATE",
				석사: "MASTER",
				"박사 이상": "DOCTORATE"
			},
			{
				// step 3: 결혼 여부
				네: "MARRIED",
				아니요: "SINGLE"
			}
		]
	},

	start() {
		this.step = 0;
		this.answers = {};
		this.isSubmitting = false;
		this.hide(); // 시작 시 숨김
	},

	notificationReceived(notification, payload) {
		console.log("[Metadata] Notification received:", notification, "payload:", payload);
		
		// USER_REGISTERED 알림 처리
		if (notification === "USER_REGISTERED") {
			console.log("[Metadata] User registered:", payload);
			
			// userId 설정
			this.userId = payload.userId;
			console.log("[Metadata] UserId set to:", this.userId);
			
			// profile_completed가 false인 경우에만 metadata 모듈 표시
			if (!payload.profileCompleted) {
				console.log("[Metadata] Profile not completed - showing metadata module");
				
				// CSS 클래스 추가로 표시
				const moduleElement = document.querySelector('.module.metadata');
				if (moduleElement) {
					moduleElement.classList.add('visible');
				}
				
				this.show(1000);
				
				// 사용자 ID 확인
				const userId = localStorage.getItem("mm_user_id") || payload.userId;
				if (!userId) {
					console.error("[Metadata] User ID not found");
				}
			} else {
				console.log("[Metadata] Profile already completed - hiding metadata module");
				this.hide(500);
			}
		}
	},

	getScripts() {
		return ["modules/default/shared/config.js", "modules/default/shared/api-client.js", "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.5/lottie.min.js"];
	},

	getStyles() {
		return ["metadata.css"];
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "wrapper";

		// 진행률 표시 (step 4 제외)
		if (this.step < 4) {
			const progressContainer = document.createElement("div");
			progressContainer.className = "progress-container";

			const progressBar = document.createElement("div");
			progressBar.className = "progress-bar";

			const progressFill = document.createElement("div");
			progressFill.className = "progress-fill";
			progressFill.style.width = `${(this.step / 4) * 100}%`;

			progressBar.appendChild(progressFill);
			progressContainer.appendChild(progressBar);

			const progressText = document.createElement("div");
			progressText.className = "progress-text";
			progressText.textContent = `${this.step + 1}/4`;
			progressContainer.appendChild(progressText);

			wrapper.appendChild(progressContainer);
		}

		// 상단 좌측 고정 btn
		const back_btn = document.createElement("img");
		back_btn.src = "modules/default/metadata/assets/left_arrow.svg"; // 외부 SVG 경로
		back_btn.alt = "back_btn";
		back_btn.classList.add("back-btn");
		wrapper.appendChild(back_btn);
		back_btn.onclick = () => {
			this.step--;
			this.updateDom();
		};

		// back-button 표시 여부
		if (this.step > 0 && this.step < 4) {
			back_btn.classList.add("show");
			back_btn.classList.remove("hidden");
		} else {
			back_btn.classList.add("hidden");
			back_btn.classList.remove("show");
		}

		const questionBox = document.createElement("div");
		questionBox.className = "question-box";
		questionBox.innerHTML = this.getQuestionHTML();
		wrapper.appendChild(questionBox);

		const buttonBox = document.createElement("div");
		buttonBox.className = "button-box";

		if (this.step < 4) {
			const options = this.getOptionsForStep();
			options.forEach((opt, index) => {
				const btn = document.createElement("button");
				btn.className = "survey-btn";
				btn.dataset.answer = opt;
				btn.textContent = opt;
				btn.style.animationDelay = `${index * 0.1}s`;
				btn.onclick = () => {
					console.log("Clicked option:", opt);
					// 선택 효과 추가
					btn.classList.add("selected");
					setTimeout(() => {
						this.handleAnswer(opt);
					}, 300);
				};
				buttonBox.appendChild(btn);
			});
		}

		wrapper.appendChild(buttonBox);
		return wrapper;
	},

	getQuestionHTML() {
		switch (this.step) {
			case 0:
				return `
        <div class="question-emoji">👋</div>
        <h1>안녕하세요! 연세가 어떻게 되시나요?</h1> 
        <p>나이는 단지 숫자일 뿐이에요. 어르신께서 쌓아오신 소중한 경험들이 더 중요하죠.<br />편하게 알려주시면 됩니다.</p>
        `;
			case 1:
				return `
        <div class="question-emoji">🌸</div>
        <h1>성별을 알려주시겠어요?</h1> 
        <p>남성분인지 여성분인지 알려주시면, 더 자연스러운 대화를 나눌 수 있을 것 같아요.</p>
        `;
			case 2:
				return `
        <div class="question-emoji">📚</div>
        <h1>어디까지 공부하셨나요?</h1> 
        <p>학교를 어디까지 다니셨는지 궁금해요. 배움의 길은 모두 소중하니까요.</p>
        `;
			case 3:
				return `
        <div class="question-emoji">💕</div>
        <h1>결혼은 하셨나요?</h1> 
        <p>가족 이야기도 소중한 추억 중 하나죠. 편하게 알려주세요.</p>
        `;
			case 4:
				return `
          <div class="completion-container">
            <div class="completion-emoji">🎉</div>
            <h1>모든 질문에 답해주셔서 감사해요!</h1> 
            <p>알려주신 내용을 바탕으로 어르신만의 특별한 이야기책을 준비하고 있어요.<br/>조금만 기다려주세요...</p>
            <div id="lottie-animation"></div>
            <div class="status-message">소중한 이야기를 정리하고 있습니다</div>
          </div>
        `;
			default:
				return `<p>에러 발생</p>`;
		}
	},

	getOptionsForStep() {
		const options = [
			["20대", "30대", "40대", "50대", "60대", "70대 이상"],
			["여자", "남자"],
			["초등학교 졸업", "중학교 졸업", "고등학교 졸업", "대학교 졸업", "석사", "박사 이상"],
			["네", "아니요"]
		];
		return options[this.step] || [];
	},

	domReady() {
		document.querySelector(".survey-wrapper").addEventListener("click", (e) => {
			if (e.target.classList.contains("survey-btn") && !e.target.classList.contains("back-btn")) {
				const answer = e.target.dataset.answer;
				if (this.step === 0) this.answers.age = answer;
				else if (this.step === 1) this.answers.gender = answer;
				else if (this.step === 2) this.answers.education = answer;
				else if (this.step === 3) this.answers.marital = answer;

				this.step++;
				this.updateDom();

				if (this.step === 4) {
					this.sendAnswers();
				}
			}
		});
	},

	handleAnswer(answer) {
		console.log("handleAnswer called at step", this.step, "with answer:", answer);

		const enumValue = this.config.enumMappings[this.step][answer];

		if (this.step === 0) this.answers.ageGroup = enumValue;
		else if (this.step === 1) this.answers.gender = enumValue;
		else if (this.step === 2) this.answers.educationLevel = enumValue;
		else if (this.step === 3) this.answers.maritalStatus = enumValue;

		this.step++;
		this.updateDom();

		if (this.step === 4) this.sendAnswers();
	},

	sendAnswers() {
		// Lottie 애니메이션
		const script = document.createElement("script");
		script.src = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.5/lottie.min.js";
		script.onload = () => {
			// eslint-disable-next-line no-undef
			lottie.loadAnimation({
				container: document.getElementById("lottie-animation"),
				renderer: "svg",
				loop: true,
				autoplay: true,
				path: "modules/default/metadata/assets/loading_anime.json"
			});
		};
		document.body.appendChild(script);

		// case 4 완료 화면을 충분히 보여준 후 info 모듈로 전환 (3초 후)
		setTimeout(() => {
			console.log("[Metadata] Sending METADATA_COMPLETED after showing completion screen");
			this.sendNotification("METADATA_COMPLETED", { userId: this.userId });
		}, 3000);

		// FormData 구성

		/*
		const formData = new FormData();
		for (const key in this.answers) {
			formData.append(key, this.answers[key]);
		}

		fetch(this.config.apiEndpoint, {
			method: "PUT",
			headers: {
				Authorization: `Bearer ${this.accessToken}`
			},
			body: formData
		})
			.then(async (res) => {
				if (res.ok) {
					console.log("응답 성공:");
					// 페이지 시스템 사용하지 않으므로 PAGE_CHANGED 제거
					// this.sendNotification("PAGE_CHANGED", 2);
				} else {
					console.error("응답 실패:", res.status);
				}
			})
			.catch((err) => {
				console.error("요청 오류:", err);
				alert("네트워크 오류가 발생했습니다.");
			});

			*/
	}
});
