import { storageManager } from './storage.js';
import { timerManager } from './edit-timer.js';

document.addEventListener('DOMContentLoaded', () => {
  const statusEditForm = document.querySelector('#status-edit');

  if (statusEditForm) {
    const statusEditTitle = document.querySelector('#status-edit-title');
    const backButton = document.querySelector('#btn-back');
    const testMachineInput2 = document.querySelector('#input-test-machine-2');
    const statusInput = document.querySelector('#input-status');
    const remarkInput = document.querySelector('#input-remark');

    // select의 선택 여부에 따라 색상 클래스를 토글하는 함수
    const updateStatusColor = () => {
      if (statusInput.value === "") {
        statusInput.classList.add('status-placeholder');
      } else {
        statusInput.classList.remove('status-placeholder');
      }
    };

    let initialData = {};

    const urlParams = new URLSearchParams(window.location.search);
    const editingOrder = urlParams.get('order');

    if (editingOrder) {
      statusEditTitle.textContent = 'Edit Status';
      const dataArray = storageManager.load('status');
      const dataToEdit = dataArray.find(d => d.statusOrder == editingOrder);
      if (dataToEdit) {
        testMachineInput2.value = dataToEdit.testMachine2 || '';
        statusInput.value = dataToEdit.status || '';
        remarkInput.value = dataToEdit.remark || '';
        updateStatusColor();

        initialData = {
          testMachine2: dataToEdit.testMachine2 || '',
          status: dataToEdit.status || '',
          remark: dataToEdit.remark || '',
        };
      }
    } else {
      statusEditTitle.textContent = 'New Status';
      initialData = {
        testMachine2: '',
        status: '',
        remark: '',
      };
      updateStatusColor();
    }

    // 사용자가 값을 변경할 때마다 색상 업데이트
    statusInput.addEventListener('change', updateStatusColor);

    // 한글 입력 시 maxlength 방지 로직
    const inputsWithMaxLength = statusEditForm.querySelectorAll('input[maxlength]');
    inputsWithMaxLength.forEach(input => {
      input.addEventListener('input', () => {
        const maxLength = parseInt(input.getAttribute('maxlength'), 10);
        if (input.value.length > maxLength) {
          input.value = input.value.substring(0, maxLength);
        }
      });
    });

    const isFormChanged = () => {
      return (
        initialData.testMachine2 !== testMachineInput2.value.trim() ||
        initialData.status !== statusInput.value.trim() ||
        initialData.remark !== remarkInput.value.trim()
      );
    };

    statusEditForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!statusEditForm.checkValidity()) {
        statusEditForm.reportValidity();
        return;
      }

      // [추가] 저장 전 개수 제한 우선 확인 (URL 직접 접근 대응)
      if (!editingOrder) {
        const statusData = storageManager.load('status');
        if (statusData.length >= storageManager.LIMITS.Status) {
          alert(`Status는 최대 ${storageManager.LIMITS.Status}개까지 생성할 수 있습니다.`);
          window.location.href = 'settings-status.html';
          return;
        }
      }

      if (confirm("작성하신 내용을 적용하시겠습니까?")) {
        const statusData = {
          testMachine2: testMachineInput2.value.trim(),
          status: statusInput.value.trim(),
          remark: remarkInput.value.trim(),
        };

        let isSaved = false;
        if (editingOrder) {
          storageManager.updateData(editingOrder, statusData, 'status');
          isSaved = true;
        } else {
          isSaved = storageManager.addData(statusData, 'status');
        }

        if (isSaved) {
          alert('작성하신 내용이 적용되었습니다.');
          window.location.href = 'settings-status.html';
        }
      }
    });

    backButton.addEventListener('click', () => {
      if (isFormChanged()) {
        timerManager.stop();
        if (confirm('변경사항이 저장되지 않았습니다. 정말로 페이지를 나가시겠습니까?')) {
          window.location.href = 'settings-status.html';
        } else {
          timerManager.start([statusEditForm]);
        }
      } else {
        window.location.href = 'settings-status.html';
      }
    });

    // 타이머 초기화 및 시작
    const timerSettings = storageManager.load('timer'); // Use generic load for timers
    const timeoutSeconds = timerSettings.backTimer || 90;
    timerManager.init(() => {
      window.location.href = 'settings-status.html';
    }, timeoutSeconds);
    timerManager.start([statusEditForm]);
  }
});
