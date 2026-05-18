/**
 * 暗色模式切换
 * 支持本地存储记忆用户偏好
 * 支持系统偏好自动检测
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'sanju-dark-mode';

  // 获取用户偏好
  function getPreference() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
    // 跟随系统偏好
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // 应用暗色模式
  function applyDarkMode(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    updateToggleIcon(isDark);
  }

  // 更新按钮图标
  function updateToggleIcon(isDark) {
    var btn = document.getElementById('darkModeToggle');
    if (btn) {
      btn.innerHTML = isDark ? '☀️' : '🌙';
      btn.title = isDark ? '切换到亮色模式' : '切换到暗色模式';
    }
  }

  // 切换模式
  function toggleDarkMode() {
    var isDark = document.body.classList.contains('dark-mode');
    var newMode = !isDark;
    localStorage.setItem(STORAGE_KEY, newMode);
    applyDarkMode(newMode);
  }

  // 创建切换按钮
  function createToggleButton() {
    var btn = document.createElement('button');
    btn.id = 'darkModeToggle';
    btn.className = 'dark-mode-toggle';
    btn.setAttribute('aria-label', '切换暗色模式');
    btn.addEventListener('click', toggleDarkMode);
    document.body.appendChild(btn);
  }

  // 初始化
  function init() {
    createToggleButton();
    var isDark = getPreference();
    applyDarkMode(isDark);
  }

  // 监听系统偏好变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      // 只有用户没有手动设置时才跟随系统
      if (localStorage.getItem(STORAGE_KEY) === null) {
        applyDarkMode(e.matches);
      }
    });
  }

  // DOM 准备好后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
