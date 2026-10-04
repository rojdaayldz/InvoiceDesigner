
console.log("toolbar_step9.js çalıştı");

/*
    Step 9 - DevExpress-like top toolbar
    Bu dosya Index.cshtml içinde script olarak eklendiğinde üst bara otomatik toolbar ekler.
*/

(function () {
    let copiedComponent = null;
    let currentZoom = 100;

    function getSelected() {
        if (typeof editor === "undefined" || !editor.getSelected) return null;
        return editor.getSelected();
    }

    function refreshPanels(component) {
        if (window.updatePropertiesPanel && typeof window.updatePropertiesPanel === "function") {
            window.updatePropertiesPanel(component || getSelected());
        }

        if (window.refreshReportExplorer && typeof window.refreshReportExplorer === "function") {
            setTimeout(window.refreshReportExplorer, 100);
        }
    }

    function runUndo() {
        try {
            if (editor.UndoManager && editor.UndoManager.undo) {
                editor.UndoManager.undo();
            } else if (editor.runCommand) {
                editor.runCommand("core:undo");
            }
        } catch (err) {
            console.warn("Undo çalışmadı:", err);
        }

        refreshPanels();
    }

    function runRedo() {
        try {
            if (editor.UndoManager && editor.UndoManager.redo) {
                editor.UndoManager.redo();
            } else if (editor.runCommand) {
                editor.runCommand("core:redo");
            }
        } catch (err) {
            console.warn("Redo çalışmadı:", err);
        }

        refreshPanels();
    }

    function deleteSelected() {
        const selected = getSelected();
        if (!selected) return;

        selected.remove();
        refreshPanels();
    }

    function copySelected() {
        const selected = getSelected();
        if (!selected) return;

        copiedComponent = selected.clone ? selected.clone() : null;
    }

    function pasteSelected() {
        if (!copiedComponent) return;

        const selected = getSelected();
        const parent = selected && selected.parent ? selected.parent() : editor.getWrapper();

        const cloned = copiedComponent.clone ? copiedComponent.clone() : copiedComponent;
        parent.append(cloned);

        try {
            editor.select(cloned);
        } catch { }

        refreshPanels(cloned);
    }

    function duplicateSelected() {
        const selected = getSelected();
        if (!selected) return;

        const parent = selected.parent ? selected.parent() : editor.getWrapper();
        const cloned = selected.clone ? selected.clone() : null;

        if (!cloned) return;

        const style = selected.getStyle ? selected.getStyle() : {};
        const left = parseInt(style.left || "0", 10);
        const top = parseInt(style.top || "0", 10);

        if (!Number.isNaN(left) || !Number.isNaN(top)) {
            cloned.addStyle({
                position: style.position || "absolute",
                left: `${(Number.isNaN(left) ? 0 : left) + 12}px`,
                top: `${(Number.isNaN(top) ? 0 : top) + 12}px`
            });
        }

        parent.append(cloned);
        editor.select(cloned);
        refreshPanels(cloned);
    }

    function applyStyle(styles) {
        const selected = getSelected();
        if (!selected || !selected.addStyle) return;

        selected.addStyle(styles);

        const el = selected.getEl && selected.getEl();
        if (el) {
            Object.assign(el.style, styles);
            const textEl = el.querySelector && el.querySelector(".report-control-text");
            if (textEl) Object.assign(textEl.style, styles);
        }

        refreshPanels(selected);
    }

    function setTextAlign(value) {
        applyStyle({
            "text-align": value,
            "justify-content": value === "center" ? "center" : value === "right" ? "flex-end" : "flex-start"
        });
    }

    function bringFront() {
        applyStyle({ "z-index": "50" });
    }

    function sendBack() {
        applyStyle({ "z-index": "1" });
    }

    function setZoom(value) {
        currentZoom = value;

        try {
            if (editor.Canvas && editor.Canvas.setZoom) {
                editor.Canvas.setZoom(value);
            } else {
                const frame = document.querySelector(".gjs-frame-wrapper");
                if (frame) {
                    frame.style.transformOrigin = "top center";
                    frame.style.transform = `scale(${value / 100})`;
                }
            }
        } catch (err) {
            console.warn("Zoom uygulanamadı:", err);
        }

        const zoomSelect = document.getElementById("dxZoomSelect");
        if (zoomSelect) zoomSelect.value = String(value);
    }

    function toggleBold() {
        const selected = getSelected();
        if (!selected) return;

        const style = selected.getStyle ? selected.getStyle() : {};
        const isBold = style["font-weight"] === "700" || style["font-weight"] === "bold";

        applyStyle({ "font-weight": isBold ? "400" : "700" });
    }

    function makeButton(label, title, actionName) {
        return `
            <button type="button"
                    class="dx-toolbar-btn"
                    title="${title}"
                    data-toolbar-action="${actionName}">
                ${label}
            </button>`;
    }

    function buildToolbar() {
        const topbar = document.querySelector(".dx-topbar");
        const actions = document.querySelector(".dx-actions");

        if (!topbar || document.getElementById("dxCommandToolbar")) return;

        const toolbar = document.createElement("div");
        toolbar.id = "dxCommandToolbar";
        toolbar.className = "dx-command-toolbar";

        toolbar.innerHTML = `
            ${makeButton("↶", "Undo", "undo")}
            ${makeButton("↷", "Redo", "redo")}

            <span class="dx-toolbar-separator"></span>

            ${makeButton("⧉", "Copy", "copy")}
            ${makeButton("⎘", "Paste", "paste")}
            ${makeButton("⧆", "Duplicate", "duplicate")}
            ${makeButton("🗑", "Delete", "delete")}

            <span class="dx-toolbar-separator"></span>

            ${makeButton("B", "Bold", "bold")}
            ${makeButton("⯇", "Align Left", "alignLeft")}
            ${makeButton("≡", "Align Center", "alignCenter")}
            ${makeButton("⯈", "Align Right", "alignRight")}

            <span class="dx-toolbar-separator"></span>

            ${makeButton("⬆", "Bring Front", "front")}
            ${makeButton("⬇", "Send Back", "back")}

            <span class="dx-toolbar-separator"></span>

            <select id="dxZoomSelect" class="dx-toolbar-select" title="Zoom">
                <option value="75">75%</option>
                <option value="90">90%</option>
                <option value="100" selected>100%</option>
                <option value="110">110%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
            </select>
        `;

        if (actions) {
            topbar.insertBefore(toolbar, actions);
        } else {
            topbar.appendChild(toolbar);
        }

        toolbar.addEventListener("click", function (e) {
            const button = e.target.closest("[data-toolbar-action]");
            if (!button) return;

            const action = button.dataset.toolbarAction;

            if (action === "undo") runUndo();
            if (action === "redo") runRedo();
            if (action === "copy") copySelected();
            if (action === "paste") pasteSelected();
            if (action === "duplicate") duplicateSelected();
            if (action === "delete") deleteSelected();
            if (action === "bold") toggleBold();
            if (action === "alignLeft") setTextAlign("left");
            if (action === "alignCenter") setTextAlign("center");
            if (action === "alignRight") setTextAlign("right");
            if (action === "front") bringFront();
            if (action === "back") sendBack();
        });

        const zoomSelect = document.getElementById("dxZoomSelect");
        if (zoomSelect) {
            zoomSelect.addEventListener("change", function () {
                setZoom(Number(this.value));
            });
        }
    }

    function waitForEditorAndBuild() {
        if (typeof editor === "undefined") {
            setTimeout(waitForEditorAndBuild, 100);
            return;
        }

        buildToolbar();

        if (editor.on) {
            editor.on("load", buildToolbar);
        }
    }

    waitForEditorAndBuild();
})();
