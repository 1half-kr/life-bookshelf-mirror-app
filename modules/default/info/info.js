Module.register("info", {
	defaults: {
		title: "인터뷰를 시작할 준비가 되었어요!",
		description: "버튼을 눌러 인터뷰를 시작해 자유롭게 얘기해 보세요!",
		buttonText: "인터뷰 시작",
		buttonSubtext: "인터뷰 없이 홈 이동하기"
	},

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "wrapper";

		const textBox = document.createElement("div");
		textBox.className = "text-box";
		textBox.innerHTML = `
    <h1>인터뷰를 시작할 준비가 되었어요!</h1>
    <p>버튼을 눌러 인터뷰를 시작해 자유롭게 얘기해 보세요!</p>
  `;

		const imageBox = document.createElement("div");
		imageBox.className = "image-box";
		const img = document.createElement("img");
		img.src = "modules/default/info/assets/mirror_image.png"; // 이미지 경로 수정
		img.alt = "인터뷰 이미지";
		imageBox.appendChild(img);

		const buttonBox = document.createElement("div");
		buttonBox.className = "info-button-box";

		const startBtn = document.createElement("button");
		startBtn.className = "start-btn";
		startBtn.textContent = "인터뷰 시작";
		startBtn.onclick = () => {
			this.sendNotification("PAGE_CHANGED", 3);
		};

		const skipBtn = document.createElement("button");
		skipBtn.className = "second-btn";
		skipBtn.onclick = () => {
			this.sendNotification("PAGE_CHANGED", 5); // 원하는 동작 설정
		};

		buttonBox.appendChild(startBtn);
		buttonBox.appendChild(skipBtn);

		wrapper.appendChild(textBox);
		wrapper.appendChild(imageBox);
		wrapper.appendChild(buttonBox);

		return wrapper;
	},

	getStyles() {
		return ["info.css"];
	}
});
