# Scientific Image Annotator

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Fabric.js](https://img.shields.io/badge/canvas-Fabric.js%205.3.1-orange.svg)](http://fabricjs.com/)
[![JavaScript](https://img.shields.io/badge/vanilla-JavaScript%20ES%20Modules-yellow.svg)](#)
[![Fonts](https://img.shields.io/badge/fonts-Inter%20%2B%20JetBrains%20Mono-5db8a6.svg)](https://fonts.google.com/)

[English](#english) | [中文](#中文)

---

## English

A privacy-first, browser-native scientific image annotation tool designed for biomedical research. Upload images, add text annotations, shape markers, scale bars, and borders, then export at publication-ready resolution — no installation, no server uploads.

### Why This Exists

Researchers routinely annotate microscope images, electrophoresis gels, tissue sections, and experimental setup photos for journal submission. Existing solutions have real drawbacks:

| Tool | Pain Point |
|------|------------|
| PowerPoint / Illustrator | Complex workflow, unpredictable export resolution |
| ImageJ / Fiji | Steep learning curve, limited annotation flexibility |
| Online tools | Data uploaded to third-party servers — privacy risk |

This tool runs **entirely in your browser**. Image data **never leaves your computer**. You can disconnect from the internet and it still works.

### Features

**Image Handling**

- **Drag & drop upload** — PNG, JPEG, TIFF, BMP, SVG
- **Adjustments** — independent brightness, exposure, contrast, highlights, and shadows controls with live preview
- **Rotation** — -180° to +180°
- **Crop** — select and retain region of interest
- **Borders** — four independent sides (0–500px) with custom color

**Text Annotations**

- Click or drag to add text boxes
- 9 font choices including Chinese fonts (Song, Hei, Kai)
- **Superscript / subscript** modes for gene names and ion symbols
- Bold, italic, underline styles; font size 8–500pt

**Shape Markers**

| Shape | Use Case |
|-------|----------|
| Curly brace `{` | Label sample groups |
| Ellipse | Circle cells, tissue regions |
| Rectangle | Frame ROI areas |
| Line | Connect annotation to target |
| Arrow | Solid-head arrow for precise pointing |

**Professional Features**

- **Snap alignment** — objects snap to edges and centerlines of nearby objects within 8px, with visual guide lines
- **Rotation snap** — locks to 0°/90°/180°/270° near those angles
- **Undo / Redo** — 50-step history, `Ctrl+Z` / `Ctrl+Y`
- **High-resolution export** — 1× to 4× resolution multiplier, lossless PNG or adjustable-quality JPEG
- **Zoom controls** — zoom in/out without affecting export resolution

### Quick Start

```bash
git clone https://github.com/Waylon524/Biotech-Tool.git
cd Biotech-Tool/scientific-annotator
python run.py
```

Your browser opens automatically. Fabric.js and fonts load from CDN.

> **Note:** Python 3.6+ is required only for the local static server. `run.py` handles automatic port allocation and correct ES Module MIME types.

### Usage

**Basic Workflow**

1. **Upload** — Click "Upload" in the toolbar or drag an image onto the canvas
2. **Adjust** — Tune brightness, contrast, and other parameters in the left panel
3. **Add borders** — Set per-side border width and color to simulate publication figure margins
4. **Annotate** — Choose a tool (text, brace, ellipse, rectangle, line, arrow) and click/drag on the image
5. **Edit properties** — Select an annotation to modify color, stroke width, font size, etc.
6. **Export** — Click "Export", choose resolution multiplier and format, then download

**Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo |
| `Delete` / `Backspace` | Delete selected object |
| `Escape` | Deselect / exit crop mode |
| `Space` + drag | Pan canvas view |

**Drawing Lines & Arrows**

Press mouse button to set the start point, drag to the end point, and release. Rotation pivots around the center point without positional drift. Arrow heads are **solid-filled** triangles, color-synced with the stroke.

### Project Structure

```
scientific-annotator/
├── run.py                   # Dev server (auto port + ES Module MIME types)
├── index.html               # Main page
├── css/
│   └── style.css            # Warm cream canvas + coral accent design system
├── js/
│   ├── main.js              # Entry point, event binding, tool switching
│   ├── canvas-manager.js    # Fabric.js canvas management, state, undo/redo, snap
│   ├── image-tools.js       # Image upload, crop, rotation, adjustments
│   ├── border-tools.js      # Border width and color controls
│   ├── text-tools.js        # Text annotation, superscript/subscript modes
│   ├── shape-tools.js       # Shape drawing (brace, ellipse, rect, line, arrow)
│   └── export.js            # High-res export (1–4×, PNG/JPEG)
└── README.md
```

Plain vanilla JavaScript with no framework dependencies. Modules communicate through a lightweight event bus (`on`/`emit`) and share data via a central `state` object.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Canvas rendering | HTML5 Canvas + [Fabric.js](http://fabricjs.com/) 5.3.1 |
| Scripting | Vanilla JavaScript (ES Modules) |
| Styling | CSS3 custom properties, warm cream design system |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) (body) + [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (monospace) |
| Runtime | Python 3.6+ as local static server only |

### Browser Compatibility

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| 90+ | 90+ | 90+ | 14+ |

### FAQ

**Q: Can I open `index.html` directly by double-clicking?**

A: No. The project uses ES Modules (`import`/`export`) which require HTTP serving. Use `python run.py`.

**Q: Is image data uploaded to any server?**

A: No. All image processing happens locally in your browser. Image data never leaves your computer.

**Q: Is export resolution sufficient for journal publication?**

A: The 4× multiplier combined with original image resolution meets 300–600 DPI requirements for most journals. Export dimensions are displayed in real time.

---

## 中文

注重隐私、纯浏览器端的科学图像标注工具，专为生物医学科研场景设计。上传图像即可添加文字标注、形状标记、比例尺和边框，导出高清图像满足学术论文发表要求——无需安装，无需上传至服务器。

### 为什么需要它

科研人员经常需要标注显微镜图像、电泳胶图、组织切片、实验装置照片等，并将其排版到论文中。现有方案普遍存在痛点：

| 工具 | 痛点 |
|------|------|
| PowerPoint / Illustrator | 操作复杂、导出分辨率不可控、非专用工具效率低 |
| ImageJ / Fiji | 功能强大但学习曲线陡峭、标注灵活性有限 |
| 在线工具 | 需上传到第三方服务器，涉及数据隐私风险 |

本工具完全在**浏览器本地运行**，图像数据**从不离开您的电脑**，断开网络连接后可继续使用。

### 功能特性

**图像处理**

- **拖拽上传** — 支持 PNG、JPEG、TIFF、BMP、SVG
- **图像调整** — 亮度、曝光、对比度、高光、阴影独立调节，带实时预览
- **旋转** — -180° 至 +180° 自由旋转
- **裁剪** — 框选保留区域，精确裁剪
- **边框** — 四边独立设置宽度（0–500px）+ 自定义颜色

**文字标注**

- 单击或拖拽添加文字框
- 9 种字体（含中文字体宋体/黑体/楷体）
- **上标 / 下标**模式，适合标注基因名、离子符号等
- 加粗、斜体、下划线样式；字号 8–500pt 可调

**形状标注**

| 形状 | 适用场景 |
|------|----------|
| 花括号 `{` | 标注样本分组 |
| 椭圆 | 圈选细胞、组织区域 |
| 矩形 | 框选 ROI 区域 |
| 直线 | 连接标注与目标 |
| 箭头 | 实心箭头，精准指向 |

**专业特性**

- **吸附对齐** — 拖拽时 8px 内自动吸附到附近对象的边和中心线，带辅助参考线
- **旋转吸附** — 旋转到 0°/90°/180°/270° 附近自动对齐
- **撤销/重做** — 最多 50 步历史，支持 `Ctrl+Z` / `Ctrl+Y`
- **高清导出** — 1× 至 4× 分辨率倍率，PNG 无损或 JPEG 可调质量
- **缩放控制** — 放大/缩小，缩放不影响导出分辨率

### 快速开始

```bash
git clone https://github.com/Waylon524/Biotech-Tool.git
cd Biotech-Tool/scientific-annotator
python run.py
```

浏览器自动打开，Fabric.js 和字体从 CDN 自动加载。

> **注意：** 需要 Python 3.6+ 仅作为本地静态服务器。`run.py` 会自动分配端口并正确处理 ES Module 的 MIME 类型。

### 使用指南

**基本工作流**

1. **上传图像** — 点击工具栏"上传"或拖拽图像到画布
2. **调整图像** — 在左侧面板调节亮度、对比度等参数
3. **添加边框** — 设置四边边框宽度和颜色，模拟论文图片边缘
4. **添加标注** — 选择工具（文字/花括号/椭圆/矩形/直线/箭头）在图像上标注
5. **编辑属性** — 选中标注后修改颜色、粗细、字号等
6. **导出** — 点击"导出"，选择分辨率倍率和格式后下载

**快捷键**

| 快捷键 | 操作 |
|--------|------|
| `Ctrl + Z` | 撤销 |
| `Ctrl + Y` / `Ctrl + Shift + Z` | 重做 |
| `Delete` / `Backspace` | 删除选中对象 |
| `Escape` | 取消选择 / 退出裁剪模式 |
| `Space` + 拖拽 | 平移画布视图 |

**绘制直线与箭头**

按下鼠标设定起点，拖动到终点松开即完成。旋转时以中心点为轴心，不会发生位置偏移。箭头的三角形头部为**实心填充**，颜色与描边同步。

### 项目结构

```
scientific-annotator/
├── run.py                   # 开发服务器（自动端口 + ES Module MIME 类型）
├── index.html               # 主页面
├── css/
│   └── style.css            # 暖调奶油色画布 + 珊瑚色主题
├── js/
│   ├── main.js              # 入口，事件绑定，工具切换
│   ├── canvas-manager.js    # Fabric.js 画布管理，状态，撤销/重做，吸附对齐
│   ├── image-tools.js       # 图像上传，裁剪，旋转，调整
│   ├── border-tools.js      # 边框控制
│   ├── text-tools.js        # 文字标注，上标/下标模式
│   ├── shape-tools.js       # 形状绘制（花括号、椭圆、矩形、直线、箭头）
│   └── export.js            # 高清导出（1–4×，PNG/JPEG）
└── README.md
```

纯原生 JavaScript，无框架依赖。各模块通过简单的事件总线（`on`/`emit`）通信，通过中央 `state` 对象共享数据。

### 技术栈

| 层 | 技术 |
|----|------|
| 画布渲染 | HTML5 Canvas + [Fabric.js](http://fabricjs.com/) 5.3.1 |
| 脚本 | 原生 JavaScript（ES Modules） |
| 样式 | CSS3 自定义属性，暖调奶油色设计系统 |
| 字体 | [Inter](https://fonts.google.com/specimen/Inter)（正文）+ [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)（等宽） |
| 运行时 | 仅需 Python 3.6+ 作为本地静态服务器 |

### 浏览器兼容性

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| 90+ | 90+ | 90+ | 14+ |

### 常见问题

**问：可以直接双击 `index.html` 打开吗？**

答：不可以。项目使用 ES Modules（`import`/`export`），必须通过 HTTP 服务器访问。使用 `python run.py` 即可。

**问：图像数据会上传到服务器吗？**

答：不会。所有图像处理都在浏览器本地完成，图像数据从未离开您的电脑。

**问：导出分辨率够发表论文吗？**

答：4× 倍率配合原始图像分辨率足以满足大多数期刊的 300–600 DPI 要求。导出尺寸实时显示在对话框中。

---

## License · 许可证

[MIT](../LICENSE)
