import { storageManager } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  const settingsButtons = document.querySelectorAll('.btn-settings');
  
  // 설정 버튼이 없는 페이지에서는 실행하지 않음
  if (!settingsButtons.length) return;

  const currentPage = window.location.pathname.split("/").pop();
  let pathValue = '';

  if (currentPage === 'index.html' || currentPage === '') { // 기본 페이지 포함
    pathValue = 'slide';
  } else if (currentPage === 'view-list.html') {
    pathValue = 'list';
  }

  if (pathValue) {
    settingsButtons.forEach(button => button.addEventListener('click', () => localStorage.setItem(storageManager.KEY_PATH, pathValue)));
  }
});