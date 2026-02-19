function getSwatchGroups() {
    var doc;
    try { doc = app.activeDocument; } catch(e) { return "Abra um documento"; }
    
    var groupList = ["Cores selecionadas manualmente"];
    for (var i = 0; i < doc.swatchGroups.length; i++) {
        var groupName = doc.swatchGroups[i].name;
        if (groupName === "") { groupName = "Todas as Cores do Documento"; }
        groupList.push("Pasta: " + groupName);
    }
    return groupList.join("|||");
}

// --- NOVA FUNÇÃO DE PREVIEW ---
function getPreviewData(swatchChoiceIndexStr) {
    var doc;
    try { doc = app.activeDocument; } catch(e) { return "0|||"; }
    
    var sel = doc.selection;
    var swatchChoiceIndex = parseInt(swatchChoiceIndexStr);
    var swatchesToUse = [];

    // 1. Pega as cores
    if (swatchChoiceIndex === 0) {
        swatchesToUse = doc.swatches.getSelected();
    } else {
        var selectedGroup = doc.swatchGroups[swatchChoiceIndex - 1];
        swatchesToUse = selectedGroup.getAllSwatches();
    }

    // Converte as cores para HEX para o HTML ler
    var hexColors = [];
    for (var i = 0; i < swatchesToUse.length; i++) {
        hexColors.push(extractHexColor(swatchesToUse[i].color));
    }

    // 2. Conta os itens REAIS que serão pintados (lógica anti-confete)
    var iconsToPaint = [];
    if (sel.length === 1 && sel[0].typename === "GroupItem") {
        var masterGroup = sel[0];
        for (var i = 0; i < masterGroup.pageItems.length; i++) {
            if (masterGroup.pageItems[i].parent === masterGroup) {
                iconsToPaint.push(masterGroup.pageItems[i]);
            }
        }
    } else {
        for (var i = 0; i < sel.length; i++) {
            var item = sel[i];
            var topItem = getTopMostParent(item);
            var exists = false;
            for (var k = 0; k < iconsToPaint.length; k++) {
                if (iconsToPaint[k] === topItem) { exists = true; break; }
            }
            if (!exists) { iconsToPaint.push(topItem); }
        }
    }

    // Retorna a quantidade de itens + as cores divididas por vírgula
    return iconsToPaint.length + "|||" + hexColors.join(",");
}

// Função Auxiliar: Converte CMYK, RGB, Spot ou Gray para Hexadecimal
function extractHexColor(c) {
    var r, g, b;
    if (c.typename == 'RGBColor') {
        r = Math.round(c.red); g = Math.round(c.green); b = Math.round(c.blue);
    } else if (c.typename == 'CMYKColor') {
        // Conversão aproximada de CMYK para RGB
        r = 255 * (1 - c.cyan / 100) * (1 - c.black / 100);
        g = 255 * (1 - c.magenta / 100) * (1 - c.black / 100);
        b = 255 * (1 - c.yellow / 100) * (1 - c.black / 100);
    } else if (c.typename == 'SpotColor') {
        return extractHexColor(c.spot.color); // Chama recursivo se for Pantone
    } else if (c.typename == 'GrayColor') {
        var val = Math.round(255 - (c.gray * 2.55));
        r = val; g = val; b = val;
    } else {
        return "#CCCCCC"; // Cor padrão de erro
    }
    
    return "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase();
}

// --- FUNÇÕES DE PINTURA (Iguais às anteriores) ---
function runMainLogic(colorStrokesStr, swatchChoiceIndexStr, excludedIndicesStr) {
    var colorStrokes = (colorStrokesStr === "true");
    var swatchChoiceIndex = parseInt(swatchChoiceIndexStr);
    
    var doc;
    try { doc = app.activeDocument; } catch(e) { alert("Abra um documento."); return; }
    
    var sel = doc.selection;
    var swatchesToUse = [];

    // Pega as cores (do Swatch ou do Grupo)
    if (swatchChoiceIndex === 0) {
        swatchesToUse = doc.swatches.getSelected();
        if (swatchesToUse.length === 0) { alert("Modo manual: selecione uma cor no painel Swatches."); return; }
    } else {
        var selectedGroup = doc.swatchGroups[swatchChoiceIndex - 1];
        swatchesToUse = selectedGroup.getAllSwatches();
        if (swatchesToUse.length === 0) { alert("Pasta vazia."); return; }
    }

    // --- NOVA LÓGICA: FILTRA AS CORES MARCADAS COM 'X' ---
    var finalSwatches = [];
    var excludedArray = (excludedIndicesStr !== "") ? excludedIndicesStr.split(',') : [];
    
    // Cria um dicionário rápido para saber quem foi excluído
    var excludedMap = {};
    for (var ex = 0; ex < excludedArray.length; ex++) {
        excludedMap[excludedArray[ex]] = true;
    }

    // Salva na lista final apenas as cores que NÃO estão marcadas como excluídas
    for (var s = 0; s < swatchesToUse.length; s++) {
        if (!excludedMap[s]) {
            finalSwatches.push(swatchesToUse[s]);
        }
    }

    // Validação: se o cara excluiu todas as cores, dá erro
    if (finalSwatches.length === 0) {
        alert("Você desativou todas as cores! Deixe pelo menos uma ligada para pintar.");
        return;
    }

    if (sel.length === 0) { alert("Selecione os ícones."); return; }

    var iconsToPaint = [];
    if (sel.length === 1 && sel[0].typename === "GroupItem") {
        var masterGroup = sel[0];
        for (var i = 0; i < masterGroup.pageItems.length; i++) {
            if (masterGroup.pageItems[i].parent === masterGroup) { iconsToPaint.push(masterGroup.pageItems[i]); }
        }
    } else {
        for (var i = 0; i < sel.length; i++) {
            var item = sel[i];
            var topItem = getTopMostParent(item);
            var exists = false;
            for (var k = 0; k < iconsToPaint.length; k++) {
                if (iconsToPaint[k] === topItem) { exists = true; break; }
            }
            if (!exists) { iconsToPaint.push(topItem); }
        }
    }

    // Pinta usando a 'finalSwatches' (lista limpa) e não mais a 'swatchesToUse'
    for (var i = 0; i < iconsToPaint.length; i++) {
        var icon = iconsToPaint[i];
        var randomIndex = Math.floor(Math.random() * finalSwatches.length);
        var chosenColor = finalSwatches[randomIndex].color;
        applyColorRecursive(icon, chosenColor, colorStrokes);
    }
}

function getTopMostParent(item) {
    var current = item;
    while (current.parent && current.parent.typename === "GroupItem") {
        if (app.activeDocument.selection.length === 1 && current.parent === app.activeDocument.selection[0]) { break; }
        current = current.parent;
    }
    return current;
}

function applyColorRecursive(item, color, colorStrokes) {
    try {
        var type = item.typename;
        if (type === "GroupItem") {
            var start = 0; if (item.clipped) { start = 1; } 
            for (var j = start; j < item.pageItems.length; j++) { applyColorRecursive(item.pageItems[j], color, colorStrokes); }
        } else if (type === "PathItem") {
            if (!item.clipping && !item.guides) {
                item.filled = true; item.fillColor = color;
                if (colorStrokes && item.stroked) { item.strokeColor = color; }
            }
        } else if (type === "CompoundPathItem") {
             if (item.pathItems.length > 0) {
                item.pathItems[0].fillColor = color;
                if (colorStrokes && item.pathItems[0].stroked) { item.pathItems[0].strokeColor = color; }
            }
            item.filled = true; item.fillColor = color;
        }
    } catch(e) {}
}