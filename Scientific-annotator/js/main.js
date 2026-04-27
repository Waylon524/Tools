// main.js — Entry point, initialization, event binding

import { initCanvas, state, saveHistory, undo, redo, on, emit, updateCanvasInfo } from './canvas-manager.js';
import { setupUpload, setupAdjustControls, setupZoomControls, enterCropMode, exitCropMode } from './image-tools.js';
import { setupBorderControls } from './border-tools.js';
import { setupTextTools, addTextBox, updateTextProps } from './text-tools.js';
import { setupShapeTools, addBrace, addEllipse, addRect, addLine, addArrow, updateShapeProps, resetShapeProps } from './shape-tools.js';
import { setupExport } from './export.js';

function init() {
    // Init canvas
    initCanvas();
    if (state.history.length === 0) saveHistory();

    // Setup all tool modules
    setupUpload();
    setupAdjustControls();
    setupZoomControls();
    setupBorderControls();
    setupTextTools();
    setupShapeTools();
    setupExport();

    // Tool button activation
    const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            setActiveTool(tool);
        });
    });

    // Snap toggle
    const snapBtn = document.getElementById('btn-snap');
    snapBtn.classList.toggle('active', state.snapEnabled);
    snapBtn.addEventListener('click', () => {
        state.snapEnabled = !state.snapEnabled;
        snapBtn.classList.toggle('active', state.snapEnabled);
    });

    // Undo/Redo buttons
    document.getElementById('btn-undo').addEventListener('click', () => {
        undo();
        state.fabricCanvas.renderAll();
    });
    document.getElementById('btn-redo').addEventListener('click', () => {
        redo();
        state.fabricCanvas.renderAll();
    });

    // Delete button
    document.getElementById('btn-delete').addEventListener('click', () => {
        const obj = state.fabricCanvas.getActiveObject();
        if (obj) {
            state.fabricCanvas.remove(obj);
            state.fabricCanvas.discardActiveObject();
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });

    // Spacebar pan state
    let spaceHeld = false;
    let panStart = null;

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !spaceHeld) {
            e.preventDefault();
            spaceHeld = true;
            state.spaceHeld = true;
            state.fabricCanvas.setCursor('grab');
            state.fabricCanvas.selection = false;
            return;
        }
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
            state.fabricCanvas.renderAll();
        } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo();
            state.fabricCanvas.renderAll();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;
            const obj = state.fabricCanvas.getActiveObject();
            if (obj) {
                e.preventDefault();
                state.fabricCanvas.remove(obj);
                state.fabricCanvas.discardActiveObject();
                state.fabricCanvas.renderAll();
                saveHistory();
            }
        } else if (e.key === 'Escape') {
            if (state.activeTool === 'crop') {
                setActiveTool('select');
                exitCropMode();
            }
            state.fabricCanvas.discardActiveObject();
            state.fabricCanvas.renderAll();
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space') {
            spaceHeld = false;
            state.spaceHeld = false;
            state.fabricCanvas.setCursor('default');
            if (state.activeTool === 'select') {
                state.fabricCanvas.selection = true;
            }
        }
    });

    // Pan via spacebar+mouse drag
    let panning = false;
    let lastPanX, lastPanY;
    state.fabricCanvas.on('mouse:down', (opt) => {
        if (spaceHeld) {
            panning = true;
            lastPanX = opt.e.clientX;
            lastPanY = opt.e.clientY;
            state.fabricCanvas.setCursor('grabbing');
        }
    });
    state.fabricCanvas.on('mouse:move', (opt) => {
        if (panning && spaceHeld) {
            const vpt = state.fabricCanvas.viewportTransform;
            vpt[4] += opt.e.clientX - lastPanX;
            vpt[5] += opt.e.clientY - lastPanY;
            lastPanX = opt.e.clientX;
            lastPanY = opt.e.clientY;
            state.fabricCanvas.requestRenderAll();
        }
    });
    state.fabricCanvas.on('mouse:up', () => {
        if (panning) {
            panning = false;
            state.fabricCanvas.setCursor('grab');
        }
    });

    // Canvas click: add objects based on active tool
    on('canvas-clicked', (opt) => {
        if (state.activeTool === 'text') {
            addTextBox(opt.e.offsetX, opt.e.offsetY);
            setActiveTool('select');
        } else if (state.activeTool === 'brace') {
            addBrace(opt.e.offsetX, opt.e.offsetY);
            setActiveTool('select');
        } else if (state.activeTool === 'ellipse') {
            addEllipse(opt.e.offsetX, opt.e.offsetY);
            setActiveTool('select');
        } else if (state.activeTool === 'rect') {
            addRect(opt.e.offsetX, opt.e.offsetY);
            setActiveTool('select');
        } else if (state.activeTool === 'line') {
            addLine(opt.e.offsetX, opt.e.offsetY);
            setActiveTool('select');
        } else if (state.activeTool === 'arrow') {
            addArrow(opt.e.offsetX, opt.e.offsetY);
            setActiveTool('select');
        }
    });

    // Drag-to-draw
    on('shape-drawn', (rect) => {
        if (state.activeTool === 'brace') {
            addBrace(0, 0, rect);
            setActiveTool('select');
        } else if (state.activeTool === 'ellipse') {
            addEllipse(0, 0, rect);
            setActiveTool('select');
        } else if (state.activeTool === 'rect') {
            addRect(0, 0, rect);
            setActiveTool('select');
        } else if (state.activeTool === 'line') {
            addLine(0, 0, rect);
            setActiveTool('select');
        } else if (state.activeTool === 'arrow') {
            addArrow(0, 0, rect);
            setActiveTool('select');
        }
    });

    // Selection changed: update properties panel
    on('selection-changed', (obj) => {
        if (!obj) {
            resetShapeProps();
            document.getElementById('properties-content').style.display = '';
            document.getElementById('text-props').style.display = 'none';
            document.getElementById('shape-props').style.display = 'none';
            document.getElementById('delete-section').style.display = 'none';
            return;
        }
        updateTextProps(obj);
        updateShapeProps(obj);
    });

    // Image scaled → update stored scale and reapply borders
    on('object-modified', (obj) => {
        if (obj === state.image) {
            state.image._origScaleX = obj.scaleX;
            state.image._origScaleY = obj.scaleY;
            updateCanvasInfo();
            emit('image-loaded', obj);
        }
    });

    // Collapsible panels
    document.querySelectorAll('.section-header.collapsible').forEach(title => {
        title.addEventListener('click', () => {
            const targetId = title.dataset.target;
            const content = document.getElementById(targetId);
            if (content) {
                content.classList.toggle('collapsed');
                title.classList.toggle('collapsed');
            }
        });
    });

    // Initial active tool
    setActiveTool('select');
}

function setActiveTool(tool) {
    const prevTool = state.activeTool;
    state.activeTool = tool;

    // Update button states
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });

    // Handle crop mode toggle
    if (prevTool === 'crop' && tool !== 'crop') {
        exitCropMode();
    }
    if (tool === 'crop' && state.image) {
        enterCropMode();
    }

    // Set canvas selection mode
    const fc = state.fabricCanvas;
    if (tool === 'select') {
        fc.selection = true;
        fc.getObjects().forEach(o => {
            if (o.isBorder || o === state.image) return;
            o.selectable = true;
            o.evented = true;
        });
    } else {
        fc.selection = false;
        fc.discardActiveObject();
        fc.renderAll();
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
