// js/timer.js
const timerManager = (() => {
  const INACTIVITY_TIMEOUT = 90; // 90 Seconds
  let inactivityTimer;
  let countdownInterval;
  let countdownElements;
  let timeoutActionCallback = null; // 타임아웃 시 실행할 콜백 함수
  let currentMonitoredElements = []; // 현재 활동을 모니터링 중인 요소들

  // 카운트다운 디스플레이를 시작하는 함수
  const startCountdownDisplay = () => {
    let remainingTime = INACTIVITY_TIMEOUT;
    countdownElements.forEach(el => el.textContent = remainingTime);
    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      remainingTime--;
      countdownElements.forEach(el => {
        el.textContent = remainingTime;
      });
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  };

  // 비활성 타이머를 리셋하는 함수
  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      if (timeoutActionCallback) {
        timeoutActionCallback(); // 제공된 콜백 함수 실행
      }
    }, INACTIVITY_TIMEOUT * 1000);
    startCountdownDisplay();
  };

  // 활동 감지 이벤트 리스너 함수
  const activityListener = () => resetInactivityTimer();

  // 지정된 요소들에 활동 리스너를 추가하는 함수
  const addActivityListeners = (elements) => {
    removeActivityListeners(); // 기존 리스너 제거
    currentMonitoredElements = elements; // 현재 모니터링 중인 요소 목록 업데이트
    ['mousemove', 'keydown', 'click'].forEach(event => {
      elements.forEach(el => {
        if (el) el.addEventListener(event, activityListener);
      });
    });
  };

  // 현재 모니터링 중인 요소들에서 활동 리스너를 제거하는 함수
  const removeActivityListeners = () => {
    ['mousemove', 'keydown', 'click'].forEach(event => {
      currentMonitoredElements.forEach(el => {
        if (el) el.removeEventListener(event, activityListener);
      });
    });
    currentMonitoredElements = []; // 모니터링 요소 목록 초기화
  };

  return {
    init: (callback) => { // 타이머 관리자를 초기화하고 타임아웃 콜백을 설정
      countdownElements = document.querySelectorAll('.countdown');
      timeoutActionCallback = callback;
    },
    start: (elementsToMonitor) => { // 타이머를 시작하고 활동을 모니터링할 요소들을 지정
      addActivityListeners(elementsToMonitor);
      resetInactivityTimer();
    },
    stop: () => { // 타이머를 중지하고 모든 활동 리스너를 제거
      clearTimeout(inactivityTimer);
      clearInterval(countdownInterval);
      removeActivityListeners();
    },
    autoStart: () => { // 페이지에 따라 타이머를 자동으로 시작하는 함수
      const path = window.location.pathname.split("/").pop();
      let elementToMonitor = null;
      let redirectUrl = 'index.html'; // 기본 리다이렉트 URL

      if (path === 'edit-slider.html') {
        elementToMonitor = document.querySelector('#slider-edit');
      } else if (path === 'edit-order.html') {
        elementToMonitor = document.querySelector('#order-edit');
        redirectUrl = 'edit-slider.html'; // edit-order.html에서는 edit-slider.html로 이동
      } else if (path === 'edit-slide.html') {
        elementToMonitor = document.querySelector('#slide-edit');
        redirectUrl = 'edit-slider.html'; // edit-slide.html에서는 edit-slider.html로 이동
      } else if (path === 'edit-cover.html') {
        elementToMonitor = document.querySelector('#cover-edit'); // edit-cover.html의 모니터링 요소
        redirectUrl = 'edit-slider.html'; // edit-cover.html에서는 edit-slider.html로 이동
      }

      if (elementToMonitor) {
        timerManager.init(() => {
          window.location.href = redirectUrl; // 타임아웃 시 지정된 URL로 리다이렉트
        });
        timerManager.start([elementToMonitor]);
      }
    }
  };
})();

// DOM이 로드되면 타이머 자동 시작 로직 실행
document.addEventListener('DOMContentLoaded', timerManager.autoStart);