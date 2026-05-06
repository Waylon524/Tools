# Biotech-Tool

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[English](#english) | [中文](#中文)

---

## English

A collection of privacy-first, browser-native tools for biotechnology research. No installation, no server uploads — everything runs locally in your browser.

### Tools

**1. Gel Chromatography Analysis System** — [gel-chromatography-analysis/](gel-chromatography-analysis/)

Extract absorbance from tube-array photographs via image processing, automatically generate elution curves, and compute $V_0$, $V_i$, $V_e$, $K_{av}$. Double-click the HTML file to run offline in any browser.

**2. Scientific Image Annotator** — [scientific-annotator/](scientific-annotator/)

Add text annotations, shape markers, scale bars, and borders to scientific images, then export at publication-ready resolution.

```bash
cd scientific-annotator
python run.py
```

### Tech Stack

| Tool | Core Technologies |
|------|-------------------|
| Gel Chromatography Analysis | HTML5 Canvas + Chart.js + Tailwind CSS |
| Scientific Image Annotator | HTML5 Canvas + Fabric.js 5 + ES Modules |

---

## 中文

一套注重隐私、纯浏览器端运行的生物技术科研工具集。无需安装，无需上传至服务器——所有操作都在浏览器本地完成。

### 工具列表

**1. 凝胶层析分析系统** — [gel-chromatography-analysis/](gel-chromatography-analysis/)

通过上传试管阵列照片提取吸光度，自动绘制洗脱曲线，计算 $V_0$、$V_i$、$V_e$、$K_{av}$ 等关键生化参数。双击 HTML 文件即可在浏览器中离线使用。

**2. 科研图像图注编辑器** — [scientific-annotator/](scientific-annotator/)

为科研图像添加文字标注、形状标记、比例尺和边框，导出满足论文发表要求的高清图像。

```bash
cd scientific-annotator
python run.py
```

### 技术栈

| 工具 | 核心技术 |
|------|----------|
| 凝胶层析分析系统 | HTML5 Canvas + Chart.js + Tailwind CSS |
| 图像图注编辑器 | HTML5 Canvas + Fabric.js 5 + ES Modules |

---

## License · 许可证

[MIT](LICENSE)
