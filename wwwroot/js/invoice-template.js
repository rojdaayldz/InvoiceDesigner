console.log("invoice-template.js çalıştı - Template Library");

window.invoiceTemplates = {
    blank: `
<div class="invoice-page report-page blank-report-template">
    <div class="report-band report-header-band" data-band-type="reportHeader" data-name="reportHeaderBand">
        <div class="band-caption">Report Header</div>
        <div class="band-content-area">
            <span class="band-placeholder">Logo, başlık veya firma bilgilerini buraya ekleyin</span>
        </div>
    </div>

    <div class="report-band detail-band" data-band-type="detail" data-name="detailBand">
        <div class="band-caption">Detail</div>
        <div class="band-content-area">
            <span class="band-placeholder">Tablo, veri alanları ve fatura detaylarını buraya ekleyin</span>
        </div>
    </div>

    <div class="report-band page-footer" data-band-type="pageFooter" data-name="pageFooterBand">
        <div class="band-caption">Page Footer</div>
        <div class="band-content-area">
            <span class="band-placeholder">Toplamlar, imza veya alt bilgileri buraya ekleyin</span>
        </div>
    </div>
</div>
`,

    zensoft: `
<div class="invoice-page report-page zensoft-invoice zensoft-template-report">
    <div class="report-band report-header-band" data-band-type="reportHeader" data-name="reportHeaderBand">
        <div class="band-caption">Report Header</div>

        <div class="zensoft-header">
            <div class="logo-area">
                <img src="https://via.placeholder.com/250x90?text=ZENSOFT" class="company-logo-img" data-control-type="image" data-name="logo">
                <div class="logo-web" data-control-type="text" data-name="companyWeb">www.zensoft.com.tr</div>
            </div>

            <div class="title-area">
                <h2 data-control-type="text" data-name="invoiceTitle">Satış Faturası</h2>
                <p class="drop-zone" data-control-type="text" data-name="headerCustomerName" data-field="customer.companyName"></p>
                <p>
                    <span class="drop-zone" data-control-type="text" data-name="customerAddress" data-field="customer.address"></span>
                    -
                    <span class="drop-zone" data-control-type="text" data-name="customerTaxOffice" data-field="customer.taxOffice"></span>
                </p>
            </div>
        </div>
    </div>

    <div class="report-band detail-band" data-band-type="detail" data-name="detailBand">
        <div class="band-caption">Detail</div>

        <table class="zensoft-info-table" data-control-type="table" data-name="customerInfoTable">
            <tr>
                <td>Cari Hesap Ünvanı</td>
                <td>:</td>
                <td><span class="drop-zone" data-control-type="text" data-name="customerName" data-field="customer.companyName"></span></td>
                <td>Fiş No</td>
                <td>:</td>
                <td><span class="drop-zone" data-control-type="text" data-name="invoiceNo" data-field="invoice.invoiceNo"></span></td>
            </tr>
            <tr>
                <td>Cari Hesap Adresi</td>
                <td>:</td>
                <td><span class="drop-zone" data-control-type="text" data-name="customerAddress" data-field="customer.address"></span></td>
                <td>Fiş Tarihi</td>
                <td>:</td>
                <td><span class="drop-zone" data-control-type="text" data-name="invoiceDate" data-field="invoice.invoiceDate"></span></td>
            </tr>
        </table>

        <table class="product-table zensoft-product-table" data-control-type="items-table" data-name="itemsTable">
            <thead>
                <tr>
                    <th>Malzeme Kodu</th>
                    <th>Malzeme Açıklaması</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                </tr>
            </thead>
            <tbody>
                <tr data-repeat-row="items">
                    <td><div class="drop-zone item-box" data-control-type="text" data-name="itemProductCode" data-field="items.productCode"></div></td>
                    <td><div class="drop-zone item-box" data-control-type="text" data-name="itemProductName" data-field="items.productName"></div></td>
                    <td><div class="drop-zone item-box" data-control-type="text" data-name="itemQuantity" data-field="items.quantity"></div></td>
                    <td><div class="drop-zone item-box" data-control-type="text" data-name="itemUnitPrice" data-field="items.unitPrice"></div></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="report-band page-footer" data-band-type="pageFooter" data-name="pageFooterBand">
        <div class="band-caption">Page Footer</div>
        <div class="zensoft-bottom-area">
            <div class="totals-row">
                <div class="total-line"><b>Ara Toplam</b><span>:</span><span class="drop-zone" data-control-type="text" data-name="subtotal" data-field="invoice.subTotal"></span></div>
                <div class="total-line"><b>KDV Toplam</b><span>:</span><span class="drop-zone" data-control-type="text" data-name="taxAmount" data-field="invoice.taxAmount"></span></div>
                <div class="total-line"><b>Genel Toplam</b><span>:</span><span class="drop-zone" data-control-type="text" data-name="totalAmount" data-field="invoice.totalAmount"></span></div>
            </div>
        </div>
    </div>
</div>
`,

    adventure: `
<div class="invoice-page report-page adventure-invoice-template">

    <div class="report-band report-header-band" data-band-type="reportHeader" data-name="reportHeaderBand">
        <div class="band-caption">Report Header</div>

        <div class="adventure-top">
            <div class="adventure-logo-box">
                <img src="https://via.placeholder.com/150x70?text=LOGO"
                     class="adventure-logo-img"
                     data-control-type="image"
                     data-name="logo">
            </div>

            <div class="adventure-company-info">
                <div class="adventure-company-name" data-control-type="text" data-name="companyName" data-field="customer.companyName"></div>
                <div data-control-type="text" data-name="companyAddress" data-field="customer.address"></div>
                <div data-control-type="text" data-name="taxOffice">Vergi Dairesi: <span data-field="customer.taxOffice"></span></div>
                <div data-control-type="text" data-name="mersisNo">Mersis No: <span data-field="customer.mersisNo"></span></div>
            </div>

            <div class="adventure-barcode-area">
                <div class="adventure-barcode" data-control-type="barcode" data-name="barcode">||||||||||||||||||||||||</div>
                <div class="adventure-barcode-no" data-control-type="text" data-name="barcodeNo" data-field="invoice.invoiceNo"></div>
            </div>
        </div>

        <div class="adventure-order-row">
            <div data-control-type="text" data-name="invoiceNo"><span>Fatura No:</span> <b data-field="invoice.invoiceNo"></b></div>
            <div data-control-type="text" data-name="invoiceDate"><span>Tarih:</span> <b data-field="invoice.invoiceDate"></b></div>
        </div>

        <div class="adventure-separator"></div>
    </div>

    <div class="report-band detail-band" data-band-type="detail" data-name="detailBand">
        <div class="band-caption">Detail</div>

        <div class="adventure-section-title" data-control-type="text" data-name="customerInfoTitle">Müşteri Bilgileri</div>

        <div class="adventure-customer-grid" data-control-type="text" data-name="customerInfoPanel">
            <div>
                <div class="adventure-label">CARİ HESAP ÜNVANI:</div>
                <div class="adventure-value" data-control-type="text" data-name="customerName" data-field="customer.companyName"></div>
            </div>
            <div>
                <div class="adventure-label">ADRES:</div>
                <div class="adventure-value" data-control-type="text" data-name="customerAddress" data-field="customer.address"></div>
            </div>
            <div>
                <div class="adventure-label">VERGİ / MERSİS:</div>
                <div class="adventure-value" data-control-type="text" data-name="customerTaxOffice" data-field="customer.taxOffice"></div>
                <div class="adventure-value" data-control-type="text" data-name="customerMersisNo" data-field="customer.mersisNo"></div>
            </div>
        </div>

        <div class="adventure-meta-row" data-control-type="text" data-name="invoiceSummaryPanel">
            <div data-control-type="text" data-name="invoiceDate"><span>TARİH:</span><b data-field="invoice.invoiceDate"></b></div>
            <div data-control-type="text" data-name="invoiceNo"><span>FATURA NO:</span><b data-field="invoice.invoiceNo"></b></div>
            <div data-control-type="text" data-name="subtotal"><span>ARA TOPLAM:</span><b data-field="invoice.subTotal"></b></div>
            <div data-control-type="text" data-name="taxAmount"><span>KDV:</span><b data-field="invoice.taxAmount"></b></div>
            <div data-control-type="text" data-name="totalAmount"><span>GENEL TOPLAM:</span><b data-field="invoice.totalAmount"></b></div>
        </div>

        <div class="adventure-section-title adventure-order-title" data-control-type="text" data-name="invoiceDetailTitle">Fatura Detayları</div>

        <table class="adventure-detail-table" data-control-type="items-table" data-name="itemsTable">
            <thead>
                <tr>
                    <th>Malzeme Kodu</th>
                    <th>Malzeme Açıklaması</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                </tr>
            </thead>
            <tbody>
                <tr data-repeat-row="items">
    <td class="product-drop-cell">
        <div class="drop-zone item-box"
             data-control-type="text"
             data-name="itemProductCode"
             data-field="items.productCode"></div>
    </td>

    <td class="product-drop-cell">
        <div class="drop-zone item-box"
             data-control-type="text"
             data-name="itemProductName"
             data-field="items.productName"></div>
    </td>

    <td class="product-drop-cell">
        <div class="drop-zone item-box"
             data-control-type="text"
             data-name="itemQuantity"
             data-field="items.quantity"></div>
    </td>

    <td class="product-drop-cell">
        <div class="drop-zone item-box"
             data-control-type="text"
             data-name="itemUnitPrice"
             data-field="items.unitPrice"></div>
    </td>
</tr>
            </tbody>
        </table>
    </div>

    <div class="report-band page-footer" data-band-type="pageFooter" data-name="pageFooterBand">
        <div class="band-caption">Page Footer</div>

        <div class="adventure-total-box" data-control-type="text" data-name="totalsPanel">
            <div data-control-type="text" data-name="subtotal"><span>Ara Toplam</span><b data-field="invoice.subTotal"></b></div>
            <div data-control-type="text" data-name="taxAmount"><span>KDV</span><b data-field="invoice.taxAmount"></b></div>
            <div class="grand-total" data-control-type="text" data-name="totalAmount"><span>Genel Toplam</span><b data-field="invoice.totalAmount"></b></div>
        </div>
    </div>
</div>
`,

    welcome: `
<div class="designer-start-page">
    <div class="designer-start-card">
        <div class="designer-start-logo">ZR</div>
        <h1>Zensoft Report Designer</h1>
        <p>Yeni bir rapor tasarlayın veya hazır fatura şablonlarından biriyle başlayın.</p>

        <div class="designer-start-actions">
            <button type="button" class="designer-start-option" data-start-action="blank">
                <span class="start-option-icon">+</span>
                <span class="start-option-title">Yeni Fatura Oluştur</span>
                <span class="start-option-desc">Boş rapor alanıyla sıfırdan başlayın.</span>
            </button>

            <button type="button" class="designer-start-option" data-start-action="templates">
                <span class="start-option-icon">📄</span>
                <span class="start-option-title">Hazır Şablon Kullan</span>
                <span class="start-option-desc">Zensoft veya klasik fatura şablonunu seçin.</span>
            </button>
        </div>
    </div>
</div>
`,

    chooser: `
<div class="designer-start-page">
    <div class="designer-start-card template-chooser-card">
        <button type="button" class="template-back-btn" data-template-action="back">← Geri</button>
        <div class="designer-start-logo">📄</div>
        <h1>Hazır Şablon Seç</h1>
        <p>Başlangıç için kullanmak istediğiniz fatura tasarımını seçin.</p>

        <div class="template-choice-grid">
            <button type="button" class="template-choice-card" data-template-key="zensoft">
                <span class="template-choice-icon">📄</span>
                <span class="template-choice-title">Zensoft Fatura</span>
                <span class="template-choice-desc">Mevcut kırmızı başlıklı fatura şablonu.</span>
            </button>

            <button type="button" class="template-choice-card" data-template-key="adventure">
                <span class="template-choice-icon">🧾</span>
                <span class="template-choice-title">Klasik Sipariş Faturası</span>
                <span class="template-choice-desc">Logo, barkod, müşteri ve ürün detaylı şablon.</span>
            </button>
        </div>
    </div>
</div>
`
};

const blankInvoiceTemplate = window.invoiceTemplates.blank;
const defaultInvoiceTemplate = window.invoiceTemplates.zensoft;
const zensoftInvoiceTemplateReport = window.invoiceTemplates.zensoft;
const adventureInvoiceTemplateReport = window.invoiceTemplates.adventure;