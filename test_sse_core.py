import requests
import threading
import time
import json
import sys

BASE_URL = 'http://localhost:8088'

def test_core_broadcast():
    print('=' * 60)
    print('Testing Core SSE Broadcast Logic')
    print('=' * 60)
    
    print('\n[Step 1] Creating SSE listener connection...')
    
    messages_received = []
    broadcast_received = threading.Event()
    
    def sse_listener():
        try:
            url = f'{BASE_URL}/api/scores/stream'
            response = requests.get(url, stream=True, timeout=30)
            print(f'[Listener] Connected, status: {response.status_code}')
            
            buffer = ''
            for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
                buffer += chunk
                while '\n\n' in buffer:
                    message, buffer = buffer.split('\n\n', 1)
                    if 'data:' in message:
                        try:
                            data_part = message.split('data:')[1].strip()
                            data = json.loads(data_part)
                            msg_type = data.get('type')
                            print(f'[Listener] Received: type={msg_type}, online={data.get("onlinePlayers")}')
                            messages_received.append(data)
                            
                            if msg_type == 'new_record':
                                print(f'[Listener] ✓ NEW RECORD BROADCAST RECEIVED!')
                                print(f'[Listener]   Rank: {data.get("rank")}')
                                print(f'[Listener]   Score: {data.get("record", {}).get("score")}')
                                print(f'[Listener]   Online players: {data.get("onlinePlayers")}')
                                broadcast_received.set()
                                response.close()
                                return
                        except Exception as e:
                            print(f'[Listener] Parse error: {e}')
        except Exception as e:
            print(f'[Listener] Error: {e}')
            import traceback
            traceback.print_exc()
    
    listener_thread = threading.Thread(target=sse_listener)
    listener_thread.daemon = True
    listener_thread.start()
    
    time.sleep(2)
    
    print(f'\n[Step 2] Messages received so far: {len(messages_received)}')
    for msg in messages_received:
        print(f'  - {msg.get("type")}: online={msg.get("onlinePlayers")}')
    
    print('\n[Step 3] Submitting high score...')
    high_score = 999999 + int(time.time()) % 10000
    
    try:
        response = requests.post(f'{BASE_URL}/api/scores', json={
            'score': high_score,
            'kills': 1000,
            'floor': 100
        })
        result = response.json()
        print(f'[Submit] Result: rank={result.get("rank")}, isNewRecord={result.get("isNewRecord")}, rankImproved={result.get("rankImproved")}')
    except Exception as e:
        print(f'[Submit] Error: {e}')
        return False
    
    print('\n[Step 4] Waiting for broadcast (max 10s)...')
    success = broadcast_received.wait(timeout=10)
    
    if success:
        print('\n' + '=' * 60)
        print('✓ BROADCAST TEST PASSED!')
        print('=' * 60)
        return True
    else:
        print('\n' + '=' * 60)
        print('✗ BROADCAST TEST FAILED - Timeout')
        print(f'Messages received: {len(messages_received)}')
        for msg in messages_received:
            print(f'  - {msg.get("type")}')
        print('=' * 60)
        return False

if __name__ == '__main__':
    try:
        import requests
    except ImportError:
        print('Installing requests...')
        import subprocess
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'requests'], check=True)
        import requests
    
    success = test_core_broadcast()
    sys.exit(0 if success else 1)
