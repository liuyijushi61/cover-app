import React, { useState, useRef, useEffect } from 'react';
import { Download, Type, Palette, Layout, Move, RefreshCcw, Monitor, Smartphone, Image as ImageIcon, User, Sliders, MousePointer2, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';

// --- 配置常量 ---
const DEFAULT_CONFIG = {
  title: {
    id: 'title',
    text: '如果 AI 读懂一切',
    fontSize: 100,
    lineHeight: 1.1,
    fontFamily: 'huiwen', // 使用本地汇文明朝体
    offset: { x: 0, y: 0 }
  },
  subtitle: {
    id: 'subtitle',
    text: '「我」还剩下什么？',
    fontSize: 100,
    lineHeight: 1.4,
    fontFamily: 'huiwen',
    offset: { x: 0, y: 0 }
  },
  author: {
    id: 'author',
    text: 'DESIGNED BY DAPENG • 2025.11.28',
    fontSize: 100,
    lineHeight: 1.0,
    fontFamily: 'sans-mono',
    offset: { x: 0, y: 0 }
  }
};

// --- 胶片颗粒生成器 (The Magic of Film Grain) ---
const useFilmGrain = (opacity = 0.08) => {
  const [grainUrl, setGrainUrl] = useState('');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);

    const imageData = ctx.createImageData(size, size);
    const buffer = new Uint32Array(imageData.data.buffer);

    for (let i = 0; i < buffer.length; i++) {
      if (Math.random() < 0.5) {
        const val = Math.random() * 255;
        buffer[i] = (255 << 24) | (val << 16) | (val << 8) | val;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    setGrainUrl(canvas.toDataURL('image/png'));
  }, []);

  return grainUrl;
};

// --- 拖拽组件 ---
const DraggableElement = ({
  id,
  isSelected,
  offset,
  onSelect,
  onDrag,
  children,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const initialOffsetRef = useRef({ x: 0, y: 0 });

  const handleStart = (clientX, clientY) => {
    setIsDragging(true);
    onSelect(id);
    startPosRef.current = { x: clientX, y: clientY };
    initialOffsetRef.current = { ...offset };
  };

  const handleMove = (clientX, clientY) => {
    if (!isDragging) return;
    const deltaX = clientX - startPosRef.current.x;
    const deltaY = clientY - startPosRef.current.y;
    onDrag(id, {
      x: initialOffsetRef.current.x + deltaX,
      y: initialOffsetRef.current.y + deltaY
    });
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();
    const onTouchMove = (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => handleEnd();

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      onMouseDown={(e) => { e.stopPropagation(); handleStart(e.clientX, e.clientY); }}
      onTouchStart={(e) => { e.stopPropagation(); handleStart(e.touches[0].clientX, e.touches[0].clientY); }}
      className={`${className} cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent rounded' : 'hover:ring-1 hover:ring-dashed hover:ring-gray-400/50 rounded'}`}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        transition: isDragging ? 'none' : 'all 0.2s ease',
        userSelect: 'none',
        touchAction: 'none'
      }}
    >
      {children}
    </div>
  );
};

const CoverGenerator = () => {
  // --- 状态管理 ---
  const [elements, setElements] = useState(JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
  const [selectedId, setSelectedId] = useState('title');
  const [bgColor, setBgColor] = useState('#1e293b');
  const [textColor, setTextColor] = useState('#f5f5f5');
  const [aspectRatio, setAspectRatio] = useState(3 / 4);
  const [customRatio, setCustomRatio] = useState({ w: 600, h: 800 });
  const [textureMode, setTextureMode] = useState('film');
  // 渐变背景相关状态
  const [bgMode, setBgMode] = useState('solid'); // 'solid' | 'gradient'
  const [selectedGradient, setSelectedGradient] = useState({ name: '暖阳', from: '#fffbeb', to: '#fff1f2' });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const canvasRef = useRef(null);
  const grainUrl = useFilmGrain();

  // --- 字体库（使用本地字体） ---
  const fontOptions = [
    { id: 'huiwen', name: '汇文 (古籍明朝)', css: "'Huiwen-Mincho', serif", weight: 400 },
    { id: 'jinghua-song', name: '京华老宋体', css: "'Jinghua-Song', serif", weight: 400 },
    { id: 'xiangcui-kesong', name: '香萃刻宋', css: "'Xiangcui-Kesong', serif", weight: 400 },
    { id: 'guyue-ming', name: '古越轩粗明', css: "'Guyue-Ming-Bold', serif", weight: 400 },
    { id: 'mf-langsong', name: '造字工房朗宋', css: "'MF-LangSong', serif", weight: 400 },
    { id: 'fz-yansong', name: '方正颜宋', css: "'FZ-YanSong-S', serif", weight: 400 },
    { id: 'lxgw-wenkai', name: '霞鹜文楷', css: "'LXGW-WenKai', serif", weight: 400 },
    { id: 'jiangxi-zhuokai', name: '江西拙楷', css: "'Jiangxi-Zhuokai', serif", weight: 400 },
    { id: 'zikutang-qingkai', name: '字酷堂清楷', css: "'Zikutang-Qingkai', serif", weight: 400 },
    { id: 'fz-suxinshiliukai-s', name: '方正苏新诗柳楷(简)', css: "'FZ-SuXinShiLiuKai-S', serif", weight: 400 },
    { id: 'suxinshiliukai-t', name: '苏新诗柳楷(繁)', css: "'SuXinShiLiuKai-T', serif", weight: 400 },
    { id: 'wanghanzong-yankai', name: '王汉宗颜楷', css: "'WangHanzong-Yankai', serif", weight: 400 },
    { id: 'huangtingjian', name: '黄庭坚书法', css: "'HuangTingJian', serif", weight: 400 },
    { id: 'yuwei-xingshu', name: '禹卫书法行书', css: "'Yuwei-Xingshu', serif", weight: 400 },
    { id: 'senty-snow', name: '新蒂雪山体', css: "'Senty-Snow', serif", weight: 400 },
    { id: 'yaoji-xiangsi', name: '遥寄相思', css: "'Yaoji-Xiangsi', serif", weight: 400 },
    { id: 'noto-serif', name: '思源宋 (标准)', css: "'Noto Serif SC', serif", weight: 700 },
    { id: 'sans-bold', name: '粗黑体 (现代)', css: "'Noto Sans SC', sans-serif", weight: 900 },
    { id: 'sans-mono', name: '等宽 (代码风)', css: "'Courier New', monospace", weight: 400 },
  ];

  const updateElement = (id, key, value) => {
    if (!id) return;
    setElements(prev => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }));
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    setElements(prev => {
      const resetState = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      resetState.title.text = prev.title.text;
      resetState.subtitle.text = prev.subtitle.text;
      resetState.author.text = prev.author.text;
      return resetState;
    });
    setBgColor('#1e293b');
    setTextColor('#f5f5f5');
    setAspectRatio(3 / 4);
    setCustomRatio({ w: 600, h: 800 });
    setTextureMode('film');
    setBgMode('solid');
    setSelectedGradient({ name: '暖阳', from: '#fffbeb', to: '#fff1f2' });
    setSelectedId('title');
    setShowResetConfirm(false);
  };

  const presetBgColors = [
    { name: '墨黑', value: '#1a1a1a' },
    { name: '深黛', value: '#1e293b' },
    { name: '玄青', value: '#0f172a' },
    { name: '赭石', value: '#2c0b0e' },
    { name: '枯绿', value: '#14261C' },
    { name: '苍灰', value: '#27272a' },
    { name: '海蓝', value: '#172554' },
  ];

  // 渐变背景预设 - 高级浅色双色渐变 (径向发散)
  // 渐变背景预设 - 高级浅色双色渐变 (径向发散，增强对比度)
  const presetGradients = [
    { name: '暖阳', from: '#fcd34d', to: '#fffbeb' },  // Amber 300 -> Amber 50
    { name: '晨曦', from: '#7dd3fc', to: '#f0f9ff' },  // Sky 300 -> Sky 50
    { name: '薄荷', from: '#86efac', to: '#f0fdf4' },  // Green 300 -> Green 50
    { name: '光韵', from: '#fbbf24', to: '#ffffff' },  // Amber 400 -> White
    { name: '月白', from: '#cbd5e1', to: '#f8fafc' },  // Slate 300 -> Slate 50
    { name: '极光', from: '#5eead4', to: '#f0fdfa' },  // Teal 300 -> Teal 50
  ];

  const presetTextColors = [
    // 浅色系
    { name: '云峰', value: '#f5f5f5' },
    { name: '古纸', value: '#eaddcf' },
    { name: '月银', value: '#cbd5e1' },
    { name: '赤金', value: '#d4c5b0' },
    { name: '钛灰', value: '#a1a1aa' },
    // 深色系 (新增)
    { name: '曜石', value: '#0f172a' }, // Slate 900
    { name: '碳灰', value: '#334155' }, // Slate 700
    { name: '深海', value: '#1e3a8a' }, // Blue 900
    { name: '墨绿', value: '#14532d' }, // Green 900
    { name: '可可', value: '#451a03' }, // Amber 950
  ];

  const ratioOptions = [
    { name: '公号首图', w: 900, h: 383, ratio: 2.35, icon: <Monitor size={16} /> },
    { name: '公号次图', w: 500, h: 500, ratio: 1, icon: <ImageIcon size={16} /> },
    { name: '4:3', w: 800, h: 600, ratio: 4 / 3, icon: <Layout size={16} /> },
    { name: '3:4', w: 600, h: 800, ratio: 3 / 4, icon: <Smartphone size={16} /> },
    { name: '16:9', w: 960, h: 540, ratio: 16 / 9, icon: <Monitor size={16} /> },
    { name: '9:16', w: 540, h: 960, ratio: 9 / 16, icon: <Smartphone size={16} /> },
    { name: '21:9', w: 945, h: 405, ratio: 21 / 9, icon: <Monitor size={16} /> },
  ];

  const handleDownload = async () => {
    if (!canvasRef.current) {
      alert("组件加载中，请稍后再试");
      return;
    }
    try {
      const tempId = selectedId;
      setSelectedId(null);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: null, // 让 html2canvas 自动捕获实际背景（包括渐变）
        useCORS: true,
        foreignObjectRendering: false
      });

      const link = document.createElement('a');
      link.download = `cover_HD_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setSelectedId(tempId);
    } catch (err) {
      console.error("导出失败:", err);
      alert("导出失败，请截图保存");
    }
  };

  const effectiveId = selectedId || 'title';
  const activeElement = elements[effectiveId];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans text-gray-800">

      {/* --- 左侧控制面板 --- */}
      <div className="w-full md:w-80 bg-white shadow-lg flex flex-col z-10 border-r border-gray-200 h-screen overflow-hidden">

        {/* Header */}
        <div className="p-4 pb-2 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                <Type className="w-6 h-6" />
                大字报·Pro
              </h1>
              <p className="text-xs text-gray-500 mt-1">HD • 胶片颗粒 • 真正复古</p>
            </div>
            <button onClick={handleReset} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Controls */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-4">

          {/* 编辑区 */}
          <div className="space-y-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer2 size={14} className="text-blue-600" />
              <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                当前编辑: {effectiveId === 'title' ? '主标题' : effectiveId === 'subtitle' ? '副标题' : '作者/底部'}
              </label>
            </div>

            <textarea
              value={activeElement.text}
              onChange={(e) => updateElement(effectiveId, 'text', e.target.value)}
              className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white resize-none h-20"
              placeholder="输入文本..."
            />

            <div>
              <label className="text-[10px] text-gray-500 block mb-1">字体 (本地字体)</label>
              <select
                value={activeElement.fontFamily}
                onChange={(e) => updateElement(effectiveId, 'fontFamily', e.target.value)}
                className="w-full p-2 border border-gray-200 rounded text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {fontOptions.map(font => (
                  <option key={font.id} value={font.id}>{font.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">大小 ({activeElement.fontSize}%)</span>
                <input type="range" min="20" max="200" step="5" value={activeElement.fontSize} onChange={(e) => updateElement(effectiveId, 'fontSize', parseInt(e.target.value))} className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block mb-1">行高 ({activeElement.lineHeight})</span>
                <input type="range" min="0.8" max="3.0" step="0.1" value={activeElement.lineHeight} onChange={(e) => updateElement(effectiveId, 'lineHeight', parseFloat(e.target.value))} className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
            </div>
          </div>

          {/* 质感与颜色 */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Palette size={12} /> 质感 & 配色
            </label>

            {/* 质感开关 */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setTextureMode('film')}
                className={`flex items-center justify-center gap-2 p-2 rounded border text-xs ${textureMode === 'film' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
              >
                <Layers size={14} /> 胶片颗粒
              </button>
              <button
                onClick={() => setTextureMode('clean')}
                className={`flex items-center justify-center gap-2 p-2 rounded border text-xs ${textureMode === 'clean' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
              >
                <div className="w-3 h-3 bg-gray-400 rounded-sm"></div> 纯净平滑
              </button>
            </div>

            {/* 背景模式切换 */}
            <div className="mt-3">
              <span className="text-[10px] text-gray-500 block mb-2">背景模式</span>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => setBgMode('solid')}
                  className={`flex items-center justify-center gap-2 p-2 rounded border text-xs ${bgMode === 'solid' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
                >
                  <div className="w-3 h-3 bg-slate-700 rounded-sm"></div> 纯色背景
                </button>
                <button
                  onClick={() => setBgMode('gradient')}
                  className={`flex items-center justify-center gap-2 p-2 rounded border text-xs ${bgMode === 'gradient' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600'}`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: 'radial-gradient(circle at center, #fffbeb, #fff1f2)' }}></div> 渐变背景
                </button>
              </div>
            </div>

            {/* 根据背景模式显示不同的选择器 */}
            {bgMode === 'solid' ? (
              <>
                <div className="grid grid-cols-6 gap-2">
                  {presetBgColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setBgColor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none ${bgColor === c.value ? 'border-white ring-2 ring-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {presetGradients.map((g) => (
                  <button
                    key={g.name}
                    onClick={() => setSelectedGradient(g)}
                    className={`h-10 rounded-lg border-2 transition-all hover:scale-105 focus:outline-none flex items-center justify-center text-[10px] font-medium ${selectedGradient.name === g.name ? 'ring-2 ring-gray-900 border-white' : 'border-transparent'}`}
                    style={{
                      background: `radial-gradient(circle at center, ${g.from} 0%, ${g.from} 15%, ${g.to} 75%, ${g.to} 100%)`,
                      color: '#374151'
                    }}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-5 gap-2 mt-2">
              {presetTextColors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTextColor(c.value)}
                  className={`h-6 rounded border transition-all text-[10px] flex items-center justify-center ${textColor === c.value ? 'ring-2 ring-gray-900 border-transparent font-bold' : 'border-gray-200 hover:bg-gray-50'}`}
                  style={{ backgroundColor: c.value, color: '#333' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* 尺寸 */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Layout size={12} /> 尺寸 Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ratioOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAspectRatio(opt.ratio);
                    setCustomRatio({ w: opt.w, h: opt.h });
                  }}
                  className={`p-2 flex flex-col items-center justify-center gap-1 rounded border text-xs transition-all ${Math.abs(aspectRatio - opt.ratio) < 0.01 ? 'bg-gray-900 text-white border-gray-900' : 'bg-white hover:bg-gray-50'}`}
                >
                  {opt.icon}
                  <span>{opt.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <button
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Download size={18} />
            下载高清封面 (Pro)
          </button>
        </div>
      </div>

      {/* --- 右侧预览区域 --- */}
      <div
        className="flex-1 bg-gray-200 flex items-center justify-center p-8 overflow-auto relative"
        onClick={() => setSelectedId(null)}
      >
        {/* 编辑器背景装饰 */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}></div>

        {/* 画布核心 */}
        <div
          ref={canvasRef}
          className="relative flex flex-col items-center justify-center text-center shadow-2xl transition-all duration-300 overflow-hidden"
          style={{
            width: '100%',
            maxWidth: `${customRatio.w}px`,
            aspectRatio: `${aspectRatio}`,
            background: bgMode === 'gradient'
              ? `radial-gradient(circle at center, ${selectedGradient.from} 0%, ${selectedGradient.from} 15%, ${selectedGradient.to} 75%, ${selectedGradient.to} 100%)`
              : bgColor,
            color: textColor,
            padding: '2rem',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. 胶片颗粒层 */}
          {textureMode === 'film' && (
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `url(${grainUrl})`,
                backgroundSize: '200px 200px',
                opacity: 0.15,
                mixBlendMode: 'overlay'
              }}
            ></div>
          )}

          {/* 2. 内边框装饰 */}
          <div className="absolute inset-4 border border-current opacity-20 pointer-events-none mix-blend-overlay z-0"></div>

          {/* 3. 元素层 */}
          <DraggableElement
            id="title"
            isSelected={selectedId === 'title'}
            offset={elements.title.offset}
            onSelect={setSelectedId}
            onDrag={(id, pos) => updateElement(id, 'offset', pos)}
            className="relative z-10 p-2"
          >
            {(() => {
              const font = fontOptions.find(f => f.id === elements.title.fontFamily) || fontOptions[0];
              return (
                <h1
                  className="font-bold leading-tight select-none break-words whitespace-pre-wrap"
                  style={{
                    fontFamily: font.css,
                    fontWeight: font.weight,
                    textShadow: '0 2px 10px rgba(0,0,0,0.15)',
                    lineHeight: elements.title.lineHeight,
                    fontSize: `${4 * (elements.title.fontSize / 100)}rem`
                  }}
                >
                  {elements.title.text}
                </h1>
              );
            })()}
          </DraggableElement>

          {elements.subtitle.text && (
            <DraggableElement
              id="subtitle"
              isSelected={selectedId === 'subtitle'}
              offset={elements.subtitle.offset}
              onSelect={setSelectedId}
              onDrag={(id, pos) => updateElement(id, 'offset', pos)}
              className="relative z-10 p-2"
            >
              {(() => {
                const font = fontOptions.find(f => f.id === elements.subtitle.fontFamily) || fontOptions[0];
                return (
                  <p
                    className="tracking-[0.2em] opacity-80 uppercase select-none font-serif whitespace-pre-wrap"
                    style={{
                      fontFamily: font.css,
                      fontWeight: font.weight,
                      lineHeight: elements.subtitle.lineHeight,
                      fontSize: `${1.5 * (elements.subtitle.fontSize / 100)}rem`
                    }}
                  >
                    {elements.subtitle.text}
                  </p>
                );
              })()}
            </DraggableElement>
          )}

          <DraggableElement
            id="author"
            isSelected={selectedId === 'author'}
            offset={elements.author.offset}
            onSelect={setSelectedId}
            onDrag={(id, pos) => updateElement(id, 'offset', pos)}
            className="absolute bottom-6 z-10 p-2"
          >
            {(() => {
              const font = fontOptions.find(f => f.id === elements.author.fontFamily) || fontOptions[3];
              return (
                <div
                  className="opacity-40 tracking-widest select-none whitespace-pre-wrap"
                  style={{
                    fontFamily: font.css,
                    fontWeight: font.weight,
                    lineHeight: elements.author.lineHeight,
                    fontSize: `${0.75 * (elements.author.fontSize / 100)}rem`
                  }}
                >
                  {elements.author.text}
                </div>
              );
            })()}
          </DraggableElement>
        </div>

        <div className="absolute bottom-4 text-gray-400 text-xs bg-gray-100/80 px-2 py-1 rounded">
          本地模式：已启用本地字体和 Canvas 胶片颗粒
        </div>
      </div>

      {/* 自定义确认弹窗 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 transform transition-all scale-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认重置？</h3>
            <p className="text-sm text-gray-500 mb-6">这将恢复所有排版和配色到默认状态，但保留文字内容。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-sm"
              >
                确定重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverGenerator;
