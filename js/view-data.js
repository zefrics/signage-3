const { Capacitor } = window;
import { formatDate } from './date.js';
import { storageManager } from './storage.js';
import { sliderManager } from './slider.js';
import { timerManager } from './edit-timer.js';

document.addEventListener('DOMContentLoaded', () => {
  const sliderEditContainer = document.querySelector('#slider-edit-container');

  // list-view 섹션의 내용을 업데이트하는 함수
  const updateListView = (dataArray) => {
    const listPagesContainer = document.querySelector('#list-pages-container');
    if (!listPagesContainer) return;
    listPagesContainer.innerHTML = ''; // 기존 목록 페이지들 초기화

    // order가 낮은 순서대로 (오래된 순) 정렬
    const sortedData = dataArray.sort((a, b) => a.order - b.order);
    const totalItems = sortedData.length;
    let chunks = [];

    if (totalItems <= 5) {
      // 5개 이하일 경우, 한 페이지에 모두 표시
      chunks.push(sortedData);
    } else {
      // 6개 이상일 경우, 두 페이지로 균등하게 분배
      const firstPageCount = Math.ceil(totalItems / 2);
      chunks.push(sortedData.slice(0, firstPageCount)); // 첫 번째 페이지 (오래된 데이터)
      chunks.push(sortedData.slice(firstPageCount));    // 두 번째 페이지 (최신 데이터)
    }

    chunks.forEach((chunk, index) => {
      const pageIndex = index + 1;
      // 각 페이지(chunk) 내부에서는 order가 높은 순서(최신순)로 정렬
      chunk.sort((a, b) => b.order - a.order);

      const listPageElement = createListPage(pageIndex);

      const listViewContainer = listPageElement.querySelector('.list-view-container');

      chunk.forEach((data, itemIndex) => {
        const { testMachine, model, purpose, startDate, endDate } = data;

        let scheduleText;
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        if (formattedStartDate && formattedEndDate) {
          scheduleText = `${formattedStartDate}<br>~ ${formattedEndDate}`;
        } else if (formattedStartDate) {
          scheduleText = `${formattedStartDate} ~`;
        } else if (formattedEndDate) {
          scheduleText = `~ ${formattedEndDate}`;
        } else {
          scheduleText = '-';
        }

        const tableRow = document.createElement('ul');
        tableRow.className = 'table-content';

        // 하이라이트 로직을 짝수 번째 행을 확인하는 방식으로 단순화
        if (itemIndex % 2 !== 0) {
          tableRow.classList.add('highlight');
        }

        tableRow.innerHTML = `
        <li><span>${testMachine || '-'}</span></li>
        <li><span>${model || '-'}</span></li>
        <li><span>${purpose || '-'}</span></li>
        <li><span>${scheduleText}</span></li>
      `;
        listViewContainer.appendChild(tableRow);
      });
      
      // prepend를 사용하여 페이지 순서를 뒤집어, 최신 데이터가 담긴 페이지가 먼저 오도록 함
      listPagesContainer.prepend(listPageElement);
    });
  };

  // 목록 페이지(표)의 기본 구조를 생성하는 함수
  const createListPage = (pageIndex) => {
    const listPage = document.createElement('div');
    listPage.id = `list-view-${pageIndex}`;
    listPage.className = 'section list-page';
    listPage.style.display = 'none'; // 기본적으로 숨김

    listPage.innerHTML = `
      <ul class="table-header">
        <li>Test Machine</li>
        <li>Model</li>
        <li>Purpose</li>
        <li>Schedule</li>
      </ul>
      <div class="list-view-container"></div>
    `;
    return listPage;
  };

  // cover-view 섹션의 내용을 업데이트하는 함수
  const updateCoverView = (data) => {
    const itemViewContainer = document.querySelector('#item-view');
    const coverViewContainer = document.querySelector('#cover-view');
    if (!data || !coverViewContainer) return;

    // Cover 뷰를 보여주고 Item 뷰는 숨김
    if (itemViewContainer) itemViewContainer.style.display = 'none';
    coverViewContainer.style.display = 'flex';

    // cover-view 내용 업데이트
    document.querySelector('#tester-name').textContent = data.testerName || '';
    const functionEl = document.querySelector('#function');
    const specificationsEl = document.querySelector('#specifications');
    if (functionEl) functionEl.innerHTML = (data.function || []).filter(Boolean).map(item => `<li class="content">${item}</li>`).join('');
    if (specificationsEl) specificationsEl.innerHTML = (data.specifications || []).filter(Boolean).map(item => `<li class="content">${item}</li>`).join('');

    const coverImgSelected = document.querySelector('#cover-img-selected');
    const coverImgDefault = document.querySelector('#cover-img-default');
    if (data.imagePath && coverImgSelected && coverImgDefault) {
      coverImgSelected.querySelector('.selected').src = Capacitor.convertFileSrc(data.imagePath);
      coverImgSelected.style.display = 'flex';
      coverImgDefault.style.display = 'none';
    } else if (coverImgSelected && coverImgDefault) {
      coverImgSelected.style.display = 'none';
      coverImgDefault.style.display = 'flex';
    }
  };

  // item-view 섹션의 내용을 업데이트하는 함수
  const updateItemView = (data) => {
    const itemViewContainer = document.querySelector('#item-view');
    const coverViewContainer = document.querySelector('#cover-view');
    if (!data || !itemViewContainer) return;

    // Item 뷰를 보여주고 Cover 뷰는 숨김
    if (coverViewContainer) coverViewContainer.style.display = 'none';
    itemViewContainer.style.display = 'flex';

    // item-view 내용 업데이트
    const formatFullDate = (dateString) => {
      if (!dateString) return '';
      const [fullYear, month, day] = dateString.split('-');
      const shortYear = fullYear.slice(-2);
      return `${shortYear}년 ${month}월 ${day}일`;
    };

    const { testMachine, model, purpose, startDate, endDate, imagePath } = data;

    const scheduleText = (startDate || endDate)
      ? `${formatFullDate(startDate)}&nbsp;~&nbsp;${formatFullDate(endDate)}`
      : '-';

    const itemImgSelected = itemViewContainer.querySelector('#item-img-selected');
    const itemImgDefault = itemViewContainer.querySelector('#item-img-default');
    if (imagePath && itemImgSelected && itemImgDefault) {
      itemImgSelected.querySelector('.selected').src = Capacitor.convertFileSrc(imagePath);
      itemImgSelected.style.display = 'flex';
      itemImgDefault.style.display = 'none';
    } else if (itemImgSelected && itemImgDefault) {
      itemImgSelected.style.display = 'none';
      itemImgDefault.style.display = 'flex';
    }

    itemViewContainer.querySelector('.test-machine-content').textContent = testMachine || '-';
    itemViewContainer.querySelector('.model-content').textContent = model || '-';
    itemViewContainer.querySelector('.purpose-content').textContent = purpose || '-';
    itemViewContainer.querySelector('.schedule-content').innerHTML = scheduleText;
  };

  // edit-slider 섹션의 내용을 업데이트하는 함수
  const updateSliderEditView = (dataArray) => {
    if (!sliderEditContainer) return;
    sliderEditContainer.innerHTML = ''; // 기존 목록 초기화

    // order가 큰 순서대로 (최신순) 정렬
    const sortedData = dataArray.sort((a, b) => b.order - a.order);

    sortedData.forEach((data, index) => {
      const { order, testMachine, testerName } = data;
      // type이 없는 기존 데이터를 위해 기본값을 'Item'으로 설정
      const type = data.type || 'Item'; 
      
      // 타입에 따라 표시할 이름과 수정 페이지 경로 결정
      const name = type === 'Cover' ? testerName : testMachine;
      const editUrl = type === 'Cover' ? 'edit-cover.html' : 'edit-item.html';

      const tableRow = document.createElement('ul');
      tableRow.className = 'table-content';
      tableRow.dataset.order = order; // 데이터셋에 order 저장
      tableRow.dataset.type = type; // 데이터셋에 type 저장

      // 짝수 번째 행에 하이라이트 클래스 추가 (index는 0부터 시작하므로 홀수 index가 짝수 번째)
      if (index % 2 !== 0) {
        tableRow.classList.add('highlight');
      }
      tableRow.innerHTML = `
        <li class="drag-handle"><img src="img/edit-order.svg"></li>
        <li><span>${sortedData.length - index}</span></li>
        <li><span>${type}</span></li>
        <li><span>${name || '-'}</span></li>
        <li>
          <button class="btn-delete" data-order="${order}">
            <img src="img/delete.svg">
            <div class="text">Delete</div>
          </button>
          <button class="btn-modify" data-order="${order}" data-edit-url="${editUrl}?order=${order}">
            <img src="img/edit.svg">
            <div class="text">Edit</div>
          </button>
        </li>
      `;
      sliderEditContainer.appendChild(tableRow);
    });
  };

  // SortableJS 초기화
  if (sliderEditContainer) {
    new window.Sortable(sliderEditContainer, {
      handle: '.drag-handle', // 드래그 핸들 클래스 지정
      animation: 100, // 애니메이션 효과
      scroll: true, // 자동 스크롤 활성화
      scrollSensitivity: 100, // 스크롤 감도 증가 (기본값 30)
      scrollSpeed: 10, // 스크롤 속도 증가 (기본값 10)
      ghostClass: 'sortable-ghost', // 드래그 시 플레이스홀더에 적용될 클래스
      dragClass: 'sortable-drag',   // 드래그하는 항목에 적용될 클래스
      onEnd: function (evt) {
        // 현재 DOM 순서대로 data-order 값을 배열로 만듦
        const orderedIds = Array.from(sliderEditContainer.querySelectorAll('.table-content'))
          .map(row => row.dataset.order);
        // storageManager를 통해 순서 저장
        storageManager.saveOrder(orderedIds);
        // 화면의 순번을 다시 매김
        // 순서 변경 후 전체 뷰를 다시 렌더링하여 data-order 속성과 표시 순번을 모두 업데이트
        updateSliderEditView(storageManager.load());
      }
    });
  }

  // settings.html의 목록 이벤트 처리 (삭제, 수정)
  if (sliderEditContainer) {
    sliderEditContainer.addEventListener('click', (event) => {
      const deleteButton = event.target.closest('.btn-delete');
      const modifyButton = event.target.closest('.btn-modify');

      // 삭제 버튼 클릭 시
      if (deleteButton) {
        (async () => {
          try {
            const order = deleteButton.dataset.order;
            const dataArray = storageManager.load();
            const dataToDelete = dataArray.find(d => d.order == order);
            if (!dataToDelete) return;

            const name = dataToDelete.type === 'Cover' ? dataToDelete.testerName : dataToDelete.testMachine;

            if (confirm(`'${name}' 항목을 삭제하시겠습니까?`)) {
              // Capacitor Filesystem API가 있는 경우 이미지 파일 삭제 시도
              if (dataToDelete.imagePath && window.Capacitor && window.Capacitor.Plugins.Filesystem) {
                try {
                  await window.Capacitor.Plugins.Filesystem.deleteFile({ path: dataToDelete.imagePath });
                } catch (error) {
                  console.error('항목 삭제 중 이미지 파일 삭제에 실패했습니다.', error);
                  // 파일 삭제 실패 시 사용자에게 알리고, 데이터 삭제를 중단합니다.
                  alert('데이터에 연결된 이미지 파일을 삭제하는 데 실패했습니다. 삭제 작업을 다시 진행해주세요.');
                  return; // 함수 실행을 여기서 중단
                }
              }

              storageManager.deleteData(order);
              alert(`'${name}' 항목이 삭제되었습니다.`);
              window.location.reload(); // 페이지를 새로고침하여 목록 갱신
            }
          } catch (e) {
            console.error('삭제 처리 중 오류가 발생했습니다.', e);
            alert('항목을 삭제하는 데 실패했습니다.');
          }
        })();
      }

      // 수정 버튼 클릭 시
      if (modifyButton) {
        if (modifyButton.dataset.editUrl) window.location.href = modifyButton.dataset.editUrl;
      }
    });
  }

  // 페이지 로드 시 localStorage에서 데이터 불러오기
  const loadData = () => {
    const slideData = storageManager.load();

    // 목록 페이지(view-list.html) 또는 슬라이더 편집 목록(settings.html)을 먼저 생성합니다.
    if (document.querySelector('#list-pages-container')) updateListView(slideData.filter(d => d.type !== 'Cover'));
    if (sliderEditContainer) updateSliderEditView(slideData);

    // 현재 페이지에 맞는 슬라이더 컨테이너를 찾아 초기화
    const sliderContainer = document.querySelector('#items') || document.querySelector('#lists');
    if (sliderContainer) sliderManager.init(slideData, { updateCoverView, updateItemView });

  };

  // settings.html 페이지의 타이머 초기화
  const path = window.location.pathname.split("/").pop();
  if (path === 'settings.html') {
    const elementToMonitor = document.querySelector('#slider-edit');
    const homeButton = document.querySelector('#btn-home');

    const previousPath = localStorage.getItem(storageManager.KEY_PATH) || 'slide'; // 기본값 'slide'
    let homeUrl = previousPath === 'list' ? 'view-list.html' : 'index.html';

    if (homeButton) homeButton.href = homeUrl;

    const timerSettings = storageManager.loadTimerSettings();
    const timeoutSeconds = timerSettings.homeTimer || 90;
    timerManager.init(() => {
      window.location.href = homeUrl;
    }, timeoutSeconds);
    timerManager.start([elementToMonitor]);
  }

  // New Cover/Item 버튼 생성 제한 로직
  const newCoverButton = document.querySelector('a[href="edit-cover.html"]');
  const newItemButton = document.querySelector('a[href="edit-item.html"]');

  if (newCoverButton) {
    newCoverButton.addEventListener('click', (event) => {
      event.preventDefault(); // 기본 링크 이동 방지
      const allData = storageManager.load();
      const coverCount = allData.filter(d => d.type === 'Cover').length;

      if (coverCount >= 5) {
        alert('Cover는 최대 5개까지 생성할 수 있습니다.');
      } else {
        window.location.href = newCoverButton.href;
      }
    });
  }

  if (newItemButton) {
    newItemButton.addEventListener('click', (event) => {
      event.preventDefault(); // 기본 링크 이동 방지
      const allData = storageManager.load();
      const itemCount = allData.filter(d => d.type === 'Item').length;

      if (itemCount >= 10) {
        alert('Item은 최대 10개까지 생성할 수 있습니다.');
      } else {
        window.location.href = newItemButton.href;
      }
    });
  }

  // 페이지가 처음 로드될 때 저장된 데이터를 불러옴
  loadData();
});