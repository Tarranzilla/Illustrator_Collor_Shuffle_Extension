// Retorna a lista de pastas para o painel
function getSwatchGroups() {
    var doc;
    try { doc = app.activeDocument; } catch(e) { return "Abra um documento primeiro"; }
    
    var groupList = ["Cores selecionadas manualmente"];
    for (var i = 0; i < doc.swatchGroups.length; i++) {
        var groupName = doc.swatchGroups[i].name;
        if (groupName === "") { groupName = "Todas as Cores do Documento"; }
        groupList.push("Pasta: " + groupName);
    }
    return groupList.join("|||"); // Usamos ||| como separador para não dar erro com vírgulas
}

// O motor de pintura
function runMainLogic(colorStrokesStr, swatchChoiceIndexStr) {
    // Converte as strings que vieram do HTML de volta para booleano e número
    var colorStrokes = (colorStrokesStr === "true");
    var swatchChoiceIndex = parseInt(swatchChoiceIndexStr);
    
    var doc;
    try { doc = app.activeDocument; } catch(e) { alert("Abra um documento."); return; }
    
    var sel = doc.selection;
    var swatchesToUse = [];

    if (swatchChoiceIndex === 0) {
        swatchesToUse = doc.swatches.getSelected();
        if (swatchesToUse.length === 0) {
            alert("Modo manual: selecione uma cor no painel Swatches."); return;
        }
    } else {
        var selectedGroup = doc.swatchGroups[swatchChoiceIndex - 1];
        swatchesToUse = selectedGroup.getAllSwatches();
        if (swatchesToUse.length === 0) { alert("Pasta vazia."); return; }
    }

    if (sel.length === 0) { alert("Selecione os ícones."); return; }

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

    for (var i = 0; i < iconsToPaint.length; i++) {
        var icon = iconsToPaint[i];
        var randomIndex = Math.floor(Math.random() * swatchesToUse.length);
        var chosenColor = swatchesToUse[randomIndex].color;
        applyColorRecursive(icon, chosenColor, colorStrokes);
    }
}

function getTopMostParent(item) {
    var current = item;
    while (current.parent && current.parent.typename === "GroupItem") {
        if (app.activeDocument.selection.length === 1 && current.parent === app.activeDocument.selection[0]) {
            break;
        }
        current = current.parent;
    }
    return current;
}

function applyColorRecursive(item, color, colorStrokes) {
    try {
        var type = item.typename;
        if (type === "GroupItem") {
            var start = 0; if (item.clipped) { start = 1; } 
            for (var j = start; j < item.pageItems.length; j++) {
                applyColorRecursive(item.pageItems[j], color, colorStrokes);
            }
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