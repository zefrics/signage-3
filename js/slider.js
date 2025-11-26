const sliderManager = {
  totalSlides: [], // 커버와 슬라이드 데이터를 모두 포함할 배열
  currentIndex: 0,
  intervalId: null,
  slideDuration: 500000, // 5초
  // DOM 요소 참조
  prevButton: document.querySelector('#btn-slide-prev'),
  nextButton: document.querySelector('#btn-slide-next'),
  counterElement: document.querySelector('#slide-counter'),
  coverElement: document.querySelector('#cover'),
  slidesElement: document.querySelector('#slides'),

  // 슬라이더 초기화
  init(dataArray) {
    this.stop();
    this.addEventListeners();

    // 1. 커버 데이터를 첫 번째 슬라이드로 추가
    const coverData = storageManager.loadCoverData();
    this.totalSlides = [{ type: 'cover', data: coverData }];

    // 2. 슬라이드 데이터를 'order' 순서대로 정렬하여 추가
    const sortedSlides = [...dataArray].sort((a, b) => a.order - b.order);
    sortedSlides.forEach(slide => {
      this.totalSlides.push({ type: 'slide', data: slide });
    });

    this.currentIndex = 0; // 항상 첫 번째 슬라이드(커버)에서 시작

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
    } else {
      // 일반 슬라이드를 보여주고, 커버 슬라이드는 숨김
      this.coverElement.style.display = 'none';
      this.slidesElement.style.display = 'block';
      this.updateSlideContent(slideInfo.data);
    }

    this.updateCounter();
  },

  // 일반 슬라이드의 내용을 채우는 함수
  updateSlideContent(data) {
    const slideContainer = document.querySelector('#slides');
    if (!slideContainer || !data) return;

    // 날짜 포맷 변경 함수 (YYYY-MM-DD -> YYYY년 MM월 DD일)
    const formatFullDate = (dateString) => {
      if (!dateString) return '';
      const [fullYear, month, day] = dateString.split('-');
      const shortYear = fullYear.slice(-2); // 연도의 마지막 두 자리만 추출
      return `${shortYear}년 ${month}월 ${day}일`;
    };

    const { testMachine, model, purpose, startDate, endDate } = data;

    const scheduleText = (startDate || endDate)
      ? `${formatFullDate(startDate)}&nbsp;&nbsp;~&nbsp;&nbsp;${formatFullDate(endDate)}`
      : '-';

    // slide-view 내부의 각 p 태그에 내용 채우기
    slideContainer.querySelector('.test-machine-content').textContent = testMachine || '-';
    slideContainer.querySelector('.model-content').textContent = model || '-';
    slideContainer.querySelector('.purpose-content').textContent = purpose || '-';
    slideContainer.querySelector('.schedule-content').innerHTML = scheduleText;
  },

  // 슬라이드 카운터 업데이트
  updateCounter() {
    if (this.counterElement) {
      const total = this.totalSlides.length;
      const current = total > 0 ? this.currentIndex + 1 : 0;
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