const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

const dirPath = path.resolve(__dirname, "../shared");
const tokenPath = path.join(dirPath, "access_token.json");

module.exports = NodeHelper.create({
	socketNotificationReceived(notification, payload) {
		if (notification === "SAVE_TOKEN") {
			// shared 디렉토리가 없다면 생성
			if (!fs.existsSync(dirPath)) {
				fs.mkdirSync(dirPath, { recursive: true });
			}

			fs.writeFileSync(tokenPath, JSON.stringify({ token: payload }), "utf8");
		}

		if (notification === "LOAD_TOKEN") {
			let token = null;
			if (fs.existsSync(tokenPath)) {
				token = JSON.parse(fs.readFileSync(tokenPath)).token;
			}
			this.sendNotification("TOKEN_RESULT", token);
		}
	}
});
