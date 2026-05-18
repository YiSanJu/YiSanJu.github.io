/**
 * GitHub 活动展示组件
 * 调用 GitHub 公开 API 获取用户活动数据
 */
(function() {
  'use strict';

  var GITHUB_USERNAME = 'YiSanJu';
  var GITHUB_API = 'https://api.github.com';

  // 获取用户仓库信息
  function fetchRepos() {
    return fetch(GITHUB_API + '/users/' + GITHUB_USERNAME + '/repos?sort=updated&per_page=6')
      .then(function(res) { return res.json(); })
      .catch(function() { return []; });
  }

  // 获取用户信息
  function fetchUserInfo() {
    return fetch(GITHUB_API + '/users/' + GITHUB_USERNAME)
      .then(function(res) { return res.json(); })
      .catch(function() { return null; });
  }

  // 渲染 GitHub 统计卡片
  function renderGitHubStats(container) {
    Promise.all([fetchUserInfo(), fetchRepos()])
      .then(function(results) {
        var user = results[0];
        var repos = results[1];

        if (!user || !repos.length) {
          container.innerHTML = '<p style="color:#999;">GitHub 数据加载失败，请稍后再试</p>';
          return;
        }

        var totalStars = repos.reduce(function(sum, repo) {
          return sum + (repo.stargazers_count || 0);
        }, 0);

        var html = '';

        // 统计数字
        html += '<div class="github-stats-grid">';
        html += '<div class="github-stat-item">';
        html += '<span class="github-stat-number">' + user.public_repos + '</span>';
        html += '<span class="github-stat-label">公开仓库</span>';
        html += '</div>';
        html += '<div class="github-stat-item">';
        html += '<span class="github-stat-number">' + totalStars + '</span>';
        html += '<span class="github-stat-label">获得 Stars</span>';
        html += '</div>';
        html += '<div class="github-stat-item">';
        html += '<span class="github-stat-number">' + user.followers + '</span>';
        html += '<span class="github-stat-label">关注者</span>';
        html += '</div>';
        html += '<div class="github-stat-item">';
        html += '<span class="github-stat-number">' + user.following + '</span>';
        html += '<span class="github-stat-label">关注中</span>';
        html += '</div>';
        html += '</div>';

        // GitHub 贡献图（使用 img 标签嵌入）
        html += '<div class="github-contrib-chart">';
        html += '<img src="https://ghchart.rshah.org/' + GITHUB_USERNAME + '" alt="GitHub 贡献热力图" />';
        html += '</div>';

        // 最近活跃仓库
        html += '<h4 style="margin-top:25px;margin-bottom:15px;font-size:16px;">📦 最近活跃仓库</h4>';
        html += '<div class="github-repos-grid">';
        repos.slice(0, 4).forEach(function(repo) {
          html += '<div class="github-repo-card">';
          html += '<a href="' + repo.html_url + '" target="_blank" class="github-repo-name">' + repo.name + '</a>';
          html += '<p class="github-repo-desc">' + (repo.description || '暂无描述') + '</p>';
          html += '<div class="github-repo-meta">';
          if (repo.language) {
            html += '<span class="github-repo-lang"><span class="lang-dot" style="background:' + getLanguageColor(repo.language) + '"></span>' + repo.language + '</span>';
          }
          html += '<span class="github-repo-stars">⭐ ' + repo.stargazers_count + '</span>';
          html += '<span class="github-repo-forks">🍴 ' + repo.forks_count + '</span>';
          html += '</div>';
          html += '</div>';
        });
        html += '</div>';

        container.innerHTML = html;
      });
  }

  // 语言颜色映射
  function getLanguageColor(lang) {
    var colors = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Vue': '#41b883',
      'HTML': '#e34c26',
      'CSS': '#563d7c',
      'Python': '#3572A5',
      'Java': '#b07219',
      'Shell': '#89e051',
      'Markdown': '#083fa1'
    };
    return colors[lang] || '#586069';
  }

  // ============ 技能雷达图 ============
  
  function renderSkillRadar(container) {
    var canvas = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    var size = 500;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.style.maxWidth = '100%';
    canvas.style.margin = '0 auto';
    canvas.style.display = 'block';
    container.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var centerX = size / 2;
    var centerY = size / 2;
    var radius = 180;

    // 技能数据（突出文档和AI方向）
    var skills = [
      { name: '文档/PPT 渲染', value: 0.92 },
      { name: 'Canvas/WebGL', value: 0.88 },
      { name: 'AI 应用开发', value: 0.82 },
      { name: '多端开发', value: 0.8 },
      { name: '前端工程化', value: 0.88 },
      { name: '性能优化', value: 0.85 },
      { name: 'TypeScript', value: 0.9 },
      { name: 'Vue/React', value: 0.85 }
    ];

    var total = skills.length;
    var step = (2 * Math.PI) / total;

    // 检测暗色模式
    var isDark = document.body.classList.contains('dark-mode');
    var textColor = isDark ? '#e0e0e0' : '#2c3e50';
    var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    var axisColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';

    // 渐变填充色
    var gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    if (isDark) {
      gradient.addColorStop(0, 'rgba(0, 210, 255, 0.35)');
      gradient.addColorStop(1, 'rgba(88, 86, 214, 0.15)');
    } else {
      gradient.addColorStop(0, 'rgba(17, 153, 142, 0.3)');
      gradient.addColorStop(1, 'rgba(56, 239, 125, 0.1)');
    }

    var strokeColor = isDark ? 'rgba(0, 210, 255, 0.9)' : 'rgba(17, 153, 142, 0.9)';
    var dotColor = isDark ? '#00d2ff' : '#11998e';
    var dotGlow = isDark ? 'rgba(0, 210, 255, 0.4)' : 'rgba(17, 153, 142, 0.3)';

    // 绘制背景网格（圆形 + 多边形混合）
    for (var level = 1; level <= 5; level++) {
      var r = (radius / 5) * level;
      ctx.beginPath();
      for (var i = 0; i <= total; i++) {
        var angle = step * i - Math.PI / 2;
        var x = centerX + r * Math.cos(angle);
        var y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 每层标注百分比
      if (level % 2 === 0) {
        ctx.font = '11px -apple-system, sans-serif';
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
        ctx.textAlign = 'left';
        ctx.fillText((level * 20) + '%', centerX + 4, centerY - r + 4);
      }
    }

    // 绘制轴线
    for (var i = 0; i < total; i++) {
      var angle = step * i - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 绘制数据区域（带渐变）
    ctx.beginPath();
    for (var i = 0; i < total; i++) {
      var angle = step * i - Math.PI / 2;
      var value = skills[i].value;
      var x = centerX + radius * value * Math.cos(angle);
      var y = centerY + radius * value * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 绘制数据点（带光晕）
    for (var i = 0; i < total; i++) {
      var angle = step * i - Math.PI / 2;
      var value = skills[i].value;
      var x = centerX + radius * value * Math.cos(angle);
      var y = centerY + radius * value * Math.sin(angle);
      
      // 光晕
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = dotGlow;
      ctx.fill();

      // 实心点
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 绘制标签
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < total; i++) {
      var angle = step * i - Math.PI / 2;
      var labelRadius = radius + 30;
      var x = centerX + labelRadius * Math.cos(angle);
      var y = centerY + labelRadius * Math.sin(angle);
      
      // 根据角度调整文字对齐
      if (Math.cos(angle) > 0.3) ctx.textAlign = 'left';
      else if (Math.cos(angle) < -0.3) ctx.textAlign = 'right';
      else ctx.textAlign = 'center';
      
      ctx.fillText(skills[i].name, x, y);

      // 数值标注
      ctx.font = '11px -apple-system, sans-serif';
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
      ctx.fillText(Math.round(skills[i].value * 100) + '%', x, y + 16);

      // 重置
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = textColor;
    }
  }

  // ============ 初始化 ============
  
  function init() {
    var githubContainer = document.getElementById('github-activity');
    if (githubContainer) {
      renderGitHubStats(githubContainer);
    }

    var radarContainer = document.getElementById('skill-radar');
    if (radarContainer) {
      renderSkillRadar(radarContainer);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 监听暗色模式切换，重绘雷达图
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        var radarContainer = document.getElementById('skill-radar');
        if (radarContainer) {
          radarContainer.innerHTML = '';
          renderSkillRadar(radarContainer);
        }
      }
    });
  });

  observer.observe(document.body, { attributes: true });
})();
