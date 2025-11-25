document.addEventListener('DOMContentLoaded', () => {
  // Header
  const viewHeader = document.querySelector('#view-header');
  const settingsHeader = document.querySelector('#settings-header');
  const orderEditHeader = document.querySelector('#order-edit-header');
  const slideEditHeader = document.querySelector('#slide-edit-header');
  const slideEditTitle = document.querySelector('#slide-edit-title');

  // Main Section
  const slideView = document.querySelector('#slide-view');
  const listView = document.querySelector('#list-view');
  const settings = document.querySelector('#settings');
  const slideEdit = document.querySelector('#slide-edit');
  const orderEdit = document.querySelector('#order-edit');
  
  // Button
  const changeViewButton = document.querySelector('#btn-change-view');
  const settingsButton = document.querySelector('#btn-settings');
  const backToViewButton = document.querySelector('#btn-back-to-view');
  const backFromCreateButton = document.querySelector('#btn-back-from-create');
  const backfromSlideButton = document.querySelector('#btn-back-from-slide');
  const orderButton = document.querySelector('#btn-order');
  const createButton = document.querySelector('#btn-create');
  const orderUpButton = document.querySelector('#btn-order-up');
  const orderDownButton = document.querySelector('#btn-order-down');
  const applyOrderButton = document.querySelector('#btn-apply-order');
  const applySlideButton = document.querySelector('#btn-apply-slide');

  // Container
  const listViewContainer = document.querySelector('#list-view-container');
  const settingsContainer = document.querySelector('#settings-container');
  const orderEditContainer = document.querySelector('#order-edit-container');
  
  
  // Edit
  const testMachineInput = document.querySelector('#input-test-machine');
  const modelInput = document.querySelector('#input-model');
  const purposeInput = document.querySelector('#input-purpose');
  const startDateInput = document.querySelector('#input-start-date');
  const endDateInput = document.querySelector('#input-end-date');

  // Timer
  const countdownElements = document.querySelectorAll('.countdown');
  let inactivityTimer;
  let countdownInterval;
  const INACTIVITY_TIMEOUT = 90; // 90 Seconds
  let activeMainView = 'slide'; // 현재 활성화된 메인 뷰 (list 또는 slide)
  let editingOrder = null; // 현재 수정 중인 데이터의 order 값 저장
  let originalEditData = null; // Create/Edit 모드에서 원본 데이터를 저장
  let initialOrderInEdit = []; // Edit Order 모드 진입 시의 초기 순서를 저장

  // 비활성 타이머를 리셋하는 함수
  const resetInactivityTimer = () => {
    // 내부 타임아웃 리셋
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(showView, INACTIVITY_TIMEOUT * 1000);
    // 화면에 보이는 카운트다운도 함께 리셋
    startCountdownDisplay();
  };

  // 화면의 카운트다운을 시작하는 함수
  const startCountdownDisplay = () => {
    let remainingTime = INACTIVITY_TIMEOUT;
    countdownElements.forEach(el => el.textContent = remainingTime);
    clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      remainingTime--;
      countdownElements.forEach(el => {
        el.textContent = remainingTime;
      });
      if (remainingTime <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  };

  // 이벤트 리스너를 제거하는 함수
  const removeActivityListeners = () => {
    ['mousemove', 'keydown', 'click'].forEach(event => {
      slideEdit.removeEventListener(event, resetInactivityTimer);
      settings.removeEventListener(event, resetInactivityTimer);
    });
    clearInterval(countdownInterval);
  };

  const showView = () => {
    // Header Toggle
    viewHeader.style.display = 'flex';
    settingsHeader.style.display = 'none';
    orderEditHeader.style.display = 'none';
    slideEditHeader.style.display = 'none';

    // Main Toggle - activeMainView에 따라 뷰를 결정
    if (activeMainView === 'list') {
      listView.style.display = 'flex';
      slideView.style.display = 'none';
    } else {
      listView.style.display = 'none';
      slideView.style.display = 'flex';
      // 슬라이드 뷰로 돌아올 때 슬라이더를 다시 시작
      const dataArray = storageManager.load();
      sliderManager.init(dataArray);
    }
    slideEdit.style.display = 'none';
    settings.style.display = 'none';
    orderEdit.style.display = 'none';

    // 타이머와 이벤트 리스너 정리
    clearTimeout(inactivityTimer);
    removeActivityListeners();

    // form 안의 모든 input, textarea 내용 초기화
    const formElements = slideEdit.querySelectorAll('input, textarea');
    formElements.forEach(element => {
      // type="date"는 value를 ''로 설정해야 초기화됨
      if (element.type === 'date') {
        element.value = '';
      } else {
        element.value = '';
      }
    });
  };

  const showSettings = () => {
    // Settings 화면으로 전환 시 폼 초기화
    // Header Toggle
    viewHeader.style.display = 'none';
    settingsHeader.style.display = 'flex';
    orderEditHeader.style.display = 'none';
    slideEditHeader.style.display = 'none';

    // Main Toggle
    listView.style.display = 'none';
    slideView.style.display = 'none';
    settings.style.display = 'flex';
    slideEdit.style.display = 'none';
    orderEdit.style.display = 'none';
    sliderManager.stop(); // 다른 뷰로 이동 시 슬라이더 정지

    // 입력 폼이 보이면 타이머 시작
    updateSettings(); // 목록 화면으로 전환 시 데이터 로드 및 표시
    resetInactivityTimer(); // 타이머 타임아웃 시작
    
    // 사용자 활동 감지를 위한 이벤트 리스너 추가
    ['mousemove', 'keydown', 'click'].forEach(event => {
      settings.addEventListener(event, resetInactivityTimer);
    });
  };

  const showCreateForm = () => {
    // Header Toggle
    viewHeader.style.display = 'none';
    settingsHeader.style.display = 'none';
    orderEditHeader.style.display = 'none';
    slideEditHeader.style.display = 'flex';

    // Main Toggle
    listView.style.display = 'none';
    slideView.style.display = 'none';
    settings.style.display = 'none';
    slideEdit.style.display = 'flex';
    sliderManager.stop(); // 다른 뷰로 이동 시 슬라이더 정지

    // 입력 폼이 보이면 타이머 시작
    resetInactivityTimer(); // 타이머 타임아웃 시작
    
    // 사용자 활동 감지를 위한 이벤트 리스너 추가
    ['mousemove', 'keydown', 'click'].forEach(event => {
      slideEdit.addEventListener(event, resetInactivityTimer);
    });
  };

  const showOrderEdit = () => {
    // Header Toggle
    viewHeader.style.display = 'none';
    settingsHeader.style.display = 'none';
    orderEditHeader.style.display = 'flex';
    slideEditHeader.style.display = 'none';

    // Main Toggle
    listView.style.display = 'none';
    slideView.style.display = 'none';
    settings.style.display = 'none';
    slideEdit.style.display = 'none';
    orderEdit.style.display = 'flex';
    sliderManager.stop(); // 다른 뷰로 이동 시 슬라이더 정지

    // Up/Down 버튼 초기 비활성화
    orderUpButton.disabled = true;
    orderDownButton.disabled = true;

    updateSettings(); // 순서 편집 목록을 데이터로 채웁니다.    
    // Edit Order 화면 진입 시의 초기 순서를 저장
    initialOrderInEdit = Array.from(orderEditContainer.querySelectorAll('.table-content'))
                               .map(row => parseInt(row.dataset.order, 10));

    resetInactivityTimer();

    ['mousemove', 'keydown', 'click'].forEach(event => {
      orderEdit.addEventListener(event, resetInactivityTimer);
    });
  };

  // 날짜 포맷 변경 함수 (YYYY-MM-DD -> yy/mm/dd)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const shortYear = year.slice(-2);
    return `${shortYear}/${month}/${day}`;
  };

  // list-view 섹션의 내용을 업데이트하는 함수
  const updateListView = (dataArray) => {
    listViewContainer.innerHTML = ''; // 기존 목록 초기화

    // order가 큰 순서대로 (최신순) 정렬
    const sortedData = dataArray.sort((a, b) => b.order - a.order);

    sortedData.forEach(data => {
      const { order, testMachine, model, purpose, startDate, endDate } = data;

      const scheduleText = (startDate || endDate)
        ? `${formatDate(startDate)}&nbsp;&nbsp;~&nbsp;&nbsp;${formatDate(endDate)}`
        : '-';

      const tableRow = document.createElement('ul');
      tableRow.className = 'table-content';
      tableRow.innerHTML = `
        <li><span>${testMachine || '-'}</span></li>
        <li><span>${model || '-'}</span></li>
        <li><span>${purpose || '-'}</span></li>
        <li><span>${scheduleText}</span></li>
      `;
      listViewContainer.appendChild(tableRow);
    });
  };

  // settings, order-edit 섹션의 내용을 업데이트하는 함수
  const updateSettings = () => {
    settingsContainer.innerHTML = ''; // 기존 목록 초기화
    orderEditContainer.innerHTML = ''; // 순서 편집 목록 초기화

    const dataArray = storageManager.load();
    // order가 큰 순서대로 (최신순) 정렬
    const sortedData = dataArray.sort((a, b) => b.order - a.order);

    sortedData.forEach((data, index) => {
      const { order, testMachine, model, purpose, startDate, endDate } = data;

      const scheduleText = (startDate || endDate)
        ? `${formatDate(startDate)}&nbsp;&nbsp;~&nbsp;&nbsp;${formatDate(endDate)}`
        : '-';

      const tableRow = document.createElement('ul');
      tableRow.className = 'table-content';
      tableRow.dataset.order = order; // 데이터셋에 order 저장 (내부적으로 사용)
      tableRow.innerHTML = `
        <li><span>${order}</span></li>
        <li><span>${testMachine || '-'}</span></li>
        <li><span>${model || '-'}</span></li>
        <li><span>${purpose || '-'}</span></li>
        <li><span>${scheduleText}</span></li>
        <li>
          <button class="btn-delete" data-order="${order}">Delete</button>
          <button class="btn-modify" data-order="${order}">Edit</button>
        </li>
      `;
      settingsContainer.appendChild(tableRow);

      // order-edit-container를 위한 별도의 행 생성 (체크박스 포함)
      const orderEditTableRow = document.createElement('ul');
      orderEditTableRow.className = 'table-content';
      orderEditTableRow.dataset.order = order;
      const rowNumber = sortedData.length - index;
      orderEditTableRow.innerHTML = `
        <li><input type="checkbox" class="item-checkbox" value="${order}"></li>
        <li><span>${rowNumber}</span></li>
        <li><span>${testMachine || '-'}</span></li>
        <li><span>${model || '-'}</span></li>
        <li><span>${purpose || '-'}</span></li>
        <li><span>${scheduleText}</span></li>
      `;
      orderEditContainer.appendChild(orderEditTableRow);
    });
  };

  // 데이터 업데이트 및 저장 함수
  const applyDataChanges = (event) => {
    event.preventDefault(); // form의 기본 제출 동작(새로고침) 방지

    // 폼 유효성 검사
    if (!slideEdit.checkValidity()) {
      slideEdit.reportValidity(); // 유효성 검사 실패 시 브라우저 기본 메시지 표시
      return; // 유효성 검사 실패 시 함수 종료
    }

    if (confirm("작성하신 내용을 적용하시겠습니까?")) {
      // 1. 입력 값 가져오기
      const newTestMachine = testMachineInput.value.trim();
      const newModel = modelInput.value.trim();
      const newPurpose = purposeInput.value.trim();
      const newStartDate = startDateInput.value;
      const newEndDate = endDateInput.value;

      if (editingOrder) {
        // --- 데이터 수정 로직 ---
        const updatedData = { testMachine: newTestMachine, model: newModel, purpose: newPurpose, startDate: newStartDate, endDate: newEndDate };
        storageManager.updateData(editingOrder, updatedData);
        loadData(); // 데이터 다시 로드
        showSettings(); // 설정 화면으로 이동
        alert('작성하신 내용이 적용되었습니다.');
      } else {
        // --- 새 데이터 추가 로직 ---
        const newData = {
          order: 0, // order는 storageManager에서 할당
          testMachine: newTestMachine,
          model: newModel,
          purpose: newPurpose,
          startDate: newStartDate,
          endDate: newEndDate,
        };
        const isSuccess = storageManager.addData(newData);
        if (isSuccess) {
          loadData();
        } // 데이터 다시 로드
        showSettings(); // 설정 화면으로 이동
        reorderData();
        alert('작성하신 내용이 적용되었습니다.');
      }
    }
  };

  const reorderData = () => {
    const dataArray = storageManager.load();
    // order 기준으로 오름차순 정렬
    dataArray.sort((a, b) => a.order - b.order);

    // 순서대로 order 값을 재할당
    dataArray.forEach((data, index) => {
      data.order = index + 1;
    });

    // 재정렬된 데이터를 저장
    storageManager.save(dataArray);
  };

  // 페이지 로드 시 localStorage에서 데이터 불러오기
  const loadData = () => {
    const dataArray = storageManager.load(); 
    updateListView(dataArray);
    sliderManager.init(dataArray); // 슬라이더 초기화
  };

  const handleOrderEditCheckboxChange = (event) => {
    if (event.target.matches('.item-checkbox')) {
      const clickedCheckbox = event.target;
      const allCheckboxes = orderEditContainer.querySelectorAll('.item-checkbox');
      const allTableRows = orderEditContainer.querySelectorAll('.table-content');

      allTableRows.forEach(row => {
        row.classList.remove('selected');
      });

      if (clickedCheckbox.checked) {
        const parentRow = clickedCheckbox.closest('.table-content');

        allCheckboxes.forEach(checkbox => {
          if (checkbox !== clickedCheckbox) {
            checkbox.checked = false;
          }
        });

        if (parentRow) {
          parentRow.classList.add('selected');
        }

      }

      // 체크박스 상태에 따라 Up/Down 버튼 활성화/비활성화
      const selectedRow = orderEditContainer.querySelector('.table-content.selected');
      if (selectedRow) {
        updateOrderButtonsState(selectedRow);
      } else {
        updateOrderButtonsState(null);
      }
    }
  };

  // List의 수정/삭제 버튼 처리를 위한 이벤트 핸들러
  const handleSettingsAction = (event) => {
    const target = event.target;

    // 삭제 버튼 클릭 시
    if (target.matches('.btn-delete')) {
      const order = target.dataset.order;
      const dataArray = storageManager.load();
      const dataToDelete = dataArray.find(d => d.order == order);

      if (dataToDelete && confirm(`${dataToDelete.testMachine} 항목을 삭제하시겠습니까?`)) {
        storageManager.deleteData(order);
        reorderData();
        loadData(); // list-view, slide-view 데이터 갱신
        updateSettings(); // settings, order-edit 목록 갱신        
        alert(`${dataToDelete.testMachine} 항목이 삭제되었습니다.`);
      }
    }

    // 수정 버튼 클릭 시
    if (target.matches('.btn-modify')) {
      const order = target.dataset.order;
      const dataArray = storageManager.load();
      const dataToEdit = dataArray.find(d => d.order == order);

      if (dataToEdit) {
        slideEditTitle.textContent = 'Edit Contents'; // 타이틀을 'Edit Contents'으로 설정
        editingOrder = order; // 수정 모드로 설정
        // 폼에 데이터 채우기 및 화면 전환
        originalEditData = { ...dataToEdit }; // 원본 데이터 저장
        testMachineInput.value = dataToEdit.testMachine || '';
        modelInput.value = dataToEdit.model || '';
        purposeInput.value = dataToEdit.purpose || '';
        startDateInput.value = dataToEdit.startDate || '';
        endDateInput.value = dataToEdit.endDate || '';
        showCreateForm();
      }
    }
  };

  // Up/Down 버튼의 활성화/비활성화 상태를 업데이트하는 함수
  const updateOrderButtonsState = (selectedRow) => {
    if (!selectedRow) {
      orderUpButton.disabled = true;
      orderDownButton.disabled = true;
      return;
    }
    // 첫 번째 자식이면 Up 버튼 비활성화, 아니면 활성화
    orderUpButton.disabled = !selectedRow.previousElementSibling;
    // 마지막 자식이면 Down 버튼 비활성화, 아니면 활성화
    orderDownButton.disabled = !selectedRow.nextElementSibling;
  };

  // order-edit 테이블의 'New Order' 열 번호를 다시 매기는 함수
  const updateOrderEditNumbers = () => {
    const allRows = orderEditContainer.querySelectorAll('.table-content');
    const totalRows = allRows.length;
    allRows.forEach((row, index) => {
      const newOrderCell = row.querySelector('li:nth-child(2) span');
      if (newOrderCell) {
        newOrderCell.textContent = totalRows - index;
      }
    });
  };

  // 이벤트 리스너 연결
  changeViewButton.addEventListener('click', () => {
    if (activeMainView === 'list') {
      listView.style.display = 'none';
      slideView.style.display = 'flex';
      activeMainView = 'slide';
      const dataArray = storageManager.load();
      sliderManager.init(dataArray); // 슬라이드 뷰 활성화 시 슬라이더 시작
    } else {
      listView.style.display = 'flex';
      slideView.style.display = 'none';
      activeMainView = 'list';
      sliderManager.stop(); // 리스트 뷰 활성화 시 슬라이더 정지
    }
  });

  settingsButton.addEventListener('click', showSettings);

  backToViewButton.addEventListener('click', showView);
  
  // Edit Order 화면의 Back 버튼
  backFromCreateButton.addEventListener('click', () => {
    // 현재 DOM에 표시된 순서를 가져옴
    const currentOrderInEdit = Array.from(orderEditContainer.querySelectorAll('.table-content'))
                                   .map(row => parseInt(row.dataset.order, 10));

    // 초기 순서와 현재 순서를 비교하여 실제 변경이 있었는지 확인
    const hasOrderActuallyChanged = JSON.stringify(currentOrderInEdit) !== JSON.stringify(initialOrderInEdit);

    if (hasOrderActuallyChanged) {
      if (!confirm("변경된 순서가 저장되지 않았습니다. 정말로 나가시겠습니까?")) {
        return; // 사용자가 '취소'를 누르면 나가지 않음
      }
    }
    showSettings();
  });

  // Create/Edit 화면의 Back 버튼
  backfromSlideButton.addEventListener('click', () => {
    let hasChanges = false;
    if (editingOrder) { // Edit 모드
      hasChanges = (originalEditData.testMachine || '') !== testMachineInput.value ||
                   (originalEditData.model || '') !== modelInput.value ||
                   (originalEditData.purpose || '') !== purposeInput.value ||
                   (originalEditData.startDate || '') !== startDateInput.value ||
                   (originalEditData.endDate || '') !== endDateInput.value;
      if (hasChanges && !confirm("수정된 내용이 저장되지 않았습니다. 정말로 나가시겠습니까?")) {
        return;
      }
    } else { // Create 모드
      hasChanges = testMachineInput.value || modelInput.value || purposeInput.value || startDateInput.value || endDateInput.value;
      if (hasChanges && !confirm("작성중인 내용이 있습니다. 정말로 나가시겠습니까?")) {
        return;
      }
    }
    showSettings();
  });


  createButton.addEventListener('click', () => {
    const dataArray = storageManager.load();
    if (dataArray.length >= 10) {
      alert("최대 10개까지 작성할 수 있습니다.");
      return;
    }
    
    slideEditTitle.textContent = 'Create Contents'; // 타이틀을 'Create Contents'로 설정
    editingOrder = null; // 'Create' 버튼 클릭 시에만 수정 모드 해제

    // form 안의 모든 input 내용 초기화
    const formElements = slideEdit.querySelectorAll('input, textarea');
    formElements.forEach(element => {
      if (element.type === 'date') {
        element.value = '';
      } else {
        element.value = '';
      }
    });

    showCreateForm();
  });
  applySlideButton.addEventListener('click', applyDataChanges);
  orderButton.addEventListener('click', showOrderEdit);
  
  settingsContainer.addEventListener('click', handleSettingsAction);
  orderEditContainer.addEventListener('click', handleOrderEditCheckboxChange);

  orderUpButton.addEventListener('click', () => {
    const selectedRow = orderEditContainer.querySelector('.table-content.selected');
    if (selectedRow && selectedRow.previousElementSibling) {
      // DOM에서 요소의 위치를 위로 이동
      orderEditContainer.insertBefore(selectedRow, selectedRow.previousElementSibling);
      updateOrderButtonsState(selectedRow);
      updateOrderEditNumbers(); // 순서 변경 후 번호 다시 매기기
    }
  });

  orderDownButton.addEventListener('click', () => {
    const selectedRow = orderEditContainer.querySelector('.table-content.selected');
    if (selectedRow && selectedRow.nextElementSibling) {
      orderEditContainer.insertBefore(selectedRow.nextElementSibling, selectedRow);
      updateOrderButtonsState(selectedRow);
      updateOrderEditNumbers(); // 순서 변경 후 번호 다시 매기기
    }
  });

  applyOrderButton.addEventListener('click', () => {
    if (confirm("변경된 순서를 적용하시겠습니까?")) {
      // 현재 DOM 순서대로 data-order 값을 배열로 만듦
      const orderedIds = Array.from(orderEditContainer.querySelectorAll('.table-content'))
                              .map(row => row.dataset.order);
      
      // storageManager를 통해 순서 저장
      storageManager.saveOrder(orderedIds);

      // 화면 갱신
      loadData(); // list-view, slide-view 갱신
      updateSettings(); // 현재 order-edit-section 갱신
      // Up/Down 버튼 비활성화
      orderUpButton.disabled = true;
      orderDownButton.disabled = true;
      alert('변경된 순서가 적용되었습니다.');
    }
  });

  // 페이지가 처음 로드될 때 저장된 데이터를 불러옴
  loadData(); // list-view 갱신

  // 초기 상태 설정
  viewHeader.style.display = 'flex';
  settingsHeader.style.display = 'none';
  orderEditHeader.style.display = 'none';
  slideEditHeader.style.display = 'none';

  slideView.style.display = 'flex';
  listView.style.display = 'none';
  orderEdit.style.display = 'none';
  settings.style.display = 'none';
  slideEdit.style.display = 'none';
});