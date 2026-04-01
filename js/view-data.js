const { Capacitor } = window;
import { formatDate } from './date.js';
import { storageManager } from './storage.js';
import { sliderManager } from './slider.js';
import { timerManager } from './edit-timer.js';
 
document.addEventListener('DOMContentLoaded', () => {
  const orderEditContainer = document.querySelector('#slider-order-edit-container');
  const statusOrderEditContainer = document.querySelector('#status-order-edit-container');

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

      const listPageElement = createListPage(pageIndex, 'item');

      const listViewContainer = listPageElement.querySelector('.list-view-container');

      chunk.forEach((data, itemIndex) => {
        const { testMachine1, model, purpose, next, startDate, endDate } = data;

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
        <li><span>${testMachine1 || '-'}</span></li>
        <li><span>${model || '-'}</span></li>
        <li><span>${purpose || '-'}</span></li>
        <li><span>${scheduleText}</span></li>
        <li><span>${next || '-'}</span></li>
      `;
        listViewContainer.appendChild(tableRow);
      });
      
      // prepend를 사용하여 페이지 순서를 뒤집어, 최신 데이터가 담긴 페이지가 먼저 오도록 함
      listPagesContainer.prepend(listPageElement);
    });
  };

  // status-view 섹션의 내용을 업데이트하는 함수
  const updateStatusView = (dataArray) => {
    const statusPagesContainer = document.querySelector('#status-pages-container');
    if (!statusPagesContainer) return;
    statusPagesContainer.innerHTML = '';

    // statusOrder가 낮은 순서대로 정렬 (chunking을 위해)
    const sortedData = dataArray.sort((a, b) => a.statusOrder - b.statusOrder);
    const totalItems = sortedData.length;
    let chunks = [];

    if (totalItems <= 5) {
      chunks.push(sortedData);
    } else {
      const firstPageCount = Math.ceil(totalItems / 2);
      chunks.push(sortedData.slice(0, firstPageCount));
      chunks.push(sortedData.slice(firstPageCount));
    }

    chunks.forEach((chunk, index) => {
      const pageIndex = index + 1;
      // 각 페이지 내부에서는 statusOrder가 높은 순서(최신순)로 정렬
      chunk.sort((a, b) => b.statusOrder - a.statusOrder);

      const listPageElement = createListPage(pageIndex, 'status');
      const listViewContainer = listPageElement.querySelector('.list-view-container');

      chunk.forEach((data, itemIndex) => {
        const { testMachine2, status, remark } = data;

        const tableRow = document.createElement('ul');
        tableRow.className = 'table-content';

        if (itemIndex % 2 !== 0) {
          tableRow.classList.add('highlight');
        }

        tableRow.innerHTML = `
          <li><span>${testMachine2 || '-'}</span></li>
          <li><span>${status || '-'}</span></li>
          <li><span>${remark || '-'}</span></li>
        `;
        listViewContainer.appendChild(tableRow);
      });
      
      statusPagesContainer.prepend(listPageElement);
    });
  };

  // 목록 페이지(표)의 기본 구조를 생성하는 함수
  const createListPage = (pageIndex, type = 'item') => {
    const listPage = document.createElement('div');
    const isStatus = type === 'status';
    
    listPage.id = isStatus ? `status-view-${pageIndex}` : `list-view-${pageIndex}`;
    listPage.className = `section list-page ${isStatus ? 'status-list' : 'item-list'}`;
    listPage.style.display = 'none'; // 기본적으로 숨김

    const header = isStatus 
      ? `
        <li>Test Machine</li>
        <li>Status</li>
        <li>Remark</li>
      `
      : `
        <li>Test Machine</li>
        <li>Model</li>
        <li>Purpose</li>
        <li>Schedule</li>
        <li>Next</li>
      `;

    listPage.innerHTML = `
      <ul class="table-header">${header}</ul>
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
      // 상대 경로를 전체 URI로 변환하여 표시
      window.Capacitor.Plugins.Filesystem.getUri({ path: data.imagePath, directory: 'Data' })
        .then(({ uri }) => { coverImgSelected.querySelector('.selected').src = Capacitor.convertFileSrc(uri); })
        .catch(err => console.error('이미지 로드 실패:', err));
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

    const { testMachine1, model, purpose, next, startDate, endDate, imagePath } = data;

    const scheduleText = (startDate || endDate)
      ? `${formatFullDate(startDate)}&nbsp;~&nbsp;${formatFullDate(endDate)}`
      : '-';

    const itemImgSelected = itemViewContainer.querySelector('#item-img-selected');
    const itemImgDefault = itemViewContainer.querySelector('#item-img-default');
    if (imagePath && itemImgSelected && itemImgDefault) {
      window.Capacitor.Plugins.Filesystem.getUri({ path: imagePath, directory: 'Data' })
        .then(({ uri }) => { itemImgSelected.querySelector('.selected').src = Capacitor.convertFileSrc(uri); })
        .catch(err => console.error('이미지 로드 실패:', err));
      itemImgSelected.style.display = 'flex';
      itemImgDefault.style.display = 'none';
    } else if (itemImgSelected && itemImgDefault) {
      itemImgSelected.style.display = 'none';
      itemImgDefault.style.display = 'flex';
    }

    itemViewContainer.querySelector('.test-machine-1-content').textContent = testMachine1 || '-';
    itemViewContainer.querySelector('.model-content').textContent = model || '-';
    itemViewContainer.querySelector('.purpose-content').textContent = purpose || '-';
    itemViewContainer.querySelector('.next-content').textContent = next || '-';
    itemViewContainer.querySelector('.schedule-content').innerHTML = scheduleText;
  };

  // order-edit 섹션의 내용을 업데이트하는 함수
  const updateOrderEditView = (dataArray) => {
    const targetContainer = orderEditContainer || statusOrderEditContainer;
    if (!targetContainer) return;
    targetContainer.innerHTML = ''; // 기존 목록 초기화

    const isStatusPage = path === 'settings-status.html';

    // 각 데이터의 order 키에 맞춰 정렬 (최신순)
    const sortedData = dataArray.sort((a, b) => {
      const orderA = isStatusPage ? a.statusOrder : a.order;
      const orderB = isStatusPage ? b.statusOrder : b.order;
      return orderB - orderA;
    });

    sortedData.forEach((data, index) => {
      const currentOrder = isStatusPage ? data.statusOrder : data.order;
      const type = isStatusPage ? 'Status' : (data.type || 'Item'); 
      
      // 페이지 타입에 따른 컬럼 구성
      let columnsHtml = '';
      let editUrl = '';

      if (isStatusPage) {
        editUrl = `edit-status.html?order=${currentOrder}`;
        columnsHtml = `
          <li><span>${data.testMachine2 || '-'}</span></li>
          <li><span>${data.status || '-'}</span></li>
          <li><span>${data.remark || '-'}</span></li>
        `;
      } else {
        const name = type === 'Cover' ? data.testerName : data.testMachine1;
        editUrl = (type === 'Cover' ? 'edit-cover.html' : 'edit-item.html') + `?order=${currentOrder}`;
        columnsHtml = `
          <li><span>${type}</span></li>
          <li><span>${name || '-'}</span></li>
        `;
      }

      const tableRow = document.createElement('ul');
      tableRow.className = 'table-content';
      tableRow.dataset.order = currentOrder;
      tableRow.dataset.type = type; // 데이터셋에 type 저장

      // 짝수 번째 행에 하이라이트 클래스 추가 (index는 0부터 시작하므로 홀수 index가 짝수 번째)
      if (index % 2 !== 0) {
        tableRow.classList.add('highlight');
      }

      tableRow.innerHTML = `
        <li class="drag-handle"><img src="img/edit-order.svg"></li>
        <li><span>${sortedData.length - index}</span></li>
        ${columnsHtml}
        <li>
          <button class="btn-delete" data-order="${currentOrder}">
            <img src="img/delete.svg">
            <div class="text">Delete</div>
          </button>
          <button class="btn-modify" data-order="${currentOrder}" data-edit-url="${editUrl}">
            <img src="img/edit.svg">
            <div class="text">Edit</div>
          </button>
        </li>
      `;
      targetContainer.appendChild(tableRow);
    });
  };

  // SortableJS 초기화
  if (orderEditContainer) {
    new window.Sortable(orderEditContainer, {
      handle: '.drag-handle',
      animation: 100,
      scroll: true,
      scrollSensitivity: 100,
      scrollSpeed: 10,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: function (evt) {
        // 현재 DOM 순서대로 data-order 값을 배열로 만듦
        const orderedIds = Array.from(orderEditContainer.querySelectorAll('.table-content'))
          .map(row => row.dataset.order);
        // storageManager를 통해 순서 저장
        storageManager.saveOrder(orderedIds);
        // 화면의 순번을 다시 매김
        // 순서 변경 후 전체 뷰를 다시 렌더링하여 data-order 속성과 표시 순번을 모두 업데이트
        updateOrderEditView(storageManager.load());
      }
    });
  }

  // Status SortableJS 초기화
  if (statusOrderEditContainer) {
    new window.Sortable(statusOrderEditContainer, {
      handle: '.drag-handle',
      animation: 100,
      scroll: true,
      scrollSensitivity: 100,
      scrollSpeed: 10,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      onEnd: function (evt) {
        const orderedIds = Array.from(statusOrderEditContainer.querySelectorAll('.table-content'))
          .map(row => row.dataset.order);
        storageManager.saveStatusOrder(orderedIds);
        updateOrderEditView(storageManager.loadStatus());
      }
    });
  }

  // settings-cover-item.html의 목록 이벤트 처리 (삭제, 수정)
  const editTableSection = orderEditContainer || statusOrderEditContainer;
  if (editTableSection) {
    editTableSection.addEventListener('click', (event) => {
      const deleteButton = event.target.closest('.btn-delete');
      const modifyButton = event.target.closest('.btn-modify');

      // 삭제 버튼 클릭 시
      if (deleteButton) {
        (async () => {
          try {
            const order = deleteButton.dataset.order;
            const isStatusPage = path === 'settings-status.html';
            const dataArray = isStatusPage ? storageManager.loadStatus() : storageManager.load();
            const dataToDelete = dataArray.find(d => (isStatusPage ? d.statusOrder : d.order) == order);
            if (!dataToDelete) return;

            const name = isStatusPage 
              ? `${dataToDelete.testMachine2} (${dataToDelete.status})`
              : (dataToDelete.type === 'Cover' ? dataToDelete.testerName : dataToDelete.testMachine1);

            if (confirm(`'${name}' 항목을 삭제하시겠습니까?`)) {
              // Capacitor Filesystem API가 있는 경우 이미지 파일 삭제 시도
              if (dataToDelete.imagePath && window.Capacitor && window.Capacitor.Plugins.Filesystem) {
                try {
                  const folderToDelete = dataToDelete.imagePath.split('/')[0];
                  await window.Capacitor.Plugins.Filesystem.rmdir({ path: folderToDelete, directory: 'Data', recursive: true });
                } catch (error) {
                  console.error('항목 삭제 중 이미지 파일 삭제에 실패했습니다.', error);
                  // 파일 삭제 실패 시 사용자에게 알리고, 데이터 삭제를 중단합니다.
                  alert('데이터에 연결된 이미지 파일을 삭제하는 데 실패했습니다. 삭제 작업을 다시 진행해주세요.');
                  return; // 함수 실행을 여기서 중단
                }
              }

              if (isStatusPage) {
                storageManager.deleteStatus(order);
              } else {
                storageManager.deleteData(order);
              }
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
    // Status 표를 생성합니다.
    if (document.querySelector('#status-pages-container')) updateStatusView(storageManager.loadStatus());
    
    if (path === 'settings-status.html') {
      updateOrderEditView(storageManager.loadStatus());
    } else if (orderEditContainer) {
      updateOrderEditView(slideData);
    }

    // 현재 페이지에 맞는 슬라이더 컨테이너를 찾아 초기화
    const sliderContainer = document.querySelector('#items') || document.querySelector('#lists');
    if (sliderContainer) sliderManager.init(slideData, { updateCoverView, updateItemView });

  };

  // settings.html 페이지의 타이머 초기화
  const path = window.location.pathname.split("/").pop();
  if (path === 'settings.html') {
    const elementToMonitor = document.querySelector('#settings-button-container');
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

  // settings-cover-item.html 페이지의 타이머 초기화
  if (path === 'settings-cover-item.html') {
    const elementToMonitor = document.querySelector('#slider-order-edit');
    const timerSettings = storageManager.loadTimerSettings();
    const timeoutSeconds = timerSettings.backTimer || 90;
    timerManager.init(() => {
      window.location.href = 'settings.html';
    }, timeoutSeconds);
    timerManager.start([elementToMonitor]);
  }

  // settings-status.html 페이지의 타이머 초기화
  if (path === 'settings-status.html') {
    // 페이지의 주요 컨테이너를 모니터링 요소로 지정합니다.
    const elementToMonitor = document.querySelector('#slider-order-edit');
    const timerSettings = storageManager.loadTimerSettings();
    const timeoutSeconds = timerSettings.backTimer || 90;
    timerManager.init(() => {
      window.location.href = 'settings.html';
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

      if (coverCount >= storageManager.LIMITS.Cover) {
        alert(`Cover는 최대 ${storageManager.LIMITS.Cover}개까지 생성할 수 있습니다.`);
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

      if (itemCount >= storageManager.LIMITS.Item) {
        alert(`Item은 최대 ${storageManager.LIMITS.Item}개까지 생성할 수 있습니다.`);
      } else {
        window.location.href = newItemButton.href;
      }
    });
  }

  const newStatusButton = document.querySelector('a[href="edit-status.html"]');

  if (newStatusButton) {
    newStatusButton.addEventListener('click', (event) => {
      event.preventDefault(); // 기본 링크 이동 방지
      const statusData = storageManager.loadStatus();

      if (statusData.length >= storageManager.LIMITS.Status) {
        alert(`Status는 최대 ${storageManager.LIMITS.Status}개까지 생성할 수 있습니다.`);
      } else {
        window.location.href = newStatusButton.href;
      }
    });
  }

  // 페이지가 처음 로드될 때 저장된 데이터를 불러옴
  loadData();
});