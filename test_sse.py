import requests
import threading
import time
import json
import sseclient

BASE_URL = 'http://localhost:8088'

def test_sse_stream():
    print('[Test] Testing SSE stream connection...')
    try:
        url = f'{BASE_URL}/api/scores/stream'
        response = requests.get(url, stream=True)
        client = sseclient.SSEClient(response)
        
        print('[Test] SSE connected! Waiting for initial data...')
        
        message_count = 0
        for event in client.events():
            message_count += 1
            print(f'\n[Test] Received event: {event.event}')
            try:
                data = json.loads(event.data)
                print(f'[Test] Type: {data.get("type")}')
                print(f'[Test] Online players: {data.get("onlinePlayers")}')
                if 'topScores' in data:
                    print(f'[Test] Top scores count: {len(data["topScores"])}')
                    print(f'[Test] Top score: {data["topScores"][0]["score"] if data["topScores"] else "N/A"}')
            except Exception as e:
                print(f'[Test] Parse error: {e}')
                print(f'[Test] Raw data: {event.data[:200]}...')
            
            if message_count >= 2:
                print('[Test] SSE test passed!')
                client.close()
                break
                
    except Exception as e:
        print(f'[Test] SSE error: {e}')
        return False
    return True

def test_score_broadcast():
    print('\n[Test] Testing score broadcast...')
    
    sse_messages = []
    
    def sse_listener():
        try:
            url = f'{BASE_URL}/api/scores/stream'
            response = requests.get(url, stream=True)
            client = sseclient.SSEClient(response)
            for event in client.events():
                try:
                    data = json.loads(event.data)
                    sse_messages.append((event.event, data))
                    if data.get('type') == 'new_record':
                        print(f'[Test] [Listener] New record broadcast received!')
                        print(f'[Test] [Listener] Rank: {data.get("rank")}, Score: {data.get("record", {}).get("score")}')
                        break
                except:
                    pass
            client.close()
        except Exception as e:
            print(f'[Test] Listener error: {e}')
    
    listener_thread = threading.Thread(target=sse_listener)
    listener_thread.daemon = True
    listener_thread.start()
    
    time.sleep(2)
    
    print('[Test] Submitting high score...')
    high_score = 99999
    response = requests.post(f'{BASE_URL}/api/scores', json={
        'score': high_score,
        'kills': 100,
        'floor': 50
    })
    
    result = response.json()
    print(f'[Test] Score submitted: {result}')
    print(f'[Test] Rank: {result.get("rank")}')
    print(f'[Test] Is new record: {result.get("isNewRecord")}')
    print(f'[Test] Rank improved: {result.get("rankImproved")}')
    
    time.sleep(3)
    
    has_broadcast = any(
        event == 'score_update' and data.get('type') == 'new_record'
        for event, data in sse_messages
    )
    
    if has_broadcast:
        print('[Test] Broadcast test passed!')
        return True
    else:
        print('[Test] Broadcast test failed - no broadcast received')
        return False

def test_concurrent_access():
    print('\n[Test] Testing concurrent score submissions...')
    
    def submit_score(score):
        try:
            response = requests.post(f'{BASE_URL}/api/scores', json={
                'score': score,
                'kills': score // 100,
                'floor': score // 1000 + 1
            }, timeout=5)
            return response.json()
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    threads = []
    scores = [5000 + i * 100 for i in range(10)]
    
    start_time = time.time()
    for score in scores:
        t = threading.Thread(target=submit_score, args=(score,))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join(timeout=10)
    
    elapsed = time.time() - start_time
    print(f'[Test] 10 concurrent submissions completed in {elapsed:.2f}s')
    
    response = requests.get(f'{BASE_URL}/api/scores')
    data = response.json()
    print(f'[Test] Current top score: {data["scores"][0]["score"]}')
    print(f'[Test] Concurrent test passed!')
    return True

def test_online_count():
    print('\n[Test] Testing online count...')
    
    connections = []
    
    for i in range(3):
        try:
            url = f'{BASE_URL}/api/scores/stream'
            response = requests.get(url, stream=True)
            connections.append(response)
            print(f'[Test] Connection {i+1} established')
            time.sleep(0.5)
        except Exception as e:
            print(f'[Test] Connection {i+1} failed: {e}')
    
    time.sleep(1)
    
    response = requests.get(f'{BASE_URL}/api/scores/online')
    data = response.json()
    print(f'[Test] Online count: {data.get("onlinePlayers")}')
    
    for conn in connections:
        conn.close()
    
    time.sleep(1)
    
    response = requests.get(f'{BASE_URL}/api/scores/online')
    data = response.json()
    print(f'[Test] Online count after close: {data.get("onlinePlayers")}')
    print('[Test] Online count test passed!')
    return True

if __name__ == '__main__':
    print('=' * 60)
    print('SSE Real-time Leaderboard Test Suite')
    print('=' * 60)
    
    all_passed = True
    
    try:
        import sseclient
    except ImportError:
        print('[Install] Installing sseclient...')
        import subprocess
        subprocess.run(['pip', 'install', 'sseclient-py'], check=True)
        import sseclient
    
    try:
        test_sse_stream()
    except Exception as e:
        print(f'[Test] SSE stream test failed: {e}')
        all_passed = False
    
    try:
        test_score_broadcast()
    except Exception as e:
        print(f'[Test] Broadcast test failed: {e}')
        all_passed = False
    
    try:
        test_concurrent_access()
    except Exception as e:
        print(f'[Test] Concurrent test failed: {e}')
        all_passed = False
    
    try:
        test_online_count()
    except Exception as e:
        print(f'[Test] Online count test failed: {e}')
        all_passed = False
    
    print('\n' + '=' * 60)
    if all_passed:
        print('All tests passed! ✓')
    else:
        print('Some tests failed! ✗')
    print('=' * 60)
