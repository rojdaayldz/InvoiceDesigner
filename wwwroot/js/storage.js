function saveTemplate() {
    const projectData = editor.getProjectData();

    const template = {
        templateName: "Varsayılan Şablon",
        templateJson: JSON.stringify(projectData)
    };

    fetch("/Designer/SaveTemplate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(template)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Kaydetme başarısız.");
            }

            return response.json();
        })
        .then(result => {
            alert("Şablon kaydedildi. ID: " + result.templateId);
        })
        .catch(error => {
            console.error("Kaydetme hatası:", error);
            alert("Şablon kaydedilemedi.");
        });
}

function loadLastTemplate() {
    fetch("/Designer/GetLastTemplate")
        .then(response => {
            if (!response.ok) {
                alert("Kayıtlı şablon bulunamadı.");
                return null;
            }

            return response.json();
        })
        .then(result => {
            if (!result) return;

            const projectData = JSON.parse(result.templateJson);

            editor.loadProjectData(projectData);

            alert("Şablon yüklendi.");
        })
        .catch(error => {
            console.error("Yükleme hatası:", error);
            alert("Şablon yüklenemedi.");
        });
}
function loadTemplates() {
    fetch("/Designer/GetTemplates")
        .then(response => response.json())
        .then(templates => {
            const select = document.getElementById("templateSelect");
            select.innerHTML = '<option value="">Şablon seç</option>';

            templates.forEach(template => {
                const option = document.createElement("option");
                option.value = template.id;
                option.textContent = template.templateName + " #" + template.id;
                select.appendChild(option);
            });
        });
}

function loadSelectedTemplate() {
    const templateId = document.getElementById("templateSelect").value;

    if (!templateId) {
        alert("Lütfen şablon seç.");
        return;
    }

    fetch("/Designer/GetTemplateById?id=" + templateId)
        .then(response => response.json())
        .then(result => {
            const projectData = JSON.parse(result.templateJson);
            editor.loadProjectData(projectData);
            alert("Şablon yüklendi.");
        });
}

loadTemplates();