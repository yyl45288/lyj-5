import os
import json
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
DATA_DIR = os.path.join(BASE_DIR, 'data')
SCORES_FILE = os.path.join(DATA_DIR, 'scores.json')

os.makedirs(SAVES_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

if not os.path.exists(SCORES_FILE):
    with open(SCORES_FILE, 'w', encoding='utf-8') as f:
        json.dump({'records': []}, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    return send_from_directory('../frontend', 'index.html')


@app.route('/api/save', methods=['POST'])
def save_game():
    try:
        data = request.get_json()
        game_state = data.get('gameState')
        save_id = data.get('saveId') or f'save_{uuid.uuid4().hex[:12]}'

        save_data = {
            'id': save_id,
            'createdAt': data.get('createdAt') or datetime.utcnow().isoformat(),
            'updatedAt': datetime.utcnow().isoformat(),
            'gameState': game_state
        }

        save_path = os.path.join(SAVES_DIR, f'{save_id}.json')
        with open(save_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)

        return jsonify({
            'success': True,
            'saveId': save_id,
            'message': '游戏已保存'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'保存失败: {str(e)}'
        }), 500


@app.route('/api/load', methods=['GET'])
def load_game():
    try:
        save_id = request.args.get('saveId')
        
        if not save_id:
            save_files = [f for f in os.listdir(SAVES_DIR) if f.endswith('.json')]
            if not save_files:
                return jsonify({
                    'success': False,
                    'message': '没有找到存档'
                })
            save_files.sort(key=lambda x: os.path.getmtime(os.path.join(SAVES_DIR, x)), reverse=True)
            save_id = save_files[0].replace('.json', '')

        save_path = os.path.join(SAVES_DIR, f'{save_id}.json')
        
        if not os.path.exists(save_path):
            return jsonify({
                'success': False,
                'message': '存档不存在'
            }), 404

        with open(save_path, 'r', encoding='utf-8') as f:
            save_data = json.load(f)

        return jsonify({
            'success': True,
            'gameState': save_data.get('gameState'),
            'saveId': save_id
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'加载失败: {str(e)}'
        }), 500


@app.route('/api/scores', methods=['GET'])
def get_scores():
    try:
        with open(SCORES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        scores = data.get('records', [])
        scores.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'success': True,
            'scores': scores[:10]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'scores': [],
            'message': f'获取积分失败: {str(e)}'
        }), 500


@app.route('/api/scores', methods=['POST'])
def save_score():
    try:
        data = request.get_json()
        
        record = {
            'id': data.get('id') or f'score_{uuid.uuid4().hex[:12]}',
            'score': data.get('score', 0),
            'kills': data.get('kills', 0),
            'floor': data.get('floor', 1),
            'date': data.get('date') or datetime.utcnow().isoformat()
        }

        with open(SCORES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        data['records'].append(record)
        data['records'].sort(key=lambda x: x['score'], reverse=True)
        data['records'] = data['records'][:10]

        with open(SCORES_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return jsonify({
            'success': True,
            'record': record
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'保存积分失败: {str(e)}'
        }), 500


@app.route('/api/saves', methods=['GET'])
def list_saves():
    try:
        save_files = [f for f in os.listdir(SAVES_DIR) if f.endswith('.json')]
        saves = []
        
        for filename in save_files:
            save_path = os.path.join(SAVES_DIR, filename)
            with open(save_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                saves.append({
                    'id': data.get('id'),
                    'createdAt': data.get('createdAt'),
                    'updatedAt': data.get('updatedAt'),
                    'floor': data.get('gameState', {}).get('dungeon', {}).get('floor', 1),
                    'level': data.get('gameState', {}).get('player', {}).get('stats', {}).get('level', 1),
                    'score': data.get('gameState', {}).get('score', 0)
                })
        
        saves.sort(key=lambda x: x['updatedAt'], reverse=True)
        
        return jsonify({
            'success': True,
            'saves': saves
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'saves': [],
            'message': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'status': 'running',
        'timestamp': datetime.utcnow().isoformat()
    })


if __name__ == '__main__':
    print('🚀 Roguelike 游戏服务器启动中...')
    print('📂 静态文件目录:', os.path.abspath('../frontend'))
    print('💾 存档目录:', SAVES_DIR)
    print('🏆 积分文件:', SCORES_FILE)
    print('🌐 访问地址: http://localhost:5000')
    print('-' * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
