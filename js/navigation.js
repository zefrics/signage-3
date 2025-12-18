import { storageManager } from './storage.js';

/**
 * 이 파일은 페이지 탐색과 관련된 로직을 관리합니다.
 * 1. view-list.html 접근 시 'Item' 데이터 유무를 확인하고 없으면 리디렉션합니다.
 * 2. 각 페이지의 'Settings' 버튼 클릭 시, 돌아올 경로를 localStorage에 저장합니다.
 */

// --- 1. view-list.html 리디렉션 로직 (즉시 실행) ---
const currentPagePath = window.location.pathname.split("/").pop();

if (currentPagePath === 'view-list.html') {
  const allData = storageManager.load();
  const hasItems = allData.some(d => d.type === 'Item');

  if (!hasItems) {
    // .replace()는 브라우저 히스토리에 현재 페이지를 남기지 않아 '뒤로 가기'로 돌아올 수 없게 합니다.
    window.location.replace('index.html');
  }
}

// --- 2. Settings 버튼 경로 저장 로직 (DOM 로드 후 실행) ---
document.addEventListener('DOMContentLoaded', () => {
  const settingsButtons = document.querySelectorAll('.btn-settings');
  if (!settingsButtons.length) return;

  const pathValue = (currentPagePath === 'index.html' || currentPagePath === '') ? 'slide' : 'list';

  settingsButtons.forEach(button => button.addEventListener('click', () => localStorage.setItem(storageManager.KEY_PATH, pathValue)));
});