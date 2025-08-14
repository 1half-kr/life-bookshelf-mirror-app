sendAnswers() {
    const payload = JSON.stringify(this.answers);
    const wrapper = document.querySelector(".survey-wrapper");

    // Lottie 애니메이션
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.7.5/lottie.min.js";
    script.onload = () => {
      lottie.loadAnimation({
        container: document.getElementById("lottie-animation"),
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: "modules/default/metadata/assets/loading_anime.json"
      });
    };
    document.body.appendChild(script);

    // POST 전송
    fetch(this.config.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    })
    .then(res => res.json())
    .then(data => {
      Log.log("응답 완료:", data);
      this.sendNotification("PAGE_CHANGED", 2);
    })
    .catch(err => {
      Log.error("POST 실패:", err);
    });
  }