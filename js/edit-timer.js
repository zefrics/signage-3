import { storageManager } from './storage.js';

export const timerManager = (() => {
  let INACTIVITY_TIMEOUT = 90; // 기본 비활성 시간 (초)
  let inactivityTimer;
  let countdownInterval;
  let countdownElements;
  let timeoutActionCallback = null; // 타임아웃 시 실행할 콜백 함수
  let currentMonitoredElements = []; // 현재 활동을 모니터링 중인 요소들

  // 타이머 시간을 설정하는 함수
  const setInactivityTimeout = (seconds) => {
    // 유효한 숫자이고 0보다 큰 경우에만 설정
    const newTimeout = parseInt(seconds, 10);
    if (!isNaN(newTimeout) && newTimeout > 0) {
      INACTIVITY_TIMEOUT = newTimeout;
    }
  };

  // 카운트다운 디스플레이를 시작하는 함수
  const startCountdownDisplay = () => {
    let remainingTime = INACTIVITY_TIMEOUT; // 현재 설정된 타임아웃 시간으로 시작
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
    init: (callback, timeoutSeconds) => { // 타이머 관리자를 초기화하고 타임아웃 콜백 및 시간 설정
      countdownElements = document.querySelectorAll('.countdown');
      timeoutActionCallback = callback;
      setInactivityTimeout(timeoutSeconds); // 외부에서 전달받은 시간으로 타임아웃 설정
    },
    start: (elementsToMonitor) => { // 타이머를 시작하고 활동을 모니터링할 요소들을 지정 
      addActivityListeners(elementsToMonitor);
      resetInactivityTimer();
    },
    stop: () => { // 타이머를 중지하고 모든 활동 리스너를 제거
      clearTimeout(inactivityTimer);
      clearInterval(countdownInterval);
      removeActivityListeners();
    }
  };
})();

// DOM이 로드되면 타이머 자동 시작 로직 실행
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split("/").pop();
  
  // edit-timer.html 페이지의 로직만 남김
  if (path === 'edit-timer.html') {
    const form = document.querySelector('#timer-edit');
    const sliderTimerInput = document.querySelector('#input-slider-timer');
    const homeTimerInput = document.querySelector('#input-home-timer');
    const backTimerInput = document.querySelector('#input-back-timer');

    // 1~99 사이의 숫자만 입력 가능하도록 제한하는 함수
    const enforceNumericRange = (event) => {
      let value = event.target.value.replace(/[^0-9]/g, ''); // 숫자 이외의 문자 제거
      if (value.startsWith('0')) {
        value = value.substring(1); // 0으로 시작하는 것 방지
      }
      event.target.value = value;
    };
    [sliderTimerInput, homeTimerInput, backTimerInput].forEach(input => {
      input.addEventListener('input', enforceNumericRange);
    });
    
    // 저장된 값 불러와서 표시
    const defaultTimers = { sliderTimer: '5', homeTimer: '90', backTimer: '90' };
    const savedTimers = storageManager.loadTimerSettings();
    
    // 기본값과 저장된 값을 병합하여 최종값 결정 (저장된 값이 우선)
    const finalTimers = { ...defaultTimers, ...savedTimers };

    // 최종값으로 입력 필드 채우기 및 스토리지 업데이트
    sliderTimerInput.value = finalTimers.sliderTimer;
    homeTimerInput.value = finalTimers.homeTimer;
    backTimerInput.value = finalTimers.backTimer;
    storageManager.saveTimerSettings(finalTimers);

    const initialTimers = {
      sliderTimer: sliderTimerInput.value,
      homeTimer: homeTimerInput.value,
      backTimer: backTimerInput.value,
    };

    // 타이머 초기화 및 시작
    const timerSettings = storageManager.loadTimerSettings();
    const timeoutSeconds = timerSettings.backTimer || 90;
    timerManager.init(() => { window.location.href = 'settings.html'; }, timeoutSeconds);
    timerManager.start([form]);

    const isFormChanged = () => {
      return initialTimers.sliderTimer !== sliderTimerInput.value ||
             initialTimers.homeTimer !== homeTimerInput.value ||
             initialTimers.backTimer !== backTimerInput.value;
    };
    
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      // 문자열을 정수로 변환 (10진법)
      const sliderValue = parseInt(sliderTimerInput.value, 10);
      const homeValue = parseInt(homeTimerInput.value, 10);
      const backValue = parseInt(backTimerInput.value, 10);

      // 유효성 검사: 모든 값이 1과 99 사이에 있는지 확인
      if (!sliderValue || sliderValue < 1 || sliderValue > 99 ||
          !homeValue || homeValue < 1 || homeValue > 99 ||
          !backValue || backValue < 1 || backValue > 99) {
        alert('모든 타이머 값은 1에서 99 사이의 숫자여야 합니다.');
        return;
      }

      if (confirm("작성하신 내용을 적용하시겠습니까?")) {
        try {
          storageManager.saveTimerSettings({
            sliderTimer: sliderTimerInput.value,
            homeTimer: homeTimerInput.value,
            backTimer: backTimerInput.value,
          });
          alert('작성하신 내용이 적용되었습니다.');
          window.location.href = 'settings.html';
        } catch (error) {
          alert('입력하신 내용을 저장하는데 실패했습니다. 입력 형식에 맞게 다시 시도해주시기 바랍니다.');
        }
      }
    });

   const backButton = document.querySelector('#btn-back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        if (isFormChanged()) {
          if (confirm('변경사항이 저장되지 않았습니다. 정말로 페이지를 나가시겠습니까?')) {
            window.location.href = 'settings.html';
          }
        } else {
          window.location.href = 'settings.html';
        }
      });
    }
  }
});