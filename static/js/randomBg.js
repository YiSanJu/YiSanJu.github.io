/**
 * 随机背景图片
 * 使用 Picsum 提供随机高质量图片
 */
(function() {
  // 配置
  var config = {
    width: 1920,
    height: 1080
  };

  // 生成随机图片 URL
  function getRandomImageUrl() {
    var seed = Date.now() + Math.floor(Math.random() * 10000);
    return 'https://picsum.photos/seed/' + seed + '/' + config.width + '/' + config.height;
  }

  // 设置背景图片
  function setRandomBackground() {
    var header = document.querySelector('header.intro-header');
    if (!header) return;
    
    var randomBg = header.getAttribute('data-random-bg');
    console.log('Random BG setting:', randomBg);
    
    // 只有明确设置为 true 时才启用随机背景
    if (randomBg === 'true') {
      var imageUrl = getRandomImageUrl();
      console.log('Setting random background:', imageUrl);
      header.style.backgroundImage = 'url(' + imageUrl + ')';
    }
  }

  // 立即执行（因为脚本在 footer 加载，DOM 已经准备好）
  setRandomBackground();
})();
