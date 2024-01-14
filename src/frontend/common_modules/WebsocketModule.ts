import {BaseModule} from "./BaseClasses";
import {DisplayManager} from "../DisplayManager";
import {Websocket, WebsocketEvent, WebsocketBuilder, ConstantBackoff} from 'websocket-ts';

export abstract class WebsocketModule extends BaseModule{
    socket: Websocket;
    url: string;

    protected constructor(name: string, url: string){
        super(name)
        this.url = url;
    }

    public enable(): void {
        throw new Error("Method not implemented.");
    }
    public disable(): void {
        throw new Error("Method not implemented.");
    }

    protected abstract messageHandler(event: MessageEvent): void;

    public init(display: DisplayManager) {
        super.init(display);

        this.socket = new WebsocketBuilder(this.url)
            .withBackoff(new ConstantBackoff(5000))
            .build();
        this.socket.addEventListener(WebsocketEvent.message, (ws: Websocket, event: MessageEvent) => this.messageHandler(event)) ;
    }
}
