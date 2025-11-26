document.addEventListener('DOMContentLoaded', () => {
  // DOM 요소 참조
  const orderEditContainer = document.querySelector('#order-edit-container');
  const orderUpButton = document.querySelector('#btn-order-up');
  const orderDownButton = document.querySelector('#btn-order-down');
  const applyOrderButton = document.querySelector('#btn-apply-order');

  let initialOrderInEdit = []; // Edit Order 모드 진입 시의 초기 순서를 저장
  let isApplying = false; // Apply 버튼 클릭 여부 플래그

  // settings, order-edit 섹션의 내용을 업데이트하는 함수
  const updateSettings = () => {
    orderEditContainer.innerHTML = ''; // 순서 편집 목록 초기화

    const dataArray = storageManager.load();
    // order가 큰 순서대로 (최신순) 정렬
    const sortedData = dataArray.sort((a, b) => b.order - a.order);

    sortedData.forEach((data, index) => {
      const { order, testMachine, model, purpose, startDate, endDate } = data;

      const scheduleText = (startDate || endDate)
        ? `${formatDate(startDate)}&nbsp;~&nbsp;${formatDate(endDate)}`
        : '-';

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

  // 날짜 포맷 변경 함수 (YYYY-MM-DD -> yy/mm/dd)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const shortYear = year.slice(-2);
    return `${shortYear}/${month}/${day}`;
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

  // 페이지 로드 시 순서 편집 목록을 업데이트
  updateSettings();

  // Edit Order 화면 진입 시의 초기 순서를 저장
  initialOrderInEdit = Array.from(orderEditContainer.querySelectorAll('.table-content'))
    .map(row => parseInt(row.dataset.order, 10));

  // 이벤트 리스너 등록: 체크박스 변경 시
  orderEditContainer.addEventListener('click', (event) => {
    if (event.target.matches('.item-checkbox')) {
      const clickedCheckbox = event.target;
      const allCheckboxes = orderEditContainer.querySelectorAll('.item-checkbox');
      const allTableRows = orderEditContainer.querySelectorAll('.table-content');

      // 모든 행에서 'selected' 클래스 제거
      allTableRows.forEach(row => row.classList.remove('selected'));

      // 클릭된 체크박스를 제외한 모든 체크박스를 해제
      allCheckboxes.forEach(checkbox => {
        if (checkbox !== clickedCheckbox) {
          checkbox.checked = false;
        }
      });

      // 클릭된 체크박스가 현재 체크 상태라면 해당 행에 'selected' 클래스 추가
      if (clickedCheckbox.checked) { // 브라우저가 이미 clickedCheckbox.checked를 토글한 상태
        const parentRow = clickedCheckbox.closest('.table-content');
        if (parentRow) {
          parentRow.classList.add('selected');
        }
      }

      const selectedRow = orderEditContainer.querySelector('.table-content.selected');
      updateOrderButtonsState(selectedRow);
    }
  });

  // 이벤트 리스너 등록: Up 버튼 클릭 시
  orderUpButton.addEventListener('click', () => {
    const selectedRow = orderEditContainer.querySelector('.table-content.selected');
    if (selectedRow && selectedRow.previousElementSibling) {
      orderEditContainer.insertBefore(selectedRow, selectedRow.previousElementSibling);
      updateOrderButtonsState(selectedRow);
      updateOrderEditNumbers();
    }
  });

  // 이벤트 리스너 등록: Down 버튼 클릭 시
  orderDownButton.addEventListener('click', () => {
    const selectedRow = orderEditContainer.querySelector('.table-content.selected');
    if (selectedRow && selectedRow.nextElementSibling) {
      orderEditContainer.insertBefore(selectedRow.nextElementSibling, selectedRow);
      updateOrderButtonsState(selectedRow);
      updateOrderEditNumbers();
    }
  });

  // 초기 Up/Down 버튼 상태 설정
  updateOrderButtonsState(null);

  // 이벤트 리스너 등록: Apply 버튼 클릭 시
  applyOrderButton.addEventListener('click', () => {
    if (confirm("변경된 순서를 적용하시겠습니까?")) {
      isApplying = true; // 제출 시작
      // 현재 DOM 순서대로 data-order 값을 배열로 만듦
      const orderedIds = Array.from(orderEditContainer.querySelectorAll('.table-content'))
        .map(row => row.dataset.order);

      // storageManager를 통해 순서 저장
      storageManager.saveOrder(orderedIds);

      alert('변경된 순서가 적용되었습니다.');
      window.location.reload(); // 페이지를 새로고침하여 변경된 순서를 보여줌
    }
  });

  // 페이지를 벗어나기 전에 변경 사항이 있는지 확인
  window.addEventListener('beforeunload', (event) => {
    // 현재 DOM 순서대로 data-order 값을 배열로 만듦
    const currentOrder = Array.from(orderEditContainer.querySelectorAll('.table-content'))
      .map(row => row.dataset.order);

    // initialOrderInEdit과 현재 순서(currentOrder)를 비교
    const isOrderChanged = !initialOrderInEdit.every((value, index) => value == currentOrder[index]);

    // 순서가 변경되었으면 경고 메시지를 표시
    if (isOrderChanged && !isApplying) {
      // 경고 메시지 설정
      const message = '순서가 변경되었습니다. 적용하지 않고 페이지를 나가시겠습니까?';
      event.returnValue = message; // 표준
      return message; // IE, Firefox, Safari에서 동작
    }
  });

  // Edit Order 화면 진입 시의 초기 순서를 저장
  initialOrderInEdit = Array.from(orderEditContainer.querySelectorAll('.table-content'))
    .map(row => row.dataset.order);

});