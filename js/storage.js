// 로컬 스토리지를 관리하는 객체
const storageManager = {
  // 저장 시 사용할 키(key) 정의
  KEY: 'signageData',

  // 데이터를 로컬 스토리지에 저장하는 함수
  save(dataArray) {
    localStorage.setItem(this.KEY, JSON.stringify(dataArray));
  },

  // 로컬 스토리지에서 데이터를 불러오는 함수
  load() {
    const data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) : [];
  },

  // 새 데이터를 추가하는 함수
  addData(newData) {
    const dataArray = this.load();

    // order 값 계산: 기존 데이터가 있으면 가장 큰 order + 1, 없으면 1
    const maxOrder = dataArray.length > 0 ? Math.max(...dataArray.map(d => d.order)) : 0;
    newData.order = maxOrder + 1;
    dataArray.push(newData);
    this.save(dataArray);
    return true; // 저장 성공
  },

  // 특정 데이터를 수정하는 함수
  updateData(order, updatedData) {
    let dataArray = this.load();
    const dataIndex = dataArray.findIndex(d => d.order == order);
    if (dataIndex > -1) {
      dataArray[dataIndex] = { ...dataArray[dataIndex], ...updatedData };
      this.save(dataArray);
    }
  },

  // 특정 데이터를 삭제하는 함수
  deleteData(order) {
    let dataArray = this.load();
    dataArray = dataArray.filter(d => d.order != order);
    this.save(dataArray);
  },

  // 모든 데이터를 삭제하는 함수 (필요 시 사용)
  clear() {
    localStorage.removeItem(this.KEY);
  },

  // 변경된 순서를 저장하는 함수
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
  }
};