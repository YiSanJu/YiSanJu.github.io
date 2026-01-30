/**
 * 草稿发布脚本
 * 将 _drafts 中的文章发布到 _posts，自动处理图片和文档
 * 
 * 使用方法:
 *   node publish.js                    # 交互式选择要发布的草稿
 *   node publish.js --list             # 列出所有草稿
 *   node publish.js --file=xxx.md      # 直接发布指定草稿
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const readline = require('readline');

// 目录配置
const rootDir = path.join(__dirname, '../..');
const draftsDir = path.join(rootDir, '_drafts');
const postsDir = path.join(rootDir, '_posts');
const imgDir = path.join(rootDir, 'static/img/posts');
const docsDir = path.join(rootDir, 'static/docs');

// 支持的文档格式
const DOC_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar'];

// 确保目录存在
[imgDir, docsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 解析命令行参数
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasArg = (name) => args.includes(`--${name}`);

// 获取所有草稿
function getDrafts() {
  if (!fs.existsSync(draftsDir)) {
    return [];
  }
  return fs.readdirSync(draftsDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = fs.readFileSync(path.join(draftsDir, f), 'utf-8');
      const titleMatch = content.match(/title:\s*(.+)/);
      const dateMatch = f.match(/^(\d{4}-\d{2}-\d{2})/);
      return {
        filename: f,
        title: titleMatch ? titleMatch[1].trim() : f,
        date: dateMatch ? dateMatch[1] : null,
        path: path.join(draftsDir, f)
      };
    });
}

// 获取 drafts 目录中的文档文件
function getLocalDocs() {
  if (!fs.existsSync(draftsDir)) {
    return [];
  }
  return fs.readdirSync(draftsDir)
    .filter(f => DOC_EXTENSIONS.some(ext => f.toLowerCase().endsWith(ext)))
    .map(f => ({
      filename: f,
      size: fs.statSync(path.join(draftsDir, f)).size,
      path: path.join(draftsDir, f)
    }));
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 列出所有草稿
function listDrafts() {
  const drafts = getDrafts();
  const docs = getLocalDocs();
  
  if (drafts.length === 0) {
    console.log('\n📭 没有找到草稿\n');
    return;
  }
  
  console.log('\n📝 草稿列表:\n');
  console.log('─'.repeat(60));
  drafts.forEach((draft, index) => {
    console.log(`[${index + 1}] ${draft.filename}`);
    console.log(`    标题: ${draft.title}`);
    if (draft.date) {
      console.log(`    日期: ${draft.date}`);
    }
    console.log('');
  });
  console.log('─'.repeat(60));
  console.log(`共 ${drafts.length} 篇草稿\n`);
  
  // 显示文档文件
  if (docs.length > 0) {
    console.log('📎 附件文档:\n');
    docs.forEach(doc => {
      console.log(`   • ${doc.filename} (${formatSize(doc.size)})`);
    });
    console.log(`\n   共 ${docs.length} 个文档，发布时会自动处理\n`);
  }
  
  return drafts;
}

// 下载文件（图片或文档）
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// 判断是否为文档链接
function isDocumentUrl(url) {
  const urlLower = url.toLowerCase();
  return DOC_EXTENSIONS.some(ext => urlLower.includes(ext));
}

// 获取文件扩展名
function getFileExtension(url) {
  // 先从 URL 路径获取
  const urlPath = url.split('?')[0];
  const ext = path.extname(urlPath).toLowerCase();
  
  if (ext && DOC_EXTENSIONS.includes(ext)) {
    return ext;
  }
  
  // 尝试从 URL 中匹配已知扩展名
  for (const docExt of DOC_EXTENSIONS) {
    if (url.toLowerCase().includes(docExt)) {
      return docExt;
    }
  }
  
  return ext || '.pdf';
}

// 处理本地文档（复制到 static/docs）
function processLocalDoc(docPath, postDate) {
  const postDocsDir = path.join(docsDir, postDate);
  if (!fs.existsSync(postDocsDir)) {
    fs.mkdirSync(postDocsDir, { recursive: true });
  }
  
  const filename = path.basename(docPath);
  const destPath = path.join(postDocsDir, filename);
  const relativePath = `/static/docs/${postDate}/${filename}`;
  
  // 检查文件是否存在于 drafts 目录
  const sourcePath = path.join(draftsDir, docPath);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, destPath);
    return { success: true, relativePath, sourcePath };
  }
  
  // 检查相对于项目根目录
  const rootSourcePath = path.join(rootDir, docPath);
  if (fs.existsSync(rootSourcePath)) {
    fs.copyFileSync(rootSourcePath, destPath);
    return { success: true, relativePath, sourcePath: rootSourcePath };
  }
  
  return { success: false };
}

// 提取并处理图片和文档
async function processAssets(content, postDate) {
  // 创建文章专属目录
  const postImgDir = path.join(imgDir, postDate);
  const postDocsDir = path.join(docsDir, postDate);
  
  [postImgDir, postDocsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // 匹配 Markdown 图片: ![alt](url)
  const mdImgPattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  // 匹配 HTML 图片: <img src="url">
  const htmlImgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  // 匹配 Markdown 链接: [text](url) - 用于文档
  const mdLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  // 匹配 HTML 链接: <a href="url">
  const htmlLinkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  
  let newContent = content;
  const images = [];
  const documents = [];
  
  // 提取 Markdown 图片
  let match;
  while ((match = mdImgPattern.exec(content)) !== null) {
    const [fullMatch, alt, url] = match;
    images.push({ type: 'md', fullMatch, alt, url });
  }
  
  // 提取 HTML 图片
  while ((match = htmlImgPattern.exec(content)) !== null) {
    const [fullMatch, url] = match;
    images.push({ type: 'html', fullMatch, url });
  }
  
  // 提取 Markdown 链接中的文档
  const mdLinkPatternFresh = /\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = mdLinkPatternFresh.exec(content)) !== null) {
    const [fullMatch, text, url] = match;
    if (isDocumentUrl(url)) {
      documents.push({ type: 'md', fullMatch, text, url });
    }
  }
  
  // 提取 HTML 链接中的文档
  while ((match = htmlLinkPattern.exec(content)) !== null) {
    const [fullMatch, url] = match;
    if (isDocumentUrl(url)) {
      documents.push({ type: 'html', fullMatch, url });
    }
  }
  
  // 处理图片
  let imgIndex = 1;
  for (const img of images) {
    const url = img.url;
    
    // 跳过已经是本地路径的图片
    if (url.startsWith('/static/') || url.startsWith('static/')) {
      console.log(`  ⏭️  跳过本地图片: ${url}`);
      continue;
    }
    
    // 跳过相对路径（非 http）
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.log(`  ⏭️  跳过相对路径: ${url}`);
      continue;
    }
    
    // 生成本地文件名
    const ext = path.extname(url.split('?')[0]) || '.jpg';
    const localFilename = `img-${imgIndex}${ext}`;
    const localPath = path.join(postImgDir, localFilename);
    const relativePath = `/static/img/posts/${postDate}/${localFilename}`;
    
    try {
      console.log(`  📥 下载图片 ${imgIndex}: ${url.substring(0, 50)}...`);
      await downloadFile(url, localPath);
      console.log(`     ✓ 保存到: ${relativePath}`);
      
      // 替换图片路径
      if (img.type === 'md') {
        const newMatch = `![${img.alt}](${relativePath})`;
        newContent = newContent.replace(img.fullMatch, newMatch);
      } else {
        const newMatch = img.fullMatch.replace(url, relativePath);
        newContent = newContent.replace(img.fullMatch, newMatch);
      }
      
      imgIndex++;
    } catch (err) {
      console.log(`     ✗ 下载失败: ${err.message}`);
    }
  }
  
  // 处理文档
  let docIndex = 1;
  for (const doc of documents) {
    const url = doc.url;
    
    // 跳过已经是本地路径的文档
    if (url.startsWith('/static/') || url.startsWith('static/')) {
      console.log(`  ⏭️  跳过本地文档: ${url}`);
      continue;
    }
    
    // 获取扩展名
    const ext = getFileExtension(url);
    const localFilename = `doc-${docIndex}${ext}`;
    const localPath = path.join(postDocsDir, localFilename);
    const relativePath = `/static/docs/${postDate}/${localFilename}`;
    
    // 处理网络文档
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try {
        console.log(`  📥 下载文档 ${docIndex}: ${url.substring(0, 50)}...`);
        await downloadFile(url, localPath);
        console.log(`     ✓ 保存到: ${relativePath}`);
        
        // 替换文档路径
        if (doc.type === 'md') {
          const newMatch = `[${doc.text}](${relativePath})`;
          newContent = newContent.replace(doc.fullMatch, newMatch);
        } else {
          const newMatch = doc.fullMatch.replace(url, relativePath);
          newContent = newContent.replace(doc.fullMatch, newMatch);
        }
        
        docIndex++;
      } catch (err) {
        console.log(`     ✗ 下载失败: ${err.message}`);
      }
    } else {
      // 处理本地文档
      console.log(`  📄 处理本地文档: ${url}`);
      const result = processLocalDoc(url, postDate);
      
      if (result.success) {
        console.log(`     ✓ 复制到: ${result.relativePath}`);
        
        // 替换文档路径
        if (doc.type === 'md') {
          const newMatch = `[${doc.text}](${result.relativePath})`;
          newContent = newContent.replace(doc.fullMatch, newMatch);
        } else {
          const newMatch = doc.fullMatch.replace(url, result.relativePath);
          newContent = newContent.replace(doc.fullMatch, newMatch);
        }
        
        docIndex++;
      } else {
        console.log(`     ⚠️  文档不存在，保留原路径`);
      }
    }
  }
  
  return newContent;
}

// 生成发布文件名
function generatePostFilename(draft) {
  // 如果草稿已有日期前缀，直接使用
  if (draft.date) {
    return draft.filename;
  }
  
  // 否则添加今天的日期
  const today = new Date().toISOString().split('T')[0];
  return `${today}-${draft.filename}`;
}

// 更新 Front Matter 中的日期
function updateFrontMatter(content, date) {
  // 检查是否有 date 字段
  if (content.match(/^date:\s*.+$/m)) {
    // 更新已有的 date 字段
    return content.replace(/^date:\s*.+$/m, `date: ${date}`);
  }
  
  // 如果没有 date 字段，在 Front Matter 中添加
  return content.replace(/^(---\n)/, `$1date: ${date}\n`);
}

// 发布草稿
async function publishDraft(draft) {
  console.log(`\n📤 正在发布: ${draft.filename}\n`);
  
  // 读取草稿内容
  let content = fs.readFileSync(draft.path, 'utf-8');
  
  // 确定发布日期
  const postDate = draft.date || new Date().toISOString().split('T')[0];
  
  // 更新 Front Matter 中的日期
  content = updateFrontMatter(content, postDate);
  
  // 处理图片和文档
  console.log('🖼️  处理资源文件...');
  content = await processAssets(content, postDate);
  
  // 生成目标文件名
  const postFilename = generatePostFilename(draft);
  const postPath = path.join(postsDir, postFilename);
  
  // 写入文章
  fs.writeFileSync(postPath, content);
  console.log(`\n✅ 发布成功!`);
  console.log(`   文件: _posts/${postFilename}`);
  
  // 询问是否删除草稿
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\n是否删除原草稿? [y/N] ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        fs.unlinkSync(draft.path);
        console.log('🗑️  已删除草稿\n');
      } else {
        console.log('📄 草稿已保留\n');
      }
      rl.close();
      resolve();
    });
  });
}

// 交互式选择草稿
async function interactivePublish() {
  const drafts = listDrafts();
  if (!drafts || drafts.length === 0) return;
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('请输入要发布的草稿序号: ', async (answer) => {
      const index = parseInt(answer) - 1;
      rl.close();
      
      if (index < 0 || index >= drafts.length) {
        console.log('无效的序号\n');
        resolve();
        return;
      }
      
      await publishDraft(drafts[index]);
      resolve();
    });
  });
}

// 主函数
async function main() {
  console.log('\n📚 草稿发布工具\n');
  
  if (hasArg('list')) {
    listDrafts();
    return;
  }
  
  const targetFile = getArg('file');
  if (targetFile) {
    // 先检查是否是文档文件
    const docs = getLocalDocs();
    const doc = docs.find(d => d.filename === targetFile || d.filename.includes(targetFile));
    
    if (doc) {
      await publishDoc(doc);
      return;
    }
    
    // 再检查是否是 md 文件
    const drafts = getDrafts();
    const draft = drafts.find(d => d.filename === targetFile || d.filename.includes(targetFile));
    
    if (!draft) {
      console.log(`❌ 未找到草稿或文档: ${targetFile}\n`);
      return;
    }
    
    await publishDraft(draft);
    return;
  }
  
  // 交互式发布
  await interactivePublish();
}

// 发布单个文档（转换为博客文章）
async function publishDoc(doc) {
  console.log(`\n📤 正在发布文档: ${doc.filename}\n`);
  
  const today = new Date().toISOString().split('T')[0];
  const ext = path.extname(doc.filename).toLowerCase();
  const baseName = path.basename(doc.filename, ext);
  
  // 检查是否支持转换
  if (ext === '.docx') {
    await publishDocx(doc, today, baseName);
  } else if (ext === '.pdf') {
    await publishPdf(doc, today, baseName);
  } else {
    console.log(`⚠️  暂不支持 ${ext} 格式转换为博客文章`);
    console.log(`   支持的格式: .docx, .pdf\n`);
  }
}

// 发布 DOCX 文档
async function publishDocx(doc, today, baseName) {
  let mammoth;
  try {
    mammoth = require('mammoth');
  } catch (e) {
    console.log('⚠️  需要安装 mammoth 模块来转换 Word 文档');
    console.log('   请运行: npm install mammoth\n');
    return;
  }
  
  try {
    console.log('📄 正在转换 Word 文档...');
    
    // 提取并处理图片目录
    const postImgDir = path.join(imgDir, today);
    if (!fs.existsSync(postImgDir)) {
      fs.mkdirSync(postImgDir, { recursive: true });
    }
    
    // 使用 mammoth 转换
    const result = await mammoth.convertToHtml({ path: doc.path });
    let html = result.value;
    
    // 提取并保存 base64 图片
    let imgIndex = 1;
    html = html.replace(/src="data:image\/([^;]+);base64,([^"]+)"/g, (match, ext, base64Data) => {
      const imgFilename = `doc-img-${imgIndex}.${ext}`;
      const imgPath = path.join(postImgDir, imgFilename);
      const relativePath = `/static/img/posts/${today}/${imgFilename}`;
      
      // 保存图片
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(imgPath, buffer);
      console.log(`  📥 提取图片 ${imgIndex}: ${imgFilename} (${formatSize(buffer.length)})`);
      imgIndex++;
      
      return `src="${relativePath}"`;
    });
    
    // 转换为混合格式：保留表格的 HTML，其他转为 Markdown
    let content = htmlToMarkdownWithTables(html);
    
    // 生成 Front Matter
    const frontMatter = `---
layout: post
title: "${baseName}"
subtitle: ""
date: ${today}
author: SanJu
header-img: static/img/tag-bg.jpg
catalog: true
tags:
    - 文档
---

<style>
.doc-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-size: 14px;
}
.doc-table th, .doc-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: left;
}
.doc-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}
.doc-table tr:nth-child(even) {
  background-color: #fafafa;
}
.doc-table tr:hover {
  background-color: #f0f0f0;
}
</style>

`;
    
    // 写入文章
    const postFilename = `${today}-${baseName}.md`;
    const postPath = path.join(postsDir, postFilename);
    fs.writeFileSync(postPath, frontMatter + content);
    
    console.log(`\n✅ 发布成功!`);
    console.log(`   文件: _posts/${postFilename}`);
    
    if (result.messages.length > 0) {
      console.log('\n⚠️  转换警告:');
      result.messages.forEach(msg => console.log(`   ${msg.message}`));
    }
    
    await askDeleteOriginal(doc);
    
  } catch (err) {
    console.log(`❌ 转换失败: ${err.message}\n`);
  }
}

// 发布 PDF 文档（创建下载页面）
async function publishPdf(doc, today, baseName) {
  console.log('📄 正在处理 PDF 文档...');
  
  // 复制 PDF 到 static/docs
  const postDocsDir = path.join(docsDir, today);
  if (!fs.existsSync(postDocsDir)) {
    fs.mkdirSync(postDocsDir, { recursive: true });
  }
  
  const pdfDestPath = path.join(postDocsDir, doc.filename);
  const pdfRelativePath = `/static/docs/${today}/${doc.filename}`;
  fs.copyFileSync(doc.path, pdfDestPath);
  
  // 生成文章（嵌入 PDF 预览）
  const content = `---
layout: post
title: "${baseName}"
subtitle: ""
date: ${today}
author: SanJu
header-img: static/img/tag-bg.jpg
catalog: false
tags:
    - PDF
    - 文档
---

<style>
.pdf-container {
  width: 100%;
  margin: 20px 0;
}
.pdf-viewer {
  width: 100%;
  height: 85vh;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.pdf-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}
.pdf-info {
  color: #666;
  font-size: 14px;
}
.pdf-download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #0066cc;
  color: white !important;
  text-decoration: none !important;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s;
}
.pdf-download-btn:hover {
  background: #0052a3;
}
</style>

<div class="pdf-actions">
  <span class="pdf-info">📄 文件大小：${formatSize(doc.size)}</span>
  <a href="${pdfRelativePath}" download class="pdf-download-btn">
    📥 下载 PDF
  </a>
</div>

<div class="pdf-container">
  <iframe class="pdf-viewer" src="${pdfRelativePath}" type="application/pdf"></iframe>
</div>

<p style="color: #999; font-size: 13px; text-align: center; margin-top: 15px;">
  如果无法预览，请 <a href="${pdfRelativePath}" target="_blank">点击此处</a> 在新窗口打开或直接下载。
</p>
`;
  
  const postFilename = `${today}-${baseName}.md`;
  const postPath = path.join(postsDir, postFilename);
  fs.writeFileSync(postPath, content);
  
  console.log(`\n✅ 发布成功!`);
  console.log(`   文章: _posts/${postFilename}`);
  console.log(`   PDF: ${pdfRelativePath}`);
  
  await askDeleteOriginal(doc);
}

// HTML 转 Markdown（保留表格）
function htmlToMarkdownWithTables(html) {
  // 先提取所有表格，用占位符替换
  const tables = [];
  let tableIndex = 0;
  
  html = html.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
    // 给表格添加样式类
    const styledTable = match.replace(/<table/gi, '<table class="doc-table"');
    tables.push(styledTable);
    return `\n\n__TABLE_PLACEHOLDER_${tableIndex++}__\n\n`;
  });
  
  let md = html;
  
  // 标题
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n');
  md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n');
  md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n');
  
  // 段落
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
  
  // 加粗和斜体
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  
  // 链接
  md = md.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');
  
  // 图片
  md = md.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, '\n![]($1)\n');
  
  // 列表
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  
  // 换行
  md = md.replace(/<br\s*\/?>/gi, '\n');
  
  // 水平线
  md = md.replace(/<hr[^>]*>/gi, '\n---\n');
  
  // 代码块
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '\n```\n$1\n```\n');
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
  
  // 删除其他标签但保留内容
  md = md.replace(/<[^>]+>/g, '');
  
  // HTML 实体转换
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/&quot;/g, '"');
  
  // 还原表格
  tables.forEach((table, i) => {
    md = md.replace(`__TABLE_PLACEHOLDER_${i}__`, '\n' + table + '\n');
  });
  
  // 清理多余空行
  md = md.replace(/\n{3,}/g, '\n\n');
  md = md.trim();
  
  return md;
}

// 询问是否删除原文件
async function askDeleteOriginal(doc) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\n是否删除原文档? [y/N] ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        fs.unlinkSync(doc.path);
        console.log('🗑️  已删除原文档\n');
      } else {
        console.log('📄 原文档已保留\n');
      }
      rl.close();
      resolve();
    });
  });
}

main();
