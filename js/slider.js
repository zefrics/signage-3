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
  isListPage: document.querySelector('#view-list-page'),

  // 뷰 업데이트 콜백 함수
  updateCoverViewCallback: null,
  updateItemViewCallback: null,

  // 슬라이더 초기화
  init(slideData, { updateCoverView, updateItemView }) {
    this.stop();

    this.updateCoverViewCallback = updateCoverView;
    this.updateItemViewCallback = updateItemView;

    if (this.coverElement) this.coverElement.style.display = 'none';
    if (this.itemElement) this.itemElement.style.display = 'none';
    if (this.listElement) this.listElement.style.display = 'none';
    
    // 로컬 스토리지에서 타이머 설정을 불러옴
    const timerSettings = storageManager.loadTimerSettings();
    // sliderTimer 값이 있으면 해당 값을 초 단위로 변환하여 사용하고, 없으면 5초(5000ms)를 기본값으로 사용
    this.slideDuration = timerSettings && timerSettings.sliderTimer ? parseInt(timerSettings.sliderTimer, 10) * 1000 : 5000;
    
    // 데이터가 없는 경우, #no-data를 표시하고 슬라이더를 숨김
    if (!slideData || slideData.length === 0) {
      const sliderElement = document.querySelector('.slider');
      const noDataElement = document.querySelector('#no-data');

      if (sliderElement) sliderElement.style.display = 'none';
      if (noDataElement) {
        noDataElement.style.display = 'block';
        // #no-data 내부의 Change View 버튼은 Item이 없으므로 비활성화
        const changeViewButton = noDataElement.querySelector('.btn-change');
        if(changeViewButton) {
          changeViewButton.style.pointerEvents = 'none';
          changeViewButton.style.opacity = '0.4';
        }
      }
      return; // 슬라이더 시작하지 않고 종료
    }

    const hasItems = slideData.some(d => d.type === 'Item');

    // index.html이고 Item이 없을 경우, Change View 버튼 비활성화
    if (!this.isListPage && !hasItems) {
      const changeViewButtons = document.querySelectorAll('.btn-change');
      changeViewButtons.forEach(button => {
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.4';
      });
    }

    // 데이터가 1개 이하일 경우 컨트롤 비활성화
    const controls = document.querySelector('.slider-controls');
    if (slideData.length <= 1 && controls) {
      controls.style.opacity = '0.4';
      const buttons = controls.querySelectorAll('button');
      buttons.forEach(button => {
        button.disabled = true;
        button.style.cursor = 'default';
      });
    }

    if (this.isListPage) {
      // view-list.html의 경우: [커버, 목록] 2개의 슬라이드로 구성
      this.addEventListeners();

      // 1. 목록 페이지(들)을 슬라이드로 추가
      const listPages = document.querySelectorAll('.list-page');
      const listSlides = Array.from(listPages).map((page, index) => ({ type: 'list', pageIndex: index + 1 }));

      // 2. 'Cover' 타입의 데이터들을 order 순으로 정렬
      const coverSlides = slideData
        .filter(d => d.type === 'Cover')
        .sort((a, b) => a.order - b.order)
        .map(cover => ({ type: 'cover', data: cover }));

      // 3. 첫 페이지는 항상 list, 그 뒤로 cover들을 추가
      this.totalSlides = [...listSlides, ...coverSlides];
    } else {
      // index.html의 경우: 저장된 모든 데이터를 order 순서대로 슬라이드로 구성
      this.addEventListeners();
      this.totalSlides = [...slideData].sort((a, b) => a.order - b.order).map(d => {
        // 데이터 타입에 따라 슬라이드 타입을 결정
        return { type: d.type === 'Cover' ? 'cover' : 'slide', data: d };
      });
    }

    // 첫 번째 슬라이드부터 시작
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
      if (this.updateCoverViewCallback) this.updateCoverViewCallback(slideInfo.data);
    } else if (slideInfo.type === 'list') {
      // List 타입일 경우
      if (this.coverElement) this.coverElement.style.display = 'none';
      if (this.itemElement) this.itemElement.style.display = 'none';
      if (this.listElement) this.listElement.style.display = 'block'; // #lists 컨테이너 보이기

      // 모든 list-page를 숨긴 후, 현재 인덱스에 맞는 페이지만 표시
      const allListPages = document.querySelectorAll('.list-page');
      allListPages.forEach(page => page.style.display = 'none');
      const currentPage = document.querySelector(`#list-view-${slideInfo.pageIndex}`);
      if (currentPage) currentPage.style.display = 'flex';

    } else { // 'slide' (Item) 타입일 경우
      // Item 타입일 경우
      if (this.coverElement) this.coverElement.style.display = 'none';
      if (this.itemElement) this.itemElement.style.display = 'block';
      if (this.listElement) this.listElement.style.display = 'none';
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
      this.prevButton.onclick = () => { this.prevSlide(); this.resetTimer(); };
    }
    if (this.nextButton) {
      this.nextButton.onclick = () => { this.nextSlide(); this.resetTimer(); };
    }
  }
};