function downloadPdf() {
    const html = editor.getHtml();
    const grapesCss = editor.getCss();

    fetch("/css/designer.css")
        .then(response => response.text())
        .then(designerCss => {
            const css = designerCss + "\n" + grapesCss;

            return fetch("/Designer/GeneratePdf", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    html: html,
                    css: css
                })
            });
        })
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "fatura.pdf";
            a.click();

            window.URL.revokeObjectURL(url);
        })
        .catch(error => {
            console.error(error);
            alert("PDF oluşturulamadı.");
        });
}