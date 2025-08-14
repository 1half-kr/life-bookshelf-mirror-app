Module.register("metadata", {
	defaults: {
		apiEndpoint: "https://v2.lifebookshelf.org/main/api/v1/members/me",

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
		this.accessToken = null;
	},

	notificationReceived(notification, payload) {
		if (notification === "PAGE_CHANGED") {
			this.sendSocketNotification("LOAD_TOKEN");
		}

		if (notification === "DOM_OBJECTS_CREATED") {
			const path = this.config.lottiePaths?.[this.currentExpression];
			if (path) this.loadLottie(path);
		}
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "TOKEN_RESULT") {
			this.accessToken = payload;
		}
	},

	getStyles() {
		return ["metadata.css"];
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "wrapper";

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
			options.forEach((opt) => {
				const btn = document.createElement("button");
				btn.className = "survey-btn";
				btn.dataset.answer = opt;
				btn.textContent = opt;
				btn.onclick = () => {
					console.log("Clicked option:", opt);
					this.handleAnswer(opt);
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
        <h1>여행자님의 나이가 궁금해요.</h1> 
        <p>나이는 단지 숫자일 뿐이죠. 여행자님께서 얼마나 멋진 경험을 쌓아오셨는지 궁금해요. <br /> 여행자님의 나이는 어떻게 되시나요?</p>
        `;
			case 1:
				return `
        <h1>여행자님의 성별은 무엇인가요?</h1> 
        <p>성별은 우리의 일부일 뿐이지만, 사람마다 특별한 이야기를 담고 있죠. <br /> 여행자님의 성별은 어떻게 되시나요?</p>
        `;
			case 2:
				return `
        <h1>여행자님의 최종 학력은 어떻게 되시나요?</h1> 
        <p>교육은 우리를 성장시키는 중요한 요소죠. 여행자님의 최종 학력에 대해 알려주세요.</p>
        `;
			case 3:
				return `
        <h1>여행자님은 결혼하셨나요?</h1> 
        <p>결혼은 인생의 큰 전환점이 되기도 하죠. 여행자님은 결혼하셨나요?</p>
        `;
			case 4:
				return `
          <h1>질문에 모두 답해주셨네요 !</h1> 
          <p>답해주신 내용으로 책을 만들기 위한 챕터를 구성 중이에요.<br>잠시만 기다려 주세요...</p>
          <div id="lottie-animation" style="width: 300px; height: 300px; margin: auto;"></div>
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
			lottie.loadAnimation({
				container: document.getElementById("lottie-animation"),
				renderer: "svg",
				loop: true,
				autoplay: true,
				path: "modules/default/metadata/assets/loading_anime.json"
			});
		};
		document.body.appendChild(script);

		// FormData 구성
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
					this.sendNotification("PAGE_CHANGED", 2);
				} else {
					console.error("응답 실패:", res.status);
				}
			})
			.catch((err) => {
				console.error("요청 오류:", err);
				alert("네트워크 오류가 발생했습니다.");
			});
	}
});
