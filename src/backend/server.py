import quart
from quart import websocket, request
import quart_redis as qr
import aiokafka
import asyncio
from threading import Event
import json
from quart_cors import cors, websocket_cors, route_cors

frame_received_event = asyncio.Event()
app = quart.Quart(__name__)
app = cors(app, allow_origin="http://*")


@app.route("/kafka/produce/<topic>")
async def produce(topic: str, message: str):
    message = request.args.get("message")
    if message is None:
        return "Failed to produce: No message"

    producer = aiokafka.AIOKafkaProducer(bootstrap_servers='localhost:9092')
    await producer.start()
    try:
        await producer.send_and_wait(topic, value=bytes(message, 'utf-8'))
    finally:
        await producer.stop()
    return f"Topic: {topic}, Message: {message}\n"


@app.websocket("/kafka/consume")
async def consume():
    await websocket.accept()
    topics = websocket.args.getlist("topic")
    consumer = aiokafka.AIOKafkaConsumer(*topics,
                                         bootstrap_servers='localhost:9092',
                                         group_id=__name__ + "_consumers",
                                         )
    try:
        await consumer.start()
        async for message in consumer:
            await message
            await websocket.send(bytes(json.dump(message), 'utf-8'))
            pass
    except asyncio.CancelledError:
        await consumer.stop()
        raise
    except aiokafka.errors.KafkaError:
        pass

    await websocket.close(400)

@app.websocket("/redis/frames")
async def frames():
    pass

def main():
    app.run(debug=True)


if __name__ == "__main__":
    main()
