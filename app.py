from flask import Flask, request, jsonify, render_template
from parser_calculadora import parser, eval_arbol
from generate_tables import analyze_chain

app = Flask(__name__)

resultado_guardado = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    global resultado_guardado
    data = request.get_json()
    expression = data.get("expression", "")
    save = data.get("save", False)

    try:
        if resultado_guardado is not None and expression:
            expression = str(resultado_guardado) + expression

        arbol = parser.parse(expression)
        result = eval_arbol(arbol)

        tabla_tokens, resumen = analyze_chain(expression)

        if save:
            resultado_guardado = result

        return jsonify({
            "result": result,
            "tree": arbol,
            "tabla_tokens": tabla_tokens,
            "resumen": resumen
        })
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route('/clear_saved', methods=['POST'])
def clear_saved():
    global resultado_guardado
    resultado_guardado = None
    return jsonify({"message": "Valor guardado eliminado"})

if __name__ == '__main__':
    app.run(debug=True)
