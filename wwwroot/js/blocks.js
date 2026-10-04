console.log("blocks.js çalıştı - Sekmeli Toolbox");

function addInvoiceBlock(id, icon, title, category, content) {
    editor.BlockManager.add(id, {
        label: `
            <div class="invoice-tool-block" title="${title}">
                <div class="invoice-tool-icon">${icon}</div>
                <div class="invoice-tool-title">${title}</div>
            </div>
        `,
        category: category,
        content: content
    });
}

/* ================================
   REPORT ITEMS
================================ */

addInvoiceBlock("invoice-textbox", "A", "TextBox", "Report Items", `
    <div class="report-control report-label invoice-draggable-block"
         data-control-type="text"
         data-name="textBox"
         style="min-width:160px; min-height:40px; padding:6px;">
        Metin giriniz
    </div>
`);

addInvoiceBlock("invoice-logo", "▧", "Logo", "Report Items", `
    <img class="report-image invoice-logo-component invoice-draggable-block"
         src="https://via.placeholder.com/220x90?text=LOGO"
         data-control-type="image"
         data-name="logo"
         style="width:220px; height:90px; object-fit:contain; resize:both; overflow:auto;">
`);

addInvoiceBlock("invoice-barcode", "|||", "Barcode", "Report Items", `
    <div class="report-control report-label drop-zone barcode-component invoice-draggable-block"
         data-control-type="barcode"
         data-name="barcode"
         data-binding=""
         data-field="">
        <span class="report-control-text">||||||||||||||||</span>
        <span class="report-smart-tag" title="Data Binding">●</span>
    </div>
`);

addInvoiceBlock("invoice-shape", "□", "Şekil", "Report Items", `
    <div class="report-control invoice-shape-component invoice-draggable-block"
         data-control-type="shape"
         data-name="shape"
         style="width:140px; height:70px; border:1px solid #111; background:#ffffff;">
    </div>
`);


addInvoiceBlock("invoice-signature", "✎", "İmza Kutusu", "Report Items", `
    <div class="signature-card invoice-draggable-block"
         data-control-type="signature-box"
         data-name="signatureBox"
         style="width:260px; min-height:135px;">
        <div class="signature-name report-control-text">Ad Soyad</div>
        <div class="signature-space"></div>
        <div class="signature-caption report-control-text">İmza</div>
    </div>
`);


/* ================================
   TABLES
================================ */

addInvoiceBlock("invoice-table", "▦", "Ürün Tablosu", "Tables", `
    <div class="invoice-ready-table-card invoice-table-wrapper invoice-draggable-block"
         data-control-type="items-table"
         data-name="invoiceTable"
         data-ready-table="true"
         data-product-table-card="true"
         style="width:700px;">

        <div class="product-table-inner">
            <table class="product-table ready-product-table"
                   data-control-type="items-table"
                   data-name="itemsTable"
                   data-repeat-source="urunlerList">
                <thead>
                    <tr>
                        <th>Malzeme Kodu</th>
                        <th>Malzeme Açıklaması</th>
                        <th>Miktar</th>
                        <th>Birim Fiyat</th>
                    </tr>
                </thead>
                <tbody>
                    <tr data-repeat-row="urunlerList">
                        <td class="product-drop-cell">
                            <div class="drop-zone item-box"
                                 data-placeholder="Malzeme Kodu"
                                 data-binding="urunlerList.malzemeKodu"
                                 data-field="urunlerList.malzemeKodu"
                                 data-format="text">
                                <span class="report-control-text">{urunlerList.malzemeKodu}</span>
                                <span class="report-smart-tag" title="Data Binding">●</span>
                            </div>
                        </td>

                        <td class="product-drop-cell">
                            <div class="drop-zone item-box"
                                 data-placeholder="Malzeme Açıklaması"
                                 data-binding="urunlerList.malzemeAdi"
                                 data-field="urunlerList.malzemeAdi"
                                 data-format="text">
                                <span class="report-control-text">{urunlerList.malzemeAdi}</span>
                                <span class="report-smart-tag" title="Data Binding">●</span>
                            </div>
                        </td>

                        <td class="product-drop-cell">
                            <div class="drop-zone item-box"
                                 data-placeholder="Miktar"
                                 data-binding="urunlerList.miktar"
                                 data-field="urunlerList.miktar"
                                 data-format="number">
                                <span class="report-control-text">{urunlerList.miktar}</span>
                                <span class="report-smart-tag" title="Data Binding">●</span>
                            </div>
                        </td>

                        <td class="product-drop-cell">
                            <div class="drop-zone item-box"
                                 data-placeholder="Birim Fiyat"
                                 data-binding="urunlerList.birimFiyat"
                                 data-field="urunlerList.birimFiyat"
                                 data-format="currency">
                                <span class="report-control-text">{urunlerList.birimFiyat}</span>
                                <span class="report-smart-tag" title="Data Binding">●</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
`);


addInvoiceBlock("customer-info-table", "C", "Müşteri Bilgileri", "Tables", `
    <div class="invoice-ready-table-card invoice-info-table-wrapper invoice-draggable-block"
         data-control-type="customer-info-table"
         data-ready-table="true"
         data-name="customerInfoTable"
         style="width:520px;">
        <div class="invoice-ready-table-header">Müşteri Bilgileri</div>
        <table class="report-table invoice-info-table" data-gjs-draggable="false">
            <tbody data-gjs-draggable="false">
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">Cari Ünvanı</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="customer.companyName"
                        data-field="customer.companyName"
                        data-format="text">
                        <span data-gjs-draggable="false" class="report-control-text">{{customer.companyName}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">Adres</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="customer.address"
                        data-field="customer.address"
                        data-format="text">
                        <span data-gjs-draggable="false" class="report-control-text">{{customer.address}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">Vergi Dairesi</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="customer.taxOffice"
                        data-field="customer.taxOffice"
                        data-format="text">
                        <span data-gjs-draggable="false" class="report-control-text">{{customer.taxOffice}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">MERSİS No</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="customer.mersisNo"
                        data-field="customer.mersisNo"
                        data-format="text">
                        <span data-gjs-draggable="false" class="report-control-text">{{customer.mersisNo}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
`);

addInvoiceBlock("invoice-info-table", "F", "Fatura Bilgileri", "Tables", `
    <div class="invoice-ready-table-card invoice-info-table-wrapper invoice-draggable-block"
         data-control-type="invoice-info-table"
         data-ready-table="true"
         data-name="invoiceInfoTable"
         style="width:420px;">
        <div class="invoice-ready-table-header">Fatura Bilgileri</div>
        <table class="report-table invoice-info-table" data-gjs-draggable="false">
            <tbody data-gjs-draggable="false">
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">Fatura No</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="invoice.invoiceNo"
                        data-field="invoice.invoiceNo"
                        data-format="text">
                        <span data-gjs-draggable="false" class="report-control-text">{{invoice.invoiceNo}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">Fatura Tarihi</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="invoice.invoiceDate"
                        data-field="invoice.invoiceDate"
                        data-format="text">
                        <span data-gjs-draggable="false" class="report-control-text">{{invoice.invoiceDate}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
`);

addInvoiceBlock("invoice-totals", "Σ", "Alt Toplam", "Tables", `
    <div class="invoice-ready-table-card invoice-info-table-wrapper invoice-draggable-block"
         data-control-type="totals-box"
         data-ready-table="true"
         data-name="totalsBox"
         style="width:340px;">
        <div class="invoice-ready-table-header">Alt Toplam</div>
        <table class="report-table invoice-info-table invoice-totals-table" data-gjs-draggable="false">
            <tbody data-gjs-draggable="false">
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">Ara Toplam</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="invoice.subTotal"
                        data-field="invoice.subTotal"
                        data-format="currency">
                        <span data-gjs-draggable="false" class="report-control-text">{{invoice.subTotal}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
                <tr data-gjs-draggable="false">
                    <td data-gjs-draggable="false" class="invoice-info-label">KDV</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="invoice.taxAmount"
                        data-field="invoice.taxAmount"
                        data-format="currency">
                        <span data-gjs-draggable="false" class="report-control-text">{{invoice.taxAmount}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
                <tr data-gjs-draggable="false" class="invoice-total-grand">
                    <td data-gjs-draggable="false" class="invoice-info-label">Genel Toplam</td>
                    <td data-gjs-draggable="false" class="invoice-info-separator">:</td>
                    <td data-gjs-draggable="false" class="report-control report-cell drop-zone"
                        data-binding="invoice.totalAmount"
                        data-field="invoice.totalAmount"
                        data-format="currency">
                        <span data-gjs-draggable="false" class="report-control-text">{{invoice.totalAmount}}</span>
                        <span data-gjs-draggable="false" class="report-smart-tag" title="Data Binding">●</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
`);

/* ================================
   PAGE ELEMENTS
================================ */

const reportNow = new Date();
const reportCurrentDate = reportNow.toLocaleDateString("tr-TR");
const reportCurrentTime = reportNow.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
});

addInvoiceBlock("page-break", "↕", "Sayfa Sonu", "Page Elements", `
    <div class="report-page-break invoice-draggable-block"
         data-control-type="page-break"
         data-name="pageBreak"
         style="
             width:700px;
             min-height:24px;
             border-top:2px dashed #64748b;
             color:#64748b;
             font-size:11px;
             text-align:center;
             padding-top:5px;
             break-after:page;
             page-break-after:always;">
        Sayfa Sonu
    </div>
`);

addInvoiceBlock("page-number", "#", "Sayfa Numarası", "Page Elements", `
    <div class="report-control report-label invoice-draggable-block"
         data-control-type="page-number"
         data-name="pageNumber"
         data-page-number="1"
         style="
             min-width:110px;
             min-height:30px;
             padding:6px 10px;
             display:flex;
             align-items:center;
             justify-content:center;">
        <span class="report-control-text">Sayfa 1</span>
    </div>
`);

addInvoiceBlock("current-date", "D", "Tarih", "Page Elements", `
    <div class="report-control report-label invoice-draggable-block"
         data-control-type="current-date"
         data-name="currentDate"
         data-current-date="${reportCurrentDate}"
         style="
             min-width:120px;
             min-height:30px;
             padding:6px 10px;
             display:flex;
             align-items:center;
             justify-content:center;">
        <span class="report-control-text">${reportCurrentDate}</span>
    </div>
`);

addInvoiceBlock("current-time", "T", "Saat", "Page Elements", `
    <div class="report-control report-label invoice-draggable-block"
         data-control-type="current-time"
         data-name="currentTime"
         data-current-time="${reportCurrentTime}"
         style="
             min-width:100px;
             min-height:30px;
             padding:6px 10px;
             display:flex;
             align-items:center;
             justify-content:center;">
        <span class="report-control-text">${reportCurrentTime}</span>
    </div>
`);


/* ================================
   RAPORLAR - HAZIR ŞABLONLAR
   Şablon HTML'leri invoice-template.js içinden gelir.
================================ */

function renderReportTemplatesPanel() {
    const titles = Array.from(document.querySelectorAll(".custom-accordion-title, .dx-accordion-title"));
    const reportTitle = titles.find(title => (title.textContent || "").trim().toUpperCase() === "RAPORLAR");

    if (!reportTitle) {
        setTimeout(renderReportTemplatesPanel, 300);
        return;
    }

    const body = reportTitle.nextElementSibling;
    if (!body || body.dataset.reportTemplatesReady === "1") return;

    body.dataset.reportTemplatesReady = "1";
    body.classList.remove("dx-empty-toolbox");
    body.classList.add("report-template-list");

    body.innerHTML = `
        <button type="button" class="report-template-card" data-template="zensoft">
            <span class="report-template-icon">📄</span>
            <span class="report-template-name">Zensoft Fatura</span>
            <span class="report-template-desc">Mevcut kırmızı başlıklı fatura şablonu</span>
        </button>

        <button type="button" class="report-template-card" data-template="adventure">
            <span class="report-template-icon">🧾</span>
            <span class="report-template-name">Klasik Sipariş Faturası</span>
            <span class="report-template-desc">Logo, barkod, müşteri ve ürün detaylı şablon</span>
        </button>
    `;

    body.querySelector('[data-template="zensoft"]').addEventListener("click", function () {
        if (window.applyReportTemplate) window.applyReportTemplate("zensoft");
    });

    body.querySelector('[data-template="adventure"]').addEventListener("click", function () {
        if (window.applyReportTemplate) window.applyReportTemplate("adventure");
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderReportTemplatesPanel);
} else {
    renderReportTemplatesPanel();
}

setTimeout(renderReportTemplatesPanel, 500);
