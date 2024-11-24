import re

def analyze_chain(cadena):
    patron = r"(\d+\.\d+|\.\d+|\d+|[\+\-\*/()]|\.)"
    tokens = re.findall(patron, cadena)

    tabla_tokens = []
    resumen = {"Operadores": 0, "Enteros": 0, "Decimales": 0, "Puntos Decimales": 0, "Multiplicaciones Implícitas": 0}

    ultimo_token = None
    for token in tokens:
        tipo = None
        if re.fullmatch(r"\d+\.\d+|\.\d+", token):  # Coincide con decimales
            # Separar el número decimal en parte entera y parte decimal
            if '.' in token:
                parte_entera, parte_decimal = token.split('.', 1)
                tabla_tokens.append({"Token": parte_entera, "Tipo": "Número entero"})
                tabla_tokens.append({"Token": ".", "Tipo": "Punto decimal"})
                tabla_tokens.append({"Token": parte_decimal, "Tipo": "Parte decimal"})
                resumen["Decimales"] += 1
                resumen["Puntos Decimales"] += 1
            tipo = "Número decimal"  # No se contará en el resumen como "Número decimal"
        elif re.fullmatch(r"\d+", token):  # Coincide con enteros
            resumen["Enteros"] += 1
            tipo = "Número entero"
        elif token in "+-*/":  # Coincide con operadores
            resumen["Operadores"] += 1
            tipo = f"Operador ({token})"
        elif token == "(":  # Paréntesis de apertura
            if ultimo_token and re.fullmatch(r"\d+(\.\d+)?", ultimo_token):  # Multiplicación implícita
                tipo = "Multiplicación implícita"
                resumen["Multiplicaciones Implícitas"] += 1
            else:
                tipo = "Paréntesis de apertura"
        elif token == ")":  # Paréntesis de cierre
            tipo = "Paréntesis de cierre"

        if tipo != "Número decimal":  # No se agrega al resumen como "Número decimal"
            tabla_tokens.append({"Token": token, "Tipo": tipo})
        ultimo_token = token

    return tabla_tokens, resumen
