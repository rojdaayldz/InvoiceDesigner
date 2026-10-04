console.log("drop-binding.js aktif edildi");

// GrapesJS editöründe bir bileşen seçildiğinde tetiklenecek event
editor.on('component:selected', (component) => {
    // 1. Sağ paneldeki input elemanlarını yakala
    const propNameInput = document.getElementById('propName');
    const propTextInput = document.getElementById('propText');
    const propBindingInput = document.getElementById('propBinding');

    if (!component) return;

    // 2. Seçilen component'in bilgilerini sağ panele aktar
    propNameInput.value = component.get('name') || component.get('tagName') || 'Bileşen';

    // Hücrenin içindeki saf metni al (Örn: {{customer.companyName}})
    propTextInput.value = component.getHtml() || component.toHTML() || '';

    // Bileşenin üzerinde önceden tanımlanmış bir binding var mı kontrol et
    const currentBinding = component.getAttributes()['data-binding'] || '';
    propBindingInput.value = currentBinding;
});

// "Özellikleri Uygula" butonuna basıldığında çalışacak fonksiyon
window.applyProperties = function () {
    const selectedComponent = editor.getSelected();
    if (!selectedComponent) {
        alert("Lütfen önce tasarım alanından bir kutucuk seçin!");
        return;
    }

    const propTextInput = document.getElementById('propText').value;
    const propBindingInput = document.getElementById('propBinding');

    // Eğer kullanıcı kutunun içine {{...}} şeklinde veri anahtarı yazdıysa otomatik eşle
    if (propTextInput.includes('{{') && propTextInput.includes('}}')) {
        // İki süslü parantez arasını regex ile ayıklıyoruz
        const match = propTextInput.match(/\{\{([^}]+)\}\}/);
        if (match && match[1]) {
            const bindingKey = match[1].trim();
            propBindingInput.value = bindingKey;

            // Bileşene DevExpress simgesini tetikleyecek nitelikleri basıyoruz
            selectedComponent.addAttributes({
                'data-binding': bindingKey,
                'data-bound': 'true'
            });
        }
    } else {
        // Eğer süslü parantez yoksa düz yazıdır, data-bound niteliğini kaldır
        propBindingInput.value = '';
        selectedComponent.removeAttribute('data-bound');
        selectedComponent.removeAttribute('data-binding');
    }

    // İçerik metnini güncelle
    selectedComponent.set('content', propTextInput);
    alert("Bileşen özellikleri başarıyla güncellendi!");
};


