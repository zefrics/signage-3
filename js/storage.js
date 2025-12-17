/**
 * 로컬 스토리지를 사용하여 앱의 데이터를 관리하는 객체.
 * 슬라이드 데이터와 커버 데이터를 별도로 처리합니다.
 */
export const storageManager = {
  // 저장 시 사용할 키(key) 정의
  KEY_SLIDES: 'slideData',
  KEY_TIMERS: 'timerSettings',
  KEY_PATH: 'path',

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
    const type = newData.type;
    const limit = type === 'Cover' ? 5 : 10; // 타입별 제한 개수 설정 (Cover는 5개, Item은 10개)

    const currentCount = dataArray.filter(d => d.type === type).length;

    if (currentCount >= limit) {
      alert(`${type}는 최대 ${limit}개까지 생성할 수 있습니다.`);
      // false를 반환하여 데이터 추가가 실패했음을 알릴 수 있습니다.
      return false;
    }

    // order 값 계산: 기존 데이터가 있으면 가장 큰 order + 1, 없으면 1
    const maxOrder = dataArray.length > 0 ? Math.max(...dataArray.map(d => d.order)) : 0;
    newData.order = maxOrder + 1;
    dataArray.push(newData);
    this.save(dataArray);

    // true를 반환하여 성공적으로 추가되었음을 알릴 수 있습니다.
    return true;
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
    const dataArray = this.load();
    // 지정된 order의 항목을 제외한 새 배열 생성
    const remainingData = dataArray.filter(d => d.order != order);

    // 남아있는 데이터를 기존 order 순서대로 정렬
    remainingData.sort((a, b) => a.order - b.order);

    // order 값을 1부터 순차적으로 재할당
    const reorderedData = remainingData.map((item, index) => ({ ...item, order: index + 1 }));

    this.save(reorderedData);
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