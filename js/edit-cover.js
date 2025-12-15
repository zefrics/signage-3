// const { Camera, Filesystem } = window.Capacitor.Plugins;
// Capacitor 플러그인 Enum을 상수로 정의
// const CameraResultType = {
//   Uri: 'uri',
// };
// const CameraSource = {
//   Photos: 'PHOTOS',
// };
// const Directory = {
//   Data: 'Data',
// };
import { storageManager } from './storage.js';
import { timerManager } from './edit-timer.js';

document.addEventListener('DOMContentLoaded', () => {
  const coverEditForm = document.querySelector('#cover-edit');

  if (coverEditForm) {
    const backButton = document.querySelector('#btn-back');
    const testerNameInput = document.querySelector('#input-tester-name');
    const functionInputs = document.querySelectorAll('[id^="input-function-"]');
    const specificationsInputs = document.querySelectorAll('[id^="input-specifications-"]');
    const imageSelectButton = document.querySelector('#btn-select-image');
    const imageClearButton = document.querySelector('#btn-clear-image');
    const fileNameDisplay = document.querySelector('#file-name-display');
    let savedImagePath = null; // 선택된 이미지의 내부 경로를 저장할 변수
    let tempImage = { path: null, name: null }; // 임시로 선택된 이미지 정보를 저장할 객체
    
    let initialData = {}; // 초기 데이터를 저장할 객체

    // 기본값 정의
    const defaultCoverData = {
      testerName: '(Tester Name)',
      imagePath: null,
      function: ['(Function #1)', '', ''],
      specifications: ['(Specifications #1)', '', ''],
    };

    // 저장된 데이터 불러오기
    const savedCoverData = storageManager.loadCoverData() || {};

    // 기본값과 저장된 값을 병합하여 최종값 결정 (저장된 값이 우선)
    // function과 specifications는 배열 길이를 유지하며 병합
    const finalCoverData = {
      ...defaultCoverData,
      ...savedCoverData,
      function: (savedCoverData.function || []).concat(defaultCoverData.function.slice((savedCoverData.function || []).length)),
      specifications: (savedCoverData.specifications || []).concat(defaultCoverData.specifications.slice((savedCoverData.specifications || []).length)),
    };

    // 최종값으로 입력 필드 채우기 및 스토리지 업데이트
    testerNameInput.value = finalCoverData.testerName;
    finalCoverData.function.forEach((val, i) => functionInputs[i] && (functionInputs[i].value = val));
    finalCoverData.specifications.forEach((val, i) => specificationsInputs[i] && (specificationsInputs[i].value = val));
    storageManager.saveCoverData(finalCoverData);

    // 이미지 데이터 처리
    savedImagePath = finalCoverData.imagePath;
    if (savedImagePath) {
      const pathParts = savedImagePath.split('/');
      fileNameDisplay.textContent = pathParts.pop();
      fileNameDisplay.classList.add('file-selected');
      imageClearButton.style.display = 'flex';
      imageSelectButton.style.display = 'none';
    }

    // 초기 데이터 저장 (isFormChanged 함수에서 비교하기 위함)
    initialData = {
      testerName: finalCoverData.testerName,
      imagePath: finalCoverData.imagePath,
      // .trim()을 사용하지 않고 원본 배열을 그대로 저장
      function: finalCoverData.function,
      specifications: finalCoverData.specifications,
    };

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

    // 이미지 선택 버튼 클릭 이벤트
    // imageSelectButton.addEventListener('click', async (event) => {
    //   try {
    //     const image = await Camera.getPhoto({
    //       quality: 90,
    //       allowEditing: false,
    //       resultType: CameraResultType.Uri, // 파일 경로(URI)를 받음
    //       source: CameraSource.Photos // 갤러리를 염
    //     });

    //     // YYYYMMDDHHMMSS 형식의 타임스탬프 생성
    //     const now = new Date();
    //     const timestamp = `${now.getFullYear()}` +
    //                       `${String(now.getMonth() + 1).padStart(2, '0')}` +
    //                       `${String(now.getDate()).padStart(2, '0')}` +
    //                       `${String(now.getHours()).padStart(2, '0')}` +
    //                       `${String(now.getMinutes()).padStart(2, '0')}` +
    //                       `${String(now.getSeconds()).padStart(2, '0')}`;
        
    //     const fileName = `${timestamp}.${image.format}`;

    //     // 파일을 바로 복사하지 않고, 임시 경로와 생성될 파일명만 저장
    //     tempImage = { path: image.webPath, name: fileName };

    //     // 화면에 파일명 표시
    //     fileNameDisplay.textContent = fileName;
    //     fileNameDisplay.classList.add('file-selected');
    //     // Delete 버튼은 보이고, Select 버튼은 숨김
    //     imageClearButton.style.display = 'flex';
    //     imageSelectButton.style.display = 'none';

    //   } catch (error) {
    //     console.error('이미지를 선택하는 데 실패했습니다.', error);
    //     // 사용자가 이미지 선택을 취소한 경우는 오류로 처리하지 않음
    //     if (error.message !== "User cancelled photos app") {
    //       alert('이미지를 불러오는 데 실패했습니다.');
    //     }
    //   }
    // });

    // 이미지 삭제 버튼 클릭 이벤트
    // imageClearButton.addEventListener('click', async () => {
    //   const pathToDelete = savedImagePath; // 1. 삭제할 경로를 미리 저장

    //   // 2. 변수와 화면 UI를 먼저 초기화
    //   // 임시 이미지 정보와 최종 이미지 경로 모두 초기화
    //   tempImage = { path: null, name: null };
    //   savedImagePath = null;
    //   fileNameDisplay.textContent = '선택된 파일 없음';
    //   fileNameDisplay.classList.remove('file-selected');
    //   imageClearButton.style.display = 'none';
    //   imageSelectButton.style.display = 'flex';

    //   // 3. 삭제할 경로가 있으면 실제 파일 삭제 시도
    //   if (pathToDelete) {
    //     try {
    //       await Filesystem.deleteFile({ path: pathToDelete });
    //     } catch (error) {
    //       console.error('파일 삭제에 실패했습니다.', error);
    //     }
    //   }
    // });

    // 폼의 변경 여부를 확인하는 함수
    const isFormChanged = () => {
      const currentFunctionValues = Array.from(functionInputs).map(input => input.value);
      const currentSpecificationsValues = Array.from(specificationsInputs).map(input => input.value);

      return (
        initialData.testerName !== testerNameInput.value.trim() ||
        initialData.imagePath !== savedImagePath || // 이미지 변경 감지 (tempImage는 저장 시에만 고려)
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

        // 새로운 이미지가 선택된 경우에만 파일 복사 및 경로 업데이트
        // if (tempImage.path && tempImage.name) {
        //   // 만약 기존 이미지가 있었다면 삭제 (교체 시)
        //   if (initialData.imagePath) {
        //     try {
        //       await Filesystem.deleteFile({ path: initialData.imagePath });
        //     } catch (e) {
        //       console.error("기존 이미지 파일 삭제 실패", e);
        //     }
        //   }
        //   // 새 파일 복사
        //   const savedFile = await Filesystem.copy({
        //     from: tempImage.path,
        //     to: tempImage.name,
        //     directory: Directory.Data
        //   });
        //   savedImagePath = savedFile.uri;
        // }

        // Function과 Specifications 값을 배열로 수집 (빈 값은 제외)
        const functionValues = Array.from(functionInputs).map(input => input.value.trim()).filter(Boolean);
        const specificationsValues = Array.from(specificationsInputs).map(input => input.value.trim()).filter(Boolean);

        const coverData = {
          testerName: testerNameInput.value.trim(),
          imagePath: savedImagePath, // 최종 이미지 경로 저장
          function: functionValues,
          specifications: specificationsValues,
        };

        storageManager.saveCoverData(coverData);

        alert('작성하신 내용이 적용되었습니다.');
        window.location.href = 'index.html'; // 저장 후 index.html로 이동
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