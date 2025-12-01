/**
 * Capacitor 플러그인을 초기화하거나, 웹 환경을 위해 모킹(Mocking)합니다.
 * 이 함수는 Capacitor 플러그인을 사용하는 모든 페이지에서 가장 먼저 호출되어야 합니다.
 */
const initializeCapacitor = () => {
  if (typeof window.Capacitor !== 'undefined' && typeof window.Camera !== 'undefined') {
    return; // 이미 초기화되었으면 중복 실행 방지
  }

  if (typeof capacitorExports === 'undefined') {
    console.warn('Capacitor is not available. Using mock plugins for browser testing.');
    window.Capacitor = {
      convertFileSrc: (path) => path,
    };
    window.Camera = {
      getPhoto: async () => {
        const fakePath = prompt('Mock Image Path:', '/img/test.JPG');
        if (!fakePath) throw new Error('User cancelled photos app');
        // 실제 플러그인과 유사하게 format 속성을 추가
        const format = fakePath.split('.').pop().toLowerCase();
        return { webPath: fakePath, format: format === 'jpg' ? 'jpeg' : format };
      }
    };
    window.CameraResultType = { Uri: 'uri' };
    window.CameraSource = { Photos: 'PHOTOS' };
    window.Filesystem = {
      copy: async ({ from }) => ({ uri: from }),
      deleteFile: async ({ path }) => console.log(`Mock delete: ${path}`),
    };
    window.Directory = { Data: 'DATA' };
  } else {
    // 실제 기기 환경에서는 Capacitor 플러그인을 사용합니다.
    window.Capacitor = capacitorExports.Capacitor;
    window.Camera = capacitorExports.Camera.Camera;
    window.CameraResultType = capacitorExports.Camera.CameraResultType;
    window.CameraSource = capacitorExports.Camera.CameraSource;
    window.Filesystem = capacitorExports.Filesystem.Filesystem;
    window.Directory = capacitorExports.Filesystem.Directory;
  }
};

/**
 * 날짜 문자열(YYYY-MM-DD)을 'yy/mm/dd' 형식으로 변환합니다.
 * @param {string} dateString - 변환할 날짜 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const shortYear = year.slice(-2);
  return `${shortYear}/${month}/${day}`;
};

/**
 * 폼 변경사항이 있을 때 페이지 이탈을 방지하는 경고창을 설정합니다.
 * @param {function} isChangedFn - 변경 여부를 확인하는 함수 (true/false 반환)
 * @param {object} isSubmittingRef - { current: boolean } 형태의 참조 객체
 */
const setupUnloadWarning = (isChangedFn, isSubmittingRef) => {
  window.addEventListener('beforeunload', (event) => {
    if (!isSubmittingRef.current && isChangedFn()) {
      const message = '변경사항이 있습니다. 적용하지 않고 페이지를 나가시겠습니까?';
      event.returnValue = message;
      return message;
    }
  });
};

// 스크립트 로드 시 즉시 Capacitor 초기화 실행
initializeCapacitor();
