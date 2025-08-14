Module.register("customNav", {
<<<<<<< HEAD
  currentPageIndex: null,

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "custom-nav";

    const items = [
      { name: "인터뷰", icon: "interview_icon.svg", index: 3 },
      { name: "책갈피", icon: "chapter_icon.svg", index: 4 },
      { name: "출판 요청", icon: "publishing_icon.svg", index: 5 }
    ];

    items.forEach(item => {
      const btn = document.createElement("button");
      btn.className = "nav-item";
      if (this.currentPageIndex === item.index) btn.classList.add("active");

      const icon = document.createElement("img");
      icon.src = `modules/default/customNav/assets/${item.icon}`;
      icon.alt = item.name;

      const label = document.createElement("div");
      label.textContent = item.name;

      btn.appendChild(icon);
      btn.appendChild(label);

      btn.onclick = () => {
        this.sendNotification("PAGE_CHANGED", item.index);
      };

      wrapper.appendChild(btn);
    });

    return wrapper;
  },

  notificationReceived(notification, payload) {

    if (notification === "NEW_PAGE") {
      this.currentPageIndex = payload;

      // 페이지 인덱스에 따라 nav 표시/숨김
      if ([0, 1, 2].includes(payload)) {
        this.hide(0); // 즉시 숨김
      } else {
        this.show(0); // 즉시 표시
      }

      this.updateDom(); // 버튼 상태 업데이트
    }
  },

  getStyles() {
    return ["customNav.css"];
  }
});
=======
	currentPageIndex: null,

	getDom() {
		const wrapper = document.createElement("div");
		wrapper.className = "custom-nav";

		const items = [{ name: "말하기", icon: "interview_icon.svg", index: 3 }];

		items.forEach((item) => {
			const btn = document.createElement("button");
			btn.className = "nav-item";
			if (this.currentPageIndex === item.index) btn.classList.add("active");

			const icon = document.createElement("img");
			icon.src = `modules/default/customNav/assets/${item.icon}`;
			icon.alt = item.name;

			const label = document.createElement("div");
			label.textContent = item.name;

			btn.appendChild(icon);
			btn.appendChild(label);

			btn.onclick = () => {
			if(item.name="말하기")this.sendNotification("AAA");
				this.sendNotification("PAGE_CHANGED", item.index);
			};

			wrapper.appendChild(btn);
		});

		return wrapper;
	},

	notificationReceived(notification, payload) {
		if (notification === "NEW_PAGE") {
			this.currentPageIndex = payload;

			// 페이지 인덱스에 따라 nav 표시/숨김
			if ([0, 1, 2].includes(payload)) {
				this.hide(0); // 즉시 숨김
			} else {
				this.show(0); // 즉시 표시
			}

			this.updateDom(); // 버튼 상태 업데이트
		}
	},

	getStyles() {
		return ["customNav.css"];
	}
});
>>>>>>> test/jimin
