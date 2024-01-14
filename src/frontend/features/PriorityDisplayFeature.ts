import {Feature, ModuleData} from "../Feature";
import {KafkaProducerModule} from "../common_modules/KafkaProducerModule";
import {KafkaConsumerModule, KafkaMessageEvent} from "../common_modules/KafkaConsumerModule";
import {RedisEvent, RedisReceiverModule} from "../common_modules/RedisReceiverModule";
import {CanvasModule} from "../common_modules/CanvasModule";
import * as T from "three";
import {TurnLever, TurnLeverEvent} from "../turn_lever/TurnLever";

export class PriorityDisplayFeature extends Feature {
    turnLever: TurnLever;
    kafkaProducer: KafkaProducerModule;
    kafkaConsumer: KafkaConsumerModule;
    redisReceiver: RedisReceiverModule;
    displayCanvas: CanvasModule;

    public constructor(proxyHost = 'localhost:5000') {
        super("TurnIndicationFeature", [
            new ModuleData(TurnLever),
            new ModuleData(KafkaProducerModule, [proxyHost]),
            new ModuleData(RedisReceiverModule, [proxyHost]),
            new ModuleData(CanvasModule, ["MarkingCanvas", new T.Vector2(16, 9), new T.Vector3(0, 3, -8), new T.Vector3(0, 0, 0), 100]),
            new ModuleData(KafkaConsumerModule, [proxyHost, ["frame_detection"]])
        ])
    }

    protected connectFunction(): void {
        this.turnLever = this.modules[0].instance as TurnLever;
        this.kafkaProducer = this.modules[1].instance as KafkaProducerModule;
        this.redisReceiver = this.modules[2].instance as RedisReceiverModule;
        this.displayCanvas = this.modules[3].instance as CanvasModule;
        this.kafkaConsumer = this.modules[4].instance as KafkaConsumerModule;

        this.turnLever.addEventListener(TurnLever.EVENT_LEVER_STATE_CHANGED, (event: TurnLeverEvent) => {
            let kafkaMessage = {
                type: "turn_lever_event",
                data: {
                    old_state: event.oldState,
                    new_state: event.newState
                }
            }
            this.kafkaProducer.produce('UI_messages', JSON.stringify(kafkaMessage),
                (msg: Response) => {
                    console.log(msg)
                    if (!msg.ok) {
                        this.turnLever.leverState = event.oldState;
                    }
                },
                (error) => {
                    console.error(error)
                })
        });

        this.redisReceiver.addEventListener(RedisReceiverModule.REDIS_DATA_RECEIVED_EVENT, (event: RedisEvent) => {
            // console.log("data received");
        })

        this.kafkaConsumer.addEventListener(KafkaConsumerModule.MESSAGE_RECEIVED, (event: KafkaMessageEvent) => {
            if (event.type !== KafkaConsumerModule.MESSAGE_RECEIVED) return;
            if (event.topic !== "frame_detection") return;

            let ls = this.turnLever.leverState;
            let val = typeof event.value === 'string' ? JSON.parse(event.value) : event.value;


        })
    }
}