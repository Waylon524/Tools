// export.js — High-resolution export with scale multiplier

import { state } from './canvas-manager.js';

export function setupExport() {
    document.getElementById('btn-export').addEventListener('click', openExportDialog);
    document.getElementById('btn-export-confirm').addEventListener('click', doExport);
    document.getElementById('btn-export-cancel').addEventListener('click', closeExportDialog);

    // Scale slider
    const scaleSlider = document.getElementById('export-scale');
    const scaleVal = document.getElementById('val-scale');
    scaleSlider.addEventListener('input', () => {
        scaleVal.textContent = scaleSlider.value + 'x';
        updateExportDimensions();
    });

    // Format change
    document.getElementById('export-format').addEventListener('change', (e) => {
        const isJpeg = e.target.value === 'jpeg';
        document.getElementById('jpeg-quality-group').style.display = isJpeg ? '' : 'none';
        updateExportDimensions();
    });

    // Quality slider
    document.getElementById('export-quality').addEventListener('input', (e) => {
        document.getElementById('val-quality').textContent = e.target.value;
    });
}

function openExportDialog() {
    if (!state.image) {
        alert('请先上传图像');
        return;
    }
    document.getElementById('export-dialog').style.display = 'flex';
    updateExportDimensions();
}

function closeExportDialog() {
    document.getElementById('export-dialog').style.display = 'none';
}

function updateExportDimensions() {
    if (!state.image) return;
    const scale = parseInt(document.getElementById('export-scale').value);
    const img = state.image;
    const b = state.borders;

    const w = Math.round(img.width * img.scaleX + b.left + b.right);
    const h = Math.round(img.height * img.scaleY + b.top + b.bottom);
    document.getElementById('export-dimensions').textContent = `${w * scale} × ${h * scale} px`;
}

function doExport() {
    if (!state.image) return;

    const scale = parseInt(document.getElementById('export-scale').value);
    const format = document.getElementById('export-format').value;
    const quality = parseInt(document.getElementById('export-quality').value) / 100;

    const fc = state.fabricCanvas;
    const img = state.image;
    const b = state.borders;

    // Calculate the bounding box including borders
    const imgLeft = img.left - (img.width * img.scaleX) / 2 - b.left;
    const imgTop = img.top - (img.height * img.scaleY) / 2 - b.top;
    const totalW = Math.round(img.width * img.scaleX + b.left + b.right);
    const totalH = Math.round(img.height * img.scaleY + b.top + b.bottom);

    const exportW = totalW * scale;
    const exportH = totalH * scale;

    // Create offscreen canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = exportW;
    offscreen.height = exportH;
    const ctx = offscreen.getContext('2d');

    // Scale context for high resolution
    ctx.scale(scale, scale);

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, totalW, totalH);

    // Draw borders
    if (b.top > 0 || b.right > 0 || b.bottom > 0 || b.left > 0) {
        ctx.fillStyle = b.color;
        if (b.top > 0) ctx.fillRect(0, 0, totalW, b.top);
        if (b.bottom > 0) ctx.fillRect(0, totalH - b.bottom, totalW, b.bottom);
        if (b.left > 0) ctx.fillRect(0, 0, b.left, totalH);
        if (b.right > 0) ctx.fillRect(totalW - b.right, 0, b.right, totalH);
    }

    // Draw the image
    const imgEl = img.getElement();
    ctx.drawImage(
        imgEl,
        b.left, b.top,
        img.width * img.scaleX,
        img.height * img.scaleY
    );

    // Draw annotations (text and shapes) from Fabric.js
    // We need to render fabric objects onto the offscreen canvas
    const annotations = fc.getObjects().filter(o => o !== img && !o.isBorder);
    if (annotations.length > 0) {
        // For each annotation, adjust position relative to the export area
        annotations.forEach(obj => {
            ctx.save();
            // Translate object position to export coordinates
            const ox = obj.left - imgLeft;
            const oy = obj.top - imgTop;
            ctx.translate(ox, oy);

            if (obj.angle) {
                ctx.rotate((obj.angle * Math.PI) / 180);
            }

            renderFabricObject(ctx, obj);
            ctx.restore();
        });
    }

    // Trigger download
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = offscreen.toDataURL(mimeType, format === 'jpeg' ? quality : undefined);

    const link = document.createElement('a');
    link.download = `annotated-image.${format}`;
    link.href = dataUrl;
    link.click();

    closeExportDialog();
}

function renderFabricObject(ctx, obj) {
    ctx.globalAlpha = obj._isLineLike ? 1 : (obj.opacity ?? 1);

    if (obj.type === 'group') {
        var children = obj.getObjects();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            ctx.save();
            ctx.translate(child.left, child.top);
            if (child.type === 'line') {
                ctx.strokeStyle = child.stroke || '#ff0000';
                ctx.lineWidth = child.strokeWidth || 2;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(child.x1 * (child.scaleX || 1), child.y1 * (child.scaleY || 1));
                ctx.lineTo(child.x2 * (child.scaleX || 1), child.y2 * (child.scaleY || 1));
                ctx.stroke();
            } else if (child.type === 'polygon') {
                var pts = child.points || [];
                if (pts.length > 0) {
                    ctx.fillStyle = child.fill || '#ff0000';
                    ctx.beginPath();
                    ctx.moveTo((pts[0].x - child.left) * (child.scaleX || 1), (pts[0].y - child.top) * (child.scaleY || 1));
                    for (var j = 1; j < pts.length; j++) {
                        ctx.lineTo((pts[j].x - child.left) * (child.scaleX || 1), (pts[j].y - child.top) * (child.scaleY || 1));
                    }
                    ctx.closePath();
                    ctx.fill();
                    if (child.stroke) {
                        ctx.strokeStyle = child.stroke;
                        ctx.lineWidth = child.strokeWidth || 1;
                        ctx.stroke();
                    }
                }
            }
            ctx.restore();
        }
    } else if (obj.type === 'i-text') {
        const baseFontSize = (obj.fontSize || 24) * (obj.scaleX || 1);
        const fontFamily = obj.fontFamily || 'Arial';
        const fontWeight = obj.fontWeight || 'normal';
        const fontStyle = obj.fontStyle || 'normal';
        ctx.textBaseline = 'top';
        ctx.fillStyle = obj.fill || '#000000';

        const text = obj.text || '';
        const styles = obj.styles || {};
        const lineHeight = (obj.lineHeight || 1.2) * baseFontSize;

        // Render character by character, handling per-char styles and line breaks
        let cx = 0;
        let cy = 0;
        let lineIdx = 0;
        let charIdx = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === '\n') {
                cx = 0;
                cy += lineHeight;
                lineIdx++;
                charIdx = 0;
                continue;
            }
            const lineStyles = styles[lineIdx] || {};
            const charStyle = lineStyles[charIdx] || {};
            const cFontSize = (charStyle.fontSize || baseFontSize);
            const deltaY = charStyle.deltaY || 0;
            ctx.font = `${fontStyle} ${fontWeight} ${cFontSize}px ${fontFamily}`;
            const metrics = ctx.measureText(char);
            ctx.fillText(char, cx, cy + deltaY);
            if (obj.underline) {
                ctx.fillRect(cx, cy + baseFontSize * 0.9, metrics.width, Math.max(1, baseFontSize * 0.06));
            }
            cx += metrics.width;
            charIdx++;
        }
    } else if (obj.type === 'line') {
        ctx.strokeStyle = obj.stroke || '#ff0000';
        ctx.lineWidth = obj.strokeWidth || 2;
        ctx.beginPath();
        // originX='left', originY='top' → x1,y1 already local offsets from left,top
        ctx.moveTo(obj.x1 * (obj.scaleX || 1), obj.y1 * (obj.scaleY || 1));
        ctx.lineTo(obj.x2 * (obj.scaleX || 1), obj.y2 * (obj.scaleY || 1));
        ctx.stroke();
    } else if (obj.type === 'ellipse') {
        ctx.strokeStyle = obj.stroke || '#ff0000';
        ctx.lineWidth = obj.strokeWidth || 2;
        ctx.fillStyle = obj.fill || 'transparent';
        ctx.beginPath();
        ctx.ellipse(0, 0, obj.rx * (obj.scaleX || 1), obj.ry * (obj.scaleY || 1), 0, 0, Math.PI * 2);
        if (obj.fill && obj.fill !== 'transparent') ctx.fill();
        ctx.stroke();
    } else if (obj.type === 'rect') {
        ctx.strokeStyle = obj.stroke || '#ff0000';
        ctx.lineWidth = obj.strokeWidth || 2;
        ctx.fillStyle = obj.fill || 'transparent';
        const w = obj.width * (obj.scaleX || 1);
        const h = obj.height * (obj.scaleY || 1);
        if (obj.fill && obj.fill !== 'transparent') ctx.fillRect(0, 0, w, h);
        ctx.strokeRect(0, 0, w, h);
    } else if (obj.type === 'polyline') {
        ctx.strokeStyle = obj.stroke || '#ff0000';
        ctx.lineWidth = obj.strokeWidth || 2;
        ctx.fillStyle = obj.fill || 'transparent';
        const pts = obj.points || [];
        if (pts.length > 0) {
            ctx.beginPath();
            ctx.moveTo((pts[0].x - obj.left) * (obj.scaleX || 1), (pts[0].y - obj.top) * (obj.scaleY || 1));
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo((pts[i].x - obj.left) * (obj.scaleX || 1), (pts[i].y - obj.top) * (obj.scaleY || 1));
            }
            ctx.stroke();
            if (obj.fill && obj.fill !== 'transparent') ctx.fill();
        }
    } else if (obj.type === 'path') {
        ctx.lineWidth = obj.strokeWidth || 2;
        // Fabric.Path stores path as array of [command, ...coords] arrays
        const path = obj.path;
        if (path && path.length > 0) {
            ctx.beginPath();
            for (const segment of path) {
                const cmd = segment[0];
                switch (cmd) {
                    case 'M':
                        ctx.moveTo(segment[1], segment[2]);
                        break;
                    case 'L':
                        ctx.lineTo(segment[1], segment[2]);
                        break;
                    case 'C':
                        ctx.bezierCurveTo(segment[1], segment[2], segment[3], segment[4], segment[5], segment[6]);
                        break;
                    case 'Q':
                        ctx.quadraticCurveTo(segment[1], segment[2], segment[3], segment[4]);
                        break;
                    case 'Z':
                        ctx.closePath();
                        break;
                }
            }
            ctx.fillStyle = obj.fill || 'transparent';
            if (obj.fill && obj.fill !== 'transparent') ctx.fill();
            const hasStroke = obj.stroke && obj.stroke !== 'transparent';
            if (hasStroke) {
                ctx.strokeStyle = obj.stroke;
                ctx.stroke();
            }
        }
    }

    ctx.globalAlpha = 1;
}
