// Capacitor 플러그인 가져오기
// Capacitor 플러그인 객체가 이미 선언되지 않았을 경우에만 초기화
if (typeof window.Camera === 'undefined') {
  // 웹 브라우저 환경을 위한 Mock(가짜) 플러그인 설정
  if (typeof capacitorExports === 'undefined') {
    console.warn('Capacitor is not available. Using mock plugins for browser testing.');
    window.Camera = {
      getPhoto: async () => {
        const fakePath = prompt('Mock Image Path:', '/img/test.JPG');
        if (!fakePath) throw new Error('User cancelled photos app');
        return { webPath: fakePath };
      }
    };
    window.CameraResultType = { Uri: 'uri' };
    window.CameraSource = { Photos: 'PHOTOS' };
    window.Filesystem = {
      copy: async ({ from }) => ({ uri: from })
    };
    window.Directory = { Data: 'DATA' };
  } else {
    // 실제 기기 환경에서는 Capacitor 플러그인을 사용합니다.
    window.Camera = capacitorExports.Camera.Camera;
    window.CameraResultType = capacitorExports.Camera.CameraResultType;
    window.CameraSource = capacitorExports.Camera.CameraSource;
    window.Filesystem = capacitorExports.Filesystem.Filesystem;
    window.Directory = capacitorExports.Filesystem.Directory;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const sliderEditContainer = document.querySelector('#slider-edit-container');
  const slideEditForm = document.querySelector('#slide-edit');

  // edit.html의 이벤트 처리
  if (sliderEditContainer) {
    sliderEditContainer.addEventListener('click', (event) => {
      const target = event.target;

      // 삭제 버튼 클릭 시
      if (target.matches('.btn-delete')) {
        (async () => {
          const order = target.dataset.order;
          const dataArray = storageManager.load();
          const dataToDelete = dataArray.find(d => d.order == order);

          if (dataToDelete && confirm(`'${dataToDelete.testMachine}' 항목을 삭제하시겠습니까?`)) {
            // 연결된 이미지 파일이 있으면 삭제
            if (dataToDelete.imagePath) {
              try {
                await Filesystem.deleteFile({ path: dataToDelete.imagePath });
              } catch (error) {
                console.error('슬라이드 삭제 중 이미지 파일 삭제에 실패했습니다.', error);
              }
            }

            storageManager.deleteData(order);
            // 삭제 후 order 재정렬
            const remainingData = storageManager.load().sort((a, b) => a.order - b.order);
            remainingData.forEach((item, index) => {
              item.order = index + 1;
            });
            storageManager.save(remainingData);

            // 목록 뷰 갱신
            window.location.reload();
            alert(`'${dataToDelete.testMachine}' 항목이 삭제되었습니다.`);
          }
        })();
      }

      // 수정 버튼 클릭 시
      if (target.matches('.btn-modify')) {
        const order = target.dataset.order;
        // URL 파라미터로 order를 전달하며 edit-slide.html로 이동
        window.location.href = `edit-slide.html?order=${order}`;
      }
    });
  }

  // edit-slide.html의 이벤트 처리
  if (slideEditForm) {
    const slideEditTitle = document.querySelector('#slide-edit-title');
    const applySlideButton = document.querySelector('#btn-apply-slide');
    const testMachineInput = document.querySelector('#input-test-machine');
    const modelInput = document.querySelector('#input-model');
    const purposeInput = document.querySelector('#input-purpose');
    const startDateInput = document.querySelector('#input-start-date');
    const endDateInput = document.querySelector('#input-end-date');
    const imageSelectButton = document.querySelector('#btn-select-image');
    const imageClearButton = document.querySelector('#btn-clear-image');
    const fileNameDisplay = document.querySelector('#file-name-display');

    let savedImagePath = null; // 선택된 이미지의 내부 경로를 저장할 변수
    let tempImage = { path: null, name: null }; // 임시로 선택된 이미지 정보를 저장할 객체
    let initialData = {}; // 초기 데이터를 저장할 객체

    // URL 파라미터에서 'order' 값을 가져옴
    const urlParams = new URLSearchParams(window.location.search);
    const editingOrder = urlParams.get('order');

    if (editingOrder) {
      // 수정 모드
      slideEditTitle.textContent = 'Edit Slide';
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
      slideEditTitle.textContent = 'New Slide';
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

    // 폼의 변경 여부를 확인하는 함수
    const isFormChanged = () => {
      return (
        initialData.testMachine !== testMachineInput.value.trim() ||
        initialData.model !== modelInput.value.trim() ||
        initialData.purpose !== purposeInput.value.trim() ||
        (tempImage.path !== null || initialData.imagePath !== savedImagePath) || // 이미지 변경 감지
        initialData.startDate !== startDateInput.value ||
        initialData.endDate !== endDateInput.value
      );
    };

    // 이미지 선택 버튼 클릭 이벤트
    imageSelectButton.addEventListener('click', async () => {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Photos
        });

        // YYYYMMDDHHMMSS 형식의 타임스탬프 생성
        const now = new Date();
        const timestamp = `${now.getFullYear()}` +
                          `${String(now.getMonth() + 1).padStart(2, '0')}` +
                          `${String(now.getDate()).padStart(2, '0')}` +
                          `${String(now.getHours()).padStart(2, '0')}` +
                          `${String(now.getMinutes()).padStart(2, '0')}` +
                          `${String(now.getSeconds()).padStart(2, '0')}`;
        
        const fileName = `${timestamp}.${image.format}`;

        // 파일을 바로 복사하지 않고, 임시 경로와 생성될 파일명만 저장
        tempImage = { path: image.webPath, name: fileName };

        fileNameDisplay.textContent = fileName;
        fileNameDisplay.classList.add('file-selected');
        // Delete 버튼은 보이고, Select 버튼은 숨김
        imageClearButton.style.display = 'flex';
        imageSelectButton.style.display = 'none';

      } catch (error) {
        console.error('이미지를 선택하는 데 실패했습니다.', error);
        if (error.message !== "User cancelled photos app") {
          alert('이미지를 불러오는 데 실패했습니다.');
        }
      }
    });

    // 이미지 삭제 버튼 클릭 이벤트
    imageClearButton.addEventListener('click', async () => {
      const pathToDelete = savedImagePath; // 1. 삭제할 경로를 미리 저장

      // 2. 변수와 화면 UI를 먼저 초기화
      tempImage = { path: null, name: null };
      savedImagePath = null;
      fileNameDisplay.textContent = '선택된 파일 없음';
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

    let isSubmitting = false; // Apply 버튼 클릭 여부 플래그

    // 적용 버튼 클릭 이벤트
    applySlideButton.addEventListener('click', async (event) => {
      event.preventDefault(); // 기본 제출 동작 방지

      if (!slideEditForm.checkValidity()) {
        slideEditForm.reportValidity();
        return;
      }

      if (confirm("작성하신 내용을 적용하시겠습니까?")) {
        isSubmitting = true; // 제출 시작

        // 새로운 이미지가 선택된 경우에만 파일 복사 및 경로 업데이트
        if (tempImage.path && tempImage.name) {
          // 만약 기존 이미지가 있었다면 삭제 (교체 시)
          if (initialData.imagePath) {
            try {
              await Filesystem.deleteFile({ path: initialData.imagePath });
            } catch (e) {
              console.error("기존 이미지 파일 삭제 실패", e);
            }
          }
          // 새 파일 복사
          const savedFile = await Filesystem.copy({
            from: tempImage.path,
            to: tempImage.name,
            directory: Directory.Data
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
        };

        if (editingOrder) {
          // 데이터 수정
          storageManager.updateData(editingOrder, slideData);
        } else {
          // 새 데이터 추가
          storageManager.addData(slideData);
        }

        alert('작성하신 내용이 적용되었습니다.');
        window.location.href = 'edit-slider.html'; // 저장 후 edit-slider.html로 이동
      }
    });

    // 페이지를 벗어나기 전에 변경 사항이 있는지 확인
    window.addEventListener('beforeunload', (event) => {
      // Apply 버튼을 통한 제출이 아니고, 폼 내용이 변경되었을 경우
      if (!isSubmitting && isFormChanged()) {
        // 경고 메시지 설정
        const message = '변경사항이 있습니다. 적용하지 않고 페이지를 나가시겠습니까?';
        event.returnValue = message; // 표준
        return message; // 일부 오래된 브라우저 지원
      }
    });
  }
});