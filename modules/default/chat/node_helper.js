const NodeHelper = require("node_helper");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const dirPath = path.resolve(__dirname, "../shared");
const tokenPath = path.join(dirPath, "access_token.json");

const pythonPath = "/home/tdd_jimin/tdd/.venv/bin/python3";
const daemonPath = "/home/tdd_jimin/tdd/stt_daemon.py";


module.exports = NodeHelper.create({
  start() {
    this.py = null;
    this._startPythonDaemon();
  },


  _startPythonDaemon() {
    if (this.py) return;
    this.py = spawn(pythonPath, ["-u", daemonPath], { stdio: ["pipe", "pipe", "pipe"] });

    this.py.stdout.on("data", (buf) => {
      const line = buf.toString().trim();
      try {
        const msg = JSON.parse(line);
        if (msg.type === "result") {
          const text = msg.text || "";
          console.log("[talking][DATA]", text);
          this.sendSocketNotification("VOICE_RESULT", text);
        } else if (msg.type === "error") {
          console.warn("[talking] python error:", msg.message);
        }
      } catch {
        console.warn("[talking] non-JSON:", line);
      }
    });

    this.py.stderr.on("data", (buf) => {
      console.error(`[talking][stderr] ${buf.toString().trim()}`);
    });


    this.py.on("close", (code) => {
      console.log(`[talking] Python 종료 (코드: ${code})`);
      this.py = null;
    });
  },

  _sendCmd(cmd) {
    if (!this.py || !this.py.stdin.writable) {
      console.warn("[talking] python not running, restarting...");
      this._startPythonDaemon();
    }
    try {
      this.py.stdin.write(cmd + "\n");
    } catch (e) {
      console.error("[talking] send cmd failed:", e);
    }
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

    if (notification === "RUN_PYTHON") {
      // 오디오만: RECORD, 영상 포함: RECORD_AV
      this._sendCmd("RECORD");
      // this._sendCmd("RECORD_AV"); // ← **영상까지 사용하려면 이 줄의 주석 해제**
    }
  },
});