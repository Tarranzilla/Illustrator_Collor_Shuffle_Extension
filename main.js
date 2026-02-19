var csInterface = new CSInterface();

// Quando o painel abrir, pede ao Illustrator a lista de Pastas de Cores
window.onload = function() {
    csInterface.evalScript('getSwatchGroups()', function(result) {
        var dropdown = document.getElementById('swatchDropdown');
        dropdown.innerHTML = ""; // Limpa o "Carregando..."
        
        // O JSX devolve uma string separada por "|||"
        var groups = result.split('|||');
        for (var i = 0; i < groups.length; i++) {
            var option = document.createElement("option");
            option.value = i;
            option.text = groups[i];
            dropdown.appendChild(option);
        }
    });
};

// Quando clicar no botão
document.getElementById('btnRun').addEventListener('click', function() {
    var checkStroke = document.getElementById('chkStroke').checked;
    var dropIndex = document.getElementById('swatchDropdown').value;
    
    // Manda os dados da interface para a função runMainLogic no script.jsx
    var callString = 'runMainLogic("' + checkStroke + '", "' + dropIndex + '")';
    csInterface.evalScript(callString);
});