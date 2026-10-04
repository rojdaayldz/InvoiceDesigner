console.log("properties_all_working.js çalıştı");

let selectedReportComponent = null;
let isUpdatingPropertyPanel = false;
let suppressPropertyEventsUntil = 0;

function isReportElement(el) {
    return el && el.matches && el.matches(".report-control, .report-table, .report-band, .report-line, .report-image, td, th, table, img");
}

function getSelectedReportComponent(component) {
    if (!component) return null;

    // GrapesJS bazen yazının kendisini "textnode" olarak seçer.
    // Bu durumda yalnızca doğrudan sahibi olan elementi seçiyoruz.
    // ÖNEMLİ: Eski kod el.closest(".report-band") yaptığı için başlığa
    // tıklanınca bütün Detail band seçiliyordu ve renk tüm alt elemanlara miras kalıyordu.
    let target = component;
    let guard = 0;

    while (target && guard < 10) {
        const type = target.get && target.get("type");
        const tag = target.get && target.get("tagName");

        if (type !== "textnode" && tag) break;
        target = target.parent && target.parent();
        guard++;
    }

    return target || component;
}

function getAttrs(component) {
    return component && component.getAttributes ? component.getAttributes() : {};
}

function getStyle(component) {
    return component && component.getStyle ? component.getStyle() : {};
}

function numberFromCss(value) {
    if (!value) return "";
    const match = String(value).match(/-?\d+/);
    return match ? match[0] : "";
}

function setInputValue(id, value) {
    const input = document.getElementById(id);
    if (!input) return;

    if (input.tagName === "SELECT" && id === "propSelected") {
        input.innerHTML = `<option>${value ?? "Seçili eleman yok"}</option>`;
        return;
    }

    input.value = value ?? "";
}

function setCheckboxValue(id, checked) {
    const input = document.getElementById(id);
    if (input) input.checked = !!checked;
}

function safeColor(value, fallback) {
    if (!value || value === "transparent") return fallback;
    if (String(value).startsWith("#")) return value;
    return fallback;
}

const TEXT_STYLE_KEYS = [
    "font-family",
    "font-size",
    "font-weight",
    "font-style",
    "text-decoration",
    "color",
    "text-align",
    "white-space",
    "word-break"
];

function componentHasClass(component, className) {
    if (!component) return false;

    try {
        if (component.getClasses) {
            return component.getClasses().includes(className);
        }

        const attrs = getAttrs(component);
        return String(attrs.class || "").split(/\s+/).includes(className);
    } catch {
        return false;
    }
}

// ÖNEMLİ: component.find() bütün alt elemanları döndürdüğü için
// bir başlık seçildiğinde aynı kapsayıcıdaki diğer yazılar da etkileniyordu.
// Burada yalnızca seçilen component'in DOĞRUDAN text span'ını alıyoruz.
function getTextChildren(component) {
    if (!component || !component.components) return [];

    try {
        const collection = component.components();
        const children = collection && collection.models ? collection.models : [];
        return children.filter(child => componentHasClass(child, "report-control-text"));
    } catch {
        return [];
    }
}

function getTextStyle(component) {
    const directText = getTextChildren(component)[0];
    if (directText && directText.getStyle) {
        return directText.getStyle() || {};
    }
    return getStyle(component);
}

function clearOuterInheritedTextStyles(component, keys) {
    if (!component || !component.getStyle || !component.setStyle) return;

    const current = { ...(component.getStyle() || {}) };
    let changed = false;

    keys.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
            delete current[key];
            changed = true;
        }
    });

    if (changed) component.setStyle(current);

    const el = component.getEl && component.getEl();
    if (el && el.style) {
        keys.forEach(key => el.style.removeProperty(key));
    }
}

function applyStyleToText(component, styles) {
    if (!component) return;

    // Bir grup/kapsayıcı seçildiyse metin stilini asla üst elemana yazma.
    // Aksi halde color/font-size bütün alt elemanlara miras kalır.
    if (getComponentKind(component) === "text-group" || getComponentKind(component) === "band" || getComponentKind(component) === "body") {
        return;
    }

    const textChildren = getTextChildren(component);
    const styleKeys = Object.keys(styles);

    if (textChildren.length > 0) {
        // Eski sürümün dış kapsayıcıya yazdığı font/renk stillerini temizle.
        // Böylece CSS inheritance ile kardeş ve alt alanlar etkilenmez.
        clearOuterInheritedTextStyles(component, styleKeys);

        textChildren.forEach(child => {
            if (child && child.addStyle) child.addStyle(styles);
        });

        const el = component.getEl && component.getEl();
        if (el) {
            const directSpan = Array.from(el.children || []).find(child =>
                child.classList && child.classList.contains("report-control-text")
            );
            if (directSpan) Object.assign(directSpan.style, styles);
        }
        return;
    }

    // Doğrudan text span'ı olmayan gerçek metin elemanlarında yalnızca
    // seçili component'in kendisine uygula.
    if (component.addStyle) component.addStyle(styles);

    const el = component.getEl && component.getEl();
    if (el) Object.assign(el.style, styles);
}

function applyOuterStyle(component, styles) {
    if (!component || !component.addStyle) return;
    component.addStyle(styles);

    const el = component.getEl && component.getEl();
    if (el) Object.assign(el.style, styles);
}

function buildControlInnerHtml(text, binding) {
    const visibleText = binding ? `{{${binding}}}` : (text || "");
    return `
        <span class="report-control-text">${visibleText}</span>
        <span class="report-smart-tag" title="Data Binding">●</span>
    `;
}

function updateComponentText(component, text) {
    if (!component) return;

    const attrs = getAttrs(component);
    const binding = attrs["data-binding"] || "";

    component.addAttributes({
        "data-text": text || ""
    });

    const controlType = attrs["data-control-type"];

    if (controlType === "label" || controlType === "cell" || component.get("tagName") === "td") {
        component.components(buildControlInnerHtml(text, binding));
        // Yazı yeniden oluştuğu için mevcut font stillerini tekrar iç span'a basıyoruz.
        applyCurrentTextStyles(component);
    } else if (component.components && !binding) {
        component.components(text || "");
    }
}

function applyCurrentTextStyles(component) {
    const style = { ...getStyle(component), ...getTextStyle(component) };
    const textStyles = {};

    ["font-family", "font-size", "font-weight", "font-style", "text-decoration", "color", "text-align", "white-space"].forEach(k => {
        if (style[k]) textStyles[k] = style[k];
    });

    if (Object.keys(textStyles).length > 0) {
        applyStyleToText(component, textStyles);
    }
}

function describeComponent(component) {
    const attrs = getAttrs(component);
    const tag = component.get && component.get("tagName");
    const type = attrs["data-control-type"] || attrs["data-band-type"] || tag || "component";
    const name = attrs["data-name"] || type;

    let dxType = "Component";
    if (type === "label") dxType = "XRLabel";
    else if (type === "cell") dxType = "XRTableCell";
    else if (type === "table") dxType = "XRTable";
    else if (type === "image") dxType = "XRPictureBox";
    else if (type === "line") dxType = "XRLine";
    else if (attrs["data-band-type"]) dxType = "Band";

    return `${name} (${dxType})`;
}



/* ================================
   CONTEXTUAL PROPERTY VISIBILITY
   Seçilen componente göre sağ panelde gereksiz grupları gizler.
================================ */

function hasNestedEditableControls(component) {
    const el = component && component.getEl && component.getEl();
    if (!el || !el.querySelector) return false;

    // Seçili elementin içinde ayrıca düzenlenebilir başka kontroller varsa
    // bu element bir grup/kapsayıcıdır. Metin rengi/fontu bu kapsayıcıya
    // uygulanırsa CSS inheritance nedeniyle bütün çocuklar değişir.
    return !!el.querySelector(":scope [data-control-type], :scope .report-control");
}

function getComponentKind(component) {
    if (!component) return "none";

    const attrs = getAttrs(component);
    const tag = component.get && component.get("tagName");
    const controlType = attrs["data-control-type"] || "";
    const bandType = attrs["data-band-type"] || "";

    if (tag === "body" || attrs.id === "wrapper") return "body";
    if (bandType || controlType === "band") return "band";
    if (controlType === "text" && hasNestedEditableControls(component)) return "text-group";
    if (controlType === "text" || controlType === "label" || controlType === "cell" || tag === "td" || tag === "th") return "text";
    if (controlType === "table" || tag === "table") return "table";
    if (controlType === "image" || tag === "img") return "image";
    if (controlType === "line") return "line";

    return "component";
}

function findPropGroup(titleText) {
    const wanted = titleText.toLowerCase();

    return Array.from(document.querySelectorAll(".prop-group")).find(group => {
        const title = group.querySelector(".prop-group-title");
        return title && title.textContent.toLowerCase().includes(wanted);
    });
}

function setPropGroupVisible(titleText, visible) {
    const group = findPropGroup(titleText);
    if (group) group.style.display = visible ? "block" : "none";
}

function setPropControlVisible(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;

    const row = el.closest(".prop-row, .property-row, .form-group, .prop-field, .property-item");
    if (row) {
        row.style.display = visible ? "" : "none";
    } else {
        el.style.display = visible ? "" : "none";
    }
}

function updatePropertyGroupVisibility(component) {
    const kind = getComponentKind(component);

    // Önce hepsini aç.
    ["actions", "data", "text", "appearance", "layout"].forEach(name => {
        setPropGroupVisible(name, true);
    });

    // Input bazında özel alanlar.
    [
        "propText",
        "propFormat",
        "propRepeatSource",
        "propFontFamily",
        "propFontSize",
        "propAlign",
        "propBold",
        "propItalic",
        "propUnderline",
        "propColor"
    ].forEach(id => setPropControlVisible(id, true));

    if (kind === "none") {
        ["actions", "data", "text", "appearance", "layout"].forEach(name => {
            setPropGroupVisible(name, false);
        });
        return;
    }

    if (kind === "body") {
        setPropGroupVisible("actions", false);
        setPropGroupVisible("data", false);
        setPropGroupVisible("text", false);
        return;
    }

    if (kind === "band") {
        setPropGroupVisible("data", false);
        setPropGroupVisible("text", false);
        return;
    }

    if (kind === "text-group") {
        // Grid/panel gibi kapsayıcılara font veya renk uygulanmasına izin verme.
        // Böylece altındaki diğer alanlar miras yoluyla etkilenmez.
        setPropGroupVisible("text", false);
        setPropGroupVisible("appearance", false);
        return;
    }

    if (kind === "table") {
        setPropGroupVisible("text", false);
        setPropControlVisible("propRepeatSource", true);
        return;
    }

    if (kind === "image") {
        setPropGroupVisible("data", false);
        setPropGroupVisible("text", false);
        return;
    }

    if (kind === "line") {
        setPropGroupVisible("data", false);
        setPropGroupVisible("text", false);
        setPropControlVisible("propFontFamily", false);
        setPropControlVisible("propFontSize", false);
        setPropControlVisible("propAlign", false);
        setPropControlVisible("propBold", false);
        setPropControlVisible("propItalic", false);
        setPropControlVisible("propUnderline", false);
        setPropControlVisible("propColor", false);
        return;
    }

    // Label / cell için her şey açık kalır.
}

function blurActivePropertyEditor() {
    const active = document.activeElement;
    if (!active) return;

    const propertiesPanel = active.closest && active.closest(".dx-properties");
    if (propertiesPanel && typeof active.blur === "function") {
        active.blur();
    }
}

window.updatePropertiesPanel = function (component) {
    // Renk inputu açıkken başka elemana tıklanınca tarayıcı son bir "input/change"
    // olayı gönderebilir. Önce editörü kapatıp kısa süre property olaylarını susturuyoruz.
    blurActivePropertyEditor();
    suppressPropertyEventsUntil = Date.now() + 350;

    component = getSelectedReportComponent(component);
    selectedReportComponent = component;
    isUpdatingPropertyPanel = true;

    if (!component) {
        setInputValue("propSelected", "Seçili eleman yok");
        isUpdatingPropertyPanel = false;
        return;
    }

    const attrs = getAttrs(component);
    const style = getStyle(component);
    const textStyle = getTextStyle(component);
    const name = attrs["data-name"] || attrs["data-control-type"] || attrs["data-band-type"] || component.get("tagName") || "component";

    setInputValue("propSelected", describeComponent(component));
    setInputValue("propName", name);
    setInputValue("propText", attrs["data-text"] || "");
    setInputValue("propBinding", attrs["data-binding"] || "");
    setInputValue("propRepeatSource", attrs["data-repeat-source"] || attrs["data-detail-source"] || "");
    setInputValue("propFormat", attrs["data-format"] || "text");

    setInputValue("propFontFamily", textStyle["font-family"] || style["font-family"] || "Segoe UI");
    setInputValue("propFontSize", numberFromCss(textStyle["font-size"] || style["font-size"]) || 12);
    setInputValue("propAlign", textStyle["text-align"] || style["text-align"] || "left");

    setCheckboxValue("propBold", textStyle["font-weight"] === "700" || textStyle["font-weight"] === "bold" || style["font-weight"] === "700" || style["font-weight"] === "bold");
    setCheckboxValue("propItalic", textStyle["font-style"] === "italic" || style["font-style"] === "italic");
    setCheckboxValue("propUnderline", String(textStyle["text-decoration"] || style["text-decoration"] || "").includes("underline"));

    setInputValue("propColor", safeColor(textStyle.color || style.color, "#111827"));
    setInputValue("propBackground", safeColor(style["background-color"], "#ffffff"));
    setInputValue("propBorderStyle", style["border-style"] || "none");
    setInputValue("propBorderColor", safeColor(style["border-color"], "#111827"));
    setInputValue("propBorderWidth", numberFromCss(style["border-width"]) || 1);

    setInputValue("propX", numberFromCss(style.left));
    setInputValue("propY", numberFromCss(style.top));
    setInputValue("propWidth", numberFromCss(style.width));
    setInputValue("propHeight", numberFromCss(style.height || style["min-height"]));
    setInputValue("propPadding", numberFromCss(style.padding));
    setInputValue("propMargin", numberFromCss(style.margin));

    setCheckboxValue("propMultiline", (textStyle["white-space"] || style["white-space"]) !== "nowrap");
    setCheckboxValue("propWordWrap", (textStyle["word-break"] || style["word-break"]) !== "normal");
    setCheckboxValue("propVisible", style.display !== "none");
    setCheckboxValue("propCanGrow", attrs["data-can-grow"] !== "false");

    updatePropertyGroupVisibility(component);

    isUpdatingPropertyPanel = false;
};

function applyPropertyChange(callback, explicitTarget) {
    const target = explicitTarget || selectedReportComponent;
    if (isUpdatingPropertyPanel || Date.now() < suppressPropertyEventsUntil || !target) return;

    callback(target);

    if (editor && editor.trigger) {
        editor.trigger("component:update", target);
        editor.trigger("change:canvasOffset");
    }
}

function bindInput(id, eventName, callback) {
    const input = document.getElementById(id);
    if (!input || input.dataset.propertyBound === "1") return;
    input.dataset.propertyBound = "1";

    // Property düzenlemeye başladığımız anda hedef component'i sabitle.
    // Kullanıcı renk seçiciyi kapatırken başka elemana tıklasa bile son event
    // yeni seçilene değil, düzenlemeye başladığı eski elemana gider.
    const freezeTarget = function () {
        input._propertyTarget = selectedReportComponent;
    };

    input.addEventListener("pointerdown", freezeTarget);
    input.addEventListener("focus", freezeTarget);

    input.addEventListener(eventName, function (event) {
        // Özellikle color input, pencere kapandıktan sonra gecikmeli bir son event gönderebilir.
        // Hedefi pointerdown/focus anında sabitlediğimiz component olarak tutuyoruz.
        // Böylece kullanıcı bu sırada başka bir elemana tıklasa bile eski renk yeni elemana taşınmaz.
        const target = input._propertyTarget;
        if (!target) return;

        applyPropertyChange(component => callback(component, input), target);

        // Select/checkbox gibi tek seferlik kontrollerde işlem bitince hedefi bırak.
        // Color ve yazı alanlarında blur sonrası gecikmeli event gelebileceği için burada bırakmıyoruz.
        if (input.type !== "color" && eventName === "change") {
            input._propertyTarget = null;
        }
    });

    input.addEventListener("blur", function () {
        // Hemen temizleme: color picker kapanırken son input/change event'i blur'dan sonra gelebilir.
        // Bir süre eski hedefi koru; böylece yeni seçilen component yanlışlıkla etkilenmez.
        const frozenTarget = input._propertyTarget;
        setTimeout(() => {
            if (input._propertyTarget === frozenTarget) {
                input._propertyTarget = null;
            }
        }, 1000);
    });
}

function initAccordion() {
    document.querySelectorAll(".prop-group-title").forEach(button => {
        if (button.dataset.bound === "1") return;
        button.dataset.bound = "1";

        button.addEventListener("click", function () {
            const group = this.closest(".prop-group");
            const isOpen = group.classList.toggle("open");
            this.setAttribute("aria-expanded", String(isOpen));
        });
    });
}

function initPropertySearch() {
    const search = document.getElementById("propSearch");
    if (!search || search.dataset.bound === "1") return;
    search.dataset.bound = "1";

    search.addEventListener("input", function () {
        const term = this.value.toLowerCase().trim();
        document.querySelectorAll(".prop-group").forEach(group => {
            const text = group.textContent.toLowerCase();
            group.style.display = !term || text.includes(term) ? "block" : "none";
        });
    });
}



// ================================
// COMPONENT ACTIONS
// ================================
let copiedComponentStyle = null;

function isProtectedReportComponent(component) {
    if (!component) return true;
    const attrs = getAttrs(component);
    const type = component.get && component.get("type");
    const tag = component.get && component.get("tagName");

    return type === "wrapper" || tag === "body" ||
        !!attrs["data-band-type"] ||
        componentHasClass(component, "invoice-page") ||
        componentHasClass(component, "report-page");
}

function refreshAfterComponentAction(component) {
    if (component && editor && editor.select) editor.select(component);
    window.refreshReportExplorer?.();
    window.updatePropertiesPanel?.(component || null);
    editor?.trigger?.("change:canvasOffset");
}

function updateActionButtonStates(component) {
    const lockButton = document.getElementById("toggleLockBtn");
    const visibilityButton = document.getElementById("toggleVisibilityBtn");
    const pasteButton = document.getElementById("pasteStyleBtn");
    const protectedComponent = isProtectedReportComponent(component);

    document.querySelectorAll("#duplicateComponentBtn, #deleteComponentBtn, #toggleLockBtn, #toggleVisibilityBtn, #copyStyleBtn")
        .forEach(button => { if (button) button.disabled = !component || protectedComponent; });

    if (pasteButton) pasteButton.disabled = !component || protectedComponent || !copiedComponentStyle;

    if (lockButton) {
        const locked = getAttrs(component)["data-designer-locked"] === "true";
        lockButton.querySelector(".property-action-icon").textContent = locked ? "🔓" : "🔒";
        lockButton.querySelector(".property-action-text").textContent = locked ? "Kilidi Aç" : "Kilitle";
        lockButton.classList.toggle("active", locked);
    }

    if (visibilityButton) {
        const hidden = getAttrs(component)["data-designer-hidden"] === "true";
        visibilityButton.querySelector(".property-action-icon").textContent = hidden ? "◌" : "◉";
        visibilityButton.querySelector(".property-action-text").textContent = hidden ? "Göster" : "Gizle";
        visibilityButton.classList.toggle("active", hidden);
    }
}

function bindComponentActions() {
    const bindClick = (id, callback) => {
        const button = document.getElementById(id);
        if (!button || button.dataset.actionBound === "1") return;
        button.dataset.actionBound = "1";
        button.addEventListener("click", callback);
    };

    bindClick("duplicateComponentBtn", function () {
        const component = selectedReportComponent;
        if (!component || isProtectedReportComponent(component)) return;

        const parent = component.parent?.();
        if (!parent || !component.clone) return;

        const clone = component.clone();
        const style = { ...(component.getStyle?.() || {}) };
        const left = numberFromCss(style.left);
        const top = numberFromCss(style.top);

        if (left !== "") style.left = `${Number(left) + 18}px`;
        if (top !== "") style.top = `${Number(top) + 18}px`;
        clone.setStyle?.(style);

        parent.append(clone);
        setTimeout(() => refreshAfterComponentAction(clone), 0);
    });

    bindClick("deleteComponentBtn", function () {
        const component = selectedReportComponent;
        if (!component || isProtectedReportComponent(component)) return;
        if (!window.confirm("Seçili eleman silinsin mi?")) return;

        selectedReportComponent = null;
        component.remove?.();
        refreshAfterComponentAction(null);
    });

    bindClick("toggleLockBtn", function () {
        const component = selectedReportComponent;
        if (!component || isProtectedReportComponent(component)) return;

        const locked = getAttrs(component)["data-designer-locked"] === "true";
        component.addAttributes({ "data-designer-locked": locked ? "false" : "true" });
        component.set({
            draggable: locked,
            resizable: locked,
            editable: locked,
            selectable: true,
            hoverable: true
        });
        updateActionButtonStates(component);
        refreshAfterComponentAction(component);
    });

    bindClick("toggleVisibilityBtn", function () {
        const component = selectedReportComponent;
        if (!component || isProtectedReportComponent(component)) return;

        const hidden = getAttrs(component)["data-designer-hidden"] === "true";
        component.addAttributes({ "data-designer-hidden": hidden ? "false" : "true" });

        // Tasarım ekranında gizlenen eleman hafif silik kalır; böylece tekrar seçilip gösterilebilir.
        // Preview/PDF tarafında data-designer-hidden=true olan eleman CSS ile tamamen gizlenir.
        applyOuterStyle(component, {
            opacity: hidden ? "1" : "0.18",
            "pointer-events": "auto"
        });
        updateActionButtonStates(component);
        refreshAfterComponentAction(component);
    });

    bindClick("copyStyleBtn", function () {
        const component = selectedReportComponent;
        if (!component || isProtectedReportComponent(component)) return;

        copiedComponentStyle = JSON.parse(JSON.stringify(component.getStyle?.() || {}));
        updateActionButtonStates(component);
    });

    bindClick("pasteStyleBtn", function () {
        const component = selectedReportComponent;
        if (!component || isProtectedReportComponent(component) || !copiedComponentStyle) return;

        // Konumu ve ölçüyü koruyup görsel stili yapıştır.
        const excluded = new Set(["position", "left", "top", "right", "bottom", "width", "height", "min-height", "transform", "z-index"]);
        const visualStyle = {};
        Object.entries(copiedComponentStyle).forEach(([key, value]) => {
            if (!excluded.has(key)) visualStyle[key] = value;
        });
        applyOuterStyle(component, visualStyle);
        refreshAfterComponentAction(component);
    });
}

function initPropertiesPanel() {
    initAccordion();
    initPropertySearch();
    bindComponentActions();

    editor.on("component:selected", component => {
        window.updatePropertiesPanel(component);
        updateActionButtonStates(getSelectedReportComponent(component));
    });

    editor.on("component:deselected", () => {
        selectedReportComponent = null;
        setInputValue("propSelected", "Seçili eleman yok");
        updatePropertyGroupVisibility(null);
        updateActionButtonStates(null);
    });

    bindInput("propName", "input", (component, input) => {
        component.addAttributes({ "data-name": input.value });
        setInputValue("propSelected", describeComponent(component));
    });

    bindInput("propText", "input", (component, input) => {
        updateComponentText(component, input.value);
    });

    bindInput("propFormat", "change", (component, input) => {
        component.addAttributes({ "data-format": input.value });
    });

    bindInput("propRepeatSource", "input", (component, input) => {
        component.addAttributes({ "data-repeat-source": input.value });

        const el = component.getEl && component.getEl();
        if (el && el.matches && el.matches("table")) {
            const row = el.querySelector("tbody tr");
            if (row) row.setAttribute("data-repeat-row", input.value || "items");
        }
    });

    bindInput("propFontFamily", "change", (component, input) => {
        applyStyleToText(component, { "font-family": input.value });
    });

    bindInput("propFontSize", "input", (component, input) => {
        applyStyleToText(component, { "font-size": `${input.value || 12}px` });
    });

    bindInput("propAlign", "change", (component, input) => {
        applyStyleToText(component, { "text-align": input.value });
        applyOuterStyle(component, { "justify-content": input.value === "center" ? "center" : input.value === "right" ? "flex-end" : "flex-start" });
    });

    bindInput("propBold", "change", (component, input) => {
        applyStyleToText(component, { "font-weight": input.checked ? "700" : "400" });
    });

    bindInput("propItalic", "change", (component, input) => {
        applyStyleToText(component, { "font-style": input.checked ? "italic" : "normal" });
    });

    bindInput("propUnderline", "change", (component, input) => {
        applyStyleToText(component, { "text-decoration": input.checked ? "underline" : "none" });
    });

    bindInput("propColor", "input", (component, input) => {
        applyStyleToText(component, { "color": input.value });
    });

    bindInput("propBackground", "input", (component, input) => {
        applyOuterStyle(component, { "background-color": input.value });
    });

    function updateBorder(component) {
        const style = document.getElementById("propBorderStyle")?.value || "none";
        const width = document.getElementById("propBorderWidth")?.value || 1;
        const color = document.getElementById("propBorderColor")?.value || "#111827";

        if (style === "none") {
            applyOuterStyle(component, {
                "border-style": "none",
                "border-width": "0px"
            });
        } else {
            applyOuterStyle(component, {
                "border-style": style,
                "border-width": `${width}px`,
                "border-color": color,
                "border": `${width}px ${style} ${color}`
            });
        }
    }

    ["propBorderStyle", "propBorderColor", "propBorderWidth"].forEach(id => {
        bindInput(id, id === "propBorderStyle" ? "change" : "input", component => updateBorder(component));
    });

    bindInput("propWidth", "input", (component, input) => {
        if (input.value) applyOuterStyle(component, { "width": `${input.value}px` });
    });

    bindInput("propHeight", "input", (component, input) => {
        if (input.value) applyOuterStyle(component, { "height": `${input.value}px`, "min-height": `${input.value}px` });
    });

    bindInput("propPadding", "input", (component, input) => {
        applyOuterStyle(component, { "padding": `${input.value || 0}px` });
    });

    bindInput("propMargin", "input", (component, input) => {
        applyOuterStyle(component, { "margin": `${input.value || 0}px` });
    });

    bindInput("propX", "input", (component, input) => {
        if (input.value !== "") applyOuterStyle(component, { "position": "absolute", "left": `${input.value}px` });
    });

    bindInput("propY", "input", (component, input) => {
        if (input.value !== "") applyOuterStyle(component, { "position": "absolute", "top": `${input.value}px` });
    });

    bindInput("propMultiline", "change", (component, input) => {
        applyStyleToText(component, { "white-space": input.checked ? "pre-wrap" : "nowrap" });
    });

    bindInput("propWordWrap", "change", (component, input) => {
        applyStyleToText(component, { "word-break": input.checked ? "break-word" : "normal" });
    });

    bindInput("propVisible", "change", (component, input) => {
        applyOuterStyle(component, { "display": input.checked ? "" : "none" });
    });

    bindInput("propCanGrow", "change", (component, input) => {
        component.addAttributes({ "data-can-grow": input.checked ? "true" : "false" });
        applyOuterStyle(component, { "overflow": input.checked ? "visible" : "hidden" });
    });

    const clearBtn = document.getElementById("clearBindingBtn");
    if (clearBtn && clearBtn.dataset.bound !== "1") {
        clearBtn.dataset.bound = "1";
        clearBtn.addEventListener("click", function () {
            applyPropertyChange(component => {
                if (typeof component.clearBinding === "function") {
                    component.clearBinding();
                } else {
                    component.addAttributes({ "data-binding": "", "data-field": "" });
                    const attrs = getAttrs(component);
                    component.components(buildControlInnerHtml(attrs["data-text"] || "", ""));
                }
                window.updatePropertiesPanel(component);
            });
        });
    }

    const bringFrontBtn = document.getElementById("bringFrontBtn");
    if (bringFrontBtn && bringFrontBtn.dataset.bound !== "1") {
        bringFrontBtn.dataset.bound = "1";
        bringFrontBtn.addEventListener("click", () => {
            applyPropertyChange(component => applyOuterStyle(component, { "z-index": "20" }));
        });
    }

    const sendBackBtn = document.getElementById("sendBackBtn");
    if (sendBackBtn && sendBackBtn.dataset.bound !== "1") {
        sendBackBtn.dataset.bound = "1";
        sendBackBtn.addEventListener("click", () => {
            applyPropertyChange(component => applyOuterStyle(component, { "z-index": "1" }));
        });
    }

    window.updatePropertiesPanel(editor.getSelected && editor.getSelected());
    updateActionButtonStates(getSelectedReportComponent(editor.getSelected && editor.getSelected()));
}

function waitAndInitProperties() {
    if (typeof editor === "undefined") {
        setTimeout(waitAndInitProperties, 100);
        return;
    }

    if (editor.on) {
        editor.on("load", initPropertiesPanel);
        // Editor zaten yüklenmişse de bağla.
        setTimeout(initPropertiesPanel, 300);
    }
}

waitAndInitProperties();
