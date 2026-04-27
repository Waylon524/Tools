// image-tools.js — Upload, crop, rotate, brightness, exposure, contrast, highlights, shadows

import { state, on, saveHistory, resetHistory, updateCanvasInfo, emit } from './canvas-manager.js';

let debounceTimer = null;
function saveHistoryDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => saveHistory(), 300);
}

// --- Upload ---
export function setupUpload() {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('canvas-drop-zone');

    document.getElementById('btn-upload').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) loadImage(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            loadImage(file);
        }
    });
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
            const fc = state.fabricCanvas;
            const toRemove = fc.getObjects().filter(o => o.isBorder || o === state.image);
            toRemove.forEach(o => fc.remove(o));

            const maxW = fc.width * 0.9;
            const maxH = fc.height * 0.9;
            const scale = Math.min(maxW / img.width, maxH / img.height, 1);
            img.set({
                scaleX: scale,
                scaleY: scale,
                left: fc.width / 2,
                top: fc.height / 2,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                hasControls: false,
                cornerColor: '#ff6b35',
                cornerSize: 12,
                transparentCorners: false
            });

            // Store original HTMLImageElement and scale before any modification
            img._origImg = img.getElement();
            img._origScaleX = scale;
            img._origScaleY = scale;

            fc.add(img);
            fc.renderAll();

            state.image = img;
            state.adjustments = { brightness: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, rotation: 0 };
            resetAdjustSliders();
            resetHistory();
            resetZoomLevel();
            updateCanvasInfo();
            emit('image-loaded', img);

            document.getElementById('drop-message').classList.add('hidden');
        });
    };
    reader.readAsDataURL(file);
}

// --- Crop ---
let cropRect = null;

export function enterCropMode() {
    if (!state.image) return;
    exitCropMode();
    const fc = state.fabricCanvas;
    const img = state.image;

    cropRect = new fabric.Rect({
        left: img.left - (img.width * img.scaleX) / 4,
        top: img.top - (img.height * img.scaleY) / 4,
        width: img.width * img.scaleX * 0.5,
        height: img.height * img.scaleY * 0.5,
        fill: 'transparent',
        stroke: '#6c8cff',
        strokeWidth: 2,
        strokeDashArray: [6, 4],
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        cornerColor: '#6c8cff',
        cornerSize: 10,
        lockRotation: true,
        lockScalingFlip: true
    });
    fc.add(cropRect);
    fc.setActiveObject(cropRect);
    fc.renderAll();
    document.getElementById('crop-controls').style.display = 'flex';
}

export function exitCropMode() {
    if (cropRect) {
        state.fabricCanvas.remove(cropRect);
        cropRect = null;
        state.fabricCanvas.renderAll();
    }
    document.getElementById('crop-controls').style.display = 'none';
}

export function confirmCrop() {
    if (!cropRect || !state.image) return;
    const fc = state.fabricCanvas;
    const img = state.image;
    const scaleX = img.scaleX;
    const scaleY = img.scaleY;

    const cropLeft = (cropRect.left - img.left + img.width * scaleX / 2) / scaleX;
    const cropTop = (cropRect.top - img.top + img.height * scaleY / 2) / scaleY;
    const cropWidth = cropRect.width * cropRect.scaleX / scaleX;
    const cropHeight = cropRect.height * cropRect.scaleY / scaleY;

    const cx = Math.max(0, Math.round(cropLeft));
    const cy = Math.max(0, Math.round(cropTop));
    const cw = Math.min(img.width - cx, Math.round(cropWidth));
    const ch = Math.min(img.height - cy, Math.round(cropHeight));

    if (cw <= 0 || ch <= 0) {
        exitCropMode();
        return;
    }

    const oc = document.createElement('canvas');
    oc.width = cw;
    oc.height = ch;
    const octx = oc.getContext('2d');
    octx.drawImage(img.getElement(), cx, cy, cw, ch, 0, 0, cw, ch);

    fabric.Image.fromURL(oc.toDataURL(), (newImg) => {
        newImg.set({
            left: img.left,
            top: img.top,
            scaleX: scaleX,
            scaleY: scaleY,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            hasControls: false,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingFlip: true,
            lockUniScaling: true,
            cornerColor: '#ff6b35',
            cornerSize: 12,
            transparentCorners: false
        });

        // Store new original for future filter processing
        newImg._origImg = newImg.getElement();
        newImg._origScaleX = scaleX;
        newImg._origScaleY = scaleY;

        fc.remove(img);
        fc.remove(cropRect);
        cropRect = null;
        fc.add(newImg);
        state.image = newImg;
        fc.renderAll();
        saveHistory();
        resetZoomLevel();
        updateCanvasInfo();
        emit('image-loaded', newImg);
        document.getElementById('crop-controls').style.display = 'none';

        // Reapply adjustments if any are active
        const hasAdj = Object.values(state.adjustments).some(v => v !== 0);
        if (hasAdj) applyAdjustments(true);
    });
}

// --- Unified image processing pipeline ---
// Applies adjustments + rotation + white-corner baking to the original image
function processImage(skipDebounce) {
    if (!state.image) return;
    const img = state.image;
    const adj = state.adjustments;
    const orig = img._origImg;
    if (!orig) return;

    const origW = orig.naturalWidth || orig.width;
    const origH = orig.naturalHeight || orig.height;

    // Step 1: Apply pixel adjustments to a copy of the original
    const workCanvas = document.createElement('canvas');
    workCanvas.width = origW;
    workCanvas.height = origH;
    const workCtx = workCanvas.getContext('2d');
    workCtx.drawImage(orig, 0, 0);

    const hasAdjustment = adj.brightness !== 0 || adj.exposure !== 0 ||
        adj.contrast !== 0 || adj.highlights !== 0 || adj.shadows !== 0;

    if (hasAdjustment) {
        const imageData = workCtx.getImageData(0, 0, origW, origH);
        const data = imageData.data;

        const brightness = adj.brightness / 100;
        const contrast = 1 + adj.contrast / 100;
        const exposure = adj.exposure / 100;
        const highlights = adj.highlights / 100;
        const shadows = adj.shadows / 100;

        for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            if (exposure !== 0) {
                const ef = Math.pow(2, exposure);
                r *= ef; g *= ef; b *= ef;
            }
            if (contrast !== 1) {
                r = (r - 128) * contrast + 128;
                g = (g - 128) * contrast + 128;
                b = (b - 128) * contrast + 128;
            }
            if (brightness !== 0) {
                r += brightness * 128;
                g += brightness * 128;
                b += brightness * 128;
            }
            if (highlights !== 0 || shadows !== 0) {
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                if (lum > 128 && highlights !== 0) {
                    const f = 1 + highlights * (lum - 128) / 127;
                    r *= f; g *= f; b *= f;
                }
                if (lum < 128 && shadows !== 0) {
                    const f = 1 + shadows * (128 - lum) / 128;
                    r *= f; g *= f; b *= f;
                }
            }
            data[i]     = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
        workCtx.putImageData(imageData, 0, 0);
    }

    // Step 2: If rotated, bake onto white background with bounding box
    const rotation = adj.rotation || 0;
    let finalCanvas = workCanvas;

    if (rotation !== 0) {
        const rad = Math.abs(rotation * Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const bbW = Math.ceil(origW * cos + origH * sin);
        const bbH = Math.ceil(origW * sin + origH * cos);

        finalCanvas = document.createElement('canvas');
        finalCanvas.width = bbW;
        finalCanvas.height = bbH;
        const fcCtx = finalCanvas.getContext('2d');

        // White fill
        fcCtx.fillStyle = '#ffffff';
        fcCtx.fillRect(0, 0, bbW, bbH);

        // Draw rotated image centered
        fcCtx.save();
        fcCtx.translate(bbW / 2, bbH / 2);
        fcCtx.rotate(rotation * Math.PI / 180);
        fcCtx.drawImage(workCanvas, -origW / 2, -origH / 2);
        fcCtx.restore();
    }

    // Step 3: Update the Fabric image
    img.setElement(finalCanvas);

    // Adjust scale based on original scale so the image maintains similar
    // apparent size after rotation baking
    const zl = state.zoomLevel || 1;
    if (rotation !== 0) {
        const rad = Math.abs(rotation * Math.PI / 180);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const bbW = Math.ceil(origW * cos + origH * sin);
        const bbH = Math.ceil(origW * sin + origH * cos);
        const baseScaleX = img._origScaleX || img.scaleX;
        const baseScaleY = img._origScaleY || img.scaleY;
        const baseScale = (baseScaleX + baseScaleY) / 2;
        const ratio = Math.sqrt((origW * origH) / (bbW * bbH));
        img.set({
            scaleX: baseScale * ratio * zl,
            scaleY: baseScale * ratio * zl
        });
    } else {
        // Restore original scale when no rotation, preserving zoom
        if (img._origScaleX) img.set('scaleX', img._origScaleX * zl);
        if (img._origScaleY) img.set('scaleY', img._origScaleY * zl);
    }

    state.fabricCanvas.renderAll();

    if (skipDebounce) {
        saveHistory();
    } else {
        saveHistoryDebounced();
    }

    emit('image-loaded', state.image);
}

// Public entry points (called by slider handlers)
export function applyRotation(degrees) {
    if (!state.image) return;
    state.adjustments.rotation = degrees;
    processImage();
}

export function applyAdjustments(skipDebounce) {
    if (!state.image) return;
    processImage(skipDebounce);
}

// --- Zoom ---
state.zoomLevel = state.zoomLevel || 1;

export function setupZoomControls() {
    const fc = state.fabricCanvas;
    const zoomCtrl = document.getElementById('zoom-control');
    const zoomLevelEl = document.getElementById('zoom-level');

    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        applyZoom(1.15);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        applyZoom(1 / 1.15);
    });

    function applyZoom(factor) {
        if (!state.image) return;
        const newZoom = Math.max(0.1, Math.min(5, state.zoomLevel * factor));
        const ratio = newZoom / state.zoomLevel;
        const img = state.image;
        const cx = img.left;
        const cy = img.top;

        // Scale image
        img.set({
            scaleX: img.scaleX * ratio,
            scaleY: img.scaleY * ratio
        });

        // Scale all annotations to maintain relative positions and sizes
        state.fabricCanvas.getObjects().forEach(obj => {
            if (obj === img || obj.isBorder) return;
            const dx = obj.left - cx;
            const dy = obj.top - cy;
            const isText = obj.type === 'i-text';
            obj.set({
                left: cx + dx * ratio,
                top: cy + dy * ratio,
                // For text, only fontSize carries the zoom; scaleX/scaleY
                // must stay at 1 to avoid ratio² compound scaling.
                scaleX: isText ? (obj.scaleX || 1) : (obj.scaleX || 1) * ratio,
                scaleY: isText ? (obj.scaleY || 1) : (obj.scaleY || 1) * ratio
            });
            if (isText && obj.fontSize) {
                obj.set('fontSize', obj.fontSize * ratio);
            }
        });

        state.zoomLevel = newZoom;
        state.fabricCanvas.renderAll();
        zoomLevelEl.textContent = Math.round(state.zoomLevel * 100) + '%';
        emit('image-loaded', state.image);
    }

    // Show zoom control when image is loaded
    on('image-loaded', () => {
        zoomCtrl.style.display = '';
    });
}

export function resetZoomLevel() {
    state.zoomLevel = 1;
    const el = document.getElementById('zoom-level');
    if (el) el.textContent = '100%';
}

export function getZoomLevel() {
    return state.zoomLevel || 1;
}

function resetAdjustSliders() {
    ['brightness', 'exposure', 'contrast', 'highlights', 'shadows', 'rotation'].forEach(key => {
        const slider = document.getElementById(`slider-${key}`);
        if (slider) slider.value = 0;
    });
    document.getElementById('val-brightness').textContent = '0';
    document.getElementById('val-exposure').textContent = '0';
    document.getElementById('val-contrast').textContent = '0';
    document.getElementById('val-highlights').textContent = '0';
    document.getElementById('val-shadows').textContent = '0';
    document.getElementById('val-rotation').textContent = '0°';
}

export function setupAdjustControls() {
    const adjustmentDefs = [
        { id: 'brightness' },
        { id: 'exposure' },
        { id: 'contrast' },
        { id: 'highlights' },
        { id: 'shadows' },
    ];

    adjustmentDefs.forEach(({ id }) => {
        const slider = document.getElementById(`slider-${id}`);
        const valEl = document.getElementById(`val-${id}`);
        slider.addEventListener('input', () => {
            state.adjustments[id] = parseInt(slider.value);
            valEl.textContent = slider.value;
            applyAdjustments();
        });
    });

    // Rotation slider
    const rotSlider = document.getElementById('slider-rotation');
    const rotVal = document.getElementById('val-rotation');
    rotSlider.addEventListener('input', () => {
        const val = parseInt(rotSlider.value);
        rotVal.textContent = val + '°';
        applyRotation(val);
    });

    // Reset button
    document.getElementById('btn-reset-adjust').addEventListener('click', () => {
        state.adjustments = { brightness: 0, exposure: 0, contrast: 0, highlights: 0, shadows: 0, rotation: 0 };
        resetAdjustSliders();
        if (state.image) {
            // Restore original element and scale
            state.image.setElement(state.image._origImg);
            if (state.image._origScaleX) state.image.set('scaleX', state.image._origScaleX);
            if (state.image._origScaleY) state.image.set('scaleY', state.image._origScaleY);
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });

    // Crop buttons
    document.getElementById('btn-crop-confirm').addEventListener('click', confirmCrop);
    document.getElementById('btn-crop-cancel').addEventListener('click', exitCropMode);
}
