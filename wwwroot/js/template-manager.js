console.log("template-manager.js çalıştı");

(() => {
    "use strict";

    let currentTemplateId = 0;
    let currentTemplateName = "";
    let busy = false;

    const panel = () => document.getElementById("savedReportsPanel");

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function notify(message, type = "info") {
        let el = document.getElementById("templateManagerStatus");
        if (!el) {
            el = document.createElement("div");
            el.id = "templateManagerStatus";
            document.body.appendChild(el);
        }
        el.className = `template-manager-status ${type} show`;
        el.textContent = message;
        clearTimeout(el._timer);
        el._timer = setTimeout(() => el.classList.remove("show"), 2600);
    }

    function getPageSettings() {
        const settings = window.currentReportPageSettings || {};
        return {
            size: settings.size || "A4",
            orientation: settings.orientation || "portrait"
        };
    }

    function buildStoredData() {
        return {
            version: 3,
            html: editor.getHtml(),
            css: editor.getCss(),
            projectData: editor.getProjectData ? editor.getProjectData() : null,
            pageSettings: getPageSettings(),
            savedAt: new Date().toISOString()
        };
    }

    function parseStoredData(raw) {
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") return parsed;
        } catch (_) { }
        return { version: 1, html: raw, css: "", projectData: null, pageSettings: null };
    }

    function applyPageSettings(settings) {
        if (!settings) return;
        window.currentReportPageSettings = window.currentReportPageSettings || {};
        window.currentReportPageSettings.size = settings.size || "A4";
        window.currentReportPageSettings.orientation = settings.orientation || "portrait";

        localStorage.setItem("reportPageSize", window.currentReportPageSettings.size);
        localStorage.setItem("reportPageOrientation", window.currentReportPageSettings.orientation);

        const size = document.getElementById("pageSizeSelect");
        const orientation = document.getElementById("pageOrientationSelect");
        if (size) size.value = window.currentReportPageSettings.size;
        if (orientation) orientation.value = window.currentReportPageSettings.orientation;
    }

    async function restoreTemplate(stored) {
        applyPageSettings(stored.pageSettings);

        if (stored.projectData && editor.loadProjectData) {
            editor.loadProjectData(stored.projectData);
        } else {
            editor.DomComponents.clear();
            editor.setComponents(stored.html || "");
            if (editor.setStyle) editor.setStyle(stored.css || "");
        }

        document.getElementById("designerStartOverlay")?.style.setProperty("display", "none");
        window.applyPageSettingsToCurrentPage?.();
        window.normalizeCanvasPaper?.();

        setTimeout(() => {
            window.prepareTemplateDataFields?.();
            if (window.datasourceConnected) window.activateTemplateDataFields?.();
            window.refreshReportExplorer?.();
            window.updatePropertiesPanel?.(editor.getSelected?.());
        }, 180);
    }

    function render(items) {
        const root = panel();
        if (!root) return;

        const saved = items.length ? items.map(item => {
            const active = Number(item.id) === Number(currentTemplateId) ? " active" : "";
            const name = escapeHtml(item.templateName);
            return `
                <div class="saved-report-row${active}" data-template-id="${item.id}">
                    <button type="button" class="saved-report-open" data-open-template="${item.id}" title="Düzenlemek için aç">
                        <span class="saved-report-icon">📄</span>
                        <span class="saved-report-name">${name}</span>
                    </button>
                    <button type="button" class="saved-report-action" data-open-template="${item.id}" title="Düzenle">✎</button>
                    <button type="button" class="saved-report-action" data-rename-template="${item.id}" data-template-name="${name}" title="Yeniden adlandır">Aa</button>
                    <button type="button" class="saved-report-action delete" data-delete-template="${item.id}" data-template-name="${name}" title="Sil">🗑</button>
                </div>`;
        }).join("") : '<div class="saved-report-empty">Henüz kaydedilmiş rapor yok.</div>';

        root.innerHTML = `
            <div class="saved-report-title">HAZIR ŞABLONLAR</div>
            <button type="button" class="saved-report-built-in" data-built-in="zensoft">📄 <span>Zensoft Fatura</span></button>
            <button type="button" class="saved-report-built-in" data-built-in="adventure">📄 <span>Klasik Sipariş Faturası</span></button>
            <div class="saved-report-title saved">KAYDEDİLEN RAPORLAR</div>
            <div class="saved-report-list">${saved}</div>`;
    }

    async function refreshList() {
        const root = panel();
        if (!root) return;
        try {
            const response = await fetch("/Designer/GetTemplates", { cache: "no-store" });
            if (!response.ok) throw new Error(`Liste alınamadı (${response.status})`);
            const data = await response.json();
            render(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            root.innerHTML = '<div class="saved-report-empty error">Raporlar yüklenemedi.</div>';
        }
    }

    window.resetManagedTemplateSelection = function () {
        currentTemplateId = 0;
        currentTemplateName = "";
        setTimeout(refreshList, 80);
    };

    window.saveManagedTemplate = async function () {
        if (busy || typeof editor === "undefined") return;

        let name = currentTemplateName;
        if (!currentTemplateId) {
            const entered = window.prompt("Rapor adını gir:", "Yeni Rapor");
            if (entered === null) return;
            name = entered.trim();
            if (!name) {
                notify("Rapor adı boş olamaz.", "error");
                return;
            }
        }

        busy = true;
        try {
            const response = await fetch("/Designer/SaveTemplate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentTemplateId,
                    templateName: name,
                    templateJson: JSON.stringify(buildStoredData())
                })
            });

            if (!response.ok) throw new Error(await response.text() || `Kayıt başarısız (${response.status})`);
            const result = await response.json();
            currentTemplateId = result.templateId;
            currentTemplateName = result.templateName || name;
            await refreshList();
            notify(result.isNew ? "Rapor kaydedildi." : "Rapor güncellendi.", "success");
        } catch (error) {
            console.error(error);
            notify(`Kaydetme başarısız: ${error.message}`, "error");
        } finally {
            busy = false;
        }
    };

    async function openTemplate(id) {
        if (busy) return;
        busy = true;
        try {
            const response = await fetch(`/Designer/GetTemplateById?id=${encodeURIComponent(id)}`, { cache: "no-store" });
            if (!response.ok) throw new Error(`Rapor açılamadı (${response.status})`);
            const template = await response.json();
            const stored = parseStoredData(template.templateJson);
            if (!stored) throw new Error("Rapor verisi boş.");
            await restoreTemplate(stored);
            currentTemplateId = Number(template.id);
            currentTemplateName = template.templateName || "";
            await refreshList();
            notify("Rapor düzenlemeye açıldı.", "success");
        } catch (error) {
            console.error(error);
            notify(error.message || "Rapor açılamadı.", "error");
        } finally {
            busy = false;
        }
    }

    async function renameTemplate(id, oldName) {
        if (busy) return;
        const entered = window.prompt("Yeni rapor adını gir:", oldName || "");
        if (entered === null) return;
        const name = entered.trim();
        if (!name) return notify("Rapor adı boş olamaz.", "error");

        busy = true;
        try {
            const response = await fetch("/Designer/RenameTemplate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: Number(id), templateName: name })
            });
            if (!response.ok) throw new Error(await response.text() || `Ad değiştirilemedi (${response.status})`);
            if (Number(currentTemplateId) === Number(id)) currentTemplateName = name;
            await refreshList();
            notify("Rapor adı değiştirildi.", "success");
        } catch (error) {
            console.error(error);
            notify(`Ad değiştirme başarısız: ${error.message}`, "error");
        } finally {
            busy = false;
        }
    }

    async function deleteTemplate(id, name) {
        if (busy || !window.confirm(`“${name}” raporunu silmek istediğine emin misin?`)) return;
        busy = true;
        try {
            const response = await fetch(`/Designer/DeleteTemplate?id=${encodeURIComponent(id)}`, { method: "POST" });
            if (!response.ok) throw new Error(await response.text() || `Silinemedi (${response.status})`);
            if (Number(currentTemplateId) === Number(id)) {
                currentTemplateId = 0;
                currentTemplateName = "";
            }
            await refreshList();
            notify("Rapor silindi.", "success");
        } catch (error) {
            console.error(error);
            notify(`Silme başarısız: ${error.message}`, "error");
        } finally {
            busy = false;
        }
    }

    function bindEvents() {
        const root = panel();
        if (!root || root.dataset.bound === "1") return;
        root.dataset.bound = "1";
        root.addEventListener("click", event => {
            const builtIn = event.target.closest("[data-built-in]");
            if (builtIn) {
                currentTemplateId = 0;
                currentTemplateName = "";
                window.applyReportTemplate?.(builtIn.dataset.builtIn);
                return;
            }
            const open = event.target.closest("[data-open-template]");
            if (open) return openTemplate(open.dataset.openTemplate);
            const rename = event.target.closest("[data-rename-template]");
            if (rename) return renameTemplate(rename.dataset.renameTemplate, rename.dataset.templateName);
            const del = event.target.closest("[data-delete-template]");
            if (del) return deleteTemplate(del.dataset.deleteTemplate, del.dataset.templateName || "Rapor");
        });
    }

    function init() {
        bindEvents();
        refreshList();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();

    window.refreshSavedReportTemplates = refreshList;
})();
