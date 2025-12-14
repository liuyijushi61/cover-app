# **📽️ Project Handover: "Big Poster" Cover Generator (Local Migration)**

## **1\. 项目背景与目标**

当前状态：  
这是一个基于 React 的单文件应用（CoverGenerator.jsx），目前运行在在线模拟环境中。功能是生成具有“复古胶片感”和“古籍印刷感”的公众号封面大图。  
**核心功能**：

* **胶片颗粒**：使用 HTML5 Canvas 生成高斯噪点，叠加 Overlay 混合模式。  
* **排版系统**：支持主标题、副标题、作者署名的独立拖拽、缩放、行高调整。  
* **所见即所得导出**：使用 html2canvas 生成高清 PNG。

本次任务目标：  
将该单文件应用重构并迁移到本地的 Vite \+ React 开发环境中，同时将核心字体从在线 Google Fonts 替换为本地的 .otf 字体文件。

## **2\. 现有资产清单 (Assets)**

我们目前的文件夹中包含以下三个文件，请确保你（Cursor）能读取到：

1. 📄 **CoverGenerator.jsx**：核心源代码（包含了业务逻辑、UI 和样式）。  
2. 🔤 **Huiwen-Mincho.otf**：用户提供的本地字体文件（原名：汇文明朝体.otf，为避免编码问题已重命名/需重命名为英文）。  
3. 📝 **PROJECT\_HANDOVER.md**：本文档。

## **3\. 迁移与重构指南 (Step-by-Step Instructions)**

请 Cursor 作为一个资深前端架构师，按照以下步骤辅助我完成迁移。每完成一个阶段，请暂停并确认。

### **阶段一：项目初始化 (Infrastructure)**

1. **脚手架搭建**：  
   * 使用 Vite 创建 React 项目：npm create vite@latest cover-app \-- \--template react  
   * 不需要 TypeScript，保持使用 JavaScript (JSX) 以降低迁移复杂度。  
2. **依赖安装**：  
   * 安装核心 UI 图标库：npm install lucide-react  
   * 安装截图库（替代 Script 标签引入）：npm install html2canvas  
   * 安装 Tailwind CSS（如果原代码使用了 Tailwind 类名，需要初始化 Tailwind 配置）：  
     * npm install \-D tailwindcss postcss autoprefixer  
     * npx tailwindcss init \-p  
     * 配置 tailwind.config.js 的 content 路径。  
     * 在 index.css 中引入 Tailwind 指令。

### **阶段二：资产配置 (Assets Management)**

这是本次迁移的**最关键步骤**，请仔细处理：

1. **字体存放**：  
   * 在 src 目录下创建 assets/fonts 文件夹。  
   * 将根目录下的 Huiwen-Mincho.otf 移动到 src/assets/fonts/ 中。  
2. **全局字体声明**：  
   * 在 src/index.css 中，使用 @font-face 定义字体。  
   * **Font Family Name**: 定义为 Huiwen-Mincho。  
   * **引用路径**: 确保指向正确的 .otf 文件。

### **阶段三：代码重构 (Refactoring Logic)**

请打开 src/App.jsx (或新建 components/CoverGenerator.jsx) 并应用原有逻辑，但需做以下修改：

1. **移除在线依赖**：  
   * ❌ 删除 useEffect 中动态创建 \<script src="...html2canvas..."\> 的代码。  
   * ❌ 删除 useEffect 中动态创建 \<link href="...googleapis..."\> 的代码（除非保留备用英文字体）。  
2. **引入本地依赖**：  
   * ✅ 添加 import html2canvas from 'html2canvas';  
   * ✅ 确保 lucide-react 的图标正确引入。  
3. **字体逻辑修正**：  
   * 修改 fontOptions 数组配置。  
   * 找到 ID 为 'shippori' (或原本指向 Shippori Mincho 的项)。  
   * 将其 css 属性修改为我们在 CSS 中定义的本地字体名：css: "'Huiwen-Mincho', serif"。  
   * *注意*：确保字体名称与 index.css 中的 @font-face 严格一致。

### **阶段四：验证与调试 (Verification)**

1. **运行检查**：执行 npm run dev。  
2. **功能检查清单**：  
   * \[ \] 页面是否正常渲染，Tailwind 样式是否生效？  
   * \[ \] **重点**：选择“汇文/七宝里”字体时，是否成功加载了本地字体（检查 Network 面板或视觉确认）？  
   * \[ \] 拖拽功能是否流畅？  
   * \[ \] 点击“下载高清封面”是否能成功生成图片，且字体没有丢失？

## **4\. 给 Cursor 的最后提示 (Prompt)**

"Cursor，请先读取当前目录下的 CoverGenerator.jsx 理解业务逻辑。然后按照上述的【阶段一】开始，指导我使用终端命令创建项目。不要一次性生成所有代码，我们一步步来。"