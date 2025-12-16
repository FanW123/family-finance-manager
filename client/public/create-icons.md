# 创建应用图标

需要创建两个图标文件用于 PWA：

1. `icon-192.png` - 192x192 像素
2. `icon-512.png` - 512x512 像素

## 快速创建方法

### 方法1：使用在线工具
访问 https://realfavicongenerator.net/ 或 https://www.pwabuilder.com/imageGenerator
上传一个 512x512 的图片，会自动生成所需尺寸。

### 方法2：使用设计工具
- 使用 Figma、Sketch 或 Photoshop
- 创建 512x512 的画布
- 设计 FirePath logo（建议使用火焰图标 + "FP" 文字）
- 背景色：#1a1a2e 或 #0a0a14
- 导出为 PNG
- 然后缩放为 192x192 版本

### 方法3：使用命令行（如果有 ImageMagick）
```bash
# 假设你有一个 512x512 的 logo.png
convert logo.png -resize 192x192 icon-192.png
cp logo.png icon-512.png
```

## 临时方案

如果暂时没有图标，可以：
1. 使用纯色图片作为占位符
2. 或者从 manifest.json 中暂时移除 icons 配置（PWA 仍可工作，但安装时可能没有图标）

