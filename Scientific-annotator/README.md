<picture><source media="(prefers-color-scheme: dark)" srcset=""><img alt="" src=""></picture>

# 科研图像图注编辑器

一个**纯浏览器端**的科学图像标注工具，专为生物医学科研场景设计。无需安装任何软件，上传图像即可添加文字标注、形状标记、比例尺和边框，最后导出为高清图像——满足学术论文发表的严格要求。

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License MIT">
  <img src="https://img.shields.io/badge/vanilla-JavaScript-yellow.svg" alt="JavaScript">
  <img src="https://img.shields.io/badge/canvas-Fabric.js%205.3.1-orange.svg" alt="Fabric.js">
  <img src="https://img.shields.io/badge/font-Inter%20%2B%20JetBrains%20Mono-5db8a6.svg" alt="Fonts">
</p>

## 为什么需要它？

科研人员经常需要标注显微镜图像、电泳胶图、组织切片、实验装置照片等，并将其排版到论文中。现有方案普遍存在痛点：

- **PowerPoint / Illustrator**：操作复杂、导出分辨率不可控、非专用工具效率低
- **ImageJ / Fiji**：功能强大但学习曲线陡峭、标注灵活性有限
- **在线工具**：需上传到第三方服务器，涉及数据隐私风险

本工具完全在**浏览器本地运行**，图像数据**从不离开您的电脑**，同时提供媲美桌面软件的专业标注能力。

## 功能

<table>
<tr>
<td width="50%">

### 图像处理
- **拖拽上传**：支持 PNG / JPEG / TIFF / BMP / SVG
- **图像调整**：亮度、曝光、对比度、高光、阴影独立调节，带实时预览
- **旋转**：-180° ~ +180° 自由旋转
- **裁剪**：框选保留区域，精确裁剪
- **边框**：四边独立设置宽度（0–500px）+ 自定义颜色

### 缩放控制
- 放大/缩小按钮，实时百分比显示
- 缩放不影响导出分辨率

</td>
<td width="50%">

### 文字标注
- 单击或拖拽添加文字框
- 9 种字体（含中文字体宋体/黑体/楷体）
- **上标 / 下标**模式，适合标注基因名、离子符号等
- 加粗、斜体、下划线样式
- 字号 8–500pt 可调

### 形状标注
- **花括号** `{` — 适合标注样本分组
- **椭圆** — 圈选细胞、组织区域
- **矩形** — 框选 ROI 区域
- **直线** — 连接标注与目标
- **箭头** — 实心箭头，精准指向

</td>
</tr>
</table>

### 专业特性
- **吸附对齐**：拖拽时 8px 内自动吸附到附近对象的边和中心线，带辅助参考线
- **旋转吸附**：旋转到 0°/90°/180°/270° 附近自动对齐
- **撤销/重做**：最多 50 步历史，支持 `Ctrl+Z` / `Ctrl+Y`
- **高清导出**：1× ~ 4× 分辨率倍率，PNG 无损或 JPEG 可调质量
- **隐私安全**：所有图像在本地处理，无需上传服务器

## 快速开始

```bash
git clone https://github.com/Waylon524/Tools/scientific-annotator.git
cd scientific-annotator
python run.py
```

浏览器自动打开，Fabric.js 和 Inter 字体从 CDN 自动加载。

> 需要 Python 3.6+。使用 `run.py` 而非 `python -m http.server`，因为它会自动分配端口并正确处理 ES Module 的 MIME 类型。

## 使用指南

### 基本工作流

1. **上传图像** — 点击工具栏“上传”或拖拽图像到画布
2. **调整图像** — 在左侧面板调节亮度、对比度等参数
3. **添加边框** — 设置四边边框宽度和颜色（模拟论文图片边缘）
4. **添加标注** — 选择工具（文字/花括号/椭圆/矩形/直线/箭头）在图像上标注
5. **编辑属性** — 选中标注后，右侧面板修改颜色、粗细、字号等
6. **导出** — 点击“导出”，选择分辨率和格式后下载

### 快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl + Z` | 撤销 |
| `Ctrl + Y` / `Ctrl + Shift + Z` | 重做 |
| `Delete` / `Backspace` | 删除选中对象 |
| `Escape` | 取消选择 / 退出裁剪模式 |
| `Space` + 鼠标拖拽 | 平移画布视图 |

### 直线和箭头

直线和箭头为拖拽绘制：按下鼠标设定起点，拖动到终点松开即完成。旋转时以中心点为轴心，不会发生位置偏移。箭头的三角形头部为**实心填充**，颜色与描边同步。

## 项目结构

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

纯原生 JavaScript，无框架依赖。各模块通过简单的事件总线（`on` / `emit`）通信，通过中央 `state` 对象共享数据。

## 技术栈

| 层 | 技术 |
|----|------|
| 画布渲染 | HTML5 Canvas + [Fabric.js](http://fabricjs.com/) 5.3.1 |
| 脚本 | 原生 JavaScript（ES Modules） |
| 样式 | CSS3 自定义属性，暖调奶油色设计系统 |
| 字体 | [Inter](https://fonts.google.com/specimen/Inter)（正文）+ [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)（等宽） |
| 运行时 | 仅需 Python 3.6+ 作为本地静态服务器 |

## 浏览器兼容性

| Chrome | Edge | Firefox | Safari |
|--------|------|---------|--------|
| ✓ 90+ | ✓ 90+ | ✓ 90+ | ✓ 14+ |

## 常见问题

**Q: 可以直接双击 `index.html` 打开吗？**  
A: 不可以。项目使用 ES Modules（`import` / `export`），必须通过 HTTP 服务器访问。使用 `python run.py` 即可。

**Q: 图像数据会上传到服务器吗？**  
A: 不会。所有图像处理都在浏览器本地完成，图像数据从未离开您的电脑。您可以断开网络连接后继续使用。

**Q: 导出的图像分辨率够发表论文吗？**  
A: 4× 倍率配合原始图像分辨率足以满足大多数期刊的 300–600 DPI 要求。导出尺寸实时显示在对话框中。

## 许可证

[MIT](LICENSE)
