import React, { useState, useRef, useEffect } from 'react';
import { Download, Type, Palette, Layout, Move, RefreshCcw, Monitor, Smartphone, Image as ImageIcon, User, Sliders, MousePointer2, Layers } from 'lucide-react';

// --- 配置常量 ---
const DEFAULT_CONFIG = {
    title: {
        id: 'title',
        text: '如果 AI 读懂一切',
        fontSize: 100,
        lineHeight: 1.1,
        fontFamily: 'shippori', // 改用 Seven Treasures (Shippori) 模拟古籍
        offset: { x: 0, y: 0 }
    },
    subtitle: {
        id: 'subtitle',
        text: '「我」还剩下什么？',
        fontSize: 100,
        lineHeight: 1.4,
        fontFamily: 'shippori',
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
// 不用 SVG，改用 Canvas 生成柔和的高斯噪点图
const useFilmGrain = (opacity = 0.08) => {
    const [grainUrl, setGrainUrl] = useState('');

    useEffect(() => {
        const canvas = document.createElement('canvas');
        const size = 256; // 纹理单元大小
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // 填充透明底
        ctx.clearRect(0, 0, size, size);

        // 生成噪点
        const imageData = ctx.createImageData(size, size);
        const buffer = new Uint32Array(imageData.data.buffer);

        for (let i = 0; i < buffer.length; i++) {
            // 使用更自然的随机算法
            if (Math.random() < 0.5) {
                // 灰色噪点，不是纯黑白，模拟银盐颗粒
                const val = Math.random() * 255;
                // Alpha 通道控制强度
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
            className={`${className} transition-all duration-200 cursor-move ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent rounded' : 'hover:ring-1 hover:ring-dashed hover:ring-gray-400/50 rounded'}`}
            style={{
                transform: `translate(${offset.x}px, ${offset.y}px)`,
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
    const [textureMode, setTextureMode] = useState('film'); // 'film' | 'clean'

    const canvasRef = useRef(null);
    const grainUrl = useFilmGrain(); // 获取生成的噪点图

    // --- 字体库升级 ---
    // 使用 Shippori Mincho 替代 SVG 腐蚀，这是真正的 Web Font 解决方案
    const fontOptions = [
        { id: 'shippori', name: '七宝里 (古籍明朝)', css: "'Shippori Mincho', serif", weight: 400 }, // 真正的复古感
        { id: 'shippori-bold', name: '七宝里 (古籍粗)', css: "'Shippori Mincho', serif", weight: 700 },
        { id: 'noto-serif', name: '思源宋 (标准)', css: "'Noto Serif SC', serif", weight: 700 },
        { id: 'long-cang', name: '龙仓 (行书)', css: "'Long Cang', cursive", weight: 400 },
        { id: 'ma-shan', name: '马善 (毛笔)', css: "'Ma Shan Zheng', cursive", weight: 400 },
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
        if (confirm('确定要重置所有排版、配色和位置到初始状态吗？（文本内容将保留）')) {
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
            setSelectedId('title');
        }
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

    const presetTextColors = [
        { name: '云峰', value: '#f5f5f5' },
        { name: '古纸', value: '#eaddcf' },
        { name: '月银', value: '#cbd5e1' },
        { name: '赤金', value: '#d4c5b0' },
        { name: '钛灰', value: '#a1a1aa' },
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

    // 加载字体
    useEffect(() => {
        const link = document.createElement('link');
        // 引入 Shippori Mincho (关键), Long Cang, Ma Shan Zheng 等有质感的字体
        link.href = 'https://fonts.googleapis.com/css2?family=Long+Cang&family=Ma+Shan+Zheng&family=Noto+Sans+SC:wght@700;900&family=Noto+Serif+SC:wght@700&family=Shippori+Mincho:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => document.head.removeChild(link);
    }, []);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://html2canvas.hertzen.com/dist/html2canvas.min.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            if (document.body.contains(script)) document.body.removeChild(script);
        }
    }, []);

    const handleDownload = async () => {
        if (!window.html2canvas || !canvasRef.current) {
            alert("组件加载中，请稍后再试或检查网络");
            return;
        }
        try {
            const tempId = selectedId;
            setSelectedId(null);
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await window.html2canvas(canvasRef.current, {
                scale: 2, // 2倍高清
                backgroundColor: bgColor, // 确保背景色正确
                useCORS: true, // 允许加载跨域字体
                // 关键：不使用 foreignObject 渲染，提高兼容性
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
            <div className="w-full md:w-80 bg-white shadow-lg flex flex-col z-10 border-r border-gray-200 h-screen md:h-auto overflow-hidden">

                {/* Header */}
                <div className="p-6 pb-2 shrink-0">
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
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">

                    {/* 编辑区 */}
                    <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
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
                            <label className="text-[10px] text-gray-500 block mb-1">字体 (Font - No SVG Filters)</label>
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
                <div className="p-6 border-t border-gray-200 shrink-0">
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
                        backgroundColor: bgColor,
                        color: textColor,
                        padding: '2rem',
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 1. 胶片颗粒层 (使用 CSS Overlay 混合，效果最自然) */}
                    {textureMode === 'film' && (
                        <div
                            className="absolute inset-0 pointer-events-none z-0"
                            style={{
                                backgroundImage: `url(${grainUrl})`, // 使用生成的噪点图
                                backgroundSize: '200px 200px', // 纹理平铺
                                opacity: 0.15, // 控制噪点强度
                                mixBlendMode: 'overlay' // 关键：使用叠加模式实现胶片感，而非简单的遮盖
                            }}
                        ></div>
                    )}

                    {/* 2. 内边框装饰 (稍微浮起一点) */}
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
                                        textShadow: '0 2px 10px rgba(0,0,0,0.15)', // 柔和的投影
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
                            const font = fontOptions.find(f => f.id === elements.author.fontFamily) || fontOptions[5];
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
                    Pro 模式：已启用 Web Font 和 Canvas 胶片颗粒
                </div>
            </div>
        </div>
    );
};

export default CoverGenerator;