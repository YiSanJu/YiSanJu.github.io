# 图片路径提取与替换工具

扫描项目中所有页面使用的图片路径，支持一键替换。

## 使用方法

```bash
cd scripts/setImage

# 查看所有图片路径
node setImage.js

# 导出图片路径到 JSON 文件
node setImage.js --export

# 交互式替换单个图片路径
node setImage.js --replace

# 批量替换路径前缀
node setImage.js --batch
```

## 功能说明

### 1. 查看所有图片路径

```bash
node setImage.js
```

输出示例：
```
📷 项目中使用的图片路径:

[1] static/img/main.jpg
    使用 1 次:
    - _config.yml:12

[2] static/img/about.jpg
    使用 1 次:
    - pages/about.html:5

共找到 10 个不同的图片路径
```

### 2. 导出到 JSON

```bash
node setImage.js --export
```

生成 `image-paths.json` 文件，包含所有图片路径及其使用位置。

### 3. 替换单个路径

```bash
node setImage.js --replace
```

交互式选择要替换的图片，输入新路径后自动替换所有引用。

### 4. 批量替换前缀

```bash
node setImage.js --batch
```

示例：将所有 `img/` 替换为 `static/img/`

## 扫描范围

- `_posts/` - 文章
- `_drafts/` - 草稿
- `_includes/` - 组件
- `_layouts/` - 布局
- `_config.yml` - 配置
- `pages/` - 页面
- `index.html` - 首页

## 支持的图片引用格式

- `header-img: "xxx.jpg"` - Front Matter
- `src="xxx.jpg"` - HTML 图片
- `url(xxx.jpg)` - CSS 背景
- `![alt](xxx.jpg)` - Markdown 图片
- `sidebar-avatar: xxx` - 配置项
