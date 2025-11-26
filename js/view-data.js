document.addEventListener('DOMContentLoaded', () => {
  const testerNameElement = document.querySelector('#tester-name');
  const functionElement = document.querySelector('#function');
  const specificationsElement = document.querySelector('#specifications');

  const listViewContainer = document.querySelector('#list-view-container');
  const sliderEditContainer = document.querySelector('#slider-edit-container');

  // 날짜 포맷 변경 함수 (YYYY-MM-DD -> yy/mm/dd)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const shortYear = year.slice(-2);
    return `${shortYear}/${month}/${day}`;
  };

  // cover-view 섹션의 내용을 업데이트하는 함수
  const updateCoverView = () => {
    const coverData = storageManager.loadCoverData();
    if (testerNameElement && functionElement && specificationsElement) {
      if (coverData) {
        testerNameElement.textContent = coverData.testerName || '';
        functionElement.textContent = coverData.function || '';
        specificationsElement.textContent = coverData.specifications || '';
      } else {
        testerNameElement.textContent = '(Tester Name)';
        functionElement.textContent = '(Function Content)';
        specificationsElement.textContent = '(Specifications Content)';
      }
    }
  };

  // list-view 섹션의 내용을 업데이트하는 함수
  const updateListView = (dataArray) => {
    if (!listViewContainer) return;
    listViewContainer.innerHTML = ''; // 기존 목록 초기화

    // order가 큰 순서대로 (최신순) 정렬
    const sortedData = dataArray.sort((a, b) => b.order - a.order);

    sortedData.forEach(data => {
      const { testMachine, model, purpose, startDate, endDate } = data;

      const scheduleText = (startDate || endDate)
        ? `${formatDate(startDate)}&nbsp;~&nbsp;${formatDate(endDate)}`
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

  // edit-slider 섹션의 내용을 업데이트하는 함수
  const updateSliderEditView = (dataArray) => {
    if (!sliderEditContainer) return;
    sliderEditContainer.innerHTML = ''; // 기존 목록 초기화

    // order가 큰 순서대로 (최신순) 정렬
    const sortedData = dataArray.sort((a, b) => b.order - a.order);

    sortedData.forEach(data => {
      const { order, testMachine, model, purpose, startDate, endDate } = data;

      const scheduleText = (startDate || endDate)
        ? `${formatDate(startDate)}&nbsp;~&nbsp;${formatDate(endDate)}`
        : '-';

      const tableRow = document.createElement('ul');
      tableRow.className = 'table-content';
      tableRow.dataset.order = order; // 데이터셋에 order 저장
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
      sliderEditContainer.appendChild(tableRow);
    });
  };

  // 페이지 로드 시 localStorage에서 데이터 불러오기
  const loadData = () => {
    const dataArray = storageManager.load(); 
    const slidesContainer = document.querySelector('#slides');
    if (slidesContainer) sliderManager.init(dataArray);
    if (listViewContainer) updateListView(dataArray);
    if (sliderEditContainer) updateSliderEditView(dataArray);

    // index.html의 cover에만 적용
    const slideCover = document.querySelector('#cover');
    if (slideCover) updateCoverView();
  };

  // 페이지가 처음 로드될 때 저장된 데이터를 불러옴
  loadData();
});