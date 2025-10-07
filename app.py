from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

DATA_FILE = 'rutas_transporte.json'

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        return []

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/rutas', methods=['GET'])
def get_rutas():
    data = load_data()
    return jsonify(data)

@app.route('/agregar_ruta', methods=['POST'])
def agregar_ruta():
    nueva_ruta = request.get_json()
    if not nueva_ruta:
        return jsonify({'error': 'No se proporcionaron datos'}), 400

    data = load_data()
    nueva_ruta['id'] = len(data) + 1
    data.append(nueva_ruta)
    save_data(data)
    return jsonify({'mensaje': 'Ruta agregada exitosamente'}), 201

@app.route('/eliminar_ruta/<int:ruta_id>', methods=['DELETE'])
def eliminar_ruta(ruta_id):
    data = load_data()
    nueva_data = [ruta for ruta in data if ruta.get('id') != ruta_id]
    if len(nueva_data) == len(data):
        return jsonify({'error': 'Ruta no encontrada'}), 404
    save_data(nueva_data)
    return jsonify({'mensaje': f'Ruta con ID {ruta_id} eliminada'}), 200

@app.route('/editar_ruta/<int:ruta_id>', methods=['PUT'])
def editar_ruta(ruta_id):
    ruta_actualizada = request.get_json()
    data = load_data()
    for i, ruta in enumerate(data):
        if ruta.get('id') == ruta_id:
            ruta_actualizada['id'] = ruta_id
            data[i] = ruta_actualizada
            save_data(data)
            return jsonify({'mensaje': f'Ruta con ID {ruta_id} actualizada'}), 200
    return jsonify({'error': 'Ruta no encontrada'}), 404

@app.route('/buscar_rutas', methods=['GET'])
def buscar_rutas():
    nombre = request.args.get('nombre', '').lower()
    sindicato = request.args.get('sindicato', '').lower()
    data = load_data()
    resultados = [
        ruta for ruta in data
        if nombre in ruta.get('nombre', '').lower() or sindicato in ruta.get('sindicato', '').lower()
    ]
    return jsonify(resultados)

if __name__ == '__main__':
    app.run(debug=True)
