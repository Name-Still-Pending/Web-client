import quart
from quart import websocket, request
import quart_redis as qr
import aiokafka
import asyncio
from threading import Event

frame_received_event = asyncio.Event()
app = quart.Quart(__name__)


@app.route("/kafka/produce/<topic>/<message>")
async def produce(topic: str, message: str):
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
            await websocket.send(message.value)
            pass
    except asyncio.CancelledError:
        await consumer.stop()
        raise
    except aiokafka.errors.KafkaError:
        pass

    await websocket.close(400)


def main():
    app.run(debug=True)


if __name__ == "__main__":
    main()
