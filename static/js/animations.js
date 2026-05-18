/**
 * 滚动动画与微交互
 * 使用 Intersection Observer 实现滚动触发动画
 */
(function() {
  'use strict';

  // ============ 滚动渐入动画 ============
  
  // 需要动画的元素选择器
  var animateSelectors = [
    '.post-preview',
    '.about-section',
    '.hobby-card',
    '.essay-item',
    '.timeline-item',
    '.skill-tag',
    '.project-card'
  ];

  // 添加初始隐藏类
  function initAnimateElements() {
    animateSelectors.forEach(function(selector) {
      var elements = document.querySelectorAll(selector);
      elements.forEach(function(el, index) {
        el.classList.add('scroll-animate');
        el.style.transitionDelay = (index % 4) * 0.1 + 's';
      });
    });
  }

  // Intersection Observer 配置
  function setupScrollObserver() {
    if (!('IntersectionObserver' in window)) {
      // 不支持的浏览器直接显示所有元素
      document.querySelectorAll('.scroll-animate').forEach(function(el) {
        el.classList.add('scroll-animate--visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-animate--visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.scroll-animate').forEach(function(el) {
      observer.observe(el);
    });
  }

  // ============ 导航栏滚动效果 ============
  
  function setupNavbarScroll() {
    var navbar = document.querySelector('.navbar-custom');
    if (!navbar) return;

    var lastScroll = 0;
    var ticking = false;

    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          var currentScroll = window.pageYOffset;
          
          if (currentScroll > 100) {
            navbar.classList.add('navbar-shrink');
          } else {
            navbar.classList.remove('navbar-shrink');
          }
          
          lastScroll = currentScroll;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ============ 回到顶部按钮 ============
  
  function setupBackToTop() {
    var btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.title = '回到顶部';
    btn.setAttribute('aria-label', '回到顶部');
    document.body.appendChild(btn);

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 400) {
        btn.classList.add('back-to-top--visible');
      } else {
        btn.classList.remove('back-to-top--visible');
      }
    });
  }

  // ============ 打字机效果 ============
  
  function setupTypewriter() {
    var element = document.querySelector('.site-heading .subheading');
    if (!element || !element.textContent.trim()) return;
    
    var text = element.textContent.trim();
    element.textContent = '';
    
    // 覆盖 fadeInUp 动画，直接显示
    element.style.opacity = '1';
    element.style.animation = 'none';
    // 添加打字状态 class（控制光标显示）
    element.classList.add('typing-active');
    
    var i = 0;
    var timer = setInterval(function() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        // 光标闪烁一会儿后消失
        setTimeout(function() {
          element.classList.remove('typing-active');
        }, 2000);
      }
    }, 80);
  }

  // ============ 初始化 ============
  
  function init() {
    initAnimateElements();
    setupScrollObserver();
    setupNavbarScroll();
    setupBackToTop();
    setupTypewriter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
