# Multi-row Image Gel Chromatography Analysis System

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![JavaScript](https://img.shields.io/badge/vanilla-JavaScript-yellow.svg)](#)
[![Chart.js](https://img.shields.io/badge/chart-Chart.js-ff6384.svg)](https://www.chartjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/css-Tailwind%20CSS-38bdf8.svg)](https://tailwindcss.com/)

[English](#english) | [中文](#中文)

---

## English

A lightweight, purely browser-based tool for gel chromatography data analysis. Upload photographs of elution tube arrays, extract absorbance values via image processing, automatically generate elution curves, and calculate key biochemical parameters including void volume ($V_0$), inner volume ($V_i$), elution volume ($V_e$), and partition coefficient ($K_{av}$).

### Features

- **Image-based photometry** — Extract color depth from RGB or grayscale channels of tube photographs using Beer-Lambert law principles to derive relative optical density (OD). No spectrophotometer required.
- **Smart parameter calculation** — Set bed volume ($V_t$), tube volume, and pre-collection discard volume. Auto-detects peaks and computes $V_e$ for each component. Designate specific substances as $V_0$ indicator.
- **Multi-channel & multi-substance** — Separate mixtures of differently colored compounds. Example: red channel for Blue Dextran, green channel for Cytochrome C.
- **Flexible image alignment** — Upload tube photos row by row with intuitive X/Y axis and scaling controls to precisely align sampling regions.
- **High-resolution export** — One-click generation of normalized elution curves exported as publication-ready PNG with white background.

### Quick Start

Download the HTML file and open it in any modern browser (Chrome, Edge, Safari). No installation required — runs entirely offline.

### Usage

**1. Configure Global Parameters**

| Parameter | Description |
|-----------|-------------|
| Bed Volume ($V_t$) | Total volume of the gel column (mL) |
| Tube Volume | Volume collected per tube (mL) |
| Pre-collection Discard Volume | Volume discarded before collecting tube 1 (mL) |

**2. Configure Substances & $V_0$ Indicator**

Click **"+ Add Substance"** and choose the optimal absorption channel:

| Substance Color | Best Channel |
|----------------|--------------|
| Blue (e.g. Blue Dextran) | Red channel |
| Red (e.g. Cytochrome C) | Green channel |
| Yellow (e.g. Riboflavin) | Blue channel |
| Colorless or mixtures | Grayscale |

Check **"Set as V₀"** on one substance — its peak position defines the void volume.

**3. Upload Photos & Align Sampling Region**

Click **"Add New Row of Photos"**, upload images, enter tube count per row, then adjust the red sampling box to precisely cover the deepest color region of each tube's liquid surface.

**4. Generate Curves & Export**

Click **"Generate Combined Curve"** to view the elution curve and computed results ($V_0$, $V_i$, $V_e$, $K_{av}$). Click **"Download Result Plot"** to save as PNG.

### Core Formulas

| Parameter | Formula |
|-----------|---------|
| Elution Volume | $V_e = V_\text{discard} + N_\text{peak} \times V_\text{tube}$ |
| Void Volume | $V_0 = V_e$ of the designated indicator |
| Inner Volume | $V_i = V_t - V_0$ |
| Partition Coefficient | $K_{av} = \frac{V_e - V_0}{V_t - V_0} = \frac{V_e - V_0}{V_i}$ |

*Internal: early tubes serve as blank reference ($I_0$). Absorbance is calculated as $A = -\log_{10}(I/I_0)$, followed by smoothing and normalization.*

### Tech Stack

| Layer | Technology |
|-------|------------|
| Structure | HTML5 + Vanilla JavaScript |
| Styling | Tailwind CSS (CDN) |
| Charting | Chart.js (CDN) |
| Image Processing | HTML5 Canvas API (ImageData) |

### Limitations

Due to variations in lighting, camera white balance, and tube wall refraction, computed optical density values may differ from spectrophotometer readings. However, **relative trends and peak positions** provide high reference value.

---

## 中文

轻量级纯浏览器端凝胶层析数据分析与可视化工具。通过上传洗脱液试管阵列照片，利用图像处理技术提取吸光度（基于相对光密度），自动绘制洗脱曲线，智能计算外水体积 ($V_0$)、内水体积 ($V_i$)、洗脱体积 ($V_e$) 及分配系数 ($K_{av}$) 等关键生化参数。

### 功能特性

- **图像光度计分析** — 通过 RGB 或灰度通道提取颜色深度，运用比尔-朗伯定律原理转化为相对光密度 (OD)，无需分光光度计。
- **智能参数计算** — 设置柱床体积 ($V_t$)、单管体积和收集前弃去体积，自动寻峰计算各组分 $V_e$，支持指定特定物质作为 $V_0$ 指示剂。
- **多通道与多物质** — 支持分离不同颜色的混合物。例如：红色通道测蓝色葡聚糖，绿色通道测细胞色素 C。
- **灵活的图像矫正** — 分行上传试管照片，通过直观的 X/Y 轴与比例控制，将采样红框精准对齐液面。
- **高清图表导出** — 一键生成以洗脱体积为横坐标的归一化洗脱曲线，导出为白底高清 PNG 图片，可直接用于实验报告。

### 快速开始

下载 HTML 文件，用任意现代浏览器（Chrome、Edge、Safari 推荐）打开即可使用。无需安装，完全离线运行。

### 使用指南

**第一步：全局参数配置**

| 参数 | 说明 |
|------|------|
| 柱床体积 ($V_t$) | 凝胶柱的总体积 (mL) |
| 单管体积 | 每支收集管所收集的液体体积 (mL) |
| 收集前弃去体积 | 开始收集第 1 管前已经流出的体积 (mL) |

**第二步：配置检测物质与 $V_0$ 指示剂**

点击 **"+ 添加物质"**，为不同颜色的物质选择最佳吸收通道：

| 物质颜色 | 最佳通道 |
|----------|----------|
| 蓝色（如蓝色葡聚糖） | 红光 |
| 红色（如细胞色素 C） | 绿光 |
| 黄色（如核黄素） | 蓝光 |
| 无色或混合物 | 灰度 |

勾选某种物质的 **"设为 V₀"** 单选框，其峰值位置即为外水体积。

**第三步：上传照片与对齐采样区**

点击 **"添加新的一排照片"**，上传裁剪好的试管阵列图片，输入管数，调整 Y 轴高度、X 起点和 X 终点，确保红色采样框套在每支试管液面的颜色最深处。

**第四步：生成曲线与导出结果**

点击 **"生成合并曲线"**，右侧面板显示归一化洗脱曲线及 $V_0$、$V_i$、$V_e$、$K_{av}$ 计算结果。点击 **"下载结果图"** 保存 PNG。

### 核心公式

| 参数 | 公式 |
|------|------|
| 洗脱体积 | $V_e = V_\text{弃去} + N_\text{峰值管} \times V_\text{单管}$ |
| 外水体积 | $V_0$ = 指定指示剂的 $V_e$ |
| 内水体积 | $V_i = V_t - V_0$ |
| 分配系数 | $K_{av} = \frac{V_e - V_0}{V_t - V_0} = \frac{V_e - V_0}{V_i}$ |

*内部处理：前几管作为空白对照 ($I_0$)，通过 $A = -\log_{10}(I/I_0)$ 计算吸光度，随后进行平滑处理与归一化。*

### 技术栈

| 层 | 技术 |
|----|------|
| 结构 | HTML5 + Vanilla JavaScript |
| 样式 | Tailwind CSS (CDN) |
| 图表 | Chart.js (CDN) |
| 图像处理 | HTML5 Canvas API (ImageData) |

### 注意事项

由于拍摄光线、相机白平衡和管壁折射的差异，基于图像像素计算的光密度与专业分光光度计测得的绝对 OD 值可能存在偏差，但其反映的**相对趋势与出峰位置**具有高度参考价值。

---

## License · 许可证

[MIT](../LICENSE)
