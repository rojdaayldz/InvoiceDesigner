console.log("preview.js çalıştı - FINAL POSITION FIX");

let previewDatasourceCache = null;

function getValueByPath(obj, path) {
    if (!obj || !path) return "";
    return path.split(".").reduce((acc, key) => {
        if (acc === null || acc === undefined) return "";
        return acc[key];
    }, obj);
}

function formatPreviewValue(value, format) {
    if (value === null || value === undefined) return "";

    if (format === "currency") {
        const numberValue = Number(value);
        if (!Number.isNaN(numberValue)) {
            return numberValue.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }

    if (format === "number") {
        const numberValue = Number(value);
        if (!Number.isNaN(numberValue)) {
            return numberValue.toLocaleString("tr-TR");
        }
    }

    return String(value);
}

async function getPreviewDatasource() {
    if (!window.isDatasourceConnected && !window.currentDatasourceJson) return null;
    if (window.currentDatasourceJson) return window.currentDatasourceJson;
    if (previewDatasourceCache) return previewDatasourceCache;

    const response = await fetch("/Designer/GetDatasource", { cache: "no-store" });
    if (!response.ok) {
        throw new Error("Datasource alınamadı. Status: " + response.status);
    }

    previewDatasourceCache = await response.json();
    return previewDatasourceCache;
}

function replaceTextPlaceholders(html, data) {
    if (!data) return html;
    html = html.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, function (_, path) {
        return formatPreviewValue(getValueByPath(data, path));
    });

    html = html.replace(/\[\s*([a-zA-Z0-9_.]+)\s*\]/g, function (_, path) {
        return formatPreviewValue(getValueByPath(data, path));
    });

    return html;
}

function fillElementBindings(root, data) {
    if (!data) return;
    root.querySelectorAll("[data-binding]").forEach(el => {
        const binding = el.getAttribute("data-binding");
        if (!binding) return;
        if (binding.startsWith("items.")) return;

        const format = el.getAttribute("data-format") || "text";
        const value = formatPreviewValue(getValueByPath(data, binding), format);
        const textEl = el.querySelector(".report-control-text");

        if (textEl) textEl.textContent = value;
        else el.textContent = value;
    });
}

function cellBinding(cell) {
    const direct = cell.getAttribute("data-binding");
    if (direct) return direct.trim();

    const textEl = cell.querySelector(".report-control-text");
    const text = (textEl ? textEl.textContent : cell.textContent || "").trim();

    let match = text.match(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/);
    if (match) return match[1];

    match = text.match(/\[\s*([a-zA-Z0-9_.]+)\s*\]/);
    if (match) return match[1];

    match = text.match(/\b(items\.[a-zA-Z0-9_]+)\b/);
    if (match) return match[1];

    return "";
}

function setCellValue(cell, value) {
    const textEl = cell.querySelector(".report-control-text");
    if (textEl) textEl.textContent = value;
    else cell.textContent = value;
}

function repeatDetailRows(root, data) {
    if (!data) return;
    let rows = Array.from(root.querySelectorAll("tr[data-repeat-row]"));

    if (rows.length === 0) {
        root.querySelectorAll("tr").forEach(row => {
            if (row.innerHTML.includes("items.") || row.textContent.includes("items.")) {
                row.setAttribute("data-repeat-row", "items");
                rows.push(row);
            }
        });
    }

    rows.forEach(row => {
        const sourceName = row.getAttribute("data-repeat-row") || "items";
        const rowsData = data[sourceName];
        if (!Array.isArray(rowsData) || rowsData.length === 0) return;

        const tbody = row.parentElement;
        const rowTemplate = row.cloneNode(true);
        row.remove();

        rowsData.forEach(item => {
            const newRow = rowTemplate.cloneNode(true);
            newRow.removeAttribute("data-repeat-row");

            newRow.querySelectorAll("td, th, .report-cell, [data-binding], [data-field]").forEach(cell => {
                const binding = cellBinding(cell);
                if (!binding) return;

                const localField = binding.startsWith(sourceName + ".")
                    ? binding.substring(sourceName.length + 1)
                    : binding;

                if (!Object.prototype.hasOwnProperty.call(item, localField)) return;

                const format = cell.getAttribute("data-format") || "text";
                const value = formatPreviewValue(item[localField], format);
                setCellValue(cell, value);
            });

            newRow.innerHTML = replaceTextPlaceholders(newRow.innerHTML, { [sourceName]: item });
            tbody.appendChild(newRow);
        });
    });
}

function cleanPreviewDesignerMarks(root) {
    root.querySelectorAll(".gjs-selected, .gjs-hovered").forEach(el => {
        el.classList.remove("gjs-selected", "gjs-hovered");
    });

    root.querySelectorAll(".report-smart-menu, .report-smart-tag").forEach(el => el.remove());
    root.querySelectorAll(".binding-hover").forEach(el => el.classList.remove("binding-hover"));

    root.querySelectorAll(".unbound-template-field").forEach(el => {
        if (el.getAttribute("data-binding")) el.classList.remove("unbound-template-field");
    });

    root.querySelectorAll(".drop-zone, .item-box").forEach(el => {
        el.style.border = "none";
        el.style.background = "transparent";
    });
}

function isInsideAnotherMovable(el, movableSelector) {
    let parent = el.parentElement;
    while (parent) {
        if (parent.matches && parent.matches(movableSelector)) return true;
        parent = parent.parentElement;
    }
    return false;
}

function buildPageCloneFromDesign() {
    const canvasBody = editor.Canvas.getBody();
    const livePage = canvasBody.querySelector(".invoice-page, .report-page");

    if (!livePage) {
        throw new Error("Rapor sayfası bulunamadı");
    }

    const pageRect = livePage.getBoundingClientRect();
    const pageWidth = livePage.offsetWidth || parseFloat(getComputedStyle(livePage).width) || pageRect.width;
    const scale = pageRect.width > 0 && pageWidth > 0 ? pageRect.width / pageWidth : 1;
    const pageClone = livePage.cloneNode(true);

    // GrapesJS absolute drag modunda banda bırakılan bazı araçları body altında tutabiliyor.
    // Preview'de yalnızca bu sayfa dışındaki ÜST SEVİYE araçları, tasarımdaki gerçek
    // koordinatlarıyla sayfanın içine alıyoruz. Ölçek/zoom farkını da hesaba katıyoruz.
    const movableSelector = [
        ".invoice-draggable-block",
        ".invoice-table-wrapper",
        ".signature-card",
        ".signature-component",
        ".total-component",
        ".barcode-component",
        ".invoice-logo-component",
        ".invoice-field-box",
        ".report-control"
    ].join(",");

    const outsideMovables = Array.from(canvasBody.querySelectorAll(movableSelector)).filter(el => {
        if (livePage.contains(el)) return false;
        return !isInsideAnotherMovable(el, movableSelector);
    });

    outsideMovables.forEach(el => {
        const rect = el.getBoundingClientRect();
        const clone = el.cloneNode(true);

        const left = (rect.left - pageRect.left) / scale;
        const top = (rect.top - pageRect.top) / scale;
        const width = rect.width / scale;
        const height = rect.height / scale;

        clone.style.setProperty("position", "absolute", "important");
        clone.style.setProperty("left", `${left}px`, "important");
        clone.style.setProperty("top", `${top}px`, "important");
        clone.style.setProperty("right", "auto", "important");
        clone.style.setProperty("bottom", "auto", "important");
        clone.style.setProperty("margin", "0", "important");
        clone.style.setProperty("transform", "none", "important");
        clone.style.setProperty("z-index", "10", "important");

        // Tasarımdaki görünür ölçüyü koru. Yükseklik otomatik olan metinlerde sabitlemeyelim.
        if (width > 0) clone.style.setProperty("width", `${width}px`, "important");
        if (height > 0 && !clone.matches(".report-label, [data-control-type='text']")) {
            clone.style.setProperty("height", `${height}px`, "important");
        }

        pageClone.appendChild(clone);
    });

    return pageClone.outerHTML;
}
async function buildPreviewHtml() {
    const data = await getPreviewDatasource();

    const frameDoc = editor.Canvas.getDocument();
    const pageHtml = buildPageCloneFromDesign();

    const liveStyles = Array.from(frameDoc.querySelectorAll("style"))
        .map(s => s.innerHTML)
        .join("\n");

    const css = editor.getCss();

    const wrapper = document.createElement("div");
    wrapper.className = "preview-page";

    wrapper.innerHTML = `
        <style>
            ${liveStyles}
            ${css}

            .preview-page {
                width: 100%;
                min-height: 100vh;
                background: #d9e0e9;
                padding: 28px 35px 70px;
                box-sizing: border-box;
                overflow: auto;
            }

            .preview-page .invoice-page {
                background: #fff !important;
                background-image: none !important;
                box-shadow: 0 14px 36px rgba(15,23,42,.25);
                margin: 0 auto !important;
                position: relative !important;
                overflow: hidden !important;
            }

            .preview-page .gjs-selected,
            .preview-page .gjs-hovered {
                outline: none !important;
                box-shadow: none !important;
            }

            .preview-page .gjs-selected::before,
            .preview-page .gjs-selected::after,
            .preview-page .report-smart-tag,
            .preview-page .report-smart-menu,
            .preview-page .band-caption,
            .preview-page .band-placeholder {
                display: none !important;
            }

            .preview-page .drop-zone,
            .preview-page .item-box {
                border: none !important;
                background: transparent !important;
            }
        </style>

        ${pageHtml}
    `;

    repeatDetailRows(wrapper, data);
    fillElementBindings(wrapper, data);
    wrapper.innerHTML = replaceTextPlaceholders(wrapper.innerHTML, data);
    cleanPreviewDesignerMarks(wrapper);

    return wrapper.outerHTML;
}





window.showPreviewMode = async function () {
    const gjs = document.getElementById("gjs");
    const preview = document.getElementById("preview-surface");
    const designBtn = document.getElementById("designTabBtn");
    const previewBtn = document.getElementById("previewTabBtn");

    if (!gjs || !preview) return;

    gjs.style.display = "none";
    preview.style.display = "block";
    document.body.classList.add("preview-mode");
    preview.innerHTML = `<div class="preview-loading">Preview hazırlanıyor...</div>`;

    if (designBtn) designBtn.classList.remove("active");
    if (previewBtn) previewBtn.classList.add("active");

    try {
        preview.innerHTML = await buildPreviewHtml();
    } catch (err) {
        console.error(err);
        preview.innerHTML = `<div class="preview-error">Preview oluşturulamadı: ${err.message}</div>`;
    }
};

window.showDesignMode = function () {
    const gjs = document.getElementById("gjs");
    const preview = document.getElementById("preview-surface");
    const designBtn = document.getElementById("designTabBtn");
    const previewBtn = document.getElementById("previewTabBtn");

    if (gjs) gjs.style.display = "block";
    if (preview) preview.style.display = "none";
    document.body.classList.remove("preview-mode");

    if (designBtn) designBtn.classList.add("active");
    if (previewBtn) previewBtn.classList.remove("active");
};
