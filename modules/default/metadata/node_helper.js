const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

const dirPath = path.resolve(__dirname, "../shared");
const tokenPath = path.join(dirPath, "access_token.json");

module.exports = NodeHelper.create({
	socketNotificationReceived(notification, payload) {
		if (notification === "LOAD_TOKEN") {
			let token = null;

			if (fs.existsSync(tokenPath)) {
				token = JSON.parse(fs.readFileSync(tokenPath, "utf8")).token;
				console.log("[metadata helper] 토큰 로드 완료:", token);
			} else {
				console.warn("[metadata helper] 토큰 파일 없음");
			}

			this.sendSocketNotification("TOKEN_RESULT", token);
		}
	}
});
