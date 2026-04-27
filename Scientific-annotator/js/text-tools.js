// text-tools.js — Text box creation, formatting, superscript/subscript typing mode

import { state, saveHistory } from './canvas-manager.js';

let textMode = 'normal'; // 'normal' | 'super' | 'sub'
let editingTarget = null;
let prevText = '';
let lastSelectedText = null;

function setMode(mode) {
    textMode = mode;
    document.getElementById('btn-superscript').classList.toggle('active', mode === 'super');
    document.getElementById('btn-subscript').classList.toggle('active', mode === 'sub');
}

function applySuperSubStyle(target, start, end, mode) {
    const fs = target.fontSize || 24;
    if (mode === 'super') {
        target.setSelectionStyles({
            deltaY: -Math.round(fs * 0.4),
            fontSize: Math.round(fs * 0.6)
        }, start, end);
    } else if (mode === 'sub') {
        target.setSelectionStyles({
            deltaY: Math.round(fs * 0.3),
            fontSize: Math.round(fs * 0.6)
        }, start, end);
    } else {
        target.setSelectionStyles({ deltaY: 0, fontSize: fs }, start, end);
    }
}

function onEditingExited() {
    editingTarget = null;
    prevText = '';
    setMode('normal');
}

function onTextChanged(opt) {
    var target = opt.target;
    if (!editingTarget || editingTarget !== target) return;

    var newText = target.text || '';
    if (newText !== prevText) {
        // Find the start of the changed region
        var start = 0;
        while (start < prevText.length && start < newText.length && prevText[start] === newText[start]) start++;
        // Find the end of the changed region
        var oldEnd = prevText.length;
        var newEnd = newText.length;
        while (oldEnd > start && newEnd > start && prevText[oldEnd - 1] === newText[newEnd - 1]) {
            oldEnd--;
            newEnd--;
        }
        // Apply current mode style to the new content in [start, newEnd)
        // Always apply (even in normal mode) to override inherited styles from
        // adjacent super/sub characters
        if (newEnd > start) {
            applySuperSubStyle(target, start, newEnd, textMode);
        }
    }
    prevText = newText;

    // Sync textarea (both value and cursor position)
    var ta = document.getElementById('prop-text-content');
    if (ta && document.activeElement !== ta) {
        ta.value = target.text || '';
        // Mirror IText selection to textarea
        try {
            ta.setSelectionRange(target.selectionStart, target.selectionEnd);
        } catch (e) { /* ignore if textarea doesn't support setSelectionRange */ }
    }
}

function onEditingEntered(opt) {
    editingTarget = opt.target;
    prevText = editingTarget.text || '';
    // Sync textarea and cursor when editing starts
    var ta = document.getElementById('prop-text-content');
    if (ta) {
        ta.value = editingTarget.text || '';
        try {
            ta.setSelectionRange(editingTarget.selectionStart, editingTarget.selectionEnd);
        } catch (e) { /* ignore */ }
    }
}

export function setupTextTools() {
    // Style toggle buttons — use mousedown + preventDefault so the canvas
    // doesn't lose selection before the handler runs
    document.getElementById('btn-bold').addEventListener('click', toggleBold);
    document.getElementById('btn-italic').addEventListener('click', toggleItalic);
    document.getElementById('btn-underline').addEventListener('click', toggleUnderline);

    var supBtn = document.getElementById('btn-superscript');
    var subBtn = document.getElementById('btn-subscript');
    supBtn.addEventListener('mousedown', function(e) { e.preventDefault(); });
    subBtn.addEventListener('mousedown', function(e) { e.preventDefault(); });
    supBtn.addEventListener('click', toggleSuperscriptMode);
    subBtn.addEventListener('click', toggleSubscriptMode);

    // Textarea for syncing plain text content
    var textContent = document.getElementById('prop-text-content');
    if (textContent) {
        textContent.addEventListener('input', function() {
            var obj = state.fabricCanvas.getActiveObject();
            if (!obj && lastSelectedText) obj = lastSelectedText;
            if (!obj || obj.type !== 'i-text') return;
            var cursorPos = textContent.selectionStart;
            obj.set('text', textContent.value);
            // Restore cursor position in IText so it matches the textarea
            if (obj.isEditing) {
                obj.selectionStart = cursorPos;
                obj.selectionEnd = cursorPos;
            }
            state.fabricCanvas.renderAll();
            saveHistory();
        });
    }

    // Font family
    document.getElementById('prop-font-family').addEventListener('change', (e) => {
        const obj = state.fabricCanvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('fontFamily', e.target.value);
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });

    // Font size
    const fontSizeInput = document.getElementById('prop-font-size');
    fontSizeInput.addEventListener('input', () => {
        const obj = state.fabricCanvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('fontSize', parseInt(fontSizeInput.value) || 24);
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });

    // Text color
    document.getElementById('prop-text-color').addEventListener('input', (e) => {
        const obj = state.fabricCanvas.getActiveObject();
        if (obj && obj.type === 'i-text') {
            obj.set('fill', e.target.value);
            state.fabricCanvas.renderAll();
            saveHistory();
        }
    });

    // Prevent IText scaling via corner handles — always use fontSize
    state.fabricCanvas.on('object:modified', function(opt) {
        var obj = opt.target;
        if (obj && obj.type === 'i-text' && (obj.scaleX !== 1 || obj.scaleY !== 1)) {
            obj.set({
                fontSize: Math.round((obj.fontSize || 24) * obj.scaleY),
                scaleX: 1,
                scaleY: 1
            });
            obj.setCoords();
            state.fabricCanvas.renderAll();
        }
    });

    // Listen for text editing events
    state.fabricCanvas.on('text:editing:entered', onEditingEntered);
    state.fabricCanvas.on('text:editing:exited', onEditingExited);
    state.fabricCanvas.on('text:changed', onTextChanged);

    // Track last selected text so toolbar button clicks (which defocus the
    // canvas) can still reach the right object.
    state.fabricCanvas.on('selection:created', (e) => {
        if (e.selected && e.selected[0] && e.selected[0].type === 'i-text') {
            lastSelectedText = e.selected[0];
        }
    });
    state.fabricCanvas.on('selection:updated', (e) => {
        if (e.selected && e.selected[0] && e.selected[0].type === 'i-text') {
            lastSelectedText = e.selected[0];
        }
    });

    // Reset mode when selection moves away from text.
    // Don't reset textMode on selection:cleared — onEditingExited handles that.
    // This prevents a race where a toolbar button click clears the mode
    // right after toggleSuperscriptMode set it and called enterEditing().
    state.fabricCanvas.on('selection:cleared', () => {
        editingTarget = null;
    });
    state.fabricCanvas.on('selection:updated', () => {
        const obj = state.fabricCanvas.getActiveObject();
        if (!obj || obj.type !== 'i-text') {
            editingTarget = null;
            if (textMode !== 'normal') setMode('normal');
        }
    });
}

export function addTextBox(x, y) {
    if (!state.image) return;

    const fc = state.fabricCanvas;
    const fontSizeInput = document.getElementById('prop-font-size');
    const baseFontSize = parseInt(fontSizeInput?.value) || 24;
    const colorInput = document.getElementById('prop-text-color');
    const baseColor = colorInput?.value || '#000000';
    const familySelect = document.getElementById('prop-font-family');
    const baseFamily = familySelect?.value || 'Arial';

    const textbox = new fabric.IText('输入文字', {
        left: x,
        top: y,
        fontSize: baseFontSize,
        fontFamily: baseFamily,
        fill: baseColor,
        fontWeight: 'normal',
        fontStyle: 'normal',
        underline: false,
        editable: true,
        selectable: true,
        evented: true,
        lockScalingX: true,
        lockScalingY: true
    });

    fc.add(textbox);
    fc.setActiveObject(textbox);
    fc.renderAll();
    saveHistory();
}

function toggleBold() {
    const obj = state.fabricCanvas.getActiveObject();
    if (!obj || obj.type !== 'i-text') return;
    const isBold = obj.fontWeight === 'bold';
    obj.set('fontWeight', isBold ? 'normal' : 'bold');
    document.getElementById('btn-bold').classList.toggle('active', !isBold);
    state.fabricCanvas.renderAll();
    saveHistory();
}

function toggleItalic() {
    const obj = state.fabricCanvas.getActiveObject();
    if (!obj || obj.type !== 'i-text') return;
    const isItalic = obj.fontStyle === 'italic';
    obj.set('fontStyle', isItalic ? 'normal' : 'italic');
    document.getElementById('btn-italic').classList.toggle('active', !isItalic);
    state.fabricCanvas.renderAll();
    saveHistory();
}

function toggleUnderline() {
    const obj = state.fabricCanvas.getActiveObject();
    if (!obj || obj.type !== 'i-text') return;
    const isUnder = !!obj.underline;
    obj.set('underline', !isUnder);
    document.getElementById('btn-underline').classList.toggle('active', !isUnder);
    state.fabricCanvas.renderAll();
    saveHistory();
}

function toggleSuperscriptMode() {
    var obj = state.fabricCanvas.getActiveObject();
    // Toolbar button clicks defocus the canvas; use the tracked selection
    if (!obj && lastSelectedText) obj = lastSelectedText;
    if (!obj || obj.type !== 'i-text') return;

    var newMode = textMode === 'super' ? 'normal' : 'super';
    setMode(newMode);

    state.fabricCanvas.setActiveObject(obj);

    if (editingTarget === obj) {
        var start = obj.selectionStart;
        var end = obj.selectionEnd;
        // If the user selected some text, convert it immediately
        if (start < end) {
            applySuperSubStyle(obj, start, end, newMode);
        }
        // Always set prevText so onTextChanged can detect new characters
        prevText = obj.text || '';
    } else {
        editingTarget = obj;
        prevText = obj.text || '';
        var targetObj = obj;
        setTimeout(function() { targetObj.enterEditing(); }, 20);
    }
    state.fabricCanvas.renderAll();
    saveHistory();
}

function toggleSubscriptMode() {
    var obj = state.fabricCanvas.getActiveObject();
    if (!obj && lastSelectedText) obj = lastSelectedText;
    if (!obj || obj.type !== 'i-text') return;

    var newMode = textMode === 'sub' ? 'normal' : 'sub';
    setMode(newMode);

    state.fabricCanvas.setActiveObject(obj);

    if (editingTarget === obj) {
        var start = obj.selectionStart;
        var end = obj.selectionEnd;
        if (start < end) {
            applySuperSubStyle(obj, start, end, newMode);
        }
        prevText = obj.text || '';
    } else {
        editingTarget = obj;
        prevText = obj.text || '';
        var targetObj = obj;
        setTimeout(function() { targetObj.enterEditing(); }, 20);
    }
    state.fabricCanvas.renderAll();
    saveHistory();
}

// Update text properties panel based on selection
export function updateTextProps(obj) {
    const panel = document.getElementById('text-props');
    const shapePanel = document.getElementById('shape-props');
    const deleteSection = document.getElementById('delete-section');
    const placeholder = document.getElementById('properties-content');
    const textContent = document.getElementById('prop-text-content');

    if (obj && obj.type === 'i-text') {
        panel.style.display = '';
        shapePanel.style.display = 'none';
        deleteSection.style.display = '';
        placeholder.style.display = 'none';

        document.getElementById('prop-font-family').value = obj.fontFamily || 'Arial';
        document.getElementById('prop-font-size').value = obj.fontSize || 24;
        document.getElementById('prop-text-color').value = obj.fill || '#000000';

        document.getElementById('btn-bold').classList.toggle('active', obj.fontWeight === 'bold');
        document.getElementById('btn-italic').classList.toggle('active', obj.fontStyle === 'italic');
        document.getElementById('btn-underline').classList.toggle('active', !!obj.underline);

        // Sync textarea with the plain text (strip Fabric styles)
        if (textContent && document.activeElement !== textContent) {
            textContent.value = obj.text || '';
        }

        // Reflect current textMode on buttons when this text is being edited
        if (editingTarget === obj) {
            document.getElementById('btn-superscript').classList.toggle('active', textMode === 'super');
            document.getElementById('btn-subscript').classList.toggle('active', textMode === 'sub');
        } else {
            // Not editing: check if selection has super/sub styling
            const selStart = obj.selectionStart;
            const selEnd = obj.selectionEnd;
            if (selStart !== selEnd) {
                const styles = obj.getSelectionStyles();
                const hasSuper = styles.some(s => s.deltaY && s.deltaY < 0);
                const hasSub = styles.some(s => s.deltaY && s.deltaY > 0);
                document.getElementById('btn-superscript').classList.toggle('active', hasSuper);
                document.getElementById('btn-subscript').classList.toggle('active', hasSub);
            } else {
                document.getElementById('btn-superscript').classList.remove('active');
                document.getElementById('btn-subscript').classList.remove('active');
            }
        }
    }
    // Clear textarea when no text is selected
    if ((!obj || obj.type !== 'i-text') && textContent && document.activeElement !== textContent) {
        textContent.value = '';
    }
}
