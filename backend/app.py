import os
import json
import uuid
import threading
import time
import queue
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAVES_DIR = os.path.join(BASE_DIR, 'saves')
DATA_DIR = os.path.join(BASE_DIR, 'data')
SCORES_FILE = os.path.join(DATA_DIR, 'scores.json')
DIFFICULTY_FILE = os.path.join(DATA_DIR, 'difficulty_stats.json')

os.makedirs(SAVES_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

if not os.path.exists(SCORES_FILE):
    with open(SCORES_FILE, 'w', encoding='utf-8') as f:
        json.dump({'records': []}, f, ensure_ascii=False, indent=2)

if not os.path.exists(DIFFICULTY_FILE):
    with open(DIFFICULTY_FILE, 'w', encoding='utf-8') as f:
        json.dump({
            'submissions': [],
            'difficultyDistribution': {
                'very_easy': 0,
                'easy': 0,
                'normal': 0,
                'hard': 0,
                'very_hard': 0,
                'extreme': 0
            },
            'stats': {
                'totalGames': 0,
                'averageScore': 0,
                'averageFloor': 0,
                'averageKills': 0,
                'averageDifficultyScore': 0
            }
        }, f, ensure_ascii=False, indent=2)


class SSEConnectionManager:
    def __init__(self):
        self.clients = {}
        self.lock = threading.RLock()
        self.heartbeat_interval = 15

    def add_client(self, client_id):
        with self.lock:
            q = queue.Queue(maxsize=1000)
            self.clients[client_id] = {'queue': q, 'active': True}
            return q

    def remove_client(self, client_id):
        with self.lock:
            if client_id in self.clients:
                self.clients[client_id]['active'] = False
                del self.clients[client_id]

    def broadcast(self, event_type, data):
        message = self._format_sse(event_type, data)
        disconnected = []
        with self.lock:
            clients_copy = list(self.clients.items())
        for client_id, client_info in clients_copy:
            if not client_info['active']:
                continue
            try:
                client_info['queue'].put_nowait(message)
            except queue.Full:
                disconnected.append(client_id)
        for client_id in disconnected:
            self.remove_client(client_id)

    def _format_sse(self, event_type, data):
        return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"

    def get_client_count(self):
        with self.lock:
            return len(self.clients)


class ScoreManager:
    def __init__(self, scores_file, sse_manager):
        self.scores_file = scores_file
        self.sse_manager = sse_manager
        self.lock = threading.RLock()
        self.top_10_scores = []
        self._load_initial_scores()

    def _load_initial_scores(self):
        with self.lock:
            try:
                with open(self.scores_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                scores = data.get('records', [])
                scores.sort(key=lambda x: x['score'], reverse=True)
                self.top_10_scores = scores[:10]
            except Exception:
                self.top_10_scores = []

    def get_top_scores(self, limit=10):
        with self.lock:
            return self.top_10_scores[:limit]

    def add_score(self, record):
        with self.lock:
            old_top_10 = list(self.top_10_scores)
            old_ids = set(r['id'] for r in old_top_10)

            with open(self.scores_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            data['records'].append(record)
            data['records'].sort(key=lambda x: x['score'], reverse=True)
            data['records'] = data['records'][:10]

            with open(self.scores_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            self.top_10_scores = data['records']

            rank = self._get_rank(record['score'])
            is_new_record = rank <= 10

            old_rank = self._get_rank_in_list(record['score'], old_top_10)
            is_new_entry = record['id'] not in old_ids
            rank_improved = is_new_record and is_new_entry

            if rank_improved:
                self._broadcast_update(record, rank)

            return {
                'record': record,
                'rank': rank,
                'is_new_record': is_new_record,
                'rank_improved': rank_improved
            }

    def _get_rank(self, score):
        for i, s in enumerate(self.top_10_scores):
            if score >= s['score']:
                return i + 1
        return len(self.top_10_scores) + 1

    def _get_rank_in_list(self, score, score_list):
        for i, s in enumerate(score_list):
            if score >= s['score']:
                return i + 1
        return None

    def _broadcast_update(self, record, rank):
        data = {
            'type': 'new_record',
            'record': record,
            'rank': rank,
            'topScores': self.top_10_scores,
            'timestamp': datetime.utcnow().isoformat(),
            'onlinePlayers': self.sse_manager.get_client_count()
        }
        self.sse_manager.broadcast('score_update', data)


sse_manager = SSEConnectionManager()
score_manager = ScoreManager(SCORES_FILE, sse_manager)


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


@app.route('/api/scores/stream', methods=['GET'])
def stream_scores():
    client_id = f'client_{uuid.uuid4().hex[:12]}'
    q = sse_manager.add_client(client_id)

    def generate():
        try:
            initial_data = {
                'type': 'initial',
                'topScores': score_manager.get_top_scores(10),
                'onlinePlayers': sse_manager.get_client_count(),
                'timestamp': datetime.utcnow().isoformat()
            }
            yield f"event: score_update\ndata: {json.dumps(initial_data, ensure_ascii=False)}\n\n"

            last_heartbeat = time.time()
            while True:
                try:
                    message = q.get(timeout=1)
                    yield message
                except queue.Empty:
                    current_time = time.time()
                    if current_time - last_heartbeat >= sse_manager.heartbeat_interval:
                        heartbeat_data = {
                            'type': 'heartbeat',
                            'onlinePlayers': sse_manager.get_client_count(),
                            'timestamp': datetime.utcnow().isoformat()
                        }
                        yield f"event: heartbeat\ndata: {json.dumps(heartbeat_data, ensure_ascii=False)}\n\n"
                        last_heartbeat = current_time
                    continue
        finally:
            sse_manager.remove_client(client_id)

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*'
        }
    )


@app.route('/api/scores', methods=['GET'])
def get_scores():
    try:
        scores = score_manager.get_top_scores(10)
        return jsonify({
            'success': True,
            'scores': scores,
            'onlinePlayers': sse_manager.get_client_count()
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

        result = score_manager.add_score(record)

        return jsonify({
            'success': True,
            'record': record,
            'rank': result['rank'],
            'isNewRecord': result['is_new_record'],
            'rankImproved': result['rank_improved']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'保存积分失败: {str(e)}'
        }), 500


@app.route('/api/scores/online', methods=['GET'])
def get_online_count():
    return jsonify({
        'success': True,
        'onlinePlayers': sse_manager.get_client_count()
    })


@app.route('/api/test/broadcast', methods=['POST'])
def test_broadcast():
    try:
        data = request.get_json() or {}
        test_score = data.get('score', 99999)
        test_record = {
            'id': f'test_{uuid.uuid4().hex[:8]}',
            'score': test_score,
            'kills': 100,
            'floor': 50,
            'date': datetime.utcnow().isoformat()
        }
        
        result = score_manager.add_score(test_record)
        
        return jsonify({
            'success': True,
            'result': result,
            'onlinePlayers': sse_manager.get_client_count()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
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


@app.route('/api/difficulty/leaderboard-avg', methods=['GET'])
def get_leaderboard_average():
    try:
        with open(SCORES_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        scores = data.get('records', [])
        if not scores:
            return jsonify({
                'success': True,
                'average': 0,
                'count': 0
            })
        
        total_score = sum(s['score'] for s in scores)
        average = total_score / len(scores)
        
        return jsonify({
            'success': True,
            'average': round(average, 2),
            'count': len(scores)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'average': 0,
            'message': str(e)
        }), 500


@app.route('/api/difficulty/submit', methods=['POST'])
def submit_difficulty_data():
    try:
        data = request.get_json()
        
        submission = {
            'id': f'diff_{uuid.uuid4().hex[:12]}',
            'floor': data.get('floor', 1),
            'kills': data.get('kills', 0),
            'score': data.get('score', 0),
            'difficulty': data.get('difficulty', 'normal'),
            'difficultyScore': data.get('difficultyScore', 0),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        with open(DIFFICULTY_FILE, 'r', encoding='utf-8') as f:
            diff_data = json.load(f)
        
        diff_data['submissions'].append(submission)
        
        difficulty = submission['difficulty']
        if difficulty in diff_data['difficultyDistribution']:
            diff_data['difficultyDistribution'][difficulty] += 1
        
        submissions = diff_data['submissions']
        if submissions:
            diff_data['stats']['totalGames'] = len(submissions)
            diff_data['stats']['averageScore'] = round(
                sum(s['score'] for s in submissions) / len(submissions), 2
            )
            diff_data['stats']['averageFloor'] = round(
                sum(s['floor'] for s in submissions) / len(submissions), 2
            )
            diff_data['stats']['averageKills'] = round(
                sum(s['kills'] for s in submissions) / len(submissions), 2
            )
            diff_data['stats']['averageDifficultyScore'] = round(
                sum(s['difficultyScore'] for s in submissions) / len(submissions), 2
            )
        
        diff_data['submissions'] = diff_data['submissions'][-100:]
        
        with open(DIFFICULTY_FILE, 'w', encoding='utf-8') as f:
            json.dump(diff_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({
            'success': True,
            'submission': submission,
            'stats': diff_data['stats']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@app.route('/api/difficulty/stats', methods=['GET'])
def get_difficulty_stats():
    try:
        with open(DIFFICULTY_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return jsonify({
            'success': True,
            'stats': data.get('stats', {}),
            'difficultyDistribution': data.get('difficultyDistribution', {}),
            'recentSubmissions': data.get('submissions', [])[-10:]
        })
    except Exception as e:
        return jsonify({
            'success': False,
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
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print('[*] Roguelike 游戏服务器启动中...')
    print('[*] 静态文件目录:', os.path.abspath('../frontend'))
    print('[*] 存档目录:', SAVES_DIR)
    print('[*] 积分文件:', SCORES_FILE)
    print('[*] 访问地址: http://localhost:8088')
    print('-' * 50)
    app.run(host='0.0.0.0', port=8088, debug=False, threaded=True)
