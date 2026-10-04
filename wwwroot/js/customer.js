function loadInvoiceData() {
    fetch("/Designer/GetInvoiceData")
        .then(response => response.json())
        .then(data => {

            const flatData = {
                ...prefixObject("Customer", data.customer),
                ...prefixObject("Invoice", data.invoice),
                ...prefixObject("Item", data.items?.[0] || {})
            };

            const wrapper = editor.DomComponents.getWrapper();

            Object.keys(flatData).forEach(key => {
                const value = flatData[key];

                const components = wrapper.find(`[data-field="${key}"]`);

                components.forEach(component => {
                    component.components(String(value ?? ""));
                });
            });

            console.log("Veriler yüklendi:", flatData);
        })
        .catch(error => {
            console.error("Veri yüklenirken hata oluştu:", error);
        });
}

function prefixObject(prefix, obj) {
    const result = {};

    if (!obj) return result;

    Object.keys(obj).forEach(key => {
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        result[prefix + "." + pascalKey] = obj[key];
    });

    return result;
}

loadInvoiceData();