import quart
from quart import websocket, request
import quart_redis as qr
import aiokafka
import asyncio
import json
import numpy as np
import cv2
from quart_cors import cors, websocket_cors, route_cors

app = quart.Quart(__name__)
app.config["REDIS_URI"] = "redis://localhost:6379"
app.config["REDIS_CONN_ATTEMPTS"] = 3
app = cors(app, allow_origin="*")
redis_handler = qr.RedisHandler(app)


@app.route("/kafka/produce/<topic>")
async def produce(topic: str):
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
                                         group_id="proxy_consumers",
                                         )
    try:
        await consumer.start()
        async for message in consumer:
            msg = {
                "topic": message.topic,
                "timestamp": message.timestamp,
                "value": message.value.decode("utf-8")
            }

            await websocket.send(bytes(json.dumps(msg), 'utf-8'))
            pass
    except asyncio.CancelledError:
        await consumer.stop()
        raise
    except aiokafka.errors.KafkaError:
        pass

    await websocket.close(400)


@app.websocket("/redis/frames")
async def frames():
    await websocket.accept()
    consumer = aiokafka.AIOKafkaConsumer("frame_notification",
                                         bootstrap_servers='localhost:9092',
                                         group_id="proxy_consumers")
    try:
        redis = qr.get_redis()
        await consumer.start()
        async for message in consumer:
            await websocket.send(message.value)
            try:
                resp = await asyncio.wait_for(websocket.receive(), 0.2)
            except asyncio.TimeoutError:
                continue

            if resp != "frame_ACK":
                print("Frame ACK timeout")
                continue

            # send frame data
            data = await redis.get("frame:latest")
            if data is not None:

                msg = json.loads(message.value.decode('utf-8'))
                npData = np.frombuffer(data, np.uint8)
                frame = npData.reshape((msg['res'][0], msg['res'][1], 3))
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                frame = np.pad(frame, ((0, 0), (0, 0), (0, 1)), "constant", constant_values=((0, 0), (0, 0), (0, 255)))
                await websocket.send(frame.tobytes())
            await consumer.seek_to_end()

    except asyncio.CancelledError:
        print("Redis websocket disconnect")
        await consumer.stop()
        return
    except aiokafka.errors.KafkaError:
        pass
    except qr.RedisError:
        await consumer.stop()

    await websocket.close(1000)


def main():
    app.run(debug=True)


if __name__ == "__main__":
    main()
