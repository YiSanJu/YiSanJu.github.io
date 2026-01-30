# 草稿发布工具

将 `_drafts` 中的草稿发布到 `_posts`，自动处理文章中的图片和文档。

## 功能

1. **自动发布** - 将草稿移动到 `_posts` 目录
2. **图片处理** - 自动下载文章中的网络图片到本地
3. **文档处理** - 自动下载/复制 PDF、DOC 等文档到本地
4. **路径替换** - 将资源 URL 替换为本地路径
5. **日期管理** - 自动添加/更新发布日期

## 使用方法

```bash
cd scripts/publish

# 交互式发布（推荐）
node publish.js

# 列出所有草稿
node publish.js --list

# 直接发布指定草稿
node publish.js --file=2024-01-20-文章名.md
node publish.js --file=文章名    # 支持模糊匹配
```

## 支持的文档格式

| 格式 | 扩展名 |
|------|--------|
| PDF | .pdf |
| Word | .doc, .docx |
| Excel | .xls, .xlsx |
| PowerPoint | .ppt, .pptx |
| 压缩包 | .zip, .rar |

## 发布流程

1. 运行脚本，选择要发布的草稿
2. 脚本自动处理：
   - 下载网络图片到 `static/img/posts/[日期]/`
   - 下载/复制文档到 `static/docs/[日期]/`
   - 替换资源路径为本地路径
   - 更新 Front Matter 中的日期
   - 移动文章到 `_posts/` 目录
3. 选择是否删除原草稿

## 资源处理规则

| 资源类型 | 处理方式 |
|---------|---------|
| 网络图片 (http/https) | 下载到本地，替换路径 |
| 网络文档 (http/https) | 下载到本地，替换路径 |
| 本地图片 (/static/...) | 保持不变 |
| 本地文档 (相对路径) | 复制到 static/docs/，替换路径 |

## 文件结构

发布后的资源存放位置：

```
static/
├── img/posts/
│   └── 2024-01-20/          # 图片按发布日期组织
│       ├── img-1.jpg
│       └── img-2.png
└── docs/
    └── 2024-01-20/          # 文档按发布日期组织
        ├── doc-1.pdf
        └── doc-2.docx
```

## 示例

### 草稿内容

```markdown
![示例图片](https://example.com/image.jpg)

下载文档：[报告.pdf](https://example.com/report.pdf)

本地文档：[简历](resume.pdf)
```

### 发布后

```markdown
![示例图片](/static/img/posts/2024-01-20/img-1.jpg)

下载文档：[报告.pdf](/static/docs/2024-01-20/doc-1.pdf)

本地文档：[简历](/static/docs/2024-01-20/doc-2.pdf)
```
