import { storageManager } from './storage.js';
import { timerManager } from './edit-timer.js';
import { initializeImageUploader } from './image-uploader.js';

document.addEventListener('DOMContentLoaded', () => {
  // 이 파일은 edit-cover.html에서만 사용되므로, 해당 페이지의 form만 선택합니다.
  const coverEditForm = document.querySelector('#cover-edit');

  if (coverEditForm) {
    const coverEditTitle = document.querySelector('#cover-edit-title');
    const backButton = document.querySelector('#btn-back');
    const testerNameInput = document.querySelector('#input-tester-name');
    const functionInputs = document.querySelectorAll('[id^="input-function-"]');
    const specificationsInputs = document.querySelectorAll('[id^="input-specifications-"]');
    const imageSelectButton = document.querySelector('#btn-select-image');
    const imageClearButton = document.querySelector('#btn-clear-image');
    const imageFileInput = document.querySelector('#input-image-file');
    const fileNameDisplay = document.querySelector('#file-name-display');
    
    let initialData = {}; // 초기 데이터를 저장할 객체
    
    // URL 파라미터에서 'order' 값을 가져옴
    const urlParams = new URLSearchParams(window.location.search);
    const editingOrder = urlParams.get('order');

    if (editingOrder) {
      // 수정 모드
      coverEditTitle.textContent = 'Edit Cover';
      const dataArray = storageManager.load();
      const dataToEdit = dataArray.find(d => d.order == editingOrder);
      if (dataToEdit) {
        testerNameInput.value = dataToEdit.testerName || '';
        (dataToEdit.function || []).forEach((val, i) => functionInputs[i] && (functionInputs[i].value = val));
        (dataToEdit.specifications || []).forEach((val, i) => specificationsInputs[i] && (specificationsInputs[i].value = val));

        // 초기 데이터 저장
        initialData = {
          testerName: dataToEdit.testerName || '',
          imagePath: dataToEdit.imagePath || null,
          originalImageName: dataToEdit.originalImageName || null,
          function: Array.from(functionInputs).map(input => input.value),
          specifications: Array.from(specificationsInputs).map(input => input.value),
        };
      }
    } else {
      // 생성 모드
      coverEditTitle.textContent = 'New Cover';
      initialData = {
        testerName: '',
        imagePath: null,
        originalImageName: null,
        function: ['', '', '', ''],
        specifications: ['', '', '', ''],
      };
    }

    // 이미지 업로더 초기화
    const imageUploader = initializeImageUploader({
      imageSelectButton,
      imageClearButton,
      imageFileInput,
      fileNameDisplay,
      initialData,
    });

    // 한글 입력 시 maxlength가 적용되지 않는 현상 방지
    const inputsWithMaxLength = coverEditForm.querySelectorAll('input[maxlength]');
    inputsWithMaxLength.forEach(input => {
      input.addEventListener('input', () => {
        const maxLength = parseInt(input.getAttribute('maxlength'), 10);
        if (input.value.length > maxLength) {
          input.value = input.value.substring(0, maxLength);
          // 사용자에게 입력이 잘렸음을 알리는 시각적 피드백을 추가할 수도 있습니다.
        }
      });
    });

    // 폼의 변경 여부를 확인하는 함수
    const isFormChanged = () => {
      const currentFunctionValues = Array.from(functionInputs).map(input => input.value);
      const currentSpecificationsValues = Array.from(specificationsInputs).map(input => input.value);

      return (
        initialData.testerName !== testerNameInput.value.trim() ||
        imageUploader.isImageChanged() || // 이미지 변경 감지
        JSON.stringify(initialData.function) !== JSON.stringify(currentFunctionValues) ||
        JSON.stringify(initialData.specifications) !== JSON.stringify(currentSpecificationsValues)
      );
    };

    const isSubmittingRef = { current: false }; // 페이지 이탈 방지 로직을 위한 참조 객체

    // 적용 버튼 클릭 이벤트
    coverEditForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // 기본 제출 동작 방지

      if (!coverEditForm.checkValidity()) {
        coverEditForm.reportValidity();
        return;
      }

      if (confirm("작성하신 내용을 적용하시겠습니까?")) {
        isSubmittingRef.current = true; // 제출 시작

        // 이미지 저장 처리
        const { imagePath, originalImageName } = await imageUploader.saveImage();

        // Function과 Specifications 값을 배열로 수집 (빈 값은 제외)
        const functionValues = Array.from(functionInputs).map(input => input.value.trim());
        const specificationsValues = Array.from(specificationsInputs).map(input => input.value.trim());

        const coverData = {
          testerName: testerNameInput.value.trim(),
          imagePath,
          originalImageName,
          function: functionValues,
          specifications: specificationsValues,
          type: 'Cover', // 타입을 'Cover'로 명시
        };

        if (editingOrder) {
          // 데이터 수정
          storageManager.updateData(editingOrder, coverData);
        } else {
          // 새 데이터 추가
          storageManager.addData(coverData);
        }
        
        alert('작성하신 내용이 적용되었습니다.');
        window.location.href = 'settings.html'; // 저장 후 settings.html로 이동
      }
    });

    // Back 버튼 클릭 이벤트
    backButton.addEventListener('click', () => {
      if (isFormChanged()) {
        if (confirm('변경사항이 저장되지 않았습니다. 정말로 페이지를 나가시겠습니까?')) {
          window.location.href = 'settings.html';
        }
      } else {
        window.location.href = 'settings.html';
      }
    });

    // 타이머 초기화 및 시작
    const timerSettings = storageManager.loadTimerSettings();
    const timeoutSeconds = timerSettings.backTimer || 90;
    timerManager.init(() => {
      window.location.href = 'settings.html';
    }, timeoutSeconds);
    timerManager.start([coverEditForm]);
  }
});