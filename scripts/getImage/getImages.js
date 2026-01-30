/**
 * 高质量图片下载脚本
 * 从 Lorem Picsum 获取免费高质量图片
 * 
 * 使用方法:
 *   node getImages.js                    # 下载 10 张 1920x1080 图片
 *   node getImages.js --count=20         # 下载 20 张图片
 *   node getImages.js --size=1920x1200   # 指定尺寸
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 解析命令行参数
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

const count = parseInt(getArg('count', '10'));
const size = getArg('size', '1920x1080');
const [width, height] = size.split('x').map(Number);

// 输出目录
const outputDir = path.join(__dirname, 'images');
const staticImgDir = path.join(__dirname, '../../static/img');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 文件名前缀列表
const prefixes = ['header', 'banner', 'bg', 'cover', 'post', 'about', 'tag', 'archive', 'hero', 'featured'];

// 下载单张图片
function downloadImage(index) {
  return new Promise((resolve, reject) => {
    const prefix = prefixes[index % prefixes.length];
    const filename = `${prefix}-${index + 1}-${size}.jpg`;
    const filepath = path.join(outputDir, filename);
    
    // 使用 Lorem Picsum 随机图片
    const url = `https://picsum.photos/${width}/${height}`;
    
    console.log(`[${index + 1}/${count}] 下载中...`);
    
    https.get(url, (response) => {
      // 处理重定向
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (imgResponse) => {
          const fileStream = fs.createWriteStream(filepath);
          imgResponse.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            console.log(`    ✓ 已保存: ${filename}`);
            resolve(filename);
          });
        }).on('error', reject);
      } else if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`    ✓ 已保存: ${filename}`);
          resolve(filename);
        });
      } else {
        reject(new Error(`HTTP ${response.statusCode}`));
      }
    }).on('error', reject);
  });
}

// 询问用户是否移动图片
function askToMove(downloadedFiles) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('是否将图片移动到博客静态资源目录 (static/img)? [y/N] ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 移动图片到静态资源目录
function moveImages(downloadedFiles) {
  if (!fs.existsSync(staticImgDir)) {
    fs.mkdirSync(staticImgDir, { recursive: true });
  }

  let movedCount = 0;
  for (const filename of downloadedFiles) {
    const src = path.join(outputDir, filename);
    const dest = path.join(staticImgDir, filename);
    try {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
      movedCount++;
    } catch (err) {
      console.log(`    ✗ 移动失败: ${filename} - ${err.message}`);
    }
  }
  console.log(`\n📁 已移动 ${movedCount} 张图片到 static/img/\n`);
}

// 串行下载（避免请求过快）
async function downloadAll() {
  console.log(`\n📷 开始下载 ${count} 张图片 (${size})\n`);
  console.log(`   来源: Lorem Picsum (https://picsum.photos/)`);
  console.log(`   保存: ${outputDir}\n`);
  
  const downloaded = [];
  
  for (let i = 0; i < count; i++) {
    try {
      const filename = await downloadImage(i);
      downloaded.push(filename);
      // 间隔 500ms 避免请求过快
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.log(`    ✗ 下载失败: ${err.message}`);
    }
  }
  
  console.log(`\n✅ 完成! 成功下载 ${downloaded.length}/${count} 张图片\n`);

  if (downloaded.length > 0) {
    const shouldMove = await askToMove(downloaded);
    if (shouldMove) {
      moveImages(downloaded);
    } else {
      console.log(`\n💡 图片保存在: ${outputDir}\n`);
    }
  }
}

downloadAll();
