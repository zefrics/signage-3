(function() {
  const initBackButton = () => {
    // Capacitor 환경이 아니거나 플러그인이 없으면 중단
    if (!window.Capacitor || !window.Capacitor.Plugins || !window.Capacitor.Plugins.App) {
      console.warn('Capacitor App plugin not found. Please install @capacitor/app');
      return;
    }

    const { App } = window.Capacitor.Plugins;
    let lastBackPressTime = 0;
    const EXIT_TIME_THRESHOLD = 2000; // 2초

    // 백버튼 리스너 등록
    App.addListener('backButton', () => {
      const currentTime = new Date().getTime();

      if (currentTime - lastBackPressTime < EXIT_TIME_THRESHOLD) {
        App.exitApp();
      } else {
        lastBackPressTime = currentTime;
        showToast("'뒤로가기'버튼을 한 번 더 누르면 종료됩니다.");
      }
    });
  };

  // 문서가 로드된 후 실행
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initBackButton();
  } else {
    document.addEventListener('DOMContentLoaded', initBackButton);
  }

  function showToast(message) {
    // 기존 토스트 메시지가 있다면 제거
    const existingToast = document.querySelector('.app-toast-message');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.classList.add('app-toast-message');
    toast.innerText = message;
    
    // 스타일 설정
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '50px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '20px',
      zIndex: '99999',
      fontSize: '14px',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });

    document.body.appendChild(toast);

    // 애니메이션 프레임 요청으로 스타일 적용 보장 (Fade In)
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    // 2초 후 제거 (Fade Out)
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          toast.remove();
        }
      }, 300);
    }, 2000);
  }
})();