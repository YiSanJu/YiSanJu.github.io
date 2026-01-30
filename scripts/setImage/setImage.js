/**
 * 图片路径提取与替换脚本
 * 提取项目中所有用到的图片路径，支持一键替换
 * 
 * 使用方法:
 *   node setImage.js                     # 提取所有图片路径
 *   node setImage.js --replace           # 交互式替换图片路径
 *   node setImage.js --export            # 导出图片路径到 JSON 文件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 项目根目录
const rootDir = path.join(__dirname, '../..');

// 需要扫描的目录和文件类型
const scanDirs = ['_posts', '_drafts', '_includes', '_layouts', '_config.yml', 'pages', 'index.html'];
const scanExtensions = ['.html', '.md', '.yml', '.yaml'];

// 图片路径匹配正则
const imgPatterns = [
  /header-img:\s*["']?([^"'\n]+)["']?/g,           // header-img: "xxx"
  /src=["']([^"']*\.(jpg|jpeg|png|gif|webp|svg))["']/gi,  // src="xxx.jpg"
  /url\(["']?([^"')]*\.(jpg|jpeg|png|gif|webp|svg))["']?\)/gi,  // url(xxx.jpg)
  /!\[.*?\]\(([^)]+\.(jpg|jpeg|png|gif|webp|svg))\)/gi,  // ![alt](xxx.jpg)
  /sidebar-avatar:\s*["']?([^"'\n]+)["']?/g,       // sidebar-avatar: xxx
];

// 存储所有找到的图片路径
const imageMap = new Map(); // path -> [{file, line, context}]

// 扫描单个文件
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative(rootDir, filePath);

  lines.forEach((line, index) => {
    imgPatterns.forEach(pattern => {
      // 重置正则状态
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const imgPath = match[1];
        if (!imgPath || imgPath.startsWith('http') || imgPath.startsWith('//')) {
          continue; // 跳过外部链接
        }
        
        if (!imageMap.has(imgPath)) {
          imageMap.set(imgPath, []);
        }
        imageMap.get(imgPath).push({
          file: relativePath,
          line: index + 1,
          context: line.trim()
        });
      }
    });
  });
}

// 递归扫描目录
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const stat = fs.statSync(dirPath);
  
  if (stat.isFile()) {
    const ext = path.extname(dirPath).toLowerCase();
    if (scanExtensions.includes(ext)) {
      scanFile(dirPath);
    }
    return;
  }
  
  if (stat.isDirectory()) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      scanDirectory(path.join(dirPath, file));
    });
  }
}

// 显示扫描结果
function showResults() {
  console.log('\n📷 项目中使用的图片路径:\n');
  console.log('─'.repeat(60));
  
  let index = 1;
  const pathList = [];
  
  imageMap.forEach((locations, imgPath) => {
    pathList.push(imgPath);
    console.log(`\n[${index}] ${imgPath}`);
    console.log(`    使用 ${locations.length} 次:`);
    locations.slice(0, 3).forEach(loc => {
      console.log(`    - ${loc.file}:${loc.line}`);
    });
    if (locations.length > 3) {
      console.log(`    ... 还有 ${locations.length - 3} 处`);
    }
    index++;
  });
  
  console.log('\n' + '─'.repeat(60));
  console.log(`\n共找到 ${imageMap.size} 个不同的图片路径\n`);
  
  return pathList;
}

// 导出到 JSON
function exportToJson() {
  const data = {};
  imageMap.forEach((locations, imgPath) => {
    data[imgPath] = locations;
  });
  
  const outputPath = path.join(__dirname, 'image-paths.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\n📁 已导出到: ${outputPath}\n`);
}

// 替换图片路径
async function replaceImagePath(pathList) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n🔄 图片路径替换\n');
  
  const indexInput = await question('请输入要替换的图片序号 (1-' + pathList.length + '): ');
  const index = parseInt(indexInput) - 1;
  
  if (index < 0 || index >= pathList.length) {
    console.log('无效的序号');
    rl.close();
    return;
  }
  
  const oldPath = pathList[index];
  console.log(`\n当前路径: ${oldPath}`);
  
  const newPath = await question('请输入新的图片路径: ');
  
  if (!newPath) {
    console.log('已取消');
    rl.close();
    return;
  }
  
  const confirm = await question(`\n确认将 "${oldPath}" 替换为 "${newPath}"? [y/N] `);
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('已取消');
    rl.close();
    return;
  }
  
  // 执行替换
  const locations = imageMap.get(oldPath);
  let replacedCount = 0;
  
  locations.forEach(loc => {
    const filePath = path.join(rootDir, loc.file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const newContent = content.split(oldPath).join(newPath);
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      replacedCount++;
      console.log(`  ✓ ${loc.file}`);
    }
  });
  
  console.log(`\n✅ 已在 ${replacedCount} 个文件中完成替换\n`);
  rl.close();
}

// 批量替换
async function batchReplace() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n🔄 批量替换图片路径\n');
  
  const oldPrefix = await question('请输入要替换的路径前缀 (如 img/): ');
  const newPrefix = await question('请输入新的路径前缀 (如 static/img/): ');
  
  if (!oldPrefix || !newPrefix) {
    console.log('已取消');
    rl.close();
    return;
  }
  
  // 找出所有匹配的路径
  const matchedPaths = [];
  imageMap.forEach((_, imgPath) => {
    if (imgPath.startsWith(oldPrefix) || imgPath.includes('/' + oldPrefix)) {
      matchedPaths.push(imgPath);
    }
  });
  
  console.log(`\n找到 ${matchedPaths.length} 个匹配的路径:`);
  matchedPaths.slice(0, 5).forEach(p => console.log(`  - ${p}`));
  if (matchedPaths.length > 5) {
    console.log(`  ... 还有 ${matchedPaths.length - 5} 个`);
  }
  
  const confirm = await question(`\n确认替换? [y/N] `);
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('已取消');
    rl.close();
    return;
  }
  
  // 执行批量替换
  const filesModified = new Set();
  
  matchedPaths.forEach(oldPath => {
    const newPath = oldPath.replace(oldPrefix, newPrefix);
    const locations = imageMap.get(oldPath);
    
    locations.forEach(loc => {
      const filePath = path.join(rootDir, loc.file);
      let content = fs.readFileSync(filePath, 'utf-8');
      const newContent = content.split(oldPath).join(newPath);
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        filesModified.add(loc.file);
      }
    });
  });
  
  console.log(`\n✅ 已在 ${filesModified.size} 个文件中完成 ${matchedPaths.length} 处替换\n`);
  rl.close();
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  console.log('\n🔍 扫描项目中的图片路径...\n');
  
  // 扫描所有目录
  scanDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    scanDirectory(fullPath);
  });
  
  const pathList = showResults();
  
  if (args.includes('--export')) {
    exportToJson();
  } else if (args.includes('--replace')) {
    await replaceImagePath(pathList);
  } else if (args.includes('--batch')) {
    await batchReplace();
  } else {
    console.log('💡 可用命令:');
    console.log('   node setImage.js --export    导出路径到 JSON');
    console.log('   node setImage.js --replace   替换单个图片路径');
    console.log('   node setImage.js --batch     批量替换路径前缀\n');
  }
}

main();
