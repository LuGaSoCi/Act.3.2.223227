import ply.lex as lex
import ply.yacc as yacc

# Definición de tokens
tokens = (
    'NUMBER',
    'PLUS',
    'MINUS',
    'TIMES',
    'DIVIDE',
    'LPAREN',
    'RPAREN',
)

t_PLUS = r'\+'
t_MINUS = r'-'
t_TIMES = r'\*'
t_DIVIDE = r'/'
t_LPAREN = r'\('
t_RPAREN = r'\)'

def t_NUMBER(t):
    r'(\d+\.\d+|\d+|(\.\d+))'
    t.value = float(t.value)
    return t

t_ignore = ' \t'

def t_error(t):
    print(f"Carácter ilegal '{t.value[0]}'")
    t.lexer.skip(1)

lexer = lex.lex()

# Gramática para las expresiones aritméticas
def p_expression(p):
    '''expression : expression PLUS term
                  | expression MINUS term
                  | term'''
    if len(p) == 4:
        p[0] = ('+', p[1], p[3]) if p[2] == '+' else ('-', p[1], p[3])
    else:
        p[0] = p[1]

def p_term(p):
    '''term : term TIMES factor
            | term DIVIDE factor
            | factor'''
    if len(p) == 4:
        p[0] = ('*', p[1], p[3]) if p[2] == '*' else ('/', p[1], p[3])
    else:
        p[0] = p[1]

def p_factor(p):
    '''factor : NUMBER
              | LPAREN expression RPAREN
              | factor LPAREN expression RPAREN'''
    if len(p) == 2:
        p[0] = p[1]
    elif len(p) == 4:
        p[0] = p[2]
    elif len(p) == 5:  # Manejar multiplicación implícita como 5(6+2)
        p[0] = ('*', p[1], p[3])

def p_error(p):
    print("Error de sintaxis en la entrada")

precedence = (
    ('left', 'PLUS', 'MINUS'),
    ('left', 'TIMES', 'DIVIDE'),
)

parser = yacc.yacc()

def eval_arbol(arbol):
    if isinstance(arbol, (int, float)):
        return arbol
    operador, izquierdo, derecho = arbol
    if operador == '+':
        return eval_arbol(izquierdo) + eval_arbol(derecho)
    elif operador == '-':
        return eval_arbol(izquierdo) - eval_arbol(derecho)
    elif operador == '*':
        return eval_arbol(izquierdo) * eval_arbol(derecho)
    elif operador == '/':
        if eval_arbol(derecho) == 0:
            raise ZeroDivisionError("División por cero no permitida")
        return eval_arbol(izquierdo) / eval_arbol(derecho)
    raise ValueError("Operador desconocido")
