// Capacitor 유틸리티 가져오기
// Capacitor 객체가 이미 선언되지 않았을 경우에만 초기화
if (typeof window.Capacitor === 'undefined') {
  // 웹 브라우저 환경을 위한 Mock(가짜) 플러그인 설정
  if (typeof capacitorExports === 'undefined') {
    console.warn('Capacitor is not available. Using mock Capacitor object for browser testing.');
    window.Capacitor = {
      convertFileSrc: (path) => path // 웹에서는 경로를 그대로 반환
    };
  } else {
    // 실제 기기 환경에서는 Capacitor 객체를 사용합니다.
    window.Capacitor = capacitorExports.Capacitor;
  }
}

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
    // coverData가 null일 경우를 대비해 기본값을 빈 객체로 설정
    const coverData = storageManager.loadCoverData() || {};

    if (testerNameElement && functionElement && specificationsElement) {
      testerNameElement.textContent = coverData.testerName || '(Cover Title)';

      // 이미지 표시 로직 추가
      const coverImgSelectedFrame = document.querySelector('#cover-img-selected');
      const coverImgDefaultFrame = document.querySelector('#cover-img-default');
      if (coverData.imagePath && coverImgSelectedFrame && coverImgDefaultFrame) {
        // 저장된 경로를 웹뷰가 사용할 수 있는 URL로 변환
        coverImgSelectedFrame.querySelector('.selected').src = Capacitor.convertFileSrc(coverData.imagePath);
        coverImgSelectedFrame.style.display = 'flex';
        coverImgDefaultFrame.style.display = 'none';
      } else if (coverImgSelectedFrame && coverImgDefaultFrame) {
        // 이미지가 없을 경우
        coverImgSelectedFrame.style.display = 'none';
        coverImgDefaultFrame.style.display = 'flex';
      }

      // Function 데이터를 li 형태로 변환하여 기존 ul에 삽입
      if (coverData.function && coverData.function.length > 0) {
        functionElement.innerHTML = coverData.function.map(item => `<li class="content">${item}</li>`).join('');
      } else {
        functionElement.innerHTML = `<li class="content"></li>`;
      }

      // Specifications 데이터를 li 형태로 변환하여 기존 ul에 삽입
      if (coverData.specifications && coverData.specifications.length > 0) {
        specificationsElement.innerHTML = coverData.specifications.map(item => `<li class="content">${item}</li>`).join('');
      } else {
        specificationsElement.innerHTML = `<li class="content"></li>`;
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