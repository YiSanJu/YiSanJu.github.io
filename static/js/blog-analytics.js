/**
 * 技术博客专用的 Google Analytics 增强跟踪
 * 针对 AI + 前端开发系列文章的数据分析
 */

// 文章分类跟踪
function trackArticleCategory() {
    const tags = document.querySelectorAll('.post-tag');
    const categories = Array.from(tags).map(tag => tag.textContent.trim());
    
    if (categories.length > 0) {
        gtag('event', 'article_view', {
            'event_category': 'content',
            'event_label': categories.join(','),
            'custom_parameter': categories[0] // 主要分类
        });
    }
}

// 代码块交互跟踪
function trackCodeInteraction() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach((block, index) => {
        // 代码块点击跟踪
        block.addEventListener('click', function() {
            const language = block.className.match(/language-(\w+)/);
            gtag('event', 'code_click', {
                'event_category': 'engagement',
                'event_label': language ? language[1] : 'unknown',
                'value': index + 1
            });
        });
        
        // 代码块滚动到视图跟踪
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const language = entry.target.className.match(/language-(\w+)/);
                    gtag('event', 'code_view', {
                        'event_category': 'engagement',
                        'event_label': language ? language[1] : 'unknown'
                    });
                    observer.unobserve(entry.target);
                }
            });
        });
        
        observer.observe(block);
    });
}

// AI 相关内容跟踪
function trackAIContent() {
    const content = document.body.textContent.toLowerCase();
    const aiKeywords = ['claude', 'chatgpt', 'copilot', 'ai', '人工智能', 'prompt'];
    
    const foundKeywords = aiKeywords.filter(keyword => content.includes(keyword));
    
    if (foundKeywords.length > 0) {
        gtag('event', 'ai_content_view', {
            'event_category': 'content',
            'event_label': foundKeywords.join(','),
            'value': foundKeywords.length
        });
    }
}

// 外链点击跟踪
function trackExternalLinks() {
    const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
    
    externalLinks.forEach(link => {
        link.addEventListener('click', function() {
            gtag('event', 'external_link_click', {
                'event_category': 'engagement',
                'event_label': this.href,
                'transport_type': 'beacon'
            });
        });
    });
}

// 搜索行为跟踪（如果有搜索功能）
function trackSearch() {
    const searchInput = document.querySelector('input[type="search"], .search-input');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                gtag('event', 'search', {
                    'search_term': this.value.trim(),
                    'event_category': 'engagement'
                });
            }
        });
    }
}

// 页面滚动深度跟踪
function trackScrollDepth() {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 90, 100];
    const tracked = new Set();
    
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        
        maxScroll = Math.max(maxScroll, scrollPercent);
        
        milestones.forEach(milestone => {
            if (maxScroll >= milestone && !tracked.has(milestone)) {
                tracked.add(milestone);
                gtag('event', 'scroll_depth', {
                    'event_category': 'engagement',
                    'event_label': milestone + '%',
                    'value': milestone
                });
            }
        });
    });
}

// 初始化所有跟踪功能
function initBlogAnalytics() {
    // 确保 gtag 已加载
    if (typeof gtag === 'undefined') {
        console.warn('Google Analytics not loaded');
        return;
    }
    
    try {
        trackArticleCategory();
        trackCodeInteraction();
        trackAIContent();
        trackExternalLinks();
        trackSearch();
        trackScrollDepth();
        
        console.log('Blog analytics initialized successfully');
    } catch (error) {
        console.error('Error initializing blog analytics:', error);
    }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogAnalytics);
} else {
    initBlogAnalytics();
}