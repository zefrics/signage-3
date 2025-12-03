document.addEventListener('DOMContentLoaded', () => {
  const testerNameElement = document.querySelector('#tester-name');
  const functionElement = document.querySelector('#function');
  const specificationsElement = document.querySelector('#specifications');

  const listViewContainer = document.querySelector('#list-view-container');
  const sliderEditContainer = document.querySelector('#slider-edit-container');

  // cover-view 섹션의 내용을 업데이트하는 함수
  const updateCoverView = () => {
    // coverData가 null일 경우를 대비해 기본값을 빈 객체로 설정
    const coverData = storageManager.loadCoverData();

    if (coverData && testerNameElement && functionElement && specificationsElement) {
      testerNameElement.textContent = coverData.testerName;

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
        functionElement.innerHTML = coverData.function.filter(Boolean).map(item => `<li class="content">${item}</li>`).join('');
      } else {
        functionElement.innerHTML = '';
      }

      // Specifications 데이터를 li 형태로 변환하여 기존 ul에 삽입
      if (coverData.specifications && coverData.specifications.length > 0) {
        specificationsElement.innerHTML = coverData.specifications.filter(Boolean).map(item => `<li class="content">${item}</li>`).join('');
      } else {
        specificationsElement.innerHTML = '';
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

  // slide-view 섹션의 내용을 업데이트하는 함수 (slider.js에서 이동)
  const updateSlideView = (data) => {
    const slideContainer = document.querySelector('#slide-view');
    if (!slideContainer || !data) return;

    // 날짜 포맷 변경 함수 (YYYY-MM-DD -> yy년 mm월 dd일)
    const formatFullDate = (dateString) => {
      if (!dateString) return '';
      const [fullYear, month, day] = dateString.split('-');
      const shortYear = fullYear.slice(-2); // 연도의 마지막 두 자리만 추출
      return `${shortYear}년 ${month}월 ${day}일`;
    };

    const { testMachine, model, purpose, startDate, endDate, imagePath } = data;

    const scheduleText = (startDate || endDate)
      ? `${formatFullDate(startDate)}&nbsp;~&nbsp;${formatFullDate(endDate)}`
      : '-';

    // 이미지 표시 로직
    const slideImgSelectedFrame = slideContainer.querySelector('#slide-img-selected');
    const slideImgDefaultFrame = slideContainer.querySelector('#slide-img-default');
    if (imagePath && slideImgSelectedFrame && slideImgDefaultFrame) {
      slideImgSelectedFrame.querySelector('.selected').src = Capacitor.convertFileSrc(imagePath);
      slideImgSelectedFrame.style.display = 'flex';
      slideImgDefaultFrame.style.display = 'none';
    } else if (slideImgSelectedFrame && slideImgDefaultFrame) {
      slideImgSelectedFrame.style.display = 'none';
      slideImgDefaultFrame.style.display = 'flex';
    }

    // slide-view 내부의 각 p 태그에 내용 채우기
    slideContainer.querySelector('.test-machine-content').textContent = testMachine || '-';
    slideContainer.querySelector('.model-content').textContent = model || '-';
    slideContainer.querySelector('.purpose-content').textContent = purpose || '-';
    slideContainer.querySelector('.schedule-content').innerHTML = scheduleText;
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
    const slideData = storageManager.load();
    const coverData = storageManager.loadCoverData();

    // sliderManager가 init 시점에 updateSlideView를 호출할 수 있도록 viewDataManager 객체를 먼저 생성하고 노출합니다.
    window.viewDataManager = { updateSlideView };

    const slidesContainer = document.querySelector('#slides');
    if (slidesContainer) sliderManager.init(slideData, coverData); // coverData 전달
    if (listViewContainer) updateListView(slideData);
    if (sliderEditContainer) updateSliderEditView(slideData);

    // index.html 또는 view-list.html의 cover에 적용
    const slideCover = document.querySelector('#cover');
    if (slideCover) updateCoverView();
  };

  // 페이지가 처음 로드될 때 저장된 데이터를 불러옴
  loadData();
});