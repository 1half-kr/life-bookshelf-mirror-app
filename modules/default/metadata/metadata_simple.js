Module.register("metadata", {
	defaults: {},

	start() {
		console.log('[Metadata] Simple metadata module starting');
		this.hide(); // 시작 시 숨김
	},

	getStyles() {
		return ["metadata.css"];
	},

	getDom() {
		console.log('[Metadata] Creating simple metadata DOM');
		
		try {
			const wrapper = document.createElement("div");
			wrapper.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 30%, #A5D6A7 70%, #81C784 100%); display: flex; align-items: center; justify-content: center; z-index: 1000;";
			
			const content = document.createElement("div");
			content.style.cssText = "text-align: center; color: white; background: rgba(0,0,0,0.3); padding: 40px; border-radius: 20px;";
			content.innerHTML = `
				<h1 style="font-size: 48px; margin-bottom: 20px;">📝 기본 정보</h1>
				<p style="font-size: 24px; margin-bottom: 40px;">간단한 정보를 입력해주세요</p>
				<button id="skipMetadataBtn" style="padding: 15px 30px; font-size: 20px; background: #4CAF50; color: white; border: none; border-radius: 10px; cursor: pointer;">
					건너뛰기
				</button>
			`;
			
			wrapper.appendChild(content);
			
			// 안전한 이벤트 리스너 추가
			setTimeout(() => {
				const btn = document.getElementById('skipMetadataBtn');
				if (btn) {
					btn.addEventListener('click', () => {
						console.log('[Metadata] Skip button clicked');
						btn.textContent = '이동 중...';
						btn.disabled = true;
						
						setTimeout(() => {
							this.sendNotification("PAGE_CHANGED", 2);
						}, 500);
					});
				}
			}, 100);
			
			return wrapper;
			
		} catch (error) {
			console.error('[Metadata] Error creating DOM:', error);
			const errorDiv = document.createElement("div");
			errorDiv.textContent = "Metadata 모듈 로딩 오류";
			return errorDiv;
		}
	},

	notificationReceived(notification, payload) {
		console.log('[Metadata] Notification received:', notification, 'payload:', payload);
		if (notification === "PAGE_CHANGED") {
			if (payload === 1) {
				console.log('[Metadata] Showing metadata module');
				this.show(1000);
			} else {
				console.log('[Metadata] Hiding metadata module for page:', payload);
				this.hide(500);
			}
		}
	}
});
