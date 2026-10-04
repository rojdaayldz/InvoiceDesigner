console.log("datasource.js çalıştı - SAFE FIX");

let draggedFieldPath = null;
window.datasourceConnected = window.datasourceConnected || false;

function getFieldToken(fieldPath) {
    return fieldPath ? `[${fieldPath}]` : "";
}

window.activateTemplateDataFields = function activateTemplateDataFields() {
    if (typeof editor === "undefined" || !editor.Canvas) return;

    const body = editor.Canvas.getBody && editor.Canvas.getBody();
    if (!body) return;

    body.querySelectorAll("[data-field]").forEach(el => {
        const field = el.getAttribute("data-field");
        if (!field) return;

        el.classList.remove("unbound-template-field");
        el.classList.add("bound-field");

        if (!el.getAttribute("data-binding")) {
            el.setAttribute("data-binding", field);
        }

        const token = getFieldToken(field);
        const textEl = el.querySelector && el.querySelector(".report-control-text");

        if (textEl) {
            if (!textEl.textContent.trim()) textEl.textContent = token;
        } else if (!el.textContent.trim()) {
            el.textContent = token;
        }
    });

    if (window.refreshReportExplorer && typeof window.refreshReportExplorer === "function") {
        setTimeout(window.refreshReportExplorer, 100);
    }
};

window.prepareTemplateDataFields = function prepareTemplateDataFields() {
    if (typeof editor === "undefined" || !editor.Canvas) return;

    const body = editor.Canvas.getBody && editor.Canvas.getBody();
    if (!body) return;

    body.querySelectorAll("[data-field]").forEach(el => {
        const field = el.getAttribute("data-field");
        if (!field) return;

        if (!el.textContent.trim()) {
            el.textContent = getFieldToken(field);
        }

        if (!window.datasourceConnected) {
            el.classList.add("unbound-template-field");
            el.classList.remove("bound-field");
            el.removeAttribute("data-binding");
        }
    });
};
window.isDatasourceConnected = false;
window.currentDatasourceJson = null;

/* ================================
   DATA SOURCE PANEL
================================ */

function loadDatasourcePanel() {
    const panel = document.getElementById("datasource-panel");

    if (!panel) {
        console.warn("datasource-panel bulunamadı, tekrar denenecek...");
        setTimeout(loadDatasourcePanel, 300);
        return;
    }

    renderDatasourceEmptyState(panel);
}

function renderDatasourceEmptyState(panel) {
    window.isDatasourceConnected = false;
    window.currentDatasourceJson = null;
    panel.innerHTML = `
        <div class="ds-empty-state">
            <div class="ds-empty-icon">⛓</div>
            <div class="ds-empty-title">Veri kaynağı bağlı değil</div>
            <div class="ds-empty-text">
                Faturada kullanacağın müşteri, fatura ve ürün alanlarını eklemek için veri kaynağı oluştur.
            </div>
            <button type="button" class="ds-add-source-btn" id="openDatasourceWizardBtn">
                + Veri Kaynağı Ekle
            </button>
        </div>
    `;

    const btn = document.getElementById("openDatasourceWizardBtn");
    if (btn) btn.addEventListener("click", openDatasourceWizard);
}

function loadDatasourceTreeFromSql() {
    const panel = document.getElementById("datasource-panel");

    if (!panel) return;

    panel.innerHTML = `<div class="data-loading">Data Source yükleniyor...</div>`;

    fetch("/Designer/GetDatasource", { cache: "no-store" })
        .then(response => {
            if (!response.ok) {
                throw new Error("GetDatasource hata kodu: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            window.currentDatasourceJson = data;
            window.datasourceConnected = true;
            window.isDatasourceConnected = true;
            panel.innerHTML = `
                <div class="ds-connected-head">
                    <div>
                        <div class="ds-connected-title">Zensoft SQL Veri Kaynağı</div>
                        <div class="ds-connected-subtitle">customer / invoice / items</div>
                    </div>
                    <button type="button" class="ds-change-source-btn" id="changeDatasourceBtn">Değiştir</button>
                </div>
                <div id="datasource-tree-root"></div>
            `;

            const root = document.getElementById("datasource-tree-root");
            createTree(data, root, "");

            const changeBtn = document.getElementById("changeDatasourceBtn");
            if (changeBtn) changeBtn.addEventListener("click", openDatasourceWizard);

            if (window.activateTemplateDataFields && typeof window.activateTemplateDataFields === "function") {
                setTimeout(window.activateTemplateDataFields, 150);
            }
        })
        .catch(error => {
            console.error("Datasource yüklenemedi:", error);
            panel.innerHTML = `
                <div class="data-error">
                    Data Source yüklenemedi.<br>
                    Veritabanını ve /Designer/GetDatasource metodunu kontrol et.
                    <br><br>
                    <button type="button" class="ds-add-source-btn" id="retryDatasourceBtn">Tekrar Dene</button>
                </div>
            `;

            const retryBtn = document.getElementById("retryDatasourceBtn");
            if (retryBtn) retryBtn.addEventListener("click", openDatasourceWizard);
        });
}

/* ================================
   DATA SOURCE WIZARD
================================ */

let dsWizardStep = 1;
let dsWizardSelectedType = "sql";
let dsWizardTables = ["Customer", "Invoice", "Items"];

function ensureDatasourceWizardModal() {
    let modal = document.getElementById("datasourceWizardModal");

    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "datasourceWizardModal";
    modal.className = "ds-wizard-overlay";
    modal.innerHTML = `
        <div class="ds-wizard-modal">
            <div class="ds-wizard-header">
                <div>
                    <div class="ds-wizard-title">Veri Kaynağı Oluştur</div>
                    <div class="ds-wizard-subtitle">Adım adım veri bağlantısı sihirbazı</div>
                </div>
                <button type="button" class="ds-wizard-close" id="closeDatasourceWizardBtn">×</button>
            </div>

            <div class="ds-wizard-steps">
                <div class="ds-step-pill active" data-step="1">1 Kaynak</div>
                <div class="ds-step-pill" data-step="2">2 Bağlantı</div>
                <div class="ds-step-pill" data-step="3">3 Tablolar</div>
                <div class="ds-step-pill" data-step="4">4 Mapping</div>
            </div>

            <div class="ds-wizard-body" id="datasourceWizardBody"></div>

            <div class="ds-wizard-footer">
                <button type="button" class="ds-wizard-btn" id="dsWizardBackBtn">Geri</button>
                <button type="button" class="ds-wizard-btn primary" id="dsWizardNextBtn">İleri</button>
                <button type="button" class="ds-wizard-btn success" id="dsWizardFinishBtn">Bitir</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("closeDatasourceWizardBtn").addEventListener("click", closeDatasourceWizard);
    document.getElementById("dsWizardBackBtn").addEventListener("click", function () {
        if (dsWizardStep > 1) {
            dsWizardStep--;
            renderDatasourceWizardStep();
        }
    });
    document.getElementById("dsWizardNextBtn").addEventListener("click", function () {
        if (dsWizardStep < 4) {
            dsWizardStep++;
            renderDatasourceWizardStep();
        }
    });
    document.getElementById("dsWizardFinishBtn").addEventListener("click", finishDatasourceWizard);

    modal.addEventListener("click", function (e) {
        if (e.target === modal) closeDatasourceWizard();
    });

    return modal;
}

function openDatasourceWizard() {
    dsWizardStep = 1;
    dsWizardSelectedType = "sql";

    const modal = ensureDatasourceWizardModal();
    modal.classList.add("open");
    renderDatasourceWizardStep();
}

function closeDatasourceWizard() {
    const modal = document.getElementById("datasourceWizardModal");
    if (modal) modal.classList.remove("open");
}

function renderDatasourceWizardStep() {
    const body = document.getElementById("datasourceWizardBody");
    const backBtn = document.getElementById("dsWizardBackBtn");
    const nextBtn = document.getElementById("dsWizardNextBtn");
    const finishBtn = document.getElementById("dsWizardFinishBtn");

    if (!body) return;

    document.querySelectorAll(".ds-step-pill").forEach(pill => {
        const step = Number(pill.dataset.step);
        pill.classList.toggle("active", step === dsWizardStep);
        pill.classList.toggle("done", step < dsWizardStep);
    });

    backBtn.style.display = dsWizardStep === 1 ? "none" : "inline-flex";
    nextBtn.style.display = dsWizardStep === 4 ? "none" : "inline-flex";
    finishBtn.style.display = dsWizardStep === 4 ? "inline-flex" : "none";

    if (dsWizardStep === 1) renderWizardSourceType(body);
    if (dsWizardStep === 2) renderWizardConnection(body);
    if (dsWizardStep === 3) renderWizardTables(body);
    if (dsWizardStep === 4) renderWizardMapping(body);
}

function renderWizardSourceType(body) {
    body.innerHTML = `
        <h3>Kaynak Türünü Seç</h3>
        <p class="ds-wizard-desc">Veriler rapora nereden gelecek?</p>

        <div class="ds-source-card-grid">
            <button type="button" class="ds-source-card ${dsWizardSelectedType === "sql" ? "selected" : ""}" data-type="sql">
                <span class="ds-source-icon">🗄</span>
                <b>Canlı Veritabanı</b>
                <small>SQL Server / PostgreSQL</small>
            </button>

            <button type="button" class="ds-source-card ${dsWizardSelectedType === "api" ? "selected" : ""}" data-type="api">
                <span class="ds-source-icon">{ }</span>
                <b>Web Servis / API</b>
                <small>REST / JSON</small>
            </button>

            <button type="button" class="ds-source-card ${dsWizardSelectedType === "file" ? "selected" : ""}" data-type="file">
                <span class="ds-source-icon">▤</span>
                <b>Hazır Dosya</b>
                <small>Excel / CSV</small>
            </button>
        </div>
    `;

    body.querySelectorAll(".ds-source-card").forEach(card => {
        card.addEventListener("click", function () {
            dsWizardSelectedType = this.dataset.type;
            renderWizardSourceType(body);
        });
    });
}

function renderWizardConnection(body) {
    if (dsWizardSelectedType === "sql") {
        body.innerHTML = `
            <h3>Bağlantı Bilgileri</h3>
            <p class="ds-wizard-desc">Bu sürümde mevcut Zensoft SQL bağlantısı kullanılacak.</p>

            <div class="ds-connection-box success">
                <div class="ds-connection-icon">✓</div>
                <div>
                    <b>Zensoft SQL Server</b>
                    <p>Mevcut proje veritabanı bağlantısı hazır. Bitir dediğinde /Designer/GetDatasource üzerinden SQL verileri alınacak.</p>
                </div>
            </div>

            <label class="ds-field-label">Bağlantı Adı</label>
            <input class="ds-input" value="Zensoft Invoice Database" readonly>
        `;
        return;
    }

    if (dsWizardSelectedType === "api") {
        body.innerHTML = `
            <h3>API Bağlantısı</h3>
            <p class="ds-wizard-desc">Bu alan sonraki aşamada gerçek API bağlantısı için kullanılacak.</p>
            <label class="ds-field-label">Zensoft API adresi</label>
            <input class="ds-input" placeholder="https://api.zensoft.com/invoice" disabled>
            <div class="ds-info-note">Şimdilik mevcut SQL veri kaynağı kullanılacak.</div>
        `;
        return;
    }

    body.innerHTML = `
        <h3>Dosya Yükleme</h3>
        <p class="ds-wizard-desc">Bu alan sonraki aşamada Excel/CSV için kullanılacak.</p>
        <input class="ds-input" value="Excel / CSV desteği sonraki aşamada eklenecek" disabled>
        <div class="ds-info-note">Şimdilik mevcut SQL veri kaynağı kullanılacak.</div>
    `;
}

function renderWizardTables(body) {
    body.innerHTML = `
        <h3>Tablo / Şema Seçimi</h3>
        <p class="ds-wizard-desc">Faturada kullanmak istediğin tabloları seç.</p>

        <div class="ds-table-list">
            <label><input type="checkbox" checked value="Customer"> Müşteri Bilgileri <small>customer</small></label>
            <label><input type="checkbox" checked value="Invoice"> Fatura Detayları <small>invoice</small></label>
            <label><input type="checkbox" checked value="Items"> Satılan Ürünler Listesi <small>items</small></label>
        </div>
    `;
}

function renderWizardMapping(body) {
    body.innerHTML = `
        <h3>Akıllı Yapılandırma</h3>
        <p class="ds-wizard-desc">Ana kayıt ve tekrar eden detay listesini belirle.</p>

        <div class="ds-mapping-grid">
            <div class="ds-mapping-card">
                <label>Ana Fatura Bilgisi</label>
                <select class="ds-input">
                    <option selected>invoice</option>
                    <option>customer</option>
                </select>
                <small>Master kayıt</small>
            </div>

            <div class="ds-mapping-card">
                <label>Döngüye Girecek Ürünler</label>
                <select class="ds-input">
                    <option selected>items</option>
                    <option>invoice</option>
                </select>
                <small>Detail liste</small>
            </div>
        </div>

        <div class="ds-finish-note">
            Bitir dediğinde Data Source paneli mevcut SQL verilerine göre oluşturulacak.
        </div>
    `;
}

function finishDatasourceWizard() {
    closeDatasourceWizard();
    loadDatasourceTreeFromSql();
}

function createTree(obj, parent, path) {
    if (!obj) return;

    Object.keys(obj).forEach(key => {
        const value = obj[key];

        if ((typeof value === "object" && value !== null) || Array.isArray(value)) {

            const group = document.createElement("div");
            group.className = "data-group";
            group.innerHTML = `
    <span class="tree-arrow">▼</span>
    <span class="tree-icon">▦</span>
    <b>${key}</b>
`;
            parent.appendChild(group);

            const childContainer = document.createElement("div");
            childContainer.className = "data-child";
            childContainer.style.marginLeft = "18px";
            parent.appendChild(childContainer);

            group.addEventListener("click", function () {
                childContainer.classList.toggle("closed");

                const arrow = group.querySelector(".tree-arrow");

                arrow.innerHTML = childContainer.classList.contains("closed")
                    ? "▶"
                    : "▼";
            });

            if (Array.isArray(value)) {
                if (value.length > 0) {
                    createTree(value[0], childContainer, path ? path + "." + key : key);
                } else {
                    const empty = document.createElement("div");
                    empty.className = "data-empty";
                    empty.textContent = "Boş liste";
                    childContainer.appendChild(empty);
                }
            } else {
                createTree(value, childContainer, path ? path + "." + key : key);
            }

            return;
        }

        const fullPath = path ? path + "." + key : key;

        const item = document.createElement("div");
        item.className = "data-field";
        item.draggable = true;
        item.dataset.field = fullPath;
        item.innerHTML = `
    <span class="field-icon">◆</span>
    <span>${key}</span>
`;

        item.addEventListener("dragstart", function (e) {
            draggedFieldPath = fullPath;
            e.dataTransfer.setData("text/plain", fullPath);
            console.log("Taşınıyor:", draggedFieldPath);
        });

        parent.appendChild(item);
    });
}


/* ================================
   COMPONENT FINDER
================================ */

function findComponentByElement(targetEl) {
    if (!targetEl || typeof editor === "undefined") return null;

    const wrapper = editor.DomComponents && editor.DomComponents.getWrapper
        ? editor.DomComponents.getWrapper()
        : null;

    let found = null;

    function walk(component) {
        if (found || !component) return;

        const el = component.getEl && component.getEl();

        if (el === targetEl) {
            found = component;
            return;
        }

        const children = component.components && component.components();

        if (children) {
            if (children.each) {
                children.each(child => walk(child));
            } else if (Array.isArray(children)) {
                children.forEach(child => walk(child));
            }
        }
    }

    walk(wrapper);

    if (found) return found;

    const selected = editor.getSelected && editor.getSelected();

    if (selected && selected.getEl) {
        const selectedEl = selected.getEl();

        if (
            selectedEl === targetEl ||
            selectedEl.contains(targetEl) ||
            targetEl.contains(selectedEl)
        ) {
            return selected;
        }
    }

    return null;
}

function refreshPanels(component) {
    if (window.updatePropertiesPanel && typeof window.updatePropertiesPanel === "function") {
        window.updatePropertiesPanel(component);
    }

    if (window.refreshReportExplorer && typeof window.refreshReportExplorer === "function") {
        setTimeout(window.refreshReportExplorer, 100);
    }
}


/* ================================
   CANVAS DROP BINDING
================================ */

function initDatasourceDragDrop() {
    if (typeof editor === "undefined" || !editor.Canvas) {
        setTimeout(initDatasourceDragDrop, 300);
        return;
    }

    const body = editor.Canvas.getBody();

    if (!body || body.dataset.datasourceBound === "1") return;

    body.dataset.datasourceBound = "1";

    body.addEventListener("dragover", function (e) {
        if (!draggedFieldPath) return;

        const targetEl = e.target.closest(".report-control, .drop-zone");

        if (!targetEl) return;

        e.preventDefault();
        e.stopPropagation();

        targetEl.classList.add("binding-hover");
    }, true);

    body.addEventListener("dragleave", function (e) {
        const targetEl = e.target.closest(".report-control, .drop-zone");

        if (targetEl) {
            targetEl.classList.remove("binding-hover");
        }
    }, true);

    body.addEventListener("drop", function (e) {
        if (!draggedFieldPath) return;

        const dropEl = e.target.closest(".drop-zone");

        if (!dropEl) {
            draggedFieldPath = null;
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        dropEl.classList.remove("binding-hover");

        const bindingText = `[${draggedFieldPath}]`;

        // 1) Önce ekrandaki HTML'i doldur
        dropEl.innerHTML = bindingText;

        // 2) Binding bilgisini HTML'e yaz
        dropEl.setAttribute("data-binding", draggedFieldPath);
        dropEl.setAttribute("data-field", draggedFieldPath);
        dropEl.classList.remove("unbound-template-field");
        dropEl.classList.add("bound-field");

        // 3) GrapesJS component modelini de güncelle
        const component = findComponentByElement(dropEl);

        if (component) {
            component.addAttributes({
                "data-binding": draggedFieldPath,
                "data-field": draggedFieldPath
            });

            component.components(bindingText);
            refreshPanels(component);
        }

        console.log("Drop zone bağlandı:", draggedFieldPath);

        draggedFieldPath = null;
    }, true);

    body.addEventListener("click", function (e) {
        const smartTag = e.target.closest(".report-smart-tag");

        if (!smartTag) return;

        e.preventDefault();
        e.stopPropagation();

        const controlEl = smartTag.closest(".report-control");
        const component = findComponentByElement(controlEl);

        if (!component) return;

        openSmartMenu(controlEl, component, body);
    }, true);
}


/* ================================
   SMART MENU
================================ */

function openSmartMenu(controlEl, component, body) {
    removeSmartMenus(body);

    const attrs = component.getAttributes ? component.getAttributes() : {};

    const menu = document.createElement("div");
    menu.className = "report-smart-menu";

    menu.innerHTML = `
        <div><b>Data Binding</b></div>
        <div class="binding-name">${attrs["data-binding"] || "Bağlı alan yok"}</div>
        <hr>
        <button type="button" class="clear-binding-btn">Bağlantıyı temizle</button>
    `;

    controlEl.appendChild(menu);

    menu.querySelector(".clear-binding-btn").addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();

        if (typeof component.clearBinding === "function") {
            component.clearBinding();
        } else {
            component.addAttributes({
                "data-binding": "",
                "data-field": ""
            });
        }

        refreshPanels(component);
        removeSmartMenus(body);
    });
}

function removeSmartMenus(body) {
    body.querySelectorAll(".report-smart-menu").forEach(menu => menu.remove());
}


/* ================================
   INIT
================================ */

loadDatasourcePanel();

if (typeof editor !== "undefined") {
    editor.on("load", initDatasourceDragDrop);
    setTimeout(initDatasourceDragDrop, 500);
} else {
    console.error("datasource.js: editor bulunamadı. Script sırasını kontrol et.");
}