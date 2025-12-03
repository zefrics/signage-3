/**
 * 로컬 스토리지를 사용하여 앱의 데이터를 관리하는 객체.
 * 슬라이드 데이터와 커버 데이터를 별도로 처리합니다.
 */
const storageManager = {
  // 저장 시 사용할 키(key) 정의
  KEY_SLIDES: 'slideData',
  KEY_COVER: 'coverData',
  KEY_TIMERS: 'timerSettings',

  /**
   * 슬라이드 데이터 배열을 로컬 스토리지에 저장합니다.
   * @param {Array<Object>} dataArray - 저장할 슬라이드 데이터 배열
   */
  save(dataArray) {
    localStorage.setItem(this.KEY_SLIDES, JSON.stringify(dataArray));
  },

  /**
   * 로컬 스토리지에서 슬라이드 데이터 배열을 불러옵니다.
   * @returns {Array<Object>} 저장된 슬라이드 데이터 배열. 데이터가 없으면 빈 배열을 반환합니다.
   */
  load() {
    const data = localStorage.getItem(this.KEY_SLIDES);
    return data ? JSON.parse(data) : [];
  },

  /**
   * 새로운 슬라이드 데이터를 배열에 추가하고 저장합니다. 'order' 값은 자동으로 할당됩니다.
   * @param {Object} newData - 추가할 새로운 슬라이드 데이터
   */
  addData(newData) {
    const dataArray = this.load();

    // order 값 계산: 기존 데이터가 있으면 가장 큰 order + 1, 없으면 1
    const maxOrder = dataArray.length > 0 ? Math.max(...dataArray.map(d => d.order)) : 0;
    newData.order = maxOrder + 1;
    dataArray.push(newData);
    this.save(dataArray);
  },

  /**
   * 지정된 'order'에 해당하는 슬라이드 데이터를 업데이트합니다.
   * @param {string|number} order - 수정할 데이터의 order 값
   * @param {Object} updatedData - 업데이트할 내용을 담은 객체
   */
  updateData(order, updatedData) {
    let dataArray = this.load();
    const dataIndex = dataArray.findIndex(d => d.order == order);
    if (dataIndex > -1) {
      dataArray[dataIndex] = { ...dataArray[dataIndex], ...updatedData };
      this.save(dataArray);
    }
  },

  /**
   * 지정된 'order'에 해당하는 슬라이드 데이터를 삭제합니다.
   * @param {string|number} order - 삭제할 데이터의 order 값
   */
  deleteData(order) {
    let dataArray = this.load();
    dataArray = dataArray.filter(d => d.order != order);
    this.save(dataArray);
  },

  /**
   * 모든 슬라이드 데이터를 로컬 스토리지에서 삭제합니다.
   */
  clear() {
    localStorage.removeItem(this.KEY_SLIDES);
  },

  /**
   * 변경된 순서 배열을 기반으로 모든 슬라이드 데이터의 'order' 값을 재정렬하고 저장합니다.
   * @param {Array<string>} orderedIds - 새로운 순서대로 정렬된 order 값들의 배열
   */
  saveOrder(orderedIds) {
    let dataArray = this.load();
    const maxOrder = dataArray.length;

    // 새로운 순서 배열(orderedIds)을 기반으로 각 항목의 order 값을 재할당
    const reorderedArray = dataArray.map(item => {
      const newIndex = orderedIds.indexOf(String(item.order));
      item.order = maxOrder - newIndex;
      return item;
    });
    this.save(reorderedArray);
  },

  /**
   * 커버 데이터를 로컬 스토리지에 저장합니다.
   * @param {Object} coverData - 저장할 커버 데이터 객체
   */
  saveCoverData(coverData) {
    localStorage.setItem(this.KEY_COVER, JSON.stringify(coverData));
  },

  /**
   * 로컬 스토리지에서 커버 데이터를 불러옵니다.
   * @returns {Object|null} 저장된 커버 데이터 객체. 데이터가 없으면 null을 반환합니다.
   */
  loadCoverData() {
    const data = localStorage.getItem(this.KEY_COVER);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 타이머 설정(슬라이더, 홈, 뒤로가기)을 로컬 스토리지에 저장합니다.
   * @param {Object} timerSettings - 저장할 타이머 설정 객체
   */
  saveTimerSettings(timerSettings) {
    localStorage.setItem(this.KEY_TIMERS, JSON.stringify(timerSettings));
  },

  /**
   * 로컬 스토리지에서 타이머 설정을 불러옵니다.
   * @returns {Object} 저장된 타이머 설정 객체. 데이터가 없으면 빈 객체를 반환합니다.
   */
  loadTimerSettings() {
    const data = localStorage.getItem(this.KEY_TIMERS);
    return data ? JSON.parse(data) : {};
  }
};