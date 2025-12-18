// const { Filesystem } = window.Capacitor.Plugins;
const Directory = {
  Data: 'Data',
};

// FileReader를 사용하여 파일을 Base64로 읽는 헬퍼 함수
const readFileAsBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // 'data:mime/type;base64,' 부분 제거
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export function initializeImageUploader({
  imageSelectButton,
  imageClearButton,
  imageFileInput,
  fileNameDisplay,
  initialData,
}) {
  let savedImagePath = initialData.imagePath || null;
  let tempImage = { file: null, name: null };

  // 초기 UI 설정
  if (savedImagePath) {
    fileNameDisplay.textContent = initialData.originalImageName || savedImagePath.split('/').pop();
    fileNameDisplay.classList.add('file-selected');
    imageClearButton.style.display = 'flex';
    imageSelectButton.style.display = 'none';
  }

  // 이미지 선택 버튼 클릭 이벤트
  imageSelectButton.addEventListener('click', () => {
    imageFileInput.click();
  });

  // 파일 입력(input) 변경 이벤트
  imageFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 크기 검사 로직 (5MB 제한)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('이미지 파일의 크기는 5MB를 초과할 수 없습니다.');
      imageFileInput.value = ''; // 파일 입력 필드 초기화
      return; // 함수 종료
    }

    // 확장자 검사 로직
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'bmp', 'svg', 'webp'];
    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      alert('지원하는 파일 형식이 아닙니다.  jpg, jpeg, png, gif, tiff, bmp, svg 파일만 선택 가능합니다.');
      imageFileInput.value = ''; // 파일 입력 필드 초기화
      return;
    }

    // YYYYMMDDHHMMSS 형식의 타임스탬프 생성
    const now = new Date();
    const timestamp = `${now.getFullYear()}` +
                      `${String(now.getMonth() + 1).padStart(2, '0')}` +
                      `${String(now.getDate()).padStart(2, '0')}` +
                      `${String(now.getHours()).padStart(2, '0')}` +
                      `${String(now.getMinutes()).padStart(2, '0')}` +
                      `${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newFileName = `${timestamp}.${fileExtension}`;

    // 임시 File 객체와 생성될 파일명 저장
    tempImage = { file: file, name: newFileName };

    // 화면에 원본 파일명 표시
    fileNameDisplay.textContent = file.name;
    fileNameDisplay.classList.add('file-selected');
    imageClearButton.style.display = 'flex';
    imageSelectButton.style.display = 'none';

    // 같은 파일을 다시 선택할 수 있도록 입력값 초기화
    imageFileInput.value = '';
  });

  // 이미지 삭제 버튼 클릭 이벤트
  imageClearButton.addEventListener('click', async () => {
    const pathToDelete = savedImagePath;

    // 변수와 화면 UI 초기화
    tempImage = { file: null, name: null };
    savedImagePath = null;
    fileNameDisplay.textContent = '선택된 파일이 없습니다.';
    fileNameDisplay.classList.remove('file-selected');
    imageClearButton.style.display = 'none';
    imageSelectButton.style.display = 'flex';

    // 실제 파일 삭제
    if (pathToDelete) {
      try {
        await Filesystem.deleteFile({ path: pathToDelete });
      } catch (error) {
        console.error('파일 삭제에 실패했습니다.', error);
      }
    }
  });

  return {
    /**
     * 이미지의 변경 여부를 반환합니다.
     * @returns {boolean}
     */
    isImageChanged: () => tempImage.file !== null || savedImagePath !== initialData.imagePath,

    /**
     * 새로운 이미지를 파일 시스템에 저장하고, 저장된 경로와 원본 파일명을 반환합니다.
     * @returns {Promise<{imagePath: string|null, originalImageName: string|null}>}
     */
    saveImage: async () => {
      // 새로운 이미지가 선택된 경우
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
        
        return {
          imagePath: savedFile.uri,
          originalImageName: tempImage.file.name
        };
      }
      
      // 이미지가 변경되지 않은 경우
      return {
        imagePath: savedImagePath,
        originalImageName: initialData.originalImageName
      };
    }
  };
}
