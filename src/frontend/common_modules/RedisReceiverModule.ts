import {WebsocketModule} from "./WebsocketModule";

export class RedisReceiverModule extends WebsocketModule {
    static REDIS_DATA_RECEIVED_EVENT = "redis_data_received";
    frameWidth: number;
    frameHeight: number;

    proxyHost: string;

    constructor(proxyHost: string) {
        super(`RedisReceiver:${proxyHost}`, `ws://${proxyHost}/redis/frames`)
    }

    protected messageHandler(event: MessageEvent): void {
        if (!(event.data instanceof Blob)) return;

        if (event.data.size < 200) {
            event.data.text().then(
                (str: string) => {
                    let format = JSON.parse(str);
                    this.frameWidth = format.res[1];
                    this.frameHeight = format.res[0];

                    this.socket.send("frame_ACK");
                }
            )
        } else {
            this.dispatchEvent(
                {
                    type: RedisReceiverModule.REDIS_DATA_RECEIVED_EVENT,
                    data: event.data,
                    width: this.frameWidth,
                    height: this.frameHeight
                })

        }
    }
}


export class RedisEvent extends Event {
    width: number;
    height: number;
    data: Blob;
}