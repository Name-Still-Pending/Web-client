import {WebsocketModule} from "./WebsocketModule";
import {WebSocket} from "vite";


export class KafkaConsumerModule extends WebsocketModule{
    static MESSAGE_RECEIVED = "message_received"
    constructor(proxyServer: string, topics: string[]){
        super(`KafkaConsumer:${proxyServer}`, KafkaConsumerModule.makeUrl(proxyServer, topics));
    }

    static makeUrl(proxyServer: string, topics: string[]){
        if(topics.length < 1) throw Error("No topics subscribed")

        let retval = `ws://${proxyServer}/kafka/consume?`;
        retval += "topic=" + topics.pop()

        for (const topic of topics) {
            retval += "&topic=" + topic;
        }
        return retval;
    }

    protected messageHandler(event: MessageEvent<any>): void {
        if(event.data instanceof Blob){
            event.data.text().then((value) => {
                let json = JSON.parse(value);
                this.dispatchEvent({
                    type: KafkaConsumerModule.MESSAGE_RECEIVED,
                    topic: json.topic,
                    timestamp: json.timestamp,
                    value: json.value})
            })
        }
    }
}

export class KafkaMessageEvent extends Event{
    topic: string;
    timestamp: number;
    value: string | Object;
}
