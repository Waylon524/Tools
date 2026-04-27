// shape-tools.js — Curly brace, ellipse, rectangle with styling controls

import { state, saveHistory, on } from './canvas-manager.js';

function arrowShaft(obj) {
    if (obj.shapeType !== 'arrow' || obj.type !== 'group') return null;
    if (!obj._arrowShaft) {
        var children = obj.getObjects();
        obj._arrowShaft = children[0];
        obj._arrowHead = children[1];
    }
    return obj._arrowShaft;
}

function arrowHead(obj) {
    if (obj.shapeType !== 'arrow' || obj.type !== 'group') return null;
    if (!obj._arrowHead) {
        var children = obj.getObjects();
        obj._arrowShaft = children[0];
        obj._arrowHead = children[1];
    }
    return obj._arrowHead;
}

export function setupShapeTools() {
    // Re-link arrow group references after undo/redo
    on('history-loaded', function() {
        state.fabricCanvas.getObjects().forEach(function(o) {
            if (o.shapeType === 'arrow' && o.type === 'group') {
                var children = o.getObjects();
                o._arrowShaft = children[0];
                o._arrowHead = children[1];
            }
        });
    });

    // Stroke color
    document.getElementById('prop-stroke-color').addEventListener('input', function(e) {
        var obj = state.fabricCanvas.getActiveObject();
        if (obj) {
            var shaft = arrowShaft(obj);
            var head = arrowHead(obj);
            if (shaft && head) {
                shaft.set('stroke', e.target.value);
                head.set('fill', e.target.value);
                obj.set('stroke', e.target.value);
            } else {
                obj.set('stroke', e.target.value);
            }
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });
    // Stroke width
    var swSlider = document.getElementById('prop-stroke-width');
    var swVal = document.getElementById('val-stroke-width');
    swSlider.addEventListener('input', function() {
        swVal.textContent = swSlider.value;
        var obj = state.fabricCanvas.getActiveObject();
        if (obj) {
            var shaft = arrowShaft(obj);
            if (shaft) {
                shaft.set('strokeWidth', parseInt(swSlider.value));
                obj.set('strokeWidth', parseInt(swSlider.value));
            } else {
                obj.set('strokeWidth', parseInt(swSlider.value));
            }
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });
    // Fill toggle
    document.getElementById('prop-has-fill').addEventListener('change', function(e) {
        var checked = e.target.checked;
        document.getElementById('prop-fill-color').disabled = !checked;
        var obj = state.fabricCanvas.getActiveObject();
        if (obj) {
            obj.set('fill', checked ? document.getElementById('prop-fill-color').value : 'transparent');
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });
    // Fill color
    document.getElementById('prop-fill-color').addEventListener('input', function(e) {
        var obj = state.fabricCanvas.getActiveObject();
        if (obj) {
            obj.set('fill', e.target.value);
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });
    // Position sliders
    document.getElementById('prop-pos-x').addEventListener('input', function(e) {
        var obj = state.fabricCanvas.getActiveObject();
        if (obj) { obj.set('left', parseFloat(e.target.value)); obj.setCoords(); state.fabricCanvas.renderAll(); }
    });
    document.getElementById('prop-pos-y').addEventListener('input', function(e) {
        var obj = state.fabricCanvas.getActiveObject();
        if (obj) { obj.set('top', parseFloat(e.target.value)); obj.setCoords(); state.fabricCanvas.renderAll(); }
    });
}

// ---- Brace ----

export function addBrace(x, y, bounds) {
    if (!state.image) return;
    var fc = state.fabricCanvas;
    var left, top, w, h;
    if (bounds && bounds.width >= 10 && bounds.height >= 10) {
        left = bounds.left; top = bounds.top;
        h = bounds.height;
        w = h * 35 / 120;
    } else {
        left = x; top = y; w = 35; h = 120;
    }
    var mid = h / 2, ax = w * 8 / 35, crv = h * 8 / 120;
    var pathStr = [
        'M ' + w + ' 0',
        'Q ' + ax + ' 0, ' + ax + ' ' + crv,
        'L ' + ax + ' ' + (mid - crv),
        'L 0 ' + mid,
        'L ' + ax + ' ' + (mid + crv),
        'L ' + ax + ' ' + (h - crv),
        'Q ' + ax + ' ' + h + ', ' + w + ' ' + h
    ].join(' ');
    var brace = new fabric.Path(pathStr, {
        left: left, top: top,
        fill: 'transparent', stroke: '#ff0000', strokeWidth: 2,
        strokeUniform: true, selectable: true, evented: true,
        strokeLineJoin: 'miter', strokeLineCap: 'round',
        shapeType: 'brace'
    });
    fc.add(brace);
    fc.setActiveObject(brace);
    fc.renderAll();
    saveHistory();
}

// ---- Ellipse ----

export function addEllipse(x, y, bounds) {
    if (!state.image) return;
    var fc = state.fabricCanvas;
    var cx, cy, rx, ry;
    if (bounds && bounds.width >= 5 && bounds.height >= 5) {
        cx = bounds.left + bounds.width / 2;
        cy = bounds.top + bounds.height / 2;
        rx = bounds.width / 2; ry = bounds.height / 2;
    } else { cx = x; cy = y; rx = 60; ry = 40; }
    var ellipse = new fabric.Ellipse({
        left: cx, top: cy, rx: rx, ry: ry,
        fill: 'transparent', stroke: '#ff0000', strokeWidth: 2,
        strokeUniform: true, selectable: true, evented: true,
        originX: 'center', originY: 'center', shapeType: 'ellipse'
    });
    fc.add(ellipse);
    fc.setActiveObject(ellipse);
    fc.renderAll();
    saveHistory();
}

// ---- Rect ----

export function addRect(x, y, bounds) {
    if (!state.image) return;
    var fc = state.fabricCanvas;
    var left, top, w, h;
    if (bounds && bounds.width >= 5 && bounds.height >= 5) {
        left = bounds.left; top = bounds.top;
        w = bounds.width; h = bounds.height;
    } else { left = x; top = y; w = 120; h = 80; }
    var rect = new fabric.Rect({
        left: left, top: top, width: w, height: h,
        fill: 'transparent', stroke: '#ff0000', strokeWidth: 2,
        strokeUniform: true, selectable: true, evented: true,
        shapeType: 'rect'
    });
    fc.add(rect);
    fc.setActiveObject(rect);
    fc.renderAll();
    saveHistory();
}

// ---- Line ----

export function addLine(x, y, bounds) {
    if (!state.image) return;
    var fc = state.fabricCanvas;
    var x1, y1, x2, y2;
    if (bounds && (bounds.width >= 5 || bounds.height >= 5)) {
        x1 = bounds.left; y1 = bounds.top;
        x2 = bounds.left + bounds.width;
        y2 = bounds.top + bounds.height;
    } else {
        x1 = x; y1 = y;
        x2 = x + 100; y2 = y;
    }
    var cx = (x1 + x2) / 2;
    var cy = (y1 + y2) / 2;
    var line = new fabric.Line([x1 - cx, y1 - cy, x2 - cx, y2 - cy], {
        left: cx, top: cy,
        originX: 'center', originY: 'center',
        stroke: '#ff0000', strokeWidth: 2,
        selectable: true, evented: true,
        strokeUniform: true,
        strokeLineCap: 'round',
        shapeType: 'line',
        _isLineLike: true
    });
    fc.add(line);
    fc.setActiveObject(line);
    fc.renderAll();
    saveHistory();
}

// ---- Arrow ----

export function addArrow(x, y, bounds) {
    if (!state.image) return;
    var fc = state.fabricCanvas;
    var x1, y1, x2, y2;
    if (bounds && (bounds.width >= 5 || bounds.height >= 5)) {
        x1 = bounds.left; y1 = bounds.top;
        x2 = bounds.left + bounds.width;
        y2 = bounds.top + bounds.height;
    } else {
        x1 = x; y1 = y;
        x2 = x + 100; y2 = y;
    }
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len;
    var uy = dy / len;
    var arrowLen = 14;
    var wing = arrowLen * 0.4;
    var sx = x2 - ux * arrowLen;
    var sy = y2 - uy * arrowLen;
    var px = -uy * wing;
    var py =  ux * wing;

    // Rotation pivot = center of the arrow
    var cx = (x1 + x2) / 2;
    var cy = (y1 + y2) / 2;

    var shaft = new fabric.Line([x1, y1, sx, sy], {
        stroke: '#ff0000', strokeWidth: 2,
        strokeUniform: true,
        strokeLineCap: 'round'
    });
    var head = new fabric.Polygon([
        { x: sx + px, y: sy + py },
        { x: x2,      y: y2 },
        { x: sx - px, y: sy - py }
    ], {
        fill: '#ff0000',
        stroke: null
    });

    var arrow = new fabric.Group([shaft, head], {
        left: cx, top: cy,
        originX: 'center', originY: 'center',
        stroke: '#ff0000', strokeWidth: 2,
        selectable: true, evented: true,
        shapeType: 'arrow',
        _isLineLike: true,
        _arrowShaft: shaft,
        _arrowHead: head
    });

    fc.add(arrow);
    fc.setActiveObject(arrow);
    fc.renderAll();
    saveHistory();
}

// ---- Properties panel ----

export function updateShapeProps(obj) {
    var textPanel   = document.getElementById('text-props');
    var shapePanel  = document.getElementById('shape-props');
    var delSection  = document.getElementById('delete-section');
    var placeholder = document.getElementById('properties-content');
    var shapeTypes  = ['line', 'path', 'ellipse', 'rect', 'polyline', 'circle', 'triangle', 'group'];
    var isShape     = obj && shapeTypes.includes(obj.type) && !obj.isBorder;

    if (!isShape) return;

    textPanel.style.display   = 'none';
    shapePanel.style.display  = '';
    delSection.style.display  = '';
    placeholder.style.display = 'none';

    document.getElementById('prop-stroke-color').value = obj.stroke || '#ff0000';
    var sw = obj.strokeWidth || 2;
    document.getElementById('prop-stroke-width').value = sw;
    document.getElementById('val-stroke-width').textContent = sw;

    var isArrowGroup = obj.shapeType === 'arrow';
    var hasFill = isArrowGroup || (obj.fill && obj.fill !== 'transparent');
    document.getElementById('prop-has-fill').checked = hasFill;
    document.getElementById('prop-fill-color').disabled = !hasFill || isArrowGroup;
    if (hasFill) document.getElementById('prop-fill-color').value = isArrowGroup ? (obj.stroke || '#ff0000') : obj.fill;

    document.getElementById('prop-pos-x').value = Math.round(obj.left || 0);
    document.getElementById('val-pos-x').textContent = Math.round(obj.left || 0);
    document.getElementById('prop-pos-y').value = Math.round(obj.top || 0);
    document.getElementById('val-pos-y').textContent = Math.round(obj.top || 0);
}

export function resetShapeProps() {
    document.getElementById('text-props').style.display    = 'none';
    document.getElementById('shape-props').style.display   = 'none';
    document.getElementById('delete-section').style.display = 'none';
    document.getElementById('properties-content').style.display = '';
}
