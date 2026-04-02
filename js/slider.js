import { storageManager } from './storage.js';

export const sliderManager = {
  totalSlides: [], // 커버와 슬라이드 데이터를 모두 포함할 배열
  currentIndex: 0,
  intervalId: null,
  slideDuration: 5000, // 슬라이드 전환 시간 (ms), init에서 coverData를 기반으로 덮어씀
  // DOM 요소 참조
  prevButton: document.querySelector('#btn-slide-prev'),
  nextButton: document.querySelector('#btn-slide-next'),
  counterElement: document.querySelector('#slide-counter'),
  coverElement: document.querySelector('#covers'),
  itemElement: document.querySelector('#items'),
  listElement: document.querySelector('#lists'),
  statusElement: document.querySelector('#status'),
  isListPage: document.querySelector('#view-list-page'),

  // 뷰 업데이트 콜백 함수
  updateCoverViewCallback: null,
  updateItemViewCallback: null,

  // 슬라이더 초기화
  init(slideData, statusData, { updateCoverView, updateItemView }) { // statusData 파라미터 추가
    this.stop();

    this.updateCoverViewCallback = updateCoverView;
    this.updateItemViewCallback = updateItemView;

    // DOM 요소 재참조 (초기 로드 시 실패 대비)
    this.prevButton = document.querySelector('#btn-slide-prev');
    this.nextButton = document.querySelector('#btn-slide-next');
    this.counterElement = document.querySelector('#slide-counter');
    this.isListPage = document.querySelector('#view-list-page');

    if (this.coverElement) this.coverElement.style.display = 'none';
    if (this.itemElement) this.itemElement.style.display = 'none';
    if (this.listElement) this.listElement.style.display = 'none';
    if (this.statusElement) this.statusElement.style.display = 'none';
    
    // 타이머 설정 불러오기
    const timerSettings = storageManager.load('timer'); // Use generic load for timers
    this.slideDuration = timerSettings && timerSettings.sliderTimer ? parseInt(timerSettings.sliderTimer, 10) * 1000 : 5000;
    
    // totalSlides 배열 구성
    let tempTotalSlides = [];

    if (this.isListPage) { // view-list.html의 경우
      // 1. 'Cover' 타입의 데이터들을 order 순으로 정렬하여 슬라이드로 추가
      const coverSlides = slideData
        .filter(d => d.type === 'Cover')
        .sort((a, b) => a.order - b.order)
        .map(cover => ({ type: 'cover', data: cover }));
      tempTotalSlides.push(...coverSlides);

      // 2. Item 목록 페이지(들)을 슬라이드로 추가
      const itemPages = document.querySelector('#list-pages-container')?.querySelectorAll('.list-page') || [];
      const itemSlides = Array.from(itemPages).map((_, index) => ({ type: 'list', pageIndex: index + 1 }));
      tempTotalSlides.push(...itemSlides);

      // 3. Status 목록 페이지(들)을 슬라이드로 추가
      const statusPages = document.querySelector('#status-pages-container')?.querySelectorAll('.list-page') || [];
      const statusSlides = Array.from(statusPages).map((_, index) => ({ type: 'status-list', pageIndex: index + 1 }));
      tempTotalSlides.push(...statusSlides);

    } else { // index.html의 경우
      // 1. 저장된 모든 Cover 및 Item 데이터를 order 순서대로 슬라이드로 구성
      const mainSlides = [...slideData].sort((a, b) => a.order - b.order).map(d => {
        return { type: d.type === 'Cover' ? 'cover' : 'slide', data: d };
      });
      tempTotalSlides.push(...mainSlides);

      // 2. Status 목록 페이지(들)을 슬라이드로 추가
      const statusPages = document.querySelector('#status-pages-container')?.querySelectorAll('.list-page') || [];
      const statusSlides = Array.from(statusPages).map((_, index) => ({ type: 'status-list', pageIndex: index + 1 }));
      tempTotalSlides.push(...statusSlides);
    }

    this.totalSlides = tempTotalSlides;

    // Change View 버튼 상태
    this.updateViewChangeButtonState(slideData);

    // 이벤트 리스너 등록 (버튼 작동 해결)
    this.addEventListeners();

    // 모든 슬라이드 데이터가 없는 경우, #no-data를 표시하고 슬라이더를 숨김
    if (this.totalSlides.length === 0) {
      const sliderElement = document.querySelector('.slider');
      const noDataElement = document.querySelector('#no-data');

      if (sliderElement) sliderElement.style.display = 'none';
      if (noDataElement) noDataElement.style.display = 'block';
      return; // 슬라이더 시작하지 않고 종료
    }

    // 슬라이드 컨트롤 비활성화 (전체 슬라이드 개수 기준)
    const controls = document.querySelector('.slider-controls');
    if (this.totalSlides.length <= 1 && controls) {
      controls.style.opacity = '0.4';
      const buttons = controls.querySelectorAll('button');
      buttons.forEach(button => {
        button.disabled = true;
        button.style.cursor = 'default';
      });
    }
    this.currentIndex = 0;

    this.showSlide(this.currentIndex);
    this.start();
  },

  // 자동 슬라이드 시작
  start() {
    // 전체 슬라이드가 2개 이상일 때만 자동 넘김 실행
    if (this.totalSlides.length > 1) {
      this.intervalId = setInterval(() => this.nextSlide(), this.slideDuration);
    }
  },

  // Item 데이터가 없을 경우 Change View 버튼을 비활성화
  updateViewChangeButtonState(slideData) {
    const hasItems = slideData && slideData.some(d => d.type === 'Item');
    const changeViewButtons = document.querySelectorAll('.btn-change');
    changeViewButtons.forEach(button => {
      if (!hasItems) {
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.4';
      } else {
        button.style.pointerEvents = 'auto';
        button.style.opacity = '1';
      }
    });
  },

  // 자동 슬라이드 타이머 리셋
  resetTimer() {
    this.stop();
    this.start();
  },

  // 자동 슬라이드 중지
  stop() {
    clearInterval(this.intervalId);
  },

  // 다음 슬라이드로 이동
  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.totalSlides.length;
    this.showSlide(this.currentIndex);
  },

  // 이전 슬라이드로 이동
  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.totalSlides.length) % this.totalSlides.length;
    this.showSlide(this.currentIndex);
  },

  // 특정 인덱스의 슬라이드를 표시
  showSlide(index) {
    const slideInfo = this.totalSlides[index];
    // 슬라이드 정보가 없으면 아무것도 하지 않음
    if (!slideInfo) return;

    if (slideInfo.type === 'cover') {
      // Cover 타입일 경우: coverElement를 보여주고 다른 컨테이너는 숨김
      if (this.coverElement) this.coverElement.style.display = 'block';
      if (this.itemElement) this.itemElement.style.display = 'none';
      if (this.listElement) this.listElement.style.display = 'none';
      if (this.statusElement) this.statusElement.style.display = 'none';
      if (this.updateCoverViewCallback) this.updateCoverViewCallback(slideInfo.data);
    } else if (slideInfo.type === 'list') {
      // List 타입일 경우
      if (this.coverElement) this.coverElement.style.display = 'none';
      if (this.itemElement) this.itemElement.style.display = 'none';
      if (this.listElement) this.listElement.style.display = 'block'; // #lists 컨테이너 보이기
      if (this.statusElement) this.statusElement.style.display = 'none';

      // 모든 list-page를 숨긴 후, 현재 인덱스에 맞는 페이지만 표시
      const allListPages = document.querySelectorAll('#list-pages-container .list-page');
      allListPages.forEach(page => page.style.display = 'none');
      const currentPage = document.querySelector(`#list-view-${slideInfo.pageIndex}`);
      if (currentPage) currentPage.style.display = 'flex';

    } else if (slideInfo.type === 'status-list') {
      // Status List 타입일 경우
      if (this.coverElement) this.coverElement.style.display = 'none';
      if (this.itemElement) this.itemElement.style.display = 'none';
      if (this.listElement) this.listElement.style.display = 'none';
      if (this.statusElement) this.statusElement.style.display = 'block'; // #status 컨테이너 보이기

      const allStatusPages = document.querySelectorAll('#status-pages-container .list-page');
      allStatusPages.forEach(page => page.style.display = 'none');
      const currentPage = document.querySelector(`#status-view-${slideInfo.pageIndex}`);
      if (currentPage) currentPage.style.display = 'flex';

    } else { // 'slide' (Item) 타입일 경우
      // Item 타입일 경우
      if (this.coverElement) this.coverElement.style.display = 'none';
      if (this.itemElement) this.itemElement.style.display = 'block';
      if (this.listElement) this.listElement.style.display = 'none';
      if (this.statusElement) this.statusElement.style.display = 'none';
      if (this.updateItemViewCallback) this.updateItemViewCallback(slideInfo.data);
    }

    this.updateCounter();

    // view-list.html의 목록 뷰 처리
  },

  // 슬라이드 카운터 업데이트
  updateCounter() {
    if (this.counterElement) {
      // 슬라이드의 총 개수는 totalSlides 배열의 길이를 사용
      const total = this.totalSlides.length;
      // 현재 인덱스 + 1
      const current = this.currentIndex + 1;
      this.counterElement.textContent = `${current} / ${total}`;
    }
  },

  // 이전/다음 버튼 이벤트 리스너 추가
  addEventListeners() {
    if (this.prevButton) {
      this.prevButton.onclick = (e) => { e.preventDefault(); this.prevSlide(); this.resetTimer(); };
    }
    if (this.nextButton) {
      this.nextButton.onclick = (e) => { e.preventDefault(); this.nextSlide(); this.resetTimer(); };
    }
  }
};