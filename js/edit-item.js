import { storageManager } from './storage.js';
import { timerManager } from './edit-timer.js';
import { initializeImageUploader } from './image-uploader.js';

document.addEventListener('DOMContentLoaded', () => {
  // 이 파일은 edit-item.html에서만 사용되므로, 해당 페이지의 form만 선택합니다.
  const itemEditForm = document.querySelector('#item-edit');

  if (itemEditForm) {
    const itemEditTitle = document.querySelector('#item-edit-title');
    const backButton = document.querySelector('#btn-back');
    const testMachineInput = document.querySelector('#input-test-machine');
    const modelInput = document.querySelector('#input-model');
    const purposeInput = document.querySelector('#input-purpose');
    const startDateInput = document.querySelector('#input-start-date');
    const endDateInput = document.querySelector('#input-end-date');
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
      itemEditTitle.textContent = 'Edit Item';
      const dataArray = storageManager.load();
      const dataToEdit = dataArray.find(d => d.order == editingOrder);
      if (dataToEdit) {
        testMachineInput.value = dataToEdit.testMachine || '';
        modelInput.value = dataToEdit.model || '';
        purposeInput.value = dataToEdit.purpose || '';
        startDateInput.value = dataToEdit.startDate || '';
        endDateInput.value = dataToEdit.endDate || '';

        // 초기 데이터 저장
        initialData = {
          testMachine: dataToEdit.testMachine || '',
          model: dataToEdit.model || '',
          purpose: dataToEdit.purpose || '',
          startDate: dataToEdit.startDate || '',
          endDate: dataToEdit.endDate || '',
          imagePath: dataToEdit.imagePath || null,
          originalImageName: dataToEdit.originalImageName || null,
        };
      }
    } else {
      // 생성 모드
      itemEditTitle.textContent = 'New Item';
      // 생성 모드의 초기 데이터는 비어있음
      initialData = {
        testMachine: '',
        model: '',
        purpose: '',
        startDate: '',
        endDate: '',
        imagePath: null,
        originalImageName: null,
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
    const inputsWithMaxLength = itemEditForm.querySelectorAll('input[maxlength]');
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
      return (
        initialData.testMachine !== testMachineInput.value.trim() ||
        initialData.model !== modelInput.value.trim() ||
        initialData.purpose !== purposeInput.value.trim() ||
        imageUploader.isImageChanged() || // 이미지 변경 감지
        initialData.startDate !== startDateInput.value ||
        initialData.endDate !== endDateInput.value
      );
    };

    const isSubmittingRef = { current: false }; // 페이지 이탈 방지 로직을 위한 참조 객체

    // 적용 버튼 클릭 이벤트
    itemEditForm.addEventListener('submit', async (event) => {
      event.preventDefault(); // 기본 제출 동작 방지

      if (!itemEditForm.checkValidity()) {
        itemEditForm.reportValidity();
        return;
      }

      if (confirm("작성하신 내용을 적용하시겠습니까?")) {
        isSubmittingRef.current = true; // 제출 시작

        try {
          // 이미지 저장 처리
          let isDataSaved = false;
          const { imagePath, originalImageName } = await imageUploader.saveImage();

          const slideData = {
            testMachine: testMachineInput.value.trim(),
            model: modelInput.value.trim(),
            purpose: purposeInput.value.trim(),
            startDate: startDateInput.value,
            endDate: endDateInput.value,
            imagePath,
            originalImageName,
            type: 'Item', // 타입을 'item'으로 명시
          };

          if (editingOrder) {
            // 데이터 수정
            storageManager.updateData(editingOrder, slideData);
            isDataSaved = true;
          } else {
            // 새 데이터 추가
            isDataSaved = storageManager.addData(slideData);
          }

          if (isDataSaved) {
            alert('작성하신 내용이 적용되었습니다.');
            window.location.href = 'settings.html'; // 저장 후 settings.html로 이동
          } else {
            // 데이터 저장 실패 시, 저장했던 이미지 파일을 다시 삭제 (롤백)
            if (imagePath) {
              await window.Capacitor.Plugins.Filesystem.deleteFile({ path: imagePath });
            }
            isSubmittingRef.current = false; // 제출 상태 초기화
            alert('입력하신 내용을 저장하는데 실패했습니다. 입력 형식에 맞게 다시 시도해주시기 바랍니다.');
          }
        } catch (error) {
          alert('이미지 파일 저장에 실패하여 작성하신 내용을 적용할 수 없습니다. 파일 형식을 확인하거나 다른 파일을 선택해주세요.');
          isSubmittingRef.current = false; // 제출 상태 초기화
        }
      }
    });

    // Back 버튼 클릭 이벤트
    backButton.addEventListener('click', () => {
      if (isFormChanged()) {
        timerManager.stop(); // 확인 창을 띄우기 전에 타이머를 중지
        if (confirm('변경사항이 저장되지 않았습니다. 정말로 페이지를 나가시겠습니까?')) {
          window.location.href = 'settings.html';
        } else {
          timerManager.start([itemEditForm]); // 취소 시 타이머를 다시 시작
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
    timerManager.start([itemEditForm]);
  }
});