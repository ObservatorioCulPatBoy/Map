import os
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory

# --------------------------------------------------
# Meses en español (reemplaza locale que no funciona en Vercel)
# --------------------------------------------------
MESES_ES = {
    1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
    5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
    9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
}

# --------------------------------------------------
# Ruta del Excel (relativa a api/)
# --------------------------------------------------
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)                        # sube a la raíz del proyecto
EXCEL_FILE = os.path.join(PROJECT_DIR, 'datos', 'Eventos.xlsx')
PUBLIC_DIR = os.path.join(PROJECT_DIR, 'public')

app = Flask(__name__, static_folder=PUBLIC_DIR, static_url_path='')

# --------------------------------------------------
# 1) Carga y procesa el Excel de eventos (hoja por defecto)
# --------------------------------------------------
df = pd.read_excel(
    EXCEL_FILE,
    dtype={'codigo_dane': str}
)

# Limpiar nombres de provincia
df['Provincia'] = (
    df['Provincia']
    .astype(str)
    .str.replace(r'^\d+\.', '', regex=True)
    .str.strip()
)

df['Fecha'] = pd.to_datetime(df['Fecha'], errors='coerce')
df['mes_num'] = df['Fecha'].dt.month
df = df.sort_values(by='mes_num')
df['mes'] = df['mes_num'].map(MESES_ES)

df['día'] = df['Fecha'].dt.day
df = df.rename(columns={
    'Evento':              'nombre_evento',
    'Fecha':               'Fecha',
    'Categoría':           'categoria',
    'Tipo de Evento':      'tipo_evento',
    'Línea/Subcategoría':  'linea_subcategoria',
    'Provincia':           'provincia',
    'Municipio':           'municipio',
    'Latitud':             'lat',
    'Longitud':            'lon',
    'Código DANE':         'codigo_dane'
})
df['Fecha'] = df['Fecha'].dt.strftime('%Y-%m-%d')

# --------------------------------------------------
# 2) Carga y procesa Sheet1 para municipios/provincias
# --------------------------------------------------
df_mun = pd.read_excel(
    EXCEL_FILE,
    sheet_name='Sheet1',
    dtype={'codigo_dane': str}
)

# Limpiar nombres de provincia
df_mun['Provincia'] = (
    df_mun['Provincia']
    .astype(str)
    .str.replace(r'^\d+\.', '', regex=True)
    .str.strip()
)

df_mun = df_mun.rename(columns={
    'Código DANE': 'codigo_dane',
    'Municipio':    'municipio',
    'Provincia':    'provincia'
})
municipios_info = (
    df_mun[['codigo_dane','municipio','provincia']]
      .drop_duplicates()
      .sort_values(by='municipio')
      .to_dict(orient='records')
)

# --------------------------------------------------
# 3) Rutas de la API
# --------------------------------------------------
@app.route('/api/municipios')
def api_municipios():
    return jsonify(municipios_info)

@app.route('/api/eventos')
def api_eventos():
    df2 = df.copy()
    codigo    = request.args.get('codigo_dane')
    mes       = request.args.get('mes')
    provincia = request.args.get('provincia')
    if codigo:
        df2 = df2[df2['codigo_dane'] == codigo]
    if mes:
        df2 = df2[df2['mes'] == mes]
    if provincia:
        df2 = df2[df2['provincia'] == provincia]
    return jsonify(df2.to_dict(orient='records'))


@app.route('/')
def index():
    return send_from_directory(PROJECT_DIR, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='127.0.0.1', port=port, debug=True)
