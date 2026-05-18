/**
 * Cloudflare Worker - AI 聊天代理
 * 
 * 功能：
 * 1. 接收前端的聊天请求
 * 2. 使用环境变量中的 API Key 调用 OpenAI/Claude API
 * 3. 返回 AI 回复
 * 
 * 部署步骤：
 * 1. 安装 wrangler: npm install -g wrangler
 * 2. 登录 Cloudflare: wrangler login
 * 3. 设置环境变量: wrangler secret put OPENAI_API_KEY
 * 4. 部署: wrangler deploy
 * 
 * 环境变量（在 Cloudflare Dashboard 或 .env 中配置）：
 * - OPENAI_API_KEY: OpenAI API Key
 * - ALLOWED_ORIGIN: 允许的前端域名（如 https://yisanju.github.io）
 */

// 系统提示词 - 定义 AI 助手的角色
const SYSTEM_PROMPT = `你是 SanJu 的个人 AI 助手，部署在他的个人博客上。

关于 SanJu：
- 腾讯科技高级前端开发工程师，负责腾讯文档 Slide 模块
- 4 年以上前端开发经验
- 技术栈：JavaScript/TypeScript、Vue.js、React、Node.js、Canvas、Webpack/Vite
- 教育背景：计算机科学与技术本科（2017-2021）
- 之前在某互联网公司做前端开发（2021.07-2023.05）

工作内容：
- 腾讯文档 Slide 前端开发与维护
- 核心功能架构设计与性能优化
- 团队工程化建设

技术特长：
- 前端工程化
- Canvas 渲染（如文字竖排实现）
- 性能优化
- 复杂交互场景

回答要求：
1. 友善、专业、简洁
2. 如果问题与 SanJu 无关，礼貌地引导回技术话题
3. 可以分享前端开发经验和建议
4. 使用中文回答
5. 回复控制在 200 字以内`;

export default {
  async fetch(request, env) {
    // CORS 处理
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || 'https://yisanju.github.io',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 只接受 POST 请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const { messages } = await request.json();

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 构建 API 请求
      const apiMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-10) // 最多保留 10 条历史
      ];

      // 调用 OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // 性价比最高的模型
          messages: apiMessages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API Error:', error);
        return new Response(JSON.stringify({ reply: '抱歉，AI 服务暂时不可用，请稍后再试。' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content || '抱歉，我无法生成回复。';

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker Error:', error);
      return new Response(JSON.stringify({ reply: '服务出现错误，请稍后再试。' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
