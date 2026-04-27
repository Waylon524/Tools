// border-tools.js — Per-side border width controls

import { state, saveHistory, on } from './canvas-manager.js';

const borderObjects = { top: null, right: null, bottom: null, left: null };

export function setupBorderControls() {
    document.getElementById('slider-border-top').addEventListener('input', (e) => {
        state.borders.top = parseInt(e.target.value) || 0;
        document.getElementById('val-border-top').textContent = state.borders.top + 'px';
        applyBorders();
    });
    document.getElementById('slider-border-right').addEventListener('input', (e) => {
        state.borders.right = parseInt(e.target.value) || 0;
        document.getElementById('val-border-right').textContent = state.borders.right + 'px';
        applyBorders();
    });
    document.getElementById('slider-border-bottom').addEventListener('input', (e) => {
        state.borders.bottom = parseInt(e.target.value) || 0;
        document.getElementById('val-border-bottom').textContent = state.borders.bottom + 'px';
        applyBorders();
    });
    document.getElementById('slider-border-left').addEventListener('input', (e) => {
        state.borders.left = parseInt(e.target.value) || 0;
        document.getElementById('val-border-left').textContent = state.borders.left + 'px';
        applyBorders();
    });

    // Border color
    document.getElementById('border-color').addEventListener('input', (e) => {
        state.borders.color = e.target.value;
        applyBorders();
    });

    // Listen for image load to reapply borders
    on('image-loaded', () => applyBorders());
}

export function applyBorders() {
    const fc = state.fabricCanvas;
    const img = state.image;
    if (!img) return;

    // Remove existing border objects
    Object.values(borderObjects).forEach(o => { if (o) fc.remove(o); });
    Object.keys(borderObjects).forEach(k => { borderObjects[k] = null; });

    const b = state.borders;
    const color = b.color;
    const imgLeft = img.left - (img.width * img.scaleX) / 2;
    const imgTop = img.top - (img.height * img.scaleY) / 2;
    const imgW = img.width * img.scaleX;
    const imgH = img.height * img.scaleY;

    // Top border
    if (b.top > 0) {
        const rect = new fabric.Rect({
            left: imgLeft - b.left,
            top: imgTop - b.top,
            width: imgW + b.left + b.right,
            height: b.top,
            fill: color,
            selectable: false,
            evented: false,
            isBorder: true,
            borderSide: 'top'
        });
        borderObjects.top = rect;
        fc.add(rect);
        rect.sendToBack();
    }

    // Bottom border
    if (b.bottom > 0) {
        const rect = new fabric.Rect({
            left: imgLeft - b.left,
            top: imgTop + imgH,
            width: imgW + b.left + b.right,
            height: b.bottom,
            fill: color,
            selectable: false,
            evented: false,
            isBorder: true,
            borderSide: 'bottom'
        });
        borderObjects.bottom = rect;
        fc.add(rect);
        rect.sendToBack();
    }

    // Left border
    if (b.left > 0) {
        const rect = new fabric.Rect({
            left: imgLeft - b.left,
            top: imgTop - b.top,
            width: b.left,
            height: imgH + b.top + b.bottom,
            fill: color,
            selectable: false,
            evented: false,
            isBorder: true,
            borderSide: 'left'
        });
        borderObjects.left = rect;
        fc.add(rect);
        rect.sendToBack();
    }

    // Right border
    if (b.right > 0) {
        const rect = new fabric.Rect({
            left: imgLeft + imgW,
            top: imgTop - b.top,
            width: b.right,
            height: imgH + b.top + b.bottom,
            fill: color,
            selectable: false,
            evented: false,
            isBorder: true,
            borderSide: 'right'
        });
        borderObjects.right = rect;
        fc.add(rect);
        rect.sendToBack();
    }

    // Ensure borders stay behind image; image stays behind annotations
    if (state.image) {
        state.image.sendToBack();
        Object.values(borderObjects).forEach(o => { if (o) o.sendToBack(); });
    }

    fc.renderAll();
    saveHistory();
}
