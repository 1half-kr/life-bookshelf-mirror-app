const NodeHelper = require("node_helper");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const dirPath = path.resolve(__dirname, "../shared");
const tokenPath = path.join(dirPath, "access_token.json");

// Python 스크립트 경로
const pythonPath = "/home/tdd_jimin/tdd/venv/bin/python3";
const scriptPath2 = "/home/tdd_jimin/tdd/input.py";

module.exports = NodeHelper.create({	
    runPython() {
        const pyProc = spawn(pythonPath, [scriptPath2]); 
		pyProc.stdout.on("data", (data) => {
			const result = data.toString().trim();
			console.log(`[talking][stdout] ${result}`);

			// 음성 인식 결과를 프론트에 전달
			this.sendSocketNotification("VOICE_RESULT", result);
		});

		pyProc.stderr.on("data", (data) => {
			console.error(`[talking][stderr] ${data.toString().trim()}`);
		});

		pyProc.on("close", (code) => {
			console.log(`[talking] Python 종료 (코드: ${code})`);
		}); 
	},

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
		if (notification === "RUN_PYTHON") {console.log("됨");this.runPython();}
	},


});
