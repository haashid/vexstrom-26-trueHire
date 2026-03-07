import asyncio
from websockets.sync.client import connect

def hello():
    try:
        with connect("ws://localhost:8000/api/v1/ws/transcript") as websocket:
            print("Successfully connected!")
            websocket.close()
    except Exception as e:
        print(f"Error connecting: {e}")

hello()
