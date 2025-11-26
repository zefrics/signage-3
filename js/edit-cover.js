document.addEventListener('DOMContentLoaded', () => {
  const coverEditForm = document.querySelector('#cover-edit');

  if (coverEditForm) {
    const applyButton = document.querySelector('#btn-apply-cover');
    const testerNameInput = document.querySelector('#input-tester-name');
    const functionInput = document.querySelector('#input-function');
    const specificationsInput = document.querySelector('#input-specifications');

    let initialData = {}; // 초기 데이터를 저장할 객체

    // 기존 커버 데이터 불러오기
    const existingCoverData = storageManager.loadCoverData();
    if (existingCoverData) {
      testerNameInput.value = existingCoverData.testerName || '';
      functionInput.value = existingCoverData.function || '';
      specificationsInput.value = existingCoverData.specifications || '';

      initialData = {
        testerName: existingCoverData.testerName || '',
        function: existingCoverData.function || '',
        specifications: existingCoverData.specifications || '',
      };
    } else {
      initialData = {
        testerName: '',
        function: '',
        specifications: '',
      };
    }

    // 폼의 변경 여부를 확인하는 함수
    const isFormChanged = () => {
      return (
        initialData.testerName !== testerNameInput.value.trim() ||
        initialData.function !== functionInput.value.trim() ||
        initialData.specifications !== specificationsInput.value.trim()
      );
    };

    let isSubmitting = false; // Apply 버튼 클릭 여부 플래그

    // 적용 버튼 클릭 이벤트
    applyButton.addEventListener('click', (event) => {
      event.preventDefault();

      if (!coverEditForm.checkValidity()) {
        coverEditForm.reportValidity();
        return;
      }

      if (confirm("작성하신 내용을 적용하시겠습니까?")) {
        isSubmitting = true; // 제출 시작

        const coverData = {
          testerName: testerNameInput.value.trim(),
          function: functionInput.value.trim(),
          specifications: specificationsInput.value.trim(),
        };

        storageManager.saveCoverData(coverData);

        alert('작성하신 내용이 적용되었습니다.');
        window.location.href = 'index.html'; // 저장 후 index.html로 이동
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