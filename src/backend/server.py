import quart
import quart_redis as qr
import aiokafka
from threading import Event

STOP_EVENT = Event()
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


@app.websocket("/kafka/consume/<topic>")
async def consume(topic: str):
    # TODO: kafka consumer
    pass


def main():
    app.run()


if __name__ == "__main__":
    main()
