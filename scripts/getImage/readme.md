# 高质量图片下载工具

从 [Lorem Picsum](https://picsum.photos/) 获取免费高质量图片，用于博客背景、文章头图等。

## 使用方法

```bash
cd scripts/getImage

# 下载 10 张图片（默认 1920x1080）
node getImages.js

# 指定下载数量
node getImages.js --count=20

# 指定图片尺寸
node getImages.js --size=1920x1200

# 组合使用
node getImages.js --count=15 --size=2560x1440
```

## 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--count` | 下载图片数量 | 10 |
| `--size` | 图片尺寸（宽x高） | 1920x1080 |

## 输出位置

下载完成后，脚本会询问是否将图片移动到博客静态资源目录：

```
是否将图片移动到博客静态资源目录 (static/img)? [y/N]
```

- 输入 `y` - 图片移动到 `static/img/`
- 输入 `n` 或直接回车 - 图片保留在 `scripts/getImage/images/`

## 在文章中引用：

```yaml
# _config.yml
header-img: static/img/new-header.jpg

# 文章 Front Matter
header-img: "static/img/post-bg.jpg"
```
