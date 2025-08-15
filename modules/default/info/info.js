Module.register("info", {
	defaults: {
		title: "인터뷰 준비",
		subtitle: "당신의 이야기를 들려주세요"
	},

	start () {
		console.log("[Info] Info module starting - safe version");

		// 전역 에러 핸들러 추가
		window.addEventListener("error", (event) => {
			if (event.filename && event.filename.includes("info")) {
				console.error("[Info] Global error caught:", event.error);
				event.preventDefault();
			}
		});

		this.hide(); // 시작 시 숨김
		console.log("[Info] Info module start completed safely");
	},

	getStyles () {
		return ["info.css"];
	},

	getDom () {
		console.log("[Info] Creating friendly info DOM");

		try {
			const wrapper = document.createElement("div");
			wrapper.className = "info-wrapper";

			// 메인 컨테이너
			const container = document.createElement("div");
			container.className = "info-container";

			// 헤더 섹션 (아이콘 + 제목)
			const header = document.createElement("div");
			header.className = "info-header";

			const welcomeIcon = document.createElement("div");
			welcomeIcon.className = "welcome-icon";
			welcomeIcon.innerHTML = "🎙️";
			header.appendChild(welcomeIcon);

			const title = document.createElement("h1");
			title.className = "info-title";
			title.textContent = "인터뷰를 시작해볼까요?";
			header.appendChild(title);

			const subtitle = document.createElement("p");
			subtitle.className = "info-subtitle";
			subtitle.textContent = "당신만의 특별한 이야기를 들려주세요";
			header.appendChild(subtitle);

			container.appendChild(header);

			// 설명 섹션
			const description = document.createElement("div");
			description.className = "info-description";

			const descItems = [
				{ icon: "💭", text: "편안한 마음으로 대화해주세요" },
				{ icon: "🎯", text: "궁금한 것이 있으면 언제든 말씀하세요" },
				{ icon: "⏰", text: "원하는 만큼 시간을 가져도 괜찮아요" }
			];

			descItems.forEach((item) => {
				const descItem = document.createElement("div");
				descItem.className = "desc-item";
				descItem.innerHTML = `
					<span class="desc-icon">${item.icon}</span>
					<span class="desc-text">${item.text}</span>
				`;
				description.appendChild(descItem);
			});

			container.appendChild(description);

			// 버튼 섹션
			const buttonSection = document.createElement("div");
			buttonSection.className = "info-button-section";

			const startButton = document.createElement("button");
			startButton.className = "start-interview-btn";
			startButton.id = "startInterviewBtn";
			startButton.innerHTML = `
				<span class="btn-icon">🚀</span>
				<span class="btn-text">인터뷰 시작하기</span>
				<span class="btn-arrow">→</span>
			`;

			buttonSection.appendChild(startButton);
			container.appendChild(buttonSection);

			// 하단 안내 메시지
			const footer = document.createElement("div");
			footer.className = "info-footer";
			footer.innerHTML = `
				<p class="footer-text">
					<span class="footer-icon">✨</span>
					AI가 여러분의 이야기를 소중히 기록해드립니다
				</p>
			`;
			container.appendChild(footer);

			wrapper.appendChild(container);

			// 안전한 이벤트 리스너 추가
			setTimeout(() => {
				const btn = document.getElementById("startInterviewBtn");
				if (btn) {
					btn.addEventListener("click", () => {
						console.log("[Info] Start interview button clicked - FORCING CHAT MODULE");

						// 버튼 애니메이션
						btn.style.transform = "scale(0.95)";
						btn.querySelector(".btn-text").textContent = "시작합니다...";
						btn.querySelector(".btn-icon").textContent = "🚀";
						btn.disabled = true;

						// 2. 여러 방법으로 chat 모듈 표시 시도
						setTimeout(() => {
							console.log("[Info] Attempting multiple methods to show chat module");
							
							// 방법 1: 직접 DOM 조작
							const chatModule = document.querySelector(".module.chat");
							if (chatModule) {
								console.log("[Info] Method 1: Direct DOM manipulation");
								chatModule.classList.add("visible");
								chatModule.style.display = "block";
								chatModule.style.opacity = "1";
								chatModule.style.visibility = "visible";
								chatModule.style.zIndex = "2000";
							} else {
								console.error("[Info] Chat module not found!");
							}

							// 방법 2: MagicMirror 알림 시스템
							console.log("[Info] Method 2: Sending notification");
							this.sendNotification("START_INTERVIEW", { userId: localStorage.getItem("mm_user_id") });

							// 방법 3: 페이지 변경 알림 (만약 페이지 시스템을 사용한다면)
							console.log("[Info] Method 3: Page change notification");
							this.sendNotification("PAGE_CHANGED", 3); // chat 페이지로 변경

							// 방법 4: 전역 함수 호출 (만약 있다면)
							if (typeof window.forceShowChat === 'function') {
								console.log("[Info] Method 4: Global function call");
								window.forceShowChat();
							}
						}, 600);
					});

					// 호버 효과
					btn.addEventListener("mouseenter", () => {
						btn.querySelector(".btn-arrow").style.transform = "translateX(5px)";
					});

					btn.addEventListener("mouseleave", () => {
						btn.querySelector(".btn-arrow").style.transform = "translateX(0)";
					});
				}
			}, 100);

			return wrapper;
		} catch (error) {
			console.error("[Info] Error creating DOM:", error);
			const errorDiv = document.createElement("div");
			errorDiv.textContent = "Info 모듈 로딩 오류";
			return errorDiv;
		}
	},

	notificationReceived (notification, payload) {
		console.log("[Info] Notification received:", notification, "payload:", payload);

		// METADATA_COMPLETED 알림 처리
		if (notification === "METADATA_COMPLETED") {
			console.log("[Info] Metadata completed - showing info module and preparing chat");

			// CSS 클래스 추가로 표시
			const moduleElement = document.querySelector(".module.info");
			if (moduleElement) {
				moduleElement.classList.add("visible");
			}
		}
	}
});
