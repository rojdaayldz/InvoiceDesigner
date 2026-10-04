const editor = grapesjs.init({
    storageManager: false,

    container: '#gjs',
    height: '100%',
    fromElement: false,
    storageManager: false,

    dragMode: 'absolute',

    deviceManager: {
        devices: [
            { name: 'Desktop', width: '' },
            { name: 'Tablet', width: '768px', widthMedia: '992px' },
            { name: 'Mobile', width: '375px', widthMedia: '480px' }
        ]
    },

    blockManager: {
        appendTo: '#blocks'
    },

    styleManager: {
        clearProperties: true
    },

    selectorManager: {
        componentFirst: true
    },

    assetManager: {
        embedAsBase64: true,
        upload: false
    },

    canvas: {
        styles: ['/css/designer.css']
    }
});

editor.on('load', () => {

    const wrapper = editor.DomComponents.getWrapper();

    wrapper.set({
        droppable: true
    });

    editor.Components.getTypes().forEach(type => {
        const model = type.model;
        const defaults = model.prototype.defaults;

        defaults.droppable = true;
    });
});

editor.on('component:dblclick', component => {
    if (component.is('image')) {
        editor.runCommand('open-assets', {
            target: component
        });
    }
});

editor.on('component:selected', component => {
    editor.StyleManager.select(component);
});
function refreshDesignerPanels() {
    if (window.refreshReportExplorer && typeof window.refreshReportExplorer === "function") {
        setTimeout(window.refreshReportExplorer, 150);
    }

    if (window.updatePropertiesPanel && typeof window.updatePropertiesPanel === "function") {
        setTimeout(() => window.updatePropertiesPanel(editor.getSelected && editor.getSelected()), 150);
    }
}



// ================================
// PAGE SIZE / ORIENTATION
// ================================
const REPORT_PAGE_SIZES = {
    A4: { width: 794, height: 1123 },
    A5: { width: 559, height: 794 },
    Letter: { width: 816, height: 1056 },
    Legal: { width: 816, height: 1344 }
};

window.currentReportPageSettings = window.currentReportPageSettings || {
    size: localStorage.getItem("reportPageSize") || "A4",
    orientation: localStorage.getItem("reportPageOrientation") || "portrait"
};

function getReportPageDimensions() {
    const settings = window.currentReportPageSettings;
    const base = REPORT_PAGE_SIZES[settings.size] || REPORT_PAGE_SIZES.A4;
    return settings.orientation === "landscape"
        ? { width: base.height, height: base.width }
        : { width: base.width, height: base.height };
}

function setPageCssVariables(doc, width, height) {
    if (!doc || !doc.documentElement) return;
    doc.documentElement.style.setProperty("--report-page-width", `${width}px`);
    doc.documentElement.style.setProperty("--report-page-height", `${height}px`);
}

window.applyPageSettingsToCurrentPage = function applyPageSettingsToCurrentPage() {
    const { width, height } = getReportPageDimensions();
    setPageCssVariables(document, width, height);

    const frameDoc = editor?.Canvas?.getDocument?.();
    if (frameDoc) setPageCssVariables(frameDoc, width, height);

    const pageComponent = editor?.DomComponents?.getWrapper?.().find?.(".invoice-page, .report-page")?.[0];
    if (pageComponent) {
        pageComponent.addAttributes({
            "data-page-size": window.currentReportPageSettings.size,
            "data-page-orientation": window.currentReportPageSettings.orientation
        });
        pageComponent.addStyle({
            width: `${width}px`,
            height: `${height}px`,
            "min-height": `${height}px`
        });
    }

    if (frameDoc) {
        frameDoc.querySelectorAll(".invoice-page, .report-page").forEach(page => {
            page.style.setProperty("width", `${width}px`, "important");
            page.style.setProperty("height", `${height}px`, "important");
            page.style.setProperty("min-height", `${height}px`, "important");
        });
        if (frameDoc.documentElement) frameDoc.documentElement.style.minHeight = `${height}px`;
        if (frameDoc.body) frameDoc.body.style.minHeight = `${height}px`;
    }

    document.querySelectorAll(".preview-page").forEach(page => {
        page.style.setProperty("width", `${width}px`, "important");
        page.style.setProperty("min-height", `${height}px`, "important");
    });
}

function movePageSettingsNextToZoom() {
    const group = document.getElementById("pageSettingsToolbar");
    if (!group) return;

    const toolbar = document.querySelector(".dx-command-toolbar");
    if (!toolbar) return;

    const selects = Array.from(toolbar.querySelectorAll("select"));
    const zoomSelect = selects.find(select =>
        select.id?.toLowerCase().includes("zoom") ||
        Array.from(select.options || []).some(option => String(option.textContent).includes("100%"))
    );

    if (zoomSelect) {
        // Zaten zoom seçiminin hemen yanındaysa tekrar taşıma.
        // Aksi halde MutationObserver ile sonsuz DOM döngüsü oluşur.
        if (zoomSelect.nextElementSibling !== group) {
            zoomSelect.insertAdjacentElement("afterend", group);
        }
    } else if (group.parentElement !== toolbar) {
        toolbar.appendChild(group);
    }
}

function initPageSettingsControls() {
    const sizeSelect = document.getElementById("pageSizeSelect");
    const orientationSelect = document.getElementById("pageOrientationSelect");
    if (!sizeSelect || !orientationSelect || sizeSelect.dataset.bound === "1") return;

    sizeSelect.dataset.bound = "1";
    sizeSelect.value = window.currentReportPageSettings.size;
    orientationSelect.value = window.currentReportPageSettings.orientation;

    const changeSettings = () => {
        window.currentReportPageSettings.size = sizeSelect.value;
        window.currentReportPageSettings.orientation = orientationSelect.value;
        localStorage.setItem("reportPageSize", sizeSelect.value);
        localStorage.setItem("reportPageOrientation", orientationSelect.value);
        applyPageSettingsToCurrentPage();
        setTimeout(normalizeCanvasPaper, 0);
    };

    sizeSelect.addEventListener("change", changeSettings);
    orientationSelect.addEventListener("change", changeSettings);

    movePageSettingsNextToZoom();
    applyPageSettingsToCurrentPage();

    // Toolbar zaten Index.cshtml içinde mevcut. Sürekli DOM gözlemlemek
    // sayfayı kilitleyebildiği için yalnızca yükleme sonrasında iki kez kontrol ediyoruz.
    setTimeout(movePageSettingsNextToZoom, 350);
    setTimeout(movePageSettingsNextToZoom, 900);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPageSettingsControls);
} else {
    initPageSettingsControls();
}

window.normalizeCanvasPaper = function normalizeCanvasPaper() {
    if (typeof editor === "undefined" || !editor.Canvas) return;

    const frameDoc = editor.Canvas.getDocument && editor.Canvas.getDocument();
    if (!frameDoc) return;

    const { width, height } = getReportPageDimensions();
    setPageCssVariables(document, width, height);
    setPageCssVariables(frameDoc, width, height);

    const html = frameDoc.documentElement;
    const body = frameDoc.body;

    if (html) {
        html.style.background = "#ffffff";
        html.style.minHeight = `${height}px`;
    }

    if (body) {
        body.style.background = "#ffffff";
        body.style.margin = "0";
        body.style.minHeight = `${height}px`;
        body.style.overflowX = "hidden";
    }

    frameDoc.querySelectorAll(".invoice-page, .report-page").forEach(page => {
        page.style.backgroundColor = "#ffffff";
        page.style.setProperty("width", `${width}px`, "important");
        page.style.setProperty("min-height", `${height}px`, "important");
        page.style.setProperty("height", `${height}px`, "important");
        page.style.overflow = "hidden";
        page.style.margin = "0 auto";
    });

    document.querySelectorAll(".preview-page").forEach(page => {
        page.style.setProperty("width", `${width}px`, "important");
        page.style.setProperty("min-height", `${height}px`, "important");
    });
}

function setDesignerContent(html) {
    editor.DomComponents.clear();
    editor.setComponents(html);

    applyPageSettingsToCurrentPage();
    normalizeCanvasPaper();

    setTimeout(function () {
        normalizeCanvasPaper();

        if (window.prepareTemplateDataFields &&
            typeof window.prepareTemplateDataFields === "function") {
            window.prepareTemplateDataFields();
        }

        if (window.datasourceConnected &&
            window.activateTemplateDataFields &&
            typeof window.activateTemplateDataFields === "function") {
            window.activateTemplateDataFields();
        }

        window.normalizeReportToolsIntoPage?.();
        refreshDesignerPanels();
    }, 150);
}

function getStartOverlay() {
    let overlay = document.getElementById("designerStartOverlay");
    if (overlay) return overlay;

    const workarea = document.querySelector(".dx-workarea");
    if (!workarea) return null;

    overlay = document.createElement("div");
    overlay.id = "designerStartOverlay";
    overlay.className = "designer-start-overlay";
    workarea.appendChild(overlay);
    return overlay;
}

function hideStartOverlay() {
    const overlay = document.getElementById("designerStartOverlay");
    if (overlay) overlay.style.display = "none";
}

function showStartOverlay(mode) {
    const overlay = getStartOverlay();
    if (!overlay) return;

    overlay.style.display = "flex";

    if (mode === "templates") {
        overlay.innerHTML = `
            <div class="designer-start-card template-chooser-card">
                <div class="designer-start-logo">ZR</div>
                <h2>Hazır Şablon Seç</h2>
                <p class="designer-start-subtitle">Başlamak için kullanmak istediğiniz fatura tasarımını seçin.</p>

                <div class="designer-template-grid">
                    <button type="button" class="designer-template-option" data-template-key="zensoft">
                        <span class="designer-template-icon">📄</span>
                        <span class="designer-template-title">Zensoft Fatura</span>
                        <span class="designer-template-text">Kırmızı başlıklı mevcut fatura şablonu</span>
                    </button>

                    <button type="button" class="designer-template-option" data-template-key="adventure">
                        <span class="designer-template-icon">🧾</span>
                        <span class="designer-template-title">Klasik Sipariş Faturası</span>
                        <span class="designer-template-text">Logo, barkod, müşteri ve ürün detaylı şablon</span>
                    </button>
                </div>

                <button type="button" class="designer-start-back" data-template-action="back">← Geri dön</button>
            </div>
        `;
        return;
    }

    overlay.innerHTML = `
        <div class="designer-start-card">
            <div class="designer-start-logo">ZR</div>
            <h2>Zensoft Report Designer</h2>
            <p class="designer-start-subtitle">Yeni bir rapor tasarlayın veya hazır fatura şablonlarından biriyle başlayın.</p>

            <div class="designer-start-options">
                <button type="button" class="designer-start-option" data-start-action="blank">
                    <span class="designer-start-option-icon">+</span>
                    <span class="designer-start-option-title">Yeni Fatura Oluştur</span>
                    <span class="designer-start-option-text">Boş rapor alanıyla sıfırdan başlayın</span>
                </button>

                <button type="button" class="designer-start-option" data-start-action="templates">
                    <span class="designer-start-option-icon">📄</span>
                    <span class="designer-start-option-title">Hazır Şablon Kullan</span>
                    <span class="designer-start-option-text">Zensoft veya klasik fatura şablonunu seçin</span>
                </button>
            </div>
        </div>
    `;
}

window.applyReportTemplate = function (templateKeyOrHtml) {
    if (typeof editor === "undefined") return;

    if (typeof templateKeyOrHtml === "string" &&
        ["blank", "zensoft", "adventure"].includes(templateKeyOrHtml)) {
        window.resetManagedTemplateSelection?.();
    }

    const templates = window.invoiceTemplates || {};
    const html = templates[templateKeyOrHtml] || templateKeyOrHtml;

    if (!html) {
        console.warn("Şablon bulunamadı:", templateKeyOrHtml);
        return;
    }

    hideStartOverlay();
    setDesignerContent(html);
};

window.loadBlankTemplate = function () {
    window.applyReportTemplate("blank");
};

function initStartScreenActions() {
    const overlay = getStartOverlay();
    if (!overlay || overlay.dataset.startActionsBound === "1") return;

    overlay.dataset.startActionsBound = "1";

    overlay.addEventListener("click", function (e) {
        const startBtn = e.target.closest("[data-start-action]");
        const templateBtn = e.target.closest("[data-template-key]");
        const templateAction = e.target.closest("[data-template-action]");

        if (startBtn) {
            e.preventDefault();
            const action = startBtn.getAttribute("data-start-action");

            if (action === "blank") {
                window.applyReportTemplate("blank");
                return;
            }

            if (action === "templates") {
                showStartOverlay("templates");
                return;
            }
        }

        if (templateBtn) {
            e.preventDefault();
            window.applyReportTemplate(templateBtn.getAttribute("data-template-key"));
            return;
        }

        if (templateAction) {
            e.preventDefault();
            if (templateAction.getAttribute("data-template-action") === "back") {
                showStartOverlay("welcome");
            }
        }
    });
}
function decodeIncomingBase64(base64) {
    const binaryText = atob(base64);

    const bytes = Uint8Array.from(
        binaryText,
        character => character.charCodeAt(0)
    );

    // UTF-16 Little Endian BOM: FF FE
    if (
        bytes.length >= 2 &&
        bytes[0] === 0xFF &&
        bytes[1] === 0xFE
    ) {
        return new TextDecoder("utf-16le")
            .decode(bytes);
    }

    // UTF-16 Big Endian BOM: FE FF
    if (
        bytes.length >= 2 &&
        bytes[0] === 0xFE &&
        bytes[1] === 0xFF
    ) {
        return new TextDecoder("utf-16be")
            .decode(bytes);
    }

    // Diğer dosyaları UTF-8 kabul et.
    return new TextDecoder("utf-8")
        .decode(bytes);
}

function loadInvoiceHtmlToDesigner(htmlText, sourceName = "Fatura") {
    if (!htmlText || !htmlText.trim()) {
        throw new Error("Seçilen dosyada açılabilecek HTML içeriği bulunamadı.");
    }

    const parsedDocument = new DOMParser().parseFromString(
        htmlText,
        "text/html"
    );

    const parserError = parsedDocument.querySelector("parsererror");
    if (parserError) {
        throw new Error("HTML dosyası okunamadı.");
    }

    const invoiceCss = Array.from(
        parsedDocument.querySelectorAll("style")
    )
        .map(styleElement => styleElement.textContent || "")
        .join("\n");

    // Style etiketlerini gövdeden çıkarıyoruz; CSS GrapesJS'e ayrı yükleniyor.
    parsedDocument.querySelectorAll("style").forEach(styleElement => {
        styleElement.remove();
    });

    const rawInvoiceBodyHtml =
        parsedDocument.body?.innerHTML || htmlText;

    const hasReportPage = parsedDocument.body?.querySelector(
        ".invoice-page, .report-page"
    );

    const invoiceBodyHtml = hasReportPage
        ? rawInvoiceBodyHtml
        : `
            <div class="invoice-page report-page imported-invoice-page">
                ${rawInvoiceBodyHtml}
            </div>
        `;

    hideStartOverlay();
    editor.select(null);
    editor.DomComponents.clear();
    editor.CssComposer.clear();
    editor.setComponents(invoiceBodyHtml);

    if (invoiceCss.trim()) {
        editor.setStyle(invoiceCss);
    }

    applyPageSettingsToCurrentPage();
    normalizeCanvasPaper();

    setTimeout(function () {
        normalizeCanvasPaper();
        window.normalizeReportToolsIntoPage?.();
        refreshDesignerPanels();
    }, 150);

    console.log(`${sourceName} Designer ekranına başarıyla yüklendi.`);
    return true;
}

window.loadInvoiceHtmlToDesigner = loadInvoiceHtmlToDesigner;

function loadIncomingInvoiceFromBase64() {
    const base64 = window.incomingInvoiceBase64;

    if (!base64) {
        return false;
    }

    try {
        const decodedHtml = decodeIncomingBase64(base64);
        return loadInvoiceHtmlToDesigner(decodedHtml, "Base64 fatura");
    } catch (error) {
        console.error("Base64 fatura açılırken hata oluştu:", error);
        alert("Fatura tasarım ekranında açılamadı.");
        return false;
    }
}

editor.on("load", function () {
    editor.DomComponents.clear();
    refreshDesignerPanels();
    initStartScreenActions();

    if (window.incomingInvoiceError) {
        console.error(window.incomingInvoiceError);
        window.alert(window.incomingInvoiceError);
    }

    const invoiceLoaded =
        loadIncomingInvoiceFromBase64();

    if (!invoiceLoaded) {
        showStartOverlay("welcome");
    }
});

setTimeout(function () {
    initStartScreenActions();

    // Base64 ile fatura geldiyse başlangıç ekranını tekrar açma.
    if (window.incomingInvoiceBase64) {
        return;
    }

    const overlay =
        document.getElementById("designerStartOverlay");

    if (overlay && overlay.style.display !== "flex") {
        showStartOverlay("welcome");
    }
}, 500);

// ================================
// TOOLBOX COMPONENTS -> REPORT PAGE
// GrapesJS absolute drag mode sometimes adds toolbox items to the wrapper/body.
// Keep report bands and template structure untouched; only move top-level tools
// into the actual report page while preserving their visible position.
// ================================
let reportToolNormalizationRunning = false;

function getReportPageComponent() {
    const wrapper = editor?.DomComponents?.getWrapper?.();
    if (!wrapper) return null;

    return wrapper.find?.(".invoice-page")?.[0]
        || wrapper.find?.(".report-page")?.[0]
        || null;
}

function isTopLevelReportTool(component) {
    if (!component || component.get?.("type") === "wrapper") return false;

    const attrs = component.getAttributes?.() || {};
    const classes = component.getClasses?.() || [];
    const classNames = classes.map(item => typeof item === "string" ? item : item?.getName?.()).filter(Boolean);

    const isTool = classNames.includes("invoice-draggable-block")
        || classNames.includes("invoice-table-wrapper")
        || classNames.includes("invoice-logo-component")
        || classNames.includes("signature-card")
        || classNames.includes("signature-component")
        || classNames.includes("total-component")
        || classNames.includes("barcode-component")
        || classNames.includes("invoice-field-box");

    // Bands are structural page sections. Never re-parent them here.
    const isBand = !!attrs["data-band-type"] || classNames.includes("report-band");
    return isTool && !isBand;
}

function moveReportToolIntoPage(component) {
    if (reportToolNormalizationRunning || !isTopLevelReportTool(component)) return false;

    const pageComponent = getReportPageComponent();
    if (!pageComponent || component === pageComponent) return false;

    const parent = component.parent?.();
    if (!parent || parent === pageComponent) return false;

    // Only repair components that GrapesJS placed directly under wrapper/body.
    const wrapper = editor.DomComponents.getWrapper();
    if (parent !== wrapper) return false;

    const pageEl = pageComponent.getEl?.();
    const toolEl = component.getEl?.();
    if (!pageEl || !toolEl) return false;

    const pageRect = pageEl.getBoundingClientRect();
    const toolRect = toolEl.getBoundingClientRect();
    const pageWidth = pageEl.offsetWidth || pageRect.width || 794;
    const pageHeight = pageEl.offsetHeight || pageRect.height || 1123;
    const scale = pageRect.width > 0 && pageWidth > 0 ? pageRect.width / pageWidth : 1;

    const toolWidth = toolRect.width / scale;
    const toolHeight = toolRect.height / scale;
    let left = (toolRect.left - pageRect.left) / scale;
    let top = (toolRect.top - pageRect.top) / scale;

    // Keep the full component inside the report page.
    left = Math.max(0, Math.min(left, Math.max(0, pageWidth - toolWidth)));
    top = Math.max(0, Math.min(top, Math.max(0, pageHeight - toolHeight)));

    reportToolNormalizationRunning = true;
    try {
        component.move(pageComponent);
        component.addStyle({
            position: "absolute",
            left: `${Math.round(left * 100) / 100}px`,
            top: `${Math.round(top * 100) / 100}px`,
            right: "auto",
            bottom: "auto",
            margin: "0",
            transform: "none"
        });
        return true;
    } catch (error) {
        console.error("Bileşen rapor sayfasına taşınamadı:", error);
        return false;
    } finally {
        reportToolNormalizationRunning = false;
    }
}

window.normalizeReportToolsIntoPage = function normalizeReportToolsIntoPage() {
    const wrapper = editor?.DomComponents?.getWrapper?.();
    if (!wrapper) return 0;

    const topLevelComponents = [...(wrapper.components?.().models || [])];
    let movedCount = 0;

    topLevelComponents.forEach(component => {
        if (moveReportToolIntoPage(component)) movedCount += 1;
    });

    if (movedCount > 0) {
        setTimeout(() => {
            normalizeCanvasPaper();
            refreshDesignerPanels();
        }, 0);
    }

    return movedCount;
};

editor.on("component:add", function (component) {
    // Wait until GrapesJS has rendered the new component so its real coordinates
    // can be measured before changing the parent.
    setTimeout(() => {
        moveReportToolIntoPage(component);
        normalizeCanvasPaper();
    }, 0);
});

editor.on("component:update", function () {
    setTimeout(normalizeCanvasPaper, 80);
});


// ================================
// READY TABLES
// Müşteri/Fatura/Alt Toplam tek kart gibi davranır.
// Ürün tablosunda iç hücreler seçilebilir kalır; dış tutamaçtan tamamı taşınır.
// ================================
function getReadyTableCard(component) {
    let current = component;

    while (current) {
        const attrs = current.getAttributes?.() || {};
        const classes = (current.getClasses?.() || [])
            .map(item => typeof item === "string" ? item : item?.getName?.())
            .filter(Boolean);

        if (attrs["data-ready-table"] === "true" ||
            classes.includes("invoice-ready-table-card")) {
            return current;
        }

        current = current.parent?.();
    }

    return null;
}

function isProductReadyTable(card) {
    if (!card) return false;
    const attrs = card.getAttributes?.() || {};
    const classes = (card.getClasses?.() || [])
        .map(item => typeof item === "string" ? item : item?.getName?.())
        .filter(Boolean);

    return attrs["data-product-table-card"] === "true" ||
        classes.includes("invoice-table-wrapper");
}

function configureReadyTable(card) {
    if (!card) return;

    card.set({
        draggable: true,
        droppable: false,
        selectable: true,
        hoverable: true
    });

    const children = card.find?.("*") || [];

    if (isProductReadyTable(card)) {
        // Ürün tablosunun hücreleri/yazıları seçilebilir ve düzenlenebilir kalsın.
        // Ancak yanlışlıkla tek tek sürüklenmesinler.
        children.forEach(child => {
            child.set({
                draggable: false,
                selectable: true,
                hoverable: true
            });
        });
        return;
    }

    // Diğer hazır tablolar tek kart gibi davranmaya devam etsin.
    children.forEach(child => {
        child.set({
            draggable: false,
            droppable: false
        });
    });
}

editor.on("component:add", function (component) {
    const card = getReadyTableCard(component);
    if (card) {
        setTimeout(() => configureReadyTable(card), 0);
    }
});

editor.on("component:selected", function (component) {
    const card = getReadyTableCard(component);
    if (!card || card === component) return;

    // Ürün tablosunda iç hücreler seçilebilir kalsın.
    if (isProductReadyTable(card)) return;

    // Diğer hazır tablolar dış kart olarak seçilsin.
    setTimeout(() => editor.select(card), 0);
});

editor.on("load", function () {
    const wrapper = editor.DomComponents.getWrapper();
    const readyCards = wrapper.find?.(".invoice-ready-table-card") || [];
    readyCards.forEach(configureReadyTable);

    const frameDoc = editor.Canvas.getDocument();
    if (!frameDoc || frameDoc.__productTableHandleBound) return;
    frameDoc.__productTableHandleBound = true;

    frameDoc.addEventListener("mousedown", function (event) {
        const handle = event.target.closest?.("[data-product-table-handle='true']");
        if (!handle) return;

        const cardEl = handle.closest(".invoice-ready-table-card");
        if (!cardEl) return;

        const cardComponent = editor.getModelByEl(cardEl);
        if (cardComponent) {
            editor.select(cardComponent);
        }
    }, true);
});


// ================================
// PRODUCT TABLE DROP POSITION FIX
// Yalnızca yeni eklenen ürün tablosunu Detail bandına güvenli konumda yerleştirir.
// Diğer bileşenlerin mevcut yerleştirme davranışına dokunmaz.
// ================================
function isProductTableCardComponent(component) {
    if (!component) return false;

    const attrs = component.getAttributes?.() || {};
    const classes = (component.getClasses?.() || [])
        .map(item => typeof item === "string" ? item : item?.getName?.())
        .filter(Boolean);

    return attrs["data-product-table-card"] === "true"
        || (
            attrs["data-control-type"] === "items-table"
            && classes.includes("invoice-table-wrapper")
        );
}

function placeProductTableInDetail(component) {
    if (!isProductTableCardComponent(component)) return false;

    const pageComponent = getReportPageComponent();
    if (!pageComponent) return false;

    const pageEl = pageComponent.getEl?.();
    const componentEl = component.getEl?.();
    if (!pageEl || !componentEl) return false;

    const frameDoc = editor.Canvas.getDocument?.();
    const detailEl = frameDoc?.querySelector(
        ".invoice-page > .detail-band, .report-page > .detail-band"
    );

    const pageRect = pageEl.getBoundingClientRect();
    const pageWidth = pageEl.offsetWidth || pageRect.width || 794;
    const scale = pageRect.width > 0 && pageWidth > 0
        ? pageRect.width / pageWidth
        : 1;

    const componentRect = componentEl.getBoundingClientRect();
    const componentWidth = componentRect.width > 0
        ? componentRect.width / scale
        : 700;

    let left = Math.max(20, (pageWidth - componentWidth) / 2);
    let top = 220;

    if (detailEl) {
        const detailRect = detailEl.getBoundingClientRect();
        top = (detailRect.top - pageRect.top) / scale + 35;
    }

    left = Math.max(0, Math.min(left, Math.max(0, pageWidth - componentWidth)));

    const parent = component.parent?.();
    if (parent !== pageComponent) {
        component.move(pageComponent);
    }

    component.addStyle({
        position: "absolute",
        left: `${Math.round(left * 100) / 100}px`,
        top: `${Math.round(top * 100) / 100}px`,
        right: "auto",
        bottom: "auto",
        margin: "0",
        transform: "none"
    });

    editor.select(component);
    normalizeCanvasPaper();
    refreshDesignerPanels();
    return true;
}

editor.on("component:add", function (component) {
    if (!isProductTableCardComponent(component)) return;

    // Tablo ağacının tamamen oluşmasını ve genel normalizasyonun bitmesini bekle.
    // Son olarak yalnızca ürün tablosunun konumunu düzelt.
    setTimeout(() => {
        placeProductTableInDetail(component);
    }, 160);
});

// Template manager entegrasyonu için güvenli dış erişim.
window.applyPageSettingsToCurrentPage = applyPageSettingsToCurrentPage;
window.normalizeCanvasPaper = normalizeCanvasPaper;
window.hideStartOverlay = hideStartOverlay;


// ================================
// FILE MENU ACTIONS
// ================================

window.startNewReport = function startNewReport() {
    const wrapper = editor?.DomComponents?.getWrapper?.();
    const hasDesign = !!wrapper?.components?.().length;

    if (hasDesign) {
        const approved = window.confirm(
            "Mevcut tasarım temizlenecek. Kaydedilmemiş değişiklikler kaybolacak.\n\nDevam etmek istiyor musunuz?"
        );
        if (!approved) return;
    }

    try {
        editor.select(null);
        editor.DomComponents.clear();
        editor.CssComposer?.clear?.();

        window.resetManagedTemplateSelection?.();

        refreshDesignerPanels();
        initStartScreenActions();
        showStartOverlay("welcome");
    } catch (error) {
        console.error("Yeni rapor açılamadı:", error);
        window.alert("Yeni rapor açılırken bir hata oluştu.");
    }
};

window.saveCurrentReport = function saveCurrentReport() {
    if (typeof window.saveManagedTemplate !== "function") {
        window.alert(
            "Kaydetme modülü yüklenmedi. template-manager.js dosyasının " +
            "wwwroot/js klasöründe olduğunu ve Index.cshtml içinde çağrıldığını kontrol edin."
        );
        return;
    }

    window.saveManagedTemplate();
};

window.saveCurrentReportAs = function saveCurrentReportAs() {
    if (typeof window.saveManagedTemplateAs === "function") {
        window.saveManagedTemplateAs();
        return;
    }

    if (typeof window.saveManagedTemplate !== "function") {
        window.alert(
            "Kaydetme modülü yüklenmedi. template-manager.js dosyasının " +
            "wwwroot/js klasöründe olduğunu ve Index.cshtml içinde çağrıldığını kontrol edin."
        );
        return;
    }

    window.resetManagedTemplateSelection?.();
    window.saveManagedTemplate();
};

function initFileMenu() {
    const menu = document.getElementById("fileMenu");
    const button = document.getElementById("fileMenuButton");
    const popup = document.getElementById("fileMenuPopup");

    if (!menu || !button || !popup || menu.dataset.bound === "1") return;

    menu.dataset.bound = "1";

    const closeMenu = () => {
        menu.classList.remove("open");
        button.setAttribute("aria-expanded", "false");
    };

    button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        const willOpen = !menu.classList.contains("open");
        menu.classList.toggle("open", willOpen);
        button.setAttribute("aria-expanded", String(willOpen));
    });

    popup.addEventListener("click", function (event) {
        const item = event.target.closest("[data-file-action]");
        if (!item) return;

        event.preventDefault();
        event.stopPropagation();

        const action = item.dataset.fileAction;
        closeMenu();

        if (action === "new") window.startNewReport();
        else if (action === "save") window.saveCurrentReport();
        else if (action === "save-as") window.saveCurrentReportAs();
    });

    document.addEventListener("click", function (event) {
        if (!menu.contains(event.target)) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeMenu();
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
        initFileMenu();
    });
} else {
    initFileMenu();
}


// =====================================================
// COMPONENT CONTEXT MENU
// Sağ tık menüsü mevcut Properties/Actions butonlarını kullanır.
// Böylece çoğaltma, silme, kilitleme, gizleme ve stil işlemleri
// tek bir iş mantığından çalışmaya devam eder.
// =====================================================
(function initDesignerContextMenuModule() {
    let contextMenu = null;
    let contextComponent = null;
    let contextMenuBound = false;

    const ACTION_BUTTON_IDS = {
        duplicate: "duplicateComponentBtn",
        copyStyle: "copyStyleBtn",
        pasteStyle: "pasteStyleBtn",
        bringFront: "bringFrontBtn",
        sendBack: "sendBackBtn",
        toggleLock: "toggleLockBtn",
        toggleVisibility: "toggleVisibilityBtn",
        delete: "deleteComponentBtn"
    };

    function componentHasClassSafe(component, className) {
        try {
            const classes = component?.getClasses?.() || [];
            return classes.some(item =>
                (typeof item === "string" ? item : item?.getName?.()) === className
            );
        } catch {
            return false;
        }
    }

    function isProtectedContextComponent(component) {
        if (!component) return true;

        const attrs = component.getAttributes?.() || {};
        const type = component.get?.("type");
        const tag = component.get?.("tagName");

        return type === "wrapper" ||
            tag === "body" ||
            Boolean(attrs["data-band-type"]) ||
            componentHasClassSafe(component, "invoice-page") ||
            componentHasClassSafe(component, "report-page");
    }

    function getContextMenu() {
        if (contextMenu) return contextMenu;

        contextMenu = document.createElement("div");
        contextMenu.id = "designerContextMenu";
        contextMenu.className = "designer-context-menu";
        contextMenu.setAttribute("role", "menu");
        contextMenu.setAttribute("aria-hidden", "true");

        contextMenu.innerHTML = `
            <button type="button" class="designer-context-item" data-context-action="duplicate">
                <span class="designer-context-icon">⧉</span>
                <span>Çoğalt</span>
                <kbd>Ctrl+D</kbd>
            </button>

            <div class="designer-context-separator"></div>

            <button type="button" class="designer-context-item" data-context-action="copyStyle">
                <span class="designer-context-icon">▣</span>
                <span>Stili Kopyala</span>
            </button>
            <button type="button" class="designer-context-item" data-context-action="pasteStyle">
                <span class="designer-context-icon">▤</span>
                <span>Stili Yapıştır</span>
            </button>

            <div class="designer-context-separator"></div>

            <button type="button" class="designer-context-item" data-context-action="bringFront">
                <span class="designer-context-icon">↑</span>
                <span>Öne Getir</span>
            </button>
            <button type="button" class="designer-context-item" data-context-action="sendBack">
                <span class="designer-context-icon">↓</span>
                <span>Arkaya Gönder</span>
            </button>

            <div class="designer-context-separator"></div>

            <button type="button" class="designer-context-item" data-context-action="toggleLock">
                <span class="designer-context-icon" data-context-lock-icon>🔒</span>
                <span data-context-lock-text>Kilitle</span>
            </button>
            <button type="button" class="designer-context-item" data-context-action="toggleVisibility">
                <span class="designer-context-icon" data-context-visibility-icon>◉</span>
                <span data-context-visibility-text>Gizle</span>
            </button>

            <div class="designer-context-separator"></div>

            <button type="button" class="designer-context-item danger" data-context-action="delete">
                <span class="designer-context-icon">⌫</span>
                <span>Sil</span>
                <kbd>Delete</kbd>
            </button>
        `;

        document.body.appendChild(contextMenu);

        contextMenu.addEventListener("contextmenu", event => {
            event.preventDefault();
        });

        contextMenu.addEventListener("click", event => {
            const item = event.target.closest("[data-context-action]");
            if (!item || item.disabled) return;

            event.preventDefault();
            event.stopPropagation();

            const action = item.dataset.contextAction;
            const buttonId = ACTION_BUTTON_IDS[action];
            const actionButton = buttonId
                ? document.getElementById(buttonId)
                : null;

            if (!contextComponent || !actionButton || actionButton.disabled) {
                hideDesignerContextMenu();
                return;
            }

            editor.select(contextComponent);
            actionButton.click();
            hideDesignerContextMenu();
        });

        return contextMenu;
    }

    function updateContextMenuState(component) {
        const menu = getContextMenu();
        const attrs = component?.getAttributes?.() || {};
        const protectedComponent = isProtectedContextComponent(component);

        const locked = attrs["data-designer-locked"] === "true";
        const hidden = attrs["data-designer-hidden"] === "true";

        const lockIcon = menu.querySelector("[data-context-lock-icon]");
        const lockText = menu.querySelector("[data-context-lock-text]");
        const visibilityIcon = menu.querySelector("[data-context-visibility-icon]");
        const visibilityText = menu.querySelector("[data-context-visibility-text]");

        if (lockIcon) lockIcon.textContent = locked ? "🔓" : "🔒";
        if (lockText) lockText.textContent = locked ? "Kilidi Aç" : "Kilitle";
        if (visibilityIcon) visibilityIcon.textContent = hidden ? "◌" : "◉";
        if (visibilityText) visibilityText.textContent = hidden ? "Göster" : "Gizle";

        menu.querySelectorAll("[data-context-action]").forEach(item => {
            const action = item.dataset.contextAction;
            const buttonId = ACTION_BUTTON_IDS[action];
            const linkedButton = buttonId
                ? document.getElementById(buttonId)
                : null;

            item.disabled = protectedComponent ||
                !linkedButton ||
                linkedButton.disabled;
        });
    }

    function positionContextMenu(clientX, clientY) {
        const menu = getContextMenu();
        const margin = 10;

        menu.style.left = "0px";
        menu.style.top = "0px";
        menu.style.visibility = "hidden";
        menu.classList.add("open");

        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = clientX;
        let top = clientY;

        if (left + rect.width + margin > viewportWidth) {
            left = Math.max(margin, viewportWidth - rect.width - margin);
        }

        if (top + rect.height + margin > viewportHeight) {
            top = Math.max(margin, viewportHeight - rect.height - margin);
        }

        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        menu.style.visibility = "visible";
        menu.setAttribute("aria-hidden", "false");
    }

    function showDesignerContextMenu(component, clientX, clientY) {
        if (!component || isProtectedContextComponent(component)) {
            hideDesignerContextMenu();
            return;
        }

        contextComponent = component;
        editor.select(component);
        window.updatePropertiesPanel?.(component);

        updateContextMenuState(component);
        positionContextMenu(clientX, clientY);
    }

    function hideDesignerContextMenu() {
        const menu = contextMenu;
        if (!menu) return;

        menu.classList.remove("open");
        menu.style.visibility = "hidden";
        menu.setAttribute("aria-hidden", "true");
        contextComponent = null;
    }

    function bindCanvasContextMenu() {
        const frameElement = editor?.Canvas?.getFrameEl?.();
        const frameDocument = editor?.Canvas?.getDocument?.();

        if (!frameElement || !frameDocument || frameDocument.__designerContextMenuBound) {
            return;
        }

        frameDocument.__designerContextMenuBound = true;

        frameDocument.addEventListener("contextmenu", event => {
            const target = event.target;
            const component = target ? editor.getModelByEl?.(target) : null;

            if (!component || isProtectedContextComponent(component)) {
                hideDesignerContextMenu();
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const frameRect = frameElement.getBoundingClientRect();
            showDesignerContextMenu(
                component,
                frameRect.left + event.clientX,
                frameRect.top + event.clientY
            );
        }, true);

        frameDocument.addEventListener("mousedown", event => {
            if (event.button !== 2) hideDesignerContextMenu();
        }, true);

        frameDocument.addEventListener("scroll", hideDesignerContextMenu, true);
    }

    function bindGlobalContextMenuEvents() {
        if (contextMenuBound) return;
        contextMenuBound = true;

        document.addEventListener("mousedown", event => {
            if (!event.target.closest?.("#designerContextMenu")) {
                hideDesignerContextMenu();
            }
        }, true);

        document.addEventListener("scroll", hideDesignerContextMenu, true);
        window.addEventListener("resize", hideDesignerContextMenu);

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") hideDesignerContextMenu();
        });
    }

    function initializeContextMenu() {
        getContextMenu();
        bindGlobalContextMenuEvents();
        bindCanvasContextMenu();

        setTimeout(bindCanvasContextMenu, 300);
        setTimeout(bindCanvasContextMenu, 900);
    }

    if (typeof editor !== "undefined" && editor.on) {
        editor.on("load", initializeContextMenu);
        editor.on("canvas:frame:load", bindCanvasContextMenu);
        editor.on("component:remove", hideDesignerContextMenu);
        editor.on("component:deselected", hideDesignerContextMenu);
        setTimeout(initializeContextMenu, 500);
    }
})();


// =====================================================
// PROFESSIONAL SELECTION BOX / 8 RESIZE HANDLES
// Gerçek rapor bileşenlerinde GrapesJS resizer'ını etkinleştirir.
// Sayfa, band, tablo satırı/hücresi ve kilitli elemanlar korunur.
// =====================================================
(function initProfessionalSelectionBox() {
    let lastResizableComponent = null;

    function classNamesOf(component) {
        try {
            return (component?.getClasses?.() || [])
                .map(item => typeof item === "string" ? item : item?.getName?.())
                .filter(Boolean);
        } catch {
            return [];
        }
    }

    function normalizeSelectionComponent(component) {
        let current = component;
        let guard = 0;

        while (current && guard < 8) {
            const type = current.get?.("type");
            const tag = String(current.get?.("tagName") || "").toLowerCase();

            if (type !== "textnode" && tag) break;
            current = current.parent?.();
            guard += 1;
        }

        return current || component;
    }

    function isProtectedResizeComponent(component) {
        if (!component) return true;

        const attrs = component.getAttributes?.() || {};
        const classes = classNamesOf(component);
        const type = component.get?.("type");
        const tag = String(component.get?.("tagName") || "").toLowerCase();

        const structuralTags = [
            "body", "html", "thead", "tbody", "tfoot",
            "tr", "td", "th", "col", "colgroup"
        ];

        return type === "wrapper" ||
            structuralTags.includes(tag) ||
            attrs["data-designer-locked"] === "true" ||
            Boolean(attrs["data-band-type"]) ||
            classes.includes("report-band") ||
            classes.includes("band-caption") ||
            classes.includes("invoice-page") ||
            classes.includes("report-page") ||
            classes.includes("drop-zone") ||
            classes.includes("item-box") ||
            classes.includes("report-smart-tag");
    }

    function makeResizeConfig(component) {
        const attrs = component.getAttributes?.() || {};
        const classes = classNamesOf(component);
        const tag = String(component.get?.("tagName") || "").toLowerCase();
        const controlType = attrs["data-control-type"] || "";

        const isLine =
            controlType === "line" ||
            classes.includes("report-line") ||
            tag === "hr";

        if (isLine) {
            return {
                tl: 0, tc: 0, tr: 0,
                cl: 1, cr: 1,
                bl: 0, bc: 0, br: 0,
                keyWidth: "width",
                minDim: 8,
                step: 1
            };
        }

        return {
            tl: 1, tc: 1, tr: 1,
            cl: 1, cr: 1,
            bl: 1, bc: 1, br: 1,
            keyWidth: "width",
            keyHeight: "height",
            minDim: 12,
            step: 1
        };
    }

    function disableManagedResize(component) {
        if (!component || !component.get?.("__professionalResizeManaged")) return;

        component.set({
            resizable: false,
            __professionalResizeManaged: false
        });
    }

    function enableProfessionalResize(component) {
        component = normalizeSelectionComponent(component);

        if (!component || isProtectedResizeComponent(component)) {
            if (lastResizableComponent) {
                disableManagedResize(lastResizableComponent);
                lastResizableComponent = null;
            }
            return;
        }

        if (lastResizableComponent && lastResizableComponent !== component) {
            disableManagedResize(lastResizableComponent);
        }

        component.set({
            resizable: makeResizeConfig(component),
            __professionalResizeManaged: true
        });

        lastResizableComponent = component;

        // GrapesJS seçim overlay'ini yeni ayarla tekrar çizsin.
        requestAnimationFrame(() => {
            try {
                editor.refresh?.();
                editor.select(component);
            } catch (error) {
                console.warn("Resize tutamaçları yenilenemedi:", error);
            }
        });
    }

    editor.on("component:selected", enableProfessionalResize);

    editor.on("component:deselected", function (component) {
        component = normalizeSelectionComponent(component);

        if (component && component === lastResizableComponent) {
            disableManagedResize(component);
            lastResizableComponent = null;
        }
    });

    editor.on("component:remove", function (component) {
        if (component === lastResizableComponent) {
            lastResizableComponent = null;
        }
    });

    editor.on("load", function () {
        const selected = editor.getSelected?.();
        if (selected) enableProfessionalResize(selected);
    });
})();
