# SanJu Blog

> 基于 Jekyll 的个人博客，部署在 GitHub Pages。记录自己，认清自己，成为自己。

## 项目结构

```
yisanju/
├── index.html            # 首页
│
├── _config.yml           # Jekyll 配置
├── _posts/               # 已发布文章
├── _drafts/              # 草稿文章
├── _layouts/             # 布局模板
│   ├── default.html      # 基础布局
│   ├── post.html         # 文章页
│   ├── page.html         # 普通页面
│   └── keynote.html      # 演示文稿
├── _includes/            # 页面组件
│   ├── head.html         # 头部（meta/css）
│   ├── nav.html          # 导航栏
│   └── footer.html       # 页脚（js/统计）
│
├── pages/                # 页面文件
│   ├── about.html        # 关于页 → /about/
│   ├── tags.html         # 标签页 → /tags/
│   ├── 404.html          # 404 页面
│   └── offline.html      # PWA 离线页
│
├── static/               # 静态资源
│   ├── css/              # 样式文件
│   ├── js/               # 脚本文件
│   ├── img/              # 图片资源
│   ├── fonts/            # 字体文件
│   └── less/             # LESS 源文件
│
├── works/                # 作品展示
├── pwa/                  # PWA 配置
│
├── feed.xml              # RSS 订阅
├── sw.js                 # Service Worker
├── Gruntfile.js          # Grunt 构建配置
└── package.json          # npm 配置
```

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install
bundle install

# 启动本地服务
jekyll serve
# 或
npm run dev

# 预览草稿
jekyll serve --drafts
```

访问 http://localhost:4000

### 前端构建

```bash
# 编译 Less / 压缩 JS
grunt

# 监听文件变化
grunt watch
```

## 写作指南

### 创建新文章

在 `_posts/` 目录创建文件，命名格式：`YYYY-MM-DD-标题.md`

```yaml
---
layout: post
title: "文章标题"
subtitle: "副标题"
date: 2024-01-16
author: "Sanju"
header-img: "static/img/post-bg.jpg"
catalog: true
tags:
    - 标签1
    - 标签2
---

文章内容...
```

### 草稿

未完成的文章放在 `_drafts/` 目录，不会被构建发布。

## 配置说明

主要配置在 `_config.yml`：

```yaml
# 站点信息
title: SanJu
SEOTitle: 三句的信使 | SanJu
url: "https://YiSanJu.github.io"

# 侧边栏
sidebar: true
sidebar-avatar: /static/img/nav.jpg

# 分页
paginate: 10

# 评论系统（Gitalk）
gitalk:
  enable: false
  clientID: ''
  clientSecret: ''

# PWA
service-worker: true
```

## 部署

```bash
git add .
git commit -m "Update blog"
git push origin main
```

GitHub Pages 会自动构建部署。

## 致谢

- [Jekyll](https://jekyllrb.com/)
- [Hux Blog](https://github.com/Huxpro/huxpro.github.io) - 模板来源
- [Bootstrap](https://getbootstrap.com/)

## 联系

- **作者**: SanJu
- **邮箱**: 1307022894@qq.com
- **GitHub**: [@YiSanJu](https://github.com/YiSanJu)
