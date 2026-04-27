// canvas-manager.js — Fabric.js canvas setup, state management, history

const MAX_HISTORY = 50;

export const state = {
    canvas: null,
    fabricCanvas: null,
    image: null,
    activeTool: 'select',
    snapEnabled: true,
    borders: { top: 0, right: 0, bottom: 0, left: 0, color: '#ffffff' },
    adjustments: {
        brightness: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, rotation: 0
    },
    history: [],
    historyIndex: -1,
    suppressEvents: false,
    spaceHeld: false
};

const listeners = {};

export function on(event, fn) {
    (listeners[event] ??= []).push(fn);
}

export function emit(event, data) {
    (listeners[event] || []).forEach(fn => fn(data));
}

export function initCanvas() {
    const el = document.getElementById('main-canvas');
    const container = document.getElementById('canvas-container');
    const w = container.clientWidth - 20;
    const h = container.clientHeight - 20;

    const fc = new fabric.Canvas(el, {
        width: Math.max(w, 400),
        height: Math.max(h, 300),
        preserveObjectStacking: true,
        selection: true,
        stopContextMenu: true,
        fireRightClick: false
    });

    state.fabricCanvas = fc;

    fc.on('selection:created', onSelection);
    fc.on('selection:updated', onSelection);
    fc.on('selection:cleared', onSelection);
    fc.on('object:modified', onObjectModified);
    fc.on('object:moving', onObjectMoving);
    fc.on('object:rotating', onObjectRotating);
    fc.on('mouse:down', onMouseDown);
    fc.on('mouse:move', onMouseMove);
    fc.on('mouse:up', onMouseUp);

    // Resize handler
    window.addEventListener('resize', () => {
        const nw = container.clientWidth - 20;
        const nh = container.clientHeight - 20;
        fc.setWidth(Math.max(nw, 400));
        fc.setHeight(Math.max(nh, 300));
        fc.renderAll();
    });

    return fc;
}

function onSelection() {
    const sel = state.fabricCanvas.getActiveObject();
    emit('selection-changed', sel);
}

function onObjectModified(opt) {
    if (state.suppressEvents) return;
    clearGuideLines();
    saveHistory();
    emit('object-modified', opt.target);
}

function onObjectMoving(opt) {
    if (!opt.target || !opt.target.selectable) return;
    snapAlign(opt.target);
}

let guideLines = [];

function clearGuideLines() {
    guideLines.forEach(l => state.fabricCanvas.remove(l));
    guideLines = [];
}

function onObjectRotating(opt) {
    const obj = opt.target;
    if (!obj || obj.isBorder || obj === state.image) return;
    const snapAngles = [0, 90, 180, 270, 360];
    const threshold = 5;
    let angle = obj.angle % 360;
    if (angle < 0) angle += 360;
    for (const sa of snapAngles) {
        if (Math.abs(angle - sa) <= threshold) {
            obj.set('angle', sa);
            break;
        }
    }
}

// Drag-to-draw state
let drawStart = null;
let drawPreview = null;

function onMouseDown(opt) {
    // Don't start drag-to-draw while panning (space held)
    if (state.spaceHeld) return;

    // Shape tools: start drag-to-draw on empty canvas
    const shapeTools = ['line', 'brace', 'ellipse', 'rect', 'arrow', 'text'];
    if (!opt.target && shapeTools.includes(state.activeTool) && state.image) {
        const pointer = state.fabricCanvas.getPointer(opt.e);
        drawStart = { x: pointer.x, y: pointer.y };
        drawPreview = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'rgba(255,107,53,0.1)',
            stroke: '#ff6b35',
            strokeWidth: 1,
            strokeDashArray: [4, 3],
            selectable: false,
            evented: false
        });
        state.fabricCanvas.add(drawPreview);
        return;
    }
    if (!opt.target && state.activeTool !== 'crop') {
        emit('canvas-clicked', opt);
    }
}

function onMouseMove(opt) {
    if (!drawStart || !drawPreview) return;
    const pointer = state.fabricCanvas.getPointer(opt.e);
    const x1 = drawStart.x;
    const y1 = drawStart.y;
    const x2 = pointer.x;
    const y2 = pointer.y;
    drawPreview.set({
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1)
    });
    state.fabricCanvas.renderAll();
}

function onMouseUp(opt) {
    if (!drawStart || !drawPreview) return;
    const rect = { left: drawPreview.left, top: drawPreview.top, width: drawPreview.width, height: drawPreview.height };
    state.fabricCanvas.remove(drawPreview);
    drawPreview = null;
    const start = drawStart;
    drawStart = null;

    // Only create if the drag was meaningful (at least 5px)
    if (rect.width < 5 && rect.height < 5) {
        // Treat as a click at start position
        emit('canvas-clicked', { e: { offsetX: start.x, offsetY: start.y } });
        return;
    }

    emit('shape-drawn', rect);
}

// Snap alignment: snap objects to edges/centerlines of nearby objects
function snapAlign(obj) {
    clearGuideLines();
    if (!state.snapEnabled) return;
    const threshold = 8;
    const all = state.fabricCanvas.getObjects();
    const snapX = [];
    const snapY = [];

    // Collect edges and centerlines of OTHER objects only
    for (const other of all) {
        if (other === obj) continue;
        if (other.isBorder) continue;
        // Left, center-X, right edges
        snapX.push({ val: other.left, type: 'left', obj: other });
        snapX.push({ val: other.left + other.width * other.scaleX / 2, type: 'cx', obj: other });
        snapX.push({ val: other.left + other.width * other.scaleX, type: 'right', obj: other });
        // Top, center-Y, bottom edges
        snapY.push({ val: other.top, type: 'top', obj: other });
        snapY.push({ val: other.top + other.height * other.scaleY / 2, type: 'cy', obj: other });
        snapY.push({ val: other.top + other.height * other.scaleY, type: 'bottom', obj: other });
    }

    if (snapX.length === 0 && snapY.length === 0) return;

    // X-axis edges of the moving object
    const xEdges = [
        { val: obj.left, set: (v) => obj.set('left', v), type: 'left' },
        { val: obj.left + obj.width * obj.scaleX / 2, set: (v) => obj.set('left', v - obj.width * obj.scaleX / 2), type: 'cx' },
        { val: obj.left + obj.width * obj.scaleX, set: (v) => obj.set('left', v - obj.width * obj.scaleX), type: 'right' }
    ];

    // Y-axis edges of the moving object
    const yEdges = [
        { val: obj.top, set: (v) => obj.set('top', v), type: 'top' },
        { val: obj.top + obj.height * obj.scaleY / 2, set: (v) => obj.set('top', v - obj.height * obj.scaleY / 2), type: 'cy' },
        { val: obj.top + obj.height * obj.scaleY, set: (v) => obj.set('top', v - obj.height * obj.scaleY), type: 'bottom' }
    ];

    // Snap X edges to X snap points
    let snappedX = null;
    for (const e of xEdges) {
        let closest = null;
        let minDist = threshold;
        for (const s of snapX) {
            const d = Math.abs(e.val - s.val);
            if (d < minDist) { minDist = d; closest = s; }
        }
        if (closest !== null) {
            e.set(closest.val);
            obj.setCoords();
            snappedX = closest.val;
        }
    }

    // Snap Y edges to Y snap points
    let snappedY = null;
    for (const e of yEdges) {
        let closest = null;
        let minDist = threshold;
        for (const s of snapY) {
            const d = Math.abs(e.val - s.val);
            if (d < minDist) { minDist = d; closest = s; }
        }
        if (closest !== null) {
            e.set(closest.val);
            obj.setCoords();
            snappedY = closest;
        }
    }

    // Draw guide lines at snap positions
    const fc = state.fabricCanvas;
    const canvasW = fc.width;
    const canvasH = fc.height;
    if (snappedX !== null) {
        const guide = new fabric.Line([snappedX, 0, snappedX, canvasH], {
            stroke: '#ff6b35',
            strokeWidth: 1,
            strokeDashArray: [4, 4],
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        fc.add(guide);
        guide.sendToBack();
        guideLines.push(guide);
    }
    if (snappedY !== null) {
        const guide = new fabric.Line([0, snappedY, canvasW, snappedY], {
            stroke: '#ff6b35',
            strokeWidth: 1,
            strokeDashArray: [4, 4],
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        fc.add(guide);
        guide.sendToBack();
        guideLines.push(guide);
    }
}

// --- History (undo/redo) ---
export function saveHistory() {
    if (state.suppressEvents) return;
    const json = state.fabricCanvas.toJSON(['id', 'isBorder', 'borderSide', 'shapeType', '_isLineLike']);
    // Trim future if we're in the middle of history
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(json);
    if (state.history.length > MAX_HISTORY) state.history.shift();
    state.historyIndex = state.history.length - 1;
}

export function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex--;
    loadHistory(state.history[state.historyIndex]);
}

export function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex++;
    loadHistory(state.history[state.historyIndex]);
}

function loadHistory(json) {
    state.suppressEvents = true;
    state.fabricCanvas.loadFromJSON(json, function() {
        state.fabricCanvas.renderAll();
        state.suppressEvents = false;
        emit('history-loaded');
    });
}

export function resetHistory() {
    state.history = [];
    state.historyIndex = -1;
    saveHistory();
}

// --- Canvas info ---
export function updateCanvasInfo() {
    const info = document.getElementById('canvas-info');
    if (state.image) {
        const w = Math.round(state.image.width * state.image.scaleX);
        const h = Math.round(state.image.height * state.image.scaleY);
        info.textContent = `图像: ${w}×${h}px`;
    } else {
        info.textContent = '未加载图像';
    }
}
