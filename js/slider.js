const sliderManager = {
  slidesData: [],
  currentIndex: 0,
  intervalId: null,
  slideDuration: 5000, // 5초
  prevButton: document.querySelector('#btn-slide-prev'),
  nextButton: document.querySelector('#btn-slide-next'),
  counterElement: document.querySelector('#slide-counter'),
  controlsContainer: document.querySelector('.slider-controls'),

  // 날짜 포맷 변경 함수 (YYYY-MM-DD -> YYYY년 MM월 DD일)
  formatFullDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${year}년 ${month}월 ${day}일`;
  },

  init(dataArray) {
    this.stop();
    this.addEventListeners();

    if (dataArray && dataArray.length > 1) {
      this.controlsContainer.style.display = 'flex';
    } else {
      this.controlsContainer.style.display = 'none';
    }

    if (!dataArray || dataArray.length === 0) {
      this.showEmptySlide();
      return;
    }

    // 데이터를 order 기준으로 오름차순 정렬
    this.slidesData = [...dataArray].sort((a, b) => a.order - b.order);
    
    // order가 1인 데이터의 인덱스를 찾아 시작점으로 설정
    const startIndex = this.slidesData.findIndex(d => d.order === 1);
    this.currentIndex = (startIndex !== -1) ? startIndex : 0;

    this.showSlide(this.currentIndex);
    this.start();
  },

  start() {
    // 슬라이드가 2개 이상일 때만 자동 슬라이드 실행
    if (this.slidesData.length > 1) {
      this.intervalId = setInterval(() => this.nextSlide(), this.slideDuration);
    }
  },

  resetTimer() {
    this.stop();
    this.start();
  },

  stop() {
    clearInterval(this.intervalId);
  },

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.slidesData.length;
    this.showSlide(this.currentIndex);
  },

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.slidesData.length) % this.slidesData.length;
    this.showSlide(this.currentIndex);
  },

  showSlide(index) {
    const slideContainer = document.querySelector('#slide-view .slide');
    if (!slideContainer) return;

    if (!this.slidesData[index]) {
      this.showEmptySlide();
      return;
    }

    const data = this.slidesData[index];
    const { testMachine, model, purpose, startDate, endDate } = data;

    const scheduleText = (startDate || endDate)
      ? `${this.formatFullDate(startDate)}&nbsp;&nbsp;~&nbsp;&nbsp;${this.formatFullDate(endDate)}`
      : '-';

    slideContainer.querySelector('.test-machine-content').textContent = testMachine || '-';
    slideContainer.querySelector('.model-content').textContent = model || '-';
    slideContainer.querySelector('.purpose-content').textContent = purpose || '-';
    slideContainer.querySelector('.schedule-content').innerHTML = scheduleText;

    // 카운터 업데이트
    this.updateCounter();
  },

  showEmptySlide() {
    const slideContainer = document.querySelector('#slide-view .slide');
    if (!slideContainer) return;
    slideContainer.querySelector('.test-machine-content').textContent = '-';
    slideContainer.querySelector('.model-content').textContent = '-';
    slideContainer.querySelector('.purpose-content').textContent = '-';
    slideContainer.querySelector('.schedule-content').innerHTML = '-';
    this.updateCounter();
  },

  updateCounter() {
    const total = this.slidesData.length;
    const current = total > 0 ? this.currentIndex + 1 : 0;
    this.counterElement.textContent = `${current} / ${total}`;
  },

  addEventListeners() {
    this.prevButton.onclick = () => { this.prevSlide(); this.resetTimer(); };
    this.nextButton.onclick = () => { this.nextSlide(); this.resetTimer(); };
  }
};