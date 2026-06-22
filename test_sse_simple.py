import requests
import threading
import time
import json

BASE_URL = 'http://localhost:8088'

def test_basic_api():
    print('[Test 1] Testing basic API endpoints...')
    
    try:
        r = requests.get(f'{BASE_URL}/api/scores')
        data = r.json()
        print(f'  ✓ GET /api/scores - {len(data["scores"])} records, online: {data["onlinePlayers"]}')
    except Exception as e:
        print(f'  ✗ GET /api/scores failed: {e}')
        return False
    
    try:
        r = requests.get(f'{BASE_URL}/api/scores/online')
        data = r.json()
        print(f'  ✓ GET /api/scores/online - online: {data["onlinePlayers"]}')
    except Exception as e:
        print(f'  ✗ GET /api/scores/online failed: {e}')
        return False
    
    try:
        r = requests.get(f'{BASE_URL}/api/health')
        data = r.json()
        print(f'  ✓ GET /api/health - status: {data["status"]}')
    except Exception as e:
        print(f'  ✗ GET /api/health failed: {e}')
        return False
    
    return True

def test_sse_connection():
    print('\n[Test 2] Testing SSE connection...')
    
    messages = []
    
    def sse_listener():
        try:
            r = requests.get(f'{BASE_URL}/api/scores/stream', stream=True, timeout=10)
            buffer = ''
            for chunk in r.iter_content(chunk_size=1024, decode_unicode=True):
                buffer += chunk
                while '\n\n' in buffer:
                    message, buffer = buffer.split('\n\n', 1)
                    if message.strip():
                        messages.append(message)
                        if len(messages) >= 2:
                            r.close()
                            return
        except Exception as e:
            print(f'  Listener error: {e}')
    
    t = threading.Thread(target=sse_listener)
    t.daemon = True
    t.start()
    
    t.join(timeout=8)
    
    if len(messages) >= 1:
        print(f'  ✓ Received {len(messages)} SSE messages')
        for i, msg in enumerate(messages[:1]):
            try:
                if 'data:' in msg:
                    data_part = msg.split('data:')[1].strip()
                    data = json.loads(data_part)
                    print(f'    Message {i+1}: type={data.get("type")}, online={data.get("onlinePlayers")}')
            except:
                pass
        return True
    else:
        print(f'  ✗ No SSE messages received')
        return False

def test_score_submission():
    print('\n[Test 3] Testing score submission...')
    
    test_score = int(time.time()) % 10000 + 2000
    
    try:
        r = requests.post(f'{BASE_URL}/api/scores', json={
            'score': test_score,
            'kills': test_score // 100,
            'floor': test_score // 1000 + 1
        })
        data = r.json()
        
        print(f'  ✓ Score submitted: {test_score}')
        print(f'    Rank: {data.get("rank")}')
        print(f'    Is new record: {data.get("isNewRecord")}')
        print(f'    Rank improved: {data.get("rankImproved")}')
        
        return True
    except Exception as e:
        print(f'  ✗ Score submission failed: {e}')
        return False

def test_concurrent_submissions():
    print('\n[Test 4] Testing concurrent submissions...')
    
    results = []
    lock = threading.Lock()
    
    def submit(score):
        try:
            r = requests.post(f'{BASE_URL}/api/scores', json={
                'score': score,
                'kills': 10,
                'floor': 5
            }, timeout=5)
            with lock:
                results.append(r.json())
        except Exception as e:
            with lock:
                results.append({'success': False, 'error': str(e)})
    
    threads = []
    scores = [3000 + i * 50 for i in range(5)]
    
    start = time.time()
    for s in scores:
        t = threading.Thread(target=submit, args=(s,))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join(timeout=10)
    
    elapsed = time.time() - start
    success_count = sum(1 for r in results if r.get('success'))
    
    print(f'  ✓ {success_count}/{len(scores)} submissions successful in {elapsed:.2f}s')
    
    try:
        r = requests.get(f'{BASE_URL}/api/scores')
        data = r.json()
        print(f'    Current top score: {data["scores"][0]["score"]}')
    except:
        pass
    
    return success_count == len(scores)

def test_broadcast():
    print('\n[Test 5] Testing broadcast mechanism...')
    
    broadcast_received = threading.Event()
    received_data = []
    
    def listener():
        try:
            r = requests.get(f'{BASE_URL}/api/scores/stream', stream=True, timeout=15)
            buffer = ''
            for chunk in r.iter_content(chunk_size=1024, decode_unicode=True):
                buffer += chunk
                while '\n\n' in buffer:
                    message, buffer = buffer.split('\n\n', 1)
                    if 'data:' in message:
                        try:
                            data_part = message.split('data:')[1].strip()
                            data = json.loads(data_part)
                            received_data.append(data)
                            if data.get('type') == 'new_record':
                                broadcast_received.set()
                                r.close()
                                return
                        except:
                            pass
        except Exception as e:
            print(f'  Listener error: {e}')
    
    t = threading.Thread(target=listener)
    t.daemon = True
    t.start()
    
    time.sleep(2)
    
    high_score = 99999 + int(time.time()) % 1000
    print(f'  Submitting high score: {high_score}')
    
    try:
        r = requests.post(f'{BASE_URL}/api/scores', json={
            'score': high_score,
            'kills': 100,
            'floor': 50
        })
        submit_result = r.json()
        print(f'  Submit result: rank={submit_result.get("rank")}, isNewRecord={submit_result.get("isNewRecord")}')
    except Exception as e:
        print(f'  Submit failed: {e}')
        return False
    
    success = broadcast_received.wait(timeout=8)
    
    if success:
        print(f'  ✓ Broadcast received!')
        for data in received_data:
            if data.get('type') == 'new_record':
                print(f'    Broadcast rank: {data.get("rank")}')
                print(f'    Broadcast score: {data.get("record", {}).get("score")}')
                print(f'    Online players: {data.get("onlinePlayers")}')
        return True
    else:
        print(f'  ✗ Broadcast not received (timeout)')
        print(f'  Messages received: {len(received_data)}')
        return False

if __name__ == '__main__':
    print('=' * 60)
    print('SSE Real-time Leaderboard Test Suite')
    print('=' * 60)
    
    tests = [
        ('Basic API', test_basic_api),
        ('SSE Connection', test_sse_connection),
        ('Score Submission', test_score_submission),
        ('Concurrent Submissions', test_concurrent_submissions),
        ('Broadcast Mechanism', test_broadcast),
    ]
    
    passed = 0
    failed = 0
    
    for name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f'  ✗ Test error: {e}')
            failed += 1
    
    print('\n' + '=' * 60)
    print(f'Results: {passed} passed, {failed} failed')
    if failed == 0:
        print('All tests passed! ✓')
    else:
        print('Some tests failed! ✗')
    print('=' * 60)
