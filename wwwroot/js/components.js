console.log("components.js çalıştı");

// ================================
// REPORT LABEL
// ================================

editor.DomComponents.addType("report-label", {
    model: {
        defaults: {
            tagName: "div",
            attributes: {
                class: "report-control report-label drop-zone",
                "data-control-type": "label",
                "data-name": "label",
                "data-text": "Label",
                "data-binding": "",
                "data-format": "text"
            },
            components: `
                <span class="report-control-text">Label</span>
                <span class="report-smart-tag" title="Data Binding">●</span>
            `,
            draggable: true,
            droppable: false,
            stylable: true,
            editable: true
        },

        setBinding(fieldPath) {
            this.addAttributes({
                "data-binding": fieldPath,
                "data-field": fieldPath
            });

            this.components(`
                <span class="report-control-text">[${fieldPath}]</span>
                <span class="report-smart-tag" title="Data Binding">●</span>
            `);
        },

        clearBinding() {
            this.addAttributes({
                "data-binding": "",
                "data-field": ""
            });

            this.components(`
                <span class="report-control-text">${this.getAttributes()["data-text"] || "Label"}</span>
                <span class="report-smart-tag" title="Data Binding">●</span>
            `);
        }
    }
});


// ================================
// REPORT CELL
// ================================

editor.DomComponents.addType("report-cell", {
    model: {
        defaults: {
            tagName: "td",
            attributes: {
                class: "report-control report-cell drop-zone",
                "data-control-type": "cell",
                "data-name": "cell",
                "data-text": "",
                "data-binding": "",
                "data-format": "text"
            },
            components: `
                <div class="cell-drop-placeholder">Alan bırak</div>
                <span class="report-control-text"></span>
                <span class="report-smart-tag" title="Data Binding">●</span>
            `,
            draggable: false,
            droppable: false,
            stylable: true,
            editable: true
        },

        setBinding(fieldPath) {
            this.addAttributes({
                "data-binding": fieldPath,
                "data-field": fieldPath
            });

            this.components(`
                <span class="report-control-text">{{${fieldPath}}}</span>
                <span class="report-smart-tag" title="Data Binding">●</span>
            `);
        },

        clearBinding() {
            this.addAttributes({
                "data-binding": "",
                "data-field": ""
            });

            this.components(`
                <div class="cell-drop-placeholder">Alan bırak</div>
                <span class="report-control-text">${this.getAttributes()["data-text"] || ""}</span>
                <span class="report-smart-tag" title="Data Binding">●</span>
            `);
        }
    }
});


// ================================
// REPORT TABLE
// ================================

editor.DomComponents.addType("report-table", {
    model: {
        defaults: {
            tagName: "table",
            attributes: {
                class: "report-table detail-repeat-table",
                "data-control-type": "table",
                "data-name": "itemsTable",
                "data-repeat-source": "items"
            },
            components: `
                <thead>
                    <tr>
                        <th>Ürün/Hizmet</th>
                        <th>Miktar</th>
                        <th>Birim Fiyat</th>
                        <th>Tutar</th>
                    </tr>
                </thead>
                <tbody>
                    <tr data-repeat-row="items">

                        <td class="report-control report-cell drop-zone"
                            data-control-type="cell"
                            data-name="productName"
                            data-binding=""
                            data-format="text">
                            <div class="cell-drop-placeholder">Ürün/Hizmet alanı bırak</div>
                            <span class="report-control-text"></span>
                            <span class="report-smart-tag" title="Data Binding">●</span>
                        </td>

                        <td class="report-control report-cell drop-zone"
                            data-control-type="cell"
                            data-name="quantity"
                            data-binding=""
                            data-format="number">
                            <div class="cell-drop-placeholder">Miktar alanı bırak</div>
                            <span class="report-control-text"></span>
                            <span class="report-smart-tag" title="Data Binding">●</span>
                        </td>

                        <td class="report-control report-cell drop-zone"
                            data-control-type="cell"
                            data-name="unitPrice"
                            data-binding=""
                            data-format="currency">
                            <div class="cell-drop-placeholder">Birim fiyat alanı bırak</div>
                            <span class="report-control-text"></span>
                            <span class="report-smart-tag" title="Data Binding">●</span>
                        </td>

                        <td class="report-control report-cell drop-zone"
                            data-control-type="cell"
                            data-name="lineTotal"
                            data-binding=""
                            data-format="currency">
                            <div class="cell-drop-placeholder">Tutar alanı bırak</div>
                            <span class="report-control-text"></span>
                            <span class="report-smart-tag" title="Data Binding">●</span>
                        </td>

                    </tr>
                </tbody>
            `,
            draggable: true,
            droppable: false,
            stylable: true
        }
    }
});


// ================================
// REPORT BAND
// ================================

editor.DomComponents.addType("report-band", {
    model: {
        defaults: {
            tagName: "div",
            attributes: {
                class: "report-band detail-band",
                "data-band-type": "detail",
                "data-repeat-source": "items"
            },
            components: `
                <div class="band-caption">Detail</div>
            `,
            draggable: true,
            droppable: true,
            stylable: true
        }
    }
});


// ================================
// REPORT LINE
// ================================

editor.DomComponents.addType("report-line", {
    model: {
        defaults: {
            tagName: "div",
            attributes: {
                class: "report-line",
                "data-control-type": "line"
            },
            draggable: true,
            droppable: false,
            stylable: true
        }
    }
});


// ================================
// REPORT IMAGE
// ================================

editor.DomComponents.addType("report-image", {
    model: {
        defaults: {
            tagName: "img",
            attributes: {
                class: "report-image",
                src: "https://via.placeholder.com/160x80?text=LOGO",
                "data-control-type": "image"
            },
            draggable: true,
            droppable: false,
            stylable: true
        }
    }
});


// ================================
// CUSTOMER LOAD / PREVIEW
// ================================

function loadCustomers() {
    fetch("/Designer/GetCustomers")
        .then(response => response.json())
        .then(customers => {
            const select = document.getElementById("customerSelect");
            if (!select) return;

            select.innerHTML = '<option value="">Müşteri seç</option>';

            customers.forEach(customer => {
                const option = document.createElement("option");
                option.value = customer.id;
                option.textContent = customer.companyName;
                select.appendChild(option);
            });
        });
}

if (document.getElementById("customerSelect")) {
    loadCustomers();
}