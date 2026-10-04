console.log("reportExplorer.js çalıştı - Band System");

(function () {
    const BAND_LABELS = {
        reportHeader: "Report Header",
        pageHeader: "Page Header",
        header: "Header",
        detail: "Detail",
        footer: "Footer",
        pageFooter: "Page Footer",
        reportFooter: "Report Footer"
    };

    const BAND_ORDER = [
        "reportHeader",
        "pageHeader",
        "header",
        "detail",
        "footer",
        "pageFooter",
        "reportFooter",
        "other"
    ];

    function waitForEditor(callback) {
        if (typeof editor === "undefined" || !editor.getWrapper) {
            setTimeout(() => waitForEditor(callback), 150);
            return;
        }
        setTimeout(callback, 400);
    }

    function getAttrs(component) {
        return component && component.getAttributes ? component.getAttributes() : {};
    }

    function getTag(component) {
        return component && component.get ? (component.get("tagName") || "component") : "component";
    }

    function getDxType(component) {
        const attrs = getAttrs(component);
        const type = attrs["data-control-type"];
        const band = attrs["data-band-type"];
        const tag = getTag(component);

        if (attrs["data-dx-type"]) return attrs["data-dx-type"];
        if (band && BAND_LABELS[band]) return BAND_LABELS[band].replace(/\s/g, "") + "Band";
        if (attrs["data-field"] || type === "title" || type === "text" || type === "label" || type === "field") return "XRLabel";
        if (type === "cell") return "XRTableCell";
        if (type === "items-table" || type === "table" || tag === "table") return "XRTable";
        if (type === "image" || tag === "img") return "XRPictureBox";
        if (type === "shape") return "XRShape";
        if (type === "line") return "XRLine";
        if (type === "checkbox") return "XRCheckBox";
        if (type === "barcode") return "XRBarCode";
        if (type === "qrcode") return "XRQRCode";
        if (type === "summary") return "XRSummary";
        return "XRControl";
    }

    function getIcon(dxType) {
        if (dxType === "XRLabel") return "A";
        if (dxType === "XRTable" || dxType === "XRTableCell") return "▦";
        if (dxType === "XRPictureBox") return "▧";
        if (dxType === "XRShape") return "□";
        if (dxType === "XRLine") return "╱";
        if (dxType === "XRCheckBox") return "☑";
        if (dxType === "XRBarCode") return "▌";
        if (dxType === "XRQRCode") return "QR";
        if (dxType === "XRSummary") return "Σ";
        if (String(dxType).includes("Band")) return "▤";
        return "□";
    }

    function getName(component, index) {
        const attrs = getAttrs(component);
        const dxType = getDxType(component);
        const tag = getTag(component);
        const band = attrs["data-band-type"];

        if (band && BAND_LABELS[band]) return BAND_LABELS[band];

        if (attrs["data-name"] && attrs["data-name"] !== "label" && attrs["data-name"] !== "cell") {
            return attrs["data-name"];
        }

        if (attrs["data-binding"]) {
            return attrs["data-binding"].split(".").pop();
        }

        if (attrs["data-field"]) {
            return attrs["data-field"].split(".").pop();
        }

        if (dxType === "XRPictureBox") return "pictureBox" + index;
        if (dxType === "XRTable") return "table" + index;
        if (dxType === "XRTableCell") return "cell" + index;
        if (dxType === "XRLabel") return "label" + index;
        if (dxType === "XRShape") return "shape" + index;
        if (dxType === "XRLine") return "line" + index;
        if (String(dxType).includes("Band")) return dxType;
        return tag + index;
    }

    function isReportComponent(component) {
        const attrs = getAttrs(component);
        const tag = getTag(component);
        return Boolean(
            attrs["data-control-type"] ||
            attrs["data-band-type"] ||
            attrs["data-binding"] ||
            attrs["data-field"] ||
            attrs["data-dx-type"] ||
            tag === "table" ||
            tag === "img"
        );
    }

    function getBandKey(component) {
        const attrs = getAttrs(component);
        if (attrs["data-band-type"] && BAND_LABELS[attrs["data-band-type"]]) {
            return attrs["data-band-type"];
        }

        const el = component.getEl && component.getEl();
        if (!el) return "other";

        const bandEl = el.closest && el.closest(".report-band[data-band-type]");
        if (!bandEl) return "other";

        const bandType = bandEl.getAttribute("data-band-type");
        return BAND_LABELS[bandType] ? bandType : "other";
    }

    function createNode(component, index) {
        const dxType = getDxType(component);
        const name = getName(component, index);

        const row = document.createElement("div");
        row.className = "report-explorer-item";
        row.dataset.cid = component.cid;
        row.innerHTML = `
            <span class="rx-icon">${getIcon(dxType)}</span>
            <span class="rx-text" title="${name}">${name}</span>
            <span class="rx-type">${dxType}</span>
        `;

        row.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            editor.select(component);
            if (window.updatePropertiesPanel) window.updatePropertiesPanel(component);
            markSelected(component);
        });

        return row;
    }

    function markSelected(component) {
        const panel = document.getElementById("report-explorer-panel");
        if (!panel || !component) return;

        panel.querySelectorAll(".report-explorer-item").forEach(item => {
            item.classList.toggle("selected", item.dataset.cid === component.cid);
        });
    }

    function renderGroup(panel, title, items) {
        if (!items.length) return;

        const group = document.createElement("div");
        group.className = "rx-group open";
        group.innerHTML = `<div class="rx-group-title">▾ ${title}</div>`;

        const body = document.createElement("div");
        body.className = "rx-group-body";

        items.forEach((component, index) => body.appendChild(createNode(component, index + 1)));
        group.appendChild(body);

        group.querySelector(".rx-group-title").addEventListener("click", function () {
            group.classList.toggle("open");
            this.textContent = (group.classList.contains("open") ? "▾ " : "▸ ") + title;
        });

        panel.appendChild(group);
    }

    window.refreshReportExplorer = function () {
        const panel = document.getElementById("report-explorer-panel");
        if (!panel) return;

        panel.innerHTML = `<div class="report-explorer-title">📄 InvoiceReport</div>`;

        const wrapper = editor.getWrapper && editor.getWrapper();
        const all = wrapper && wrapper.find ? wrapper.find("*") : [];
        const components = all.filter(isReportComponent);

        if (!components.length) {
            panel.innerHTML += `<div class="rx-empty">Rapor elemanı yok</div>`;
            return;
        }

        const groups = {
            reportHeader: [],
            pageHeader: [],
            header: [],
            detail: [],
            footer: [],
            pageFooter: [],
            reportFooter: [],
            other: []
        };

        components.forEach(component => {
            groups[getBandKey(component)].push(component);
        });

        BAND_ORDER.forEach(key => {
            renderGroup(panel, key === "other" ? "Other Controls" : BAND_LABELS[key], groups[key]);
        });

        if (editor.getSelected) markSelected(editor.getSelected());
    };

    function init() {
        window.refreshReportExplorer();
        editor.on("component:selected", component => markSelected(component));
        editor.on("component:add", () => setTimeout(window.refreshReportExplorer, 150));
        editor.on("component:remove", () => setTimeout(window.refreshReportExplorer, 150));
        editor.on("component:update", () => setTimeout(window.refreshReportExplorer, 200));
    }

    waitForEditor(init);
})();
