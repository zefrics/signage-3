const sliderManager = {
  totalSlides: [], // 커버와 슬라이드 데이터를 모두 포함할 배열
  currentIndex: 0,
  intervalId: null,
  slideDuration: 5000, // 5초
  // DOM 요소 참조
  prevButton: document.querySelector('#btn-slide-prev'),
  nextButton: document.querySelector('#btn-slide-next'),
  counterElement: document.querySelector('#slide-counter'),
  coverElement: document.querySelector('#cover'),
  slidesElement: document.querySelector('#slides'),

  // 슬라이더 초기화
  init(slideData, coverData) {
    this.stop();

    // 데이터가 없는 경우, 커버만 표시하고 슬라이더를 비활성화
    if (!slideData || slideData.length === 0) {
      this.totalSlides = [{ type: 'cover', data: coverData }];
      this.currentIndex = 0;
      this.showSlide(this.currentIndex);
      
      // 슬라이더 컨트롤 숨기기
      const controls = document.querySelector('.slider-controls');
      if (controls) controls.style.display = 'none';

      // "Change View" 버튼 비활성화
      const changeViewButtons = document.querySelectorAll('.btn-4');
      changeViewButtons.forEach(button => {
        button.style.opacity = '0.4';
        button.style.cursor = 'not-allowed';
        button.addEventListener('click', (e) => e.preventDefault());
      });

      return; // 슬라이더 시작하지 않고 종료
    }

    const isListPage = document.querySelector('#view-list-page');

    if (isListPage) {
      // view-list.html의 경우: [커버, 목록] 2개의 슬라이드로 구성
      this.addEventListeners();
      this.totalSlides = [
        { type: 'cover', data: coverData },
        { type: 'list', data: null } // 목록 뷰를 위한 슬라이드
      ];
    } else {
      // index.html의 경우: [커버, 슬라이드1, 슬라이드2, ...]
      // 1. 커버 데이터를 첫 번째 슬라이드로 추가
      this.addEventListeners();
      this.totalSlides = [{ type: 'cover', data: coverData }];

      // 2. 슬라이드 데이터를 'order' 순서대로 정렬하여 추가
      const sortedSlides = [...slideData].sort((a, b) => a.order - b.order);
      sortedSlides.forEach(slide => {
        this.totalSlides.push({ type: 'slide', data: slide });
      });
    }

    // 데이터가 있으면 첫번째 슬라이드(index: 1)부터, 없으면 커버(index: 0)부터 시작
    this.currentIndex = this.totalSlides.length > 1 ? 1 : 0;

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

    if (slideInfo.type === 'cover') {
      // 커버 슬라이드를 보여주고, 일반 슬라이드는 숨김
      this.coverElement.style.display = 'block';
      this.slidesElement.style.display = 'none';
      // view-data.js의 updateCoverView가 이미 내용을 채웠으므로 여기서는 별도 작업 불필요
    } else if (slideInfo.type === 'slide') {
      // 일반 슬라이드를 보여주고, 커버 슬라이드는 숨김
      this.coverElement.style.display = 'none';
      this.slidesElement.style.display = 'block';
      // view-data.js에 데이터 표시 위임
      if (window.viewDataManager && typeof window.viewDataManager.updateSlideView === 'function') {
        window.viewDataManager.updateSlideView(slideInfo.data);
      }
    }

    this.updateCounter();

    // view-list.html의 목록 뷰 처리
    if (slideInfo.type === 'list') {
      this.coverElement.style.display = 'none';
      this.slidesElement.style.display = 'block';
    }
  },

  // 슬라이드 카운터 업데이트
  updateCounter() {
    if (this.counterElement) {
      // 전체 개수에서 커버는 제외
      const total = this.totalSlides.length > 1 ? this.totalSlides.length - 1 : 0;
      // 현재 인덱스를 그대로 사용하여 커버는 0번으로 표시
      const current = this.currentIndex;

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