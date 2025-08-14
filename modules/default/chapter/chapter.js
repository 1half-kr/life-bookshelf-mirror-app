Module.register("chapter", {
	defaults: {
		chapters: [
			{ title: "성장 과정", image: "modules/chapter/img1.png", description: "성장 과정의 설명입니다.", items: ["출생", "유년기"] },
			{ title: "가족 관계", image: "modules/chapter/img2.png", description: "가족 관계의 설명입니다.", items: ["부모", "형제자매"] }
		]
	},

	getTemplate () {
		return "chapter.njk";
	},

	getTemplateData () {
		return this.config;
	},

	notificationReceived (notification) {
		if (notification === "DOM_OBJECTS_CREATED") {
			const chapterCards = document.querySelectorAll(".chapter-card");
			chapterCards.forEach((card, index) => {
				card.addEventListener("click", () => this.showBottomSheet(index));
			});
		}
	},

	showBottomSheet (index) {
		const sheet = document.getElementById("bottomSheet");
		const overlay = document.getElementById("sheetOverlay");
		const sheetTitle = document.getElementById("sheetTitle");
		const sheetDesc = document.getElementById("sheetDesc");
		const sheetItems = document.getElementById("sheetItems");

		const chapter = this.config.chapters[index];
		sheetTitle.textContent = chapter.title;
		sheetDesc.textContent = chapter.description;
		sheetItems.innerHTML = chapter.items.map((item) => `<button class="item-btn">${item}</button>`).join("");

		sheet.classList.remove("hidden");
		overlay.classList.remove("hidden");

		sheetItems.querySelectorAll(".item-btn").forEach((btn) => {
			btn.addEventListener("click", () => {
				this.hideBottomSheet();
				this.sendNotification("PAGE_CHANGED", 1); // 상세페이지로 전환
			});
		});

		overlay.addEventListener("click", () => this.hideBottomSheet());
	},

	hideBottomSheet () {
		const sheet = document.getElementById("bottomSheet");
		const overlay = document.getElementById("sheetOverlay");
		sheet.classList.add("hidden");
		overlay.classList.add("hidden");
	},

	getStyles () {
		return ["chapter.css"];
	}
});
