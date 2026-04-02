/**
 * 로컬 스토리지를 사용하여 앱의 데이터를 관리하는 객체.
 * 슬라이드 데이터와 커버 데이터를 별도로 처리합니다.
 */
export const storageManager = {
  // 저장 시 사용할 키(key) 정의
  KEY_SLIDES: 'slideData',
  KEY_STATUS: 'statusData',
  KEY_TIMERS: 'timerSettings',
  KEY_PATH: 'path',

  // 생성 제한 개수 중앙 관리
  LIMITS: {
    Cover: 5,
    Item: 10,
    Status: 10
  },

  // 내부 헬퍼: 타입에 따른 키값 반환
  _getKeys(type) {
    const isStatus = type === 'status';
    const isTimer = type === 'timer';
    return {
      storageKey: isStatus ? this.KEY_STATUS : (isTimer ? this.KEY_TIMERS : this.KEY_SLIDES),
      orderKey: isStatus ? 'statusOrder' : 'order'
    };
  },

  /**
   * 데이터를 로컬 스토리지에 저장합니다.
   * @param {Array<Object>} dataArray - 저장할 데이터 배열
   * @param {string} type - 'item' (기본값) 또는 'status'
   */
  save(dataToSave, type = 'item') {
    const { storageKey } = this._getKeys(type);
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  },

  /**
   * 로컬 스토리지에서 데이터를 불러옵니다.
   * @param {string} type - 'item' (기본값) 또는 'status'
   * @returns {Array<Object>} 저장된 데이터 배열
   */
  load(type = 'item') {
    const { storageKey } = this._getKeys(type);
    const data = localStorage.getItem(storageKey);
    if (type === 'timer') {
      return data ? JSON.parse(data) : {}; // For timers, return an object
    }
    return data ? JSON.parse(data) : []; // For items/status, return an array
  },

  // 레거시 지원 및 명확성을 위한 별칭
  loadStatus() { return this.load('status'); },

  /**
   * 새로운 데이터를 추가합니다.
   * @param {Object} newData - 추가할 데이터
   * @param {string} type - 'item' 또는 'status'
   */
  addData(newData, type) {
    const { orderKey } = this._getKeys(type);
    const dataArray = this.load(type);
    
    // 한도 체크 (Status는 'Status' 키 사용, Item/Cover는 데이터 내부의 type 사용)
    const limitKey = type === 'status' ? 'Status' : newData.type;
    const limit = this.LIMITS[limitKey];
    const currentCount = type === 'status' ? dataArray.length : dataArray.filter(d => d.type === newData.type).length;

    if (currentCount >= limit) {
      alert(`${limitKey}는 최대 ${limit}개까지 생성할 수 있습니다.`);
      return false;
    }

    // 순번 할당
    const maxOrder = dataArray.length > 0 ? Math.max(...dataArray.map(d => d[orderKey])) : 0;
    newData[orderKey] = maxOrder + 1;
    
    dataArray.push(newData);
    this.save(dataArray, type);
    return true;
  },

  /**
   * 데이터를 업데이트합니다.
   */
  updateData(order, updatedData, type = 'item') {
    const { orderKey } = this._getKeys(type);
    let dataArray = this.load(type);
    const dataIndex = dataArray.findIndex(d => d[orderKey] == order);
    
    if (dataIndex > -1) {
      dataArray[dataIndex] = { ...dataArray[dataIndex], ...updatedData };
      this.save(dataArray, type);
    }
  },

  /**
   * 데이터를 삭제하고 순번을 재정렬합니다.
   */
  deleteData(order, type = 'item') {
    const { orderKey } = this._getKeys(type);
    const dataArray = this.load(type);
    const remainingData = dataArray.filter(d => d[orderKey] != order);
    
    remainingData.sort((a, b) => a[orderKey] - b[orderKey]);
    const reorderedData = remainingData.map((item, index) => ({ 
      ...item, 
      [orderKey]: index + 1 
    }));

    this.save(reorderedData, type);
  },

  /**
   * 드래그 앤 드롭 후 순서를 저장합니다.
   */
  saveOrder(orderedIds, type = 'item') {
    const { orderKey } = this._getKeys(type);
    let dataArray = this.load(type);

    const reorderedArray = dataArray.map(item => {
      const newIndex = orderedIds.indexOf(String(item[orderKey]));
      item[orderKey] = newIndex + 1;
      return item;
    });
    this.save(reorderedArray, type);
  },

  /**
   * 타이머 설정(슬라이더, 홈, 뒤로가기)을 로컬 스토리지에 저장합니다.
   * @param {Object} timerSettings - 저장할 타이머 설정 객체
   */
  saveTimerSettings(timerSettings) {
    this.save(timerSettings, 'timer');
  },

  /**
   * 로컬 스토리지에서 타이머 설정을 불러옵니다.
   * @returns {Object} 저장된 타이머 설정 객체. 데이터가 없으면 빈 객체를 반환합니다.
   */
  loadTimerSettings() {
    return this.load('timer');
  }
};