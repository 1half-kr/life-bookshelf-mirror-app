Module.register("mypage", {
	defaults: {
		progressSteps: [
			"인터뷰 진행 완료",
			"출판 신청하기",
			"문법 교정",
			"기업 검토",
			"출판 진행"
		],
		books: []
	},

	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = "publish-wrapper";

		// 출판 진행 상태 제목
		const title = document.createElement("h2");
		title.className = "publish-title";
		title.textContent = "출판 진행";

		// 진행 단계
		const progressSection = document.createElement("div");
		progressSection.className = "publish-steps";

		const steps = [
			{ index: "01", title: "인터뷰 진행 완료", desc: "자서전 생성을 위해 인터뷰를 진행해요", done: true },
			{ index: "02", title: "출판 신청하기", desc: "챕터 생성이 끝났어요. 출판 신청을 해보세요!", current: true },
			{ index: "03", title: "문법 교정", desc: "자서전 생성이 끝난 문법 교정을 진행하고 있어요" },
			{ index: "04", title: "기업 검토", desc: "최종적으로 기업에서 자서전을 검토 중이에요." },
			{ index: "05", title: "인쇄 및 배송", desc: "자서전 인쇄 후 배송을 준비해요." }
		];

		steps.forEach((step) => {
			const stepEl = document.createElement("div");
			stepEl.className = "step-box";
			if (step.done) stepEl.classList.add("done");
			if (step.current) stepEl.classList.add("current");

			const index = document.createElement("div");
			index.className = "step-index";
			index.textContent = step.index;

			const title = document.createElement("div");
			title.className = "step-title";
			title.textContent = step.title;

			const desc = document.createElement("div");
			desc.className = "step-desc";
			desc.textContent = step.desc;

			stepEl.appendChild(index);
			stepEl.appendChild(title);
			stepEl.appendChild(desc);

			progressSection.appendChild(stepEl);
		});

		// 내가 출판한 책
		const bookSection = document.createElement("div");
		bookSection.className = "publish-book";

		const emptyText = document.createElement("p");
		emptyText.className = "book-empty-text";
		emptyText.innerHTML = "<strong>아직 출판한 책이 없어요!</strong><br>한 출판 즈믄, 여행자의 삶이 한 권의 책이 됩니다.<br>지금, 여행자님의 이야기를 시작해보세요!";

		const button = document.createElement("button");
		button.className = "publish-button";
		button.textContent = "자서전 생성하기";

		bookSection.appendChild(emptyText);
		bookSection.appendChild(button);

		// 전체 구성 조립
		wrapper.appendChild(title);
		wrapper.appendChild(progressSection);
		wrapper.appendChild(bookSection);

		return wrapper;
	},

	getStyles () {
		return ["mypage.css"];
	}
});
