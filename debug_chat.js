// 브라우저 콘솔에서 실행할 디버깅 스크립트

console.log("=== Chat Module Debug Script ===");

// 1. 모든 모듈 확인
console.log("1. 등록된 모든 모듈:");
const allModules = document.querySelectorAll('.module');
allModules.forEach((module, index) => {
    console.log(`   ${index + 1}. ${module.className}`);
});

// 2. chat 모듈 찾기
console.log("\n2. Chat 모듈 상태:");
const chatModule = document.querySelector('.module.chat');
if (chatModule) {
    console.log("   ✅ Chat 모듈 발견");
    console.log("   - display:", window.getComputedStyle(chatModule).display);
    console.log("   - opacity:", window.getComputedStyle(chatModule).opacity);
    console.log("   - visibility:", window.getComputedStyle(chatModule).visibility);
    console.log("   - z-index:", window.getComputedStyle(chatModule).zIndex);
    console.log("   - classes:", chatModule.className);
} else {
    console.log("   ❌ Chat 모듈을 찾을 수 없음");
}

// 3. info 모듈 찾기
console.log("\n3. Info 모듈 상태:");
const infoModule = document.querySelector('.module.info');
if (infoModule) {
    console.log("   ✅ Info 모듈 발견");
    console.log("   - display:", window.getComputedStyle(infoModule).display);
    console.log("   - opacity:", window.getComputedStyle(infoModule).opacity);
    console.log("   - visibility:", window.getComputedStyle(infoModule).visibility);
    console.log("   - z-index:", window.getComputedStyle(infoModule).zIndex);
} else {
    console.log("   ❌ Info 모듈을 찾을 수 없음");
}

// 4. Chat 모듈 강제 표시 함수
window.forceShowChat = function() {
    console.log("\n=== 강제로 Chat 모듈 표시 ===");
    const chatModule = document.querySelector('.module.chat');
    if (chatModule) {
        chatModule.classList.add('visible');
        chatModule.style.display = 'block';
        chatModule.style.opacity = '1';
        chatModule.style.visibility = 'visible';
        chatModule.style.zIndex = '2000';
        console.log("✅ Chat 모듈 강제 표시 완료");
        
        // Info 모듈 숨기기
        const infoModule = document.querySelector('.module.info');
        if (infoModule) {
            infoModule.style.display = 'none';
            console.log("✅ Info 모듈 숨김 완료");
        }
    } else {
        console.log("❌ Chat 모듈을 찾을 수 없음");
    }
};

// 5. Info 모듈 강제 표시 함수
window.forceShowInfo = function() {
    console.log("\n=== 강제로 Info 모듈 표시 ===");
    const infoModule = document.querySelector('.module.info');
    if (infoModule) {
        infoModule.style.display = 'block';
        infoModule.style.opacity = '1';
        infoModule.style.visibility = 'visible';
        infoModule.style.zIndex = '2000';
        console.log("✅ Info 모듈 강제 표시 완료");
        
        // Chat 모듈 숨기기
        const chatModule = document.querySelector('.module.chat');
        if (chatModule) {
            chatModule.classList.remove('visible');
            chatModule.style.display = 'none';
            console.log("✅ Chat 모듈 숨김 완료");
        }
    } else {
        console.log("❌ Info 모듈을 찾을 수 없음");
    }
};

console.log("\n=== 사용 방법 ===");
console.log("브라우저 콘솔에서 다음 함수들을 실행하세요:");
console.log("- forceShowChat(): Chat 모듈 강제 표시");
console.log("- forceShowInfo(): Info 모듈 강제 표시");
