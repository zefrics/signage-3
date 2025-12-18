// const { Filesystem } = window.Capacitor.Plugins;
// Capacitor 플러그인 Enum을 상수로 정의
const Directory = {
  Data: 'Data',
};
import { storageManager } from './storage.js';
import { timerManager } from './edit-timer.js';

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

    let savedImagePath = null; // 선택된 이미지의 내부 경로를 저장할 변수
    let tempImage = { file: null, name: null }; // 임시로 선택된 이미지 정보를 저장할 객체
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
        savedImagePath = dataToEdit.imagePath || null;

        if (savedImagePath) {
          const pathParts = savedImagePath.split('/');
          fileNameDisplay.textContent = pathParts.pop();
          fileNameDisplay.classList.add('file-selected');
          // Delete 버튼은 보이고, Select 버튼은 숨김
          imageClearButton.style.display = 'flex';
          imageSelectButton.style.display = 'none';
        }

        // 초기 데이터 저장
        initialData = {
          testMachine: dataToEdit.testMachine || '',
          model: dataToEdit.model || '',
          purpose: dataToEdit.purpose || '',
          startDate: dataToEdit.startDate || '',
          endDate: dataToEdit.endDate || '',
          imagePath: dataToEdit.imagePath || null,
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
      };
    }

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
        (tempImage.file !== null || initialData.imagePath !== savedImagePath) || // 이미지 변경 감지
        initialData.startDate !== startDateInput.value ||
        initialData.endDate !== endDateInput.value
      );
    };

    // 이미지 선택 버튼 클릭 이벤트
    imageSelectButton.addEventListener('click', () => {
      imageFileInput.click(); // 숨겨진 input[type=file]을 클릭
    });

    // 파일 입력(input) 변경 이벤트
    imageFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // YYYYMMDDHHMMSS 형식의 타임스탬프 생성
      const now = new Date();
      const timestamp = `${now.getFullYear()}` +
                        `${String(now.getMonth() + 1).padStart(2, '0')}` +
                        `${String(now.getDate()).padStart(2, '0')}` +
                        `${String(now.getHours()).padStart(2, '0')}` +
                        `${String(now.getMinutes()).padStart(2, '0')}` +
                        `${String(now.getSeconds()).padStart(2, '0')}`;
      
      const extension = file.name.split('.').pop();
      const newFileName = `${timestamp}.${extension}`;

      // 파일을 바로 복사하지 않고, 임시 File 객체와 생성될 파일명만 저장
      tempImage = { file: file, name: newFileName };

      // 화면에 파일명 표시
      fileNameDisplay.textContent = file.name; // 원본 파일명 표시
      fileNameDisplay.classList.add('file-selected');
      // Delete 버튼은 보이고, Select 버튼은 숨김
      imageClearButton.style.display = 'flex';
      imageSelectButton.style.display = 'none';

      // 같은 파일을 다시 선택할 수 있도록 입력값 초기화
      imageFileInput.value = '';
    });

    // 이미지 삭제 버튼 클릭 이벤트
    imageClearButton.addEventListener('click', async () => {
      const pathToDelete = savedImagePath; // 1. 삭제할 경로를 미리 저장

      // 2. 변수와 화면 UI를 먼저 초기화
      tempImage = { file: null, name: null };
      savedImagePath = null;
      fileNameDisplay.textContent = '선택된 파일이 없습니다.';
      fileNameDisplay.classList.remove('file-selected');
      imageClearButton.style.display = 'none';
      imageSelectButton.style.display = 'flex';

      // 3. 삭제할 경로가 있으면 실제 파일 삭제 시도
      if (pathToDelete) {
        try {
          await Filesystem.deleteFile({ path: pathToDelete });
        } catch (error) {
          console.error('파일 삭제에 실패했습니다.', error);
          // PC 환경에서는 Filesystem API가 없으므로 오류가 발생하지만, 기능 흐름상 정상입니다.
          // 사용자에게 불필요한 경고창을 띄우지 않기 위해 alert는 주석 처리하거나 제거할 수 있습니다.
          // alert('파일을 삭제하는 데 실패했습니다.');
        }
      }
    });

    // FileReader를 사용하여 파일을 Base64로 읽는 헬퍼 함수
    const readFileAsBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]); // 'data:mime/type;base64,' 부분 제거
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });
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

        // 새로운 이미지가 선택된 경우에만 파일 복사 및 경로 업데이트
        if (tempImage.file && tempImage.name) {
          // 만약 기존 이미지가 있었다면 삭제 (교체 시)
          if (initialData.imagePath) {
            try {
              await Filesystem.deleteFile({ path: initialData.imagePath });
            } catch (e) {
              console.error("기존 이미지 파일 삭제 실패", e);
            }
          }
          // 새 파일 복사
          const base64Data = await readFileAsBase64(tempImage.file);
          const savedFile = await Filesystem.writeFile({
            path: tempImage.name,
            data: base64Data,
            directory: Directory.Data,
          });
          savedImagePath = savedFile.uri;
        }

        const slideData = {
          testMachine: testMachineInput.value.trim(),
          model: modelInput.value.trim(),
          purpose: purposeInput.value.trim(),
          startDate: startDateInput.value,
          endDate: endDateInput.value,
          imagePath: savedImagePath, // 최종 이미지 경로 저장
          type: 'Item', // 타입을 'item'으로 명시
        };

        if (editingOrder) {
          // 데이터 수정
          storageManager.updateData(editingOrder, slideData);
        } else {
          // 새 데이터 추가
          storageManager.addData(slideData);
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
    timerManager.start([itemEditForm]);
  }
});