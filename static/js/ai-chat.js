/**
 * AI 聊天组件
 * 前端聊天界面，通过 Cloudflare Workers 代理调用 AI API
 * API Key 存储在 Cloudflare Workers 的环境变量中，不会暴露在前端
 */
(function() {
  'use strict';

  // ============ 配置 ============
  // 替换为你的 Cloudflare Worker URL
  // Worker 代码见 /scripts/ai-chat-worker/ 目录
  var CONFIG = {
    workerUrl: '', // 部署 Worker 后填入 URL，如: https://ai-chat.your-name.workers.dev
    botName: 'SanJu AI',
    welcomeMessage: '👋 你好！我是 SanJu 的 AI 助手，基于他的博客和技术经验训练。\n\n你可以问我：\n• 关于 SanJu 的技术栈和工作经验\n• 前端开发相关问题\n• 腾讯文档 Slide 的技术细节\n\n有什么我能帮你的？',
    placeholder: '输入消息，和我聊聊...',
    maxHistory: 10
  };

  // ============ 状态 ============
  var chatHistory = [];
  var isOpen = false;
  var isLoading = false;

  // ============ UI 创建 ============
  
  function createChatWidget() {
    // 聊天按钮
    var trigger = document.createElement('button');
    trigger.id = 'aiChatTrigger';
    trigger.className = 'ai-chat-trigger';
    trigger.innerHTML = '💬';
    trigger.title = '和 AI 聊聊';
    trigger.addEventListener('click', toggleChat);

    // 聊天窗口
    var widget = document.createElement('div');
    widget.id = 'aiChatWidget';
    widget.className = 'ai-chat-widget';
    widget.innerHTML = [
      '<div class="ai-chat-header">',
      '  <div class="ai-chat-header-info">',
      '    <span class="ai-chat-avatar">🤖</span>',
      '    <span class="ai-chat-title">' + CONFIG.botName + '</span>',
      '    <span class="ai-chat-status">在线</span>',
      '  </div>',
      '  <button class="ai-chat-close" id="aiChatClose">✕</button>',
      '</div>',
      '<div class="ai-chat-messages" id="aiChatMessages"></div>',
      '<div class="ai-chat-input-area">',
      '  <input type="text" class="ai-chat-input" id="aiChatInput" placeholder="' + CONFIG.placeholder + '" />',
      '  <button class="ai-chat-send" id="aiChatSend">发送</button>',
      '</div>'
    ].join('\n');

    document.body.appendChild(trigger);
    document.body.appendChild(widget);

    // 绑定事件
    document.getElementById('aiChatClose').addEventListener('click', toggleChat);
    document.getElementById('aiChatSend').addEventListener('click', sendMessage);
    document.getElementById('aiChatInput').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // 显示欢迎消息
    appendMessage('bot', CONFIG.welcomeMessage);
  }

  // ============ 交互逻辑 ============
  
  function toggleChat() {
    isOpen = !isOpen;
    var widget = document.getElementById('aiChatWidget');
    var trigger = document.getElementById('aiChatTrigger');
    
    if (isOpen) {
      widget.classList.add('ai-chat-widget--open');
      trigger.classList.add('ai-chat-trigger--hidden');
      document.getElementById('aiChatInput').focus();
    } else {
      widget.classList.remove('ai-chat-widget--open');
      trigger.classList.remove('ai-chat-trigger--hidden');
    }
  }

  function appendMessage(role, content) {
    var messagesEl = document.getElementById('aiChatMessages');
    var messageEl = document.createElement('div');
    messageEl.className = 'ai-chat-message ai-chat-message--' + role;
    
    // 简单的 markdown 转换
    var html = content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
    
    messageEl.innerHTML = [
      '<div class="ai-chat-bubble">',
      html,
      '</div>'
    ].join('');
    
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function appendLoadingMessage() {
    var messagesEl = document.getElementById('aiChatMessages');
    var messageEl = document.createElement('div');
    messageEl.className = 'ai-chat-message ai-chat-message--bot ai-chat-message--loading';
    messageEl.id = 'aiChatLoading';
    messageEl.innerHTML = '<div class="ai-chat-bubble"><span class="ai-chat-dots"><span>.</span><span>.</span><span>.</span></span></div>';
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function removeLoadingMessage() {
    var loading = document.getElementById('aiChatLoading');
    if (loading) loading.remove();
  }

  function sendMessage() {
    if (isLoading) return;
    
    var input = document.getElementById('aiChatInput');
    var message = input.value.trim();
    if (!message) return;

    // 显示用户消息
    appendMessage('user', message);
    input.value = '';

    // 保存到历史
    chatHistory.push({ role: 'user', content: message });

    // 检查是否配置了 Worker URL
    if (!CONFIG.workerUrl) {
      // 没有配置 Worker，使用本地回复
      appendLocalReply(message);
      return;
    }

    // 调用 AI API
    isLoading = true;
    appendLoadingMessage();

    fetch(CONFIG.workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory.slice(-CONFIG.maxHistory)
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      removeLoadingMessage();
      isLoading = false;
      
      var reply = data.reply || '抱歉，我暂时无法回答这个问题。';
      appendMessage('bot', reply);
      chatHistory.push({ role: 'assistant', content: reply });
    })
    .catch(function(err) {
      removeLoadingMessage();
      isLoading = false;
      appendMessage('bot', '⚠️ 网络连接出现问题，请稍后再试。');
      console.error('AI Chat Error:', err);
    });
  }

  // ============ 本地回复（未配置 Worker 时的兜底） ============
  
  function appendLocalReply(message) {
    var msg = message.toLowerCase();
    var reply = '';

    if (msg.includes('技术栈') || msg.includes('擅长') || msg.includes('会什么')) {
      reply = '**SanJu 的技术栈：**\n\n• 前端框架：Vue.js、React\n• 编程语言：JavaScript、TypeScript\n• 构建工具：Webpack、Vite\n• 可视化：Canvas、SVG\n• 后端：Node.js\n• 其他：Git、性能优化、前端工程化\n\n目前主要在腾讯负责文档 Slide 模块的开发。';
    } else if (msg.includes('工作') || msg.includes('经历') || msg.includes('腾讯')) {
      reply = '**SanJu 的工作经历：**\n\n🏢 **腾讯科技**（2023.06 - 至今）\n高级前端开发工程师，负责腾讯文档 Slide 模块。\n\n🏢 **某互联网公司**（2021.07 - 2023.05）\n前端开发工程师，负责核心产品的前端开发。\n\n拥有 4 年以上前端开发经验。';
    } else if (msg.includes('slide') || msg.includes('文档') || msg.includes('竖排')) {
      reply = '**关于 Slide 文字竖排：**\n\nSanJu 在腾讯文档 Slide 中实现了东亚文字竖排渲染，主要技术点：\n\n• 解析 OOXML 格式中的 `vert` 属性\n• 支持 eaVert（东亚垂直）等多种排版模式\n• 使用 Canvas 进行文字渲染\n• 处理数字在竖排中的特殊显示逻辑\n\n详细内容可以查看博客文章《Slide文字竖排实现》。';
    } else if (msg.includes('联系') || msg.includes('邮箱') || msg.includes('github')) {
      reply = '**联系方式：**\n\n📧 Email: 1307022894@qq.com\n🐙 GitHub: [github.com/YiSanJu](https://github.com/YiSanJu)\n\n欢迎联系交流！';
    } else if (msg.includes('你好') || msg.includes('hi') || msg.includes('hello')) {
      reply = '你好！👋 很高兴和你聊天。我是 SanJu 的 AI 助手，可以回答关于他的技术栈、工作经历、项目等问题。有什么想了解的？';
    } else {
      reply = '感谢你的提问！作为 SanJu 的 AI 助手，我可以回答以下问题：\n\n• 技术栈和技能\n• 工作经历\n• Slide 竖排渲染等技术细节\n• 联系方式\n\n你也可以直接访问 [About](/about/) 页面了解更多信息。\n\n*（提示：配置 Cloudflare Worker 后可获得更智能的 AI 回复）*';
    }

    setTimeout(function() {
      appendMessage('bot', reply);
      chatHistory.push({ role: 'assistant', content: reply });
    }, 500);
  }

  // ============ 初始化 ============
  
  function init() {
    createChatWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
