import {BaseModule} from "./BaseClasses";


export class KafkaProducerModule extends BaseModule{
    proxyHost: string;

    constructor(proxyHost: string){
        super(`KafkaProducer:${proxyHost}`);

        this.proxyHost = proxyHost;
    }

    public produce(topic: string, message: string, onSuccess: (msg: Response) => void, onError: (error: Error) => void){
        let url = `http://${this.proxyHost}/kafka/produce/${topic}?message=${encodeURIComponent(message)}`;
        fetch(url, {mode: "no-cors"}).then(onSuccess, onError);
    }

    public enable(): void {
        throw new Error("Method not implemented.");
    }
    public disable(): void {
        throw new Error("Method not implemented.");
    }

}