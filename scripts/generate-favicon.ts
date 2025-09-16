/**
 * 生成白菜形状的 favicon
 */
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFileSync } from 'fs'
import { join } from 'path'

// 白菜 SVG - 可爱的卡通风格
const cabbageSvg = `
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <!-- 外层叶子 -->
  <ellipse cx="32" cy="38" rx="26" ry="22" fill="#7CB342"/>
  <ellipse cx="32" cy="38" rx="26" ry="22" fill="url(#leafGradient1)"/>
  
  <!-- 左侧叶子 -->
  <path d="M10 35 Q5 25 15 18 Q25 12 28 25 Q20 28 10 35Z" fill="#8BC34A"/>
  
  <!-- 右侧叶子 -->
  <path d="M54 35 Q59 25 49 18 Q39 12 36 25 Q44 28 54 35Z" fill="#8BC34A"/>
  
  <!-- 中层叶子 -->
  <ellipse cx="32" cy="36" rx="20" ry="17" fill="#9CCC65"/>
  
  <!-- 内层叶子 -->
  <ellipse cx="32" cy="34" rx="14" ry="12" fill="#AED581"/>
  
  <!-- 菜心 -->
  <ellipse cx="32" cy="32" rx="8" ry="7" fill="#C5E1A5"/>
  <ellipse cx="32" cy="30" rx="4" ry="4" fill="#DCEDC8"/>
  
  <!-- 叶脉纹理 -->
  <path d="M32 45 Q32 38 32 28" stroke="#689F38" stroke-width="1.5" fill="none" opacity="0.5"/>
  <path d="M25 42 Q28 36 32 30" stroke="#689F38" stroke-width="1" fill="none" opacity="0.4"/>
  <path d="M39 42 Q36 36 32 30" stroke="#689F38" stroke-width="1" fill="none" opacity="0.4"/>
  
  <!-- 可爱的眼睛 -->
  <ellipse cx="26" cy="35" rx="3" ry="3.5" fill="#333"/>
  <ellipse cx="38" cy="35" rx="3" ry="3.5" fill="#333"/>
  <ellipse cx="27" cy="34" rx="1" ry="1" fill="#FFF"/>
  <ellipse cx="39" cy="34" rx="1" ry="1" fill="#FFF"/>
  
  <!-- 微笑 -->
  <path d="M28 42 Q32 46 36 42" stroke="#333" stroke-width="2" fill="none" stroke-linecap="round"/>
  
  <!-- 腮红 -->
  <ellipse cx="22" cy="40" rx="3" ry="2" fill="#FFCDD2" opacity="0.6"/>
  <ellipse cx="42" cy="40" rx="3" ry="2" fill="#FFCDD2" opacity="0.6"/>
  
  <defs>
    <linearGradient id="leafGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#8BC34A;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#558B2F;stop-opacity:0.3" />
    </linearGradient>
  </defs>
</svg>
`

async function generateFavicon() {
  const outputDir = join(process.cwd(), 'public')
  
  // 生成不同尺寸的 PNG
  const sizes = [16, 32, 48, 64, 128, 256]
  const pngBuffers: Buffer[] = []
  
  for (const size of sizes) {
    const buffer = await sharp(Buffer.from(cabbageSvg))
      .resize(size, size)
      .png()
      .toBuffer()
    pngBuffers.push(buffer)
    
    // 保存各尺寸 PNG（可选，用于 PWA）
    if (size === 192 || size === 512) {
      writeFileSync(join(outputDir, `icon-${size}.png`), buffer)
    }
  }
  
  // 使用 32x32 的 PNG 生成 ICO
  const png32 = await sharp(Buffer.from(cabbageSvg))
    .resize(32, 32)
    .png()
    .toBuffer()
  
  const icoBuffer = await pngToIco(png32)
  writeFileSync(join(outputDir, 'favicon.ico'), icoBuffer)
  
  console.log('✅ favicon.ico 生成成功！')
  
  // 同时生成一个大尺寸的 PNG 用于分享
  const png512 = await sharp(Buffer.from(cabbageSvg))
    .resize(512, 512)
    .png()
    .toBuffer()
  writeFileSync(join(outputDir, 'icon-512.png'), png512)
  console.log('✅ icon-512.png 生成成功！')
}

generateFavicon().catch(console.error)
