Module.register("chat", {
	defaults: {},

	start() {
		console.log('[Chat-Simple] Simple chat module starting');
		this.hide(); // 시작 시 숨김
	},

	getDom() {
		console.log('[Chat-Simple] getDom called');
		const wrapper = document.createElement("div");
		wrapper.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 30%, #90CAF9 70%, #64B5F6 100%); display: flex; align-items: center; justify-content: center; z-index: 1000;";
		
		const content = document.createElement("div");
		content.style.cssText = "color: white; font-size: 48px; text-align: center; background: rgba(0,0,0,0.3); padding: 40px; border-radius: 20px;";
		content.innerHTML = "<h1>인터뷰 화면</h1><p>Chat 모듈이 성공적으로 로드되었습니다!</p>";
		
		wrapper.appendChild(content);
		return wrapper;
	},

	notificationReceived(notification, payload) {
		console.log('[Chat-Simple] Notification received:', notification, 'payload:', payload);
		
		if (notification === "PAGE_CHANGED") {
			if (payload === 3) {
				console.log('[Chat-Simple] Showing chat module for page 3');
				this.show(1000);
			} else {
				console.log('[Chat-Simple] Hiding chat module for page:', payload);
				this.hide(500);
			}
		}
	}
});
