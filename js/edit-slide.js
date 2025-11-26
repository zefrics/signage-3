document.addEventListener('DOMContentLoaded', () => {
  const sliderEditContainer = document.querySelector('#slider-edit-container');
  const slideEditForm = document.querySelector('#slide-edit');

  // edit.html의 이벤트 처리
  if (sliderEditContainer) {
    sliderEditContainer.addEventListener('click', (event) => {
      const target = event.target;

      // 삭제 버튼 클릭 시
      if (target.matches('.btn-delete')) {
        const order = target.dataset.order;
        const dataArray = storageManager.load();
        const dataToDelete = dataArray.find(d => d.order == order);

        if (dataToDelete && confirm(`'${dataToDelete.testMachine}' 항목을 삭제하시겠습니까?`)) {
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

        // 초기 데이터 저장
        initialData = {
          testMachine: dataToEdit.testMachine || '',
          model: dataToEdit.model || '',
          purpose: dataToEdit.purpose || '',
          startDate: dataToEdit.startDate || '',
          endDate: dataToEdit.endDate || '',
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
      };
    }

    // 폼의 변경 여부를 확인하는 함수
    const isFormChanged = () => {
      return (
        initialData.testMachine !== testMachineInput.value.trim() ||
        initialData.model !== modelInput.value.trim() ||
        initialData.purpose !== purposeInput.value.trim() ||
        initialData.startDate !== startDateInput.value ||
        initialData.endDate !== endDateInput.value
      );
    };

    let isSubmitting = false; // Apply 버튼 클릭 여부 플래그

    // 적용 버튼 클릭 이벤트
    applySlideButton.addEventListener('click', (event) => {
      event.preventDefault();

      if (!slideEditForm.checkValidity()) {
        slideEditForm.reportValidity();
        return;
      }

      if (confirm("작성하신 내용을 적용하시겠습니까?")) {
        isSubmitting = true; // 제출 시작

        const slideData = {
          testMachine: testMachineInput.value.trim(),
          model: modelInput.value.trim(),
          purpose: purposeInput.value.trim(),
          startDate: startDateInput.value,
          endDate: endDateInput.value,
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