import quart
from quart import websocket, request
import quart_redis as qr
import aiokafka
import asyncio
import json
from quart_cors import cors, websocket_cors, route_cors

app = quart.Quart(__name__)
app = cors(app, allow_origin="*")


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
                                         group_id=__name__ + "_consumers",
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

    try:
        while True:
            await asyncio.sleep(1)
            await websocket.send("Data sent")
    except asyncio.CancelledError:
        print("Redis websocket disconnect")
        return

    await websocket.close(1000)

def main():
    app.run(debug=True)


if __name__ == "__main__":
    main()
