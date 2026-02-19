var csInterface = new CSInterface();

window.onload = function() {
    csInterface.evalScript('getSwatchGroups()', function(result) {
        var dropdown = document.getElementById('swatchDropdown');
        dropdown.innerHTML = ""; 
        var groups = result.split('|||');
        for (var i = 0; i < groups.length; i++) {
            var option = document.createElement("option");
            option.value = i; option.text = groups[i];
            dropdown.appendChild(option);
        }
        updatePreview();
    });

    document.getElementById('swatchDropdown').addEventListener('change', updatePreview);
    document.getElementById('btnRefresh').addEventListener('click', updatePreview);
};

function updatePreview() {
    var dropIndex = document.getElementById('swatchDropdown').value;
    
    csInterface.evalScript('getPreviewData("' + dropIndex + '")', function(result) {
        var parts = result.split('|||');
        var count = parts[0];
        var colors = parts[1] ? parts[1].split(',') : [];

        document.getElementById('itemCount').innerHTML = 'Ícones identificados: <span class="highlight">' + count + '</span>';

        var colorContainer = document.getElementById('colorBoxes');
        colorContainer.innerHTML = ""; 

        if (colors.length === 0 || colors[0] === "") {
            colorContainer.innerHTML = "<span style='color:#999; font-size:11px;'>Nenhuma cor encontrada.</span>";
        } else {
            for (var i = 0; i < colors.length; i++) {
                var div = document.createElement('div');
                div.className = 'color-swatch';
                div.style.backgroundColor = colors[i];
                div.title = "Clique para ligar/desligar esta cor";
                
                // Salva o índice original da cor neste quadradinho
                div.setAttribute('data-index', i); 
                
                // O efeito de Toggle (liga/desliga)
                div.onclick = function() {
                    this.classList.toggle('disabled');
                };

                colorContainer.appendChild(div);
            }
        }
    });
}

document.getElementById('btnRun').addEventListener('click', function() {
    var checkStroke = document.getElementById('chkStroke').checked;
    var dropIndex = document.getElementById('swatchDropdown').value;
    
    // --- NOVA LÓGICA DE EXCLUSÃO ---
    // Pega todos os quadradinhos que receberam a classe "disabled" (com o X)
    var disabledElements = document.querySelectorAll('.color-swatch.disabled');
    var excludedIndices = [];
    
    for (var j = 0; j < disabledElements.length; j++) {
        // Guarda o número original daquela cor
        excludedIndices.push(disabledElements[j].getAttribute('data-index'));
    }
    
    // Transforma a lista numa string separada por vírgula (ex: "0,3,5") para o Illustrator entender
    var excludedStr = excludedIndices.join(',');

    // Manda para o JSX o parâmetro extra com as cores excluídas
    var callString = 'runMainLogic("' + checkStroke + '", "' + dropIndex + '", "' + excludedStr + '")';
    csInterface.evalScript(callString);
});