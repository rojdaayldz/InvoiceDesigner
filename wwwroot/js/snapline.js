console.log("snap lines çalıştı - mouse based");

function initSnapLines() {
    if (typeof editor === "undefined" || !editor.Canvas) {
        setTimeout(initSnapLines, 300);
        return;
    }

    const body = editor.Canvas.getBody();

    if (!body || body.dataset.snapLinesBound === "1") return;
    body.dataset.snapLinesBound = "1";

    const vLine = document.createElement("div");
    vLine.className = "report-guide-line vertical";

    const hLine = document.createElement("div");
    hLine.className = "report-guide-line horizontal";

    body.appendChild(vLine);
    body.appendChild(hLine);

    let isDragging = false;
    let selectedEl = null;

    function showLines() {
        if (!selectedEl) return;

        const bodyRect = body.getBoundingClientRect();
        const rect = selectedEl.getBoundingClientRect();

        vLine.style.left = rect.left - bodyRect.left + "px";
        hLine.style.top = rect.top - bodyRect.top + "px";

        vLine.style.display = "block";
        hLine.style.display = "block";
    }

    function hideLines() {
        isDragging = false;
        selectedEl = null;
        vLine.style.display = "none";
        hLine.style.display = "none";
    }

    body.addEventListener("mousedown", function (e) {
        const target = e.target.closest(
            ".report-control, .report-table, .report-image, .report-line"
        );

        if (!target) return;

        isDragging = true;
        selectedEl = target;

        showLines();
    }, true);

    body.addEventListener("mousemove", function () {
        if (!isDragging || !selectedEl) return;

        showLines();
    }, true);

    body.addEventListener("mouseup", hideLines, true);
    body.addEventListener("mouseleave", hideLines, true);

    console.log("snapline mouse eventleri bağlandı");
}

if (typeof editor !== "undefined") {
    editor.on("load", initSnapLines);
    setTimeout(initSnapLines, 500);
} else {
    setTimeout(initSnapLines, 500);
}