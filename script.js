let expression = "";
let savedValue = null;

function addToExpression(value) {
    // Si hay un valor guardado y empezamos una nueva expresión
    if (savedValue !== null && expression === "") {
        expression = savedValue.toString() + value;
        savedValue = null;
        updateMCButtonState();
    } else {
        expression += value;
    }
    document.getElementById('display').value = expression;
}

function clearDisplay() {
    expression = "";
    document.getElementById('display').value = "";
    d3.select("#tree").selectAll("*").remove();
    document.getElementById('tokens-table').innerHTML = "";
    document.getElementById('summary-table').innerHTML = "";
}

function calculate(save = false) {
    if (!expression) return;

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            expression: expression,
            save: save 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.result !== undefined) {
            const result = data.result;
            document.getElementById('display').value = result;
            
            if (save) {
                savedValue = result;
                updateMCButtonState();
            }
            
            expression = "";

            if (data.tabla_tokens && data.resumen) {
                renderTokensTable(data.tabla_tokens);
                renderSummaryTable(data.resumen);
            }
            if (data.tree) {
                drawTree(data.tree);
            }
        } else {
            document.getElementById('display').value = data.error || "Error";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('display').value = "Error de cálculo";
    });
}

function saveResult() {
    if (expression) {
        calculate(true);
    } else {
        const displayValue = document.getElementById('display').value;
        if (displayValue && !isNaN(displayValue)) {
            savedValue = parseFloat(displayValue);
            updateMCButtonState();
        }
    }
}

function clearSavedValue() {
    savedValue = null;
    updateMCButtonState();
    
    fetch('/clear_saved', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .catch(error => console.error('Error clearing saved value:', error));
}

function updateMCButtonState() {
    const mcButton = document.querySelector('button:nth-child(20)');
    if (mcButton) {
        mcButton.style.backgroundColor = savedValue !== null ? '#45a049' : '#666';
    }
}

function renderTokensTable(tokens) {
    const table = document.getElementById('tokens-table');
    if (!table) return;

    let html = `
        <tr>
            <th>Token</th>
            <th>Tipo</th>
        </tr>
    `;

    tokens.forEach(token => {
        html += `
            <tr>
                <td>${escapeHtml(token.Token)}</td>
                <td>${escapeHtml(token.Tipo)}</td>
            </tr>
        `;
    });

    table.innerHTML = html;
}

function renderSummaryTable(summary) {
    const table = document.getElementById('summary-table');
    if (!table) return;

    table.innerHTML = `
        <tr>
            <th>Tipo</th>
            <th>Cantidad</th>
        </tr>
        <tr>
            <td>Operadores</td>
            <td>${summary.Operadores}</td>
        </tr>
        <tr>
            <td>Enteros</td>
            <td>${summary.Enteros}</td>
        </tr>
        <tr>
            <td>Decimales</td>
            <td>${summary.Decimales}</td>
        </tr>
    `;
}

function escapeHtml(unsafe) {
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showTree() {
    if (!expression) return;

    fetch('/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expression: expression })
    })
    .then(response => response.json())
    .then(data => {
        if (data.tree) {
            drawTree(data.tree);
        } else {
            document.getElementById('tree').innerHTML = data.error || "Error al generar árbol";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('tree').innerHTML = "Error al generar árbol";
    });
}

function drawTree(treeData) {
    const svg = d3.select("#tree");
    svg.selectAll("*").remove();

    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const padding = 40;
    const verticalOffset = 50;

    const treeLayout = d3.tree()
        .size([width - (padding * 2), height - (padding * 2) - verticalOffset]);

    const root = d3.hierarchy(convertTree(treeData));
    treeLayout(root);

    // Crear un grupo para todo el contenido del árbol
    const g = svg.append("g")
        .attr("transform", `translate(${padding},${verticalOffset + padding})`);

    // Dibujar las líneas
    g.selectAll("line")
        .data(root.links())
        .enter()
        .append("line")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    // Dibujar los nodos
    const nodes = g.selectAll("g.node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("circle")
        .attr("r", 20)
        .attr("fill", "#666")
        .attr("stroke", "white")
        .attr("stroke-width", 2);

    nodes.append("text")
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .text(d => d.data.name)
        .attr("font-size", "14px");
}

function convertTree(tree) {
    if (typeof tree === "number" || typeof tree === "string") {
        return { name: tree };
    }

    const [operator, left, right] = tree;
    return {
        name: operator,
        children: [convertTree(left), convertTree(right)]
    };
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el doble clic para limpiar el valor guardado
    const mcButton = document.querySelector('button:nth-child(20)');
    if (mcButton) {
        mcButton.addEventListener('dblclick', clearSavedValue);
    }

    // Inicializar el estado del botón MC
    updateMCButtonState();
});