import {WebsocketModule} from "./WebsocketModule";

export class RedisReceiverModule extends WebsocketModule {
    static REDIS_DATA_RECEIVED_EVENT = "redis_data_received";

    proxyHost: string;
    constructor(proxyHost: string){
        super(`RedisReceiver:${proxyHost}`, `ws://${proxyHost}/redis/frames`)
    }

    protected messageHandler(event: MessageEvent): void {
        this.dispatchEvent({type: RedisReceiverModule.REDIS_DATA_RECEIVED_EVENT, data: event.data})
    }

}

export class RedisEvent extends Event{
    data: Buffer;
}