import {Feature, ModuleData} from "../Feature";
import {KafkaProducerModule} from "../common_modules/KafkaProducerModule";
import {KafkaConsumerModule, KafkaMessageEvent} from "../common_modules/KafkaConsumerModule";
import {RedisEvent, RedisReceiverModule} from "../common_modules/RedisReceiverModule";
import * as T from "three";
import {LeverState, TurnLever, TurnLeverEvent} from "../turn_lever/TurnLever";
import {ScreenModule} from "../common_modules/ScreenModule";

export class PriorityDisplayFeature extends Feature {

    // modules
    turnLever: TurnLever;
    kafkaProducer: KafkaProducerModule;
    kafkaConsumer: KafkaConsumerModule;
    redisReceiver: RedisReceiverModule;
    displayCanvas: ScreenModule;

    //private properties
    private turnType: TurnMode;
    private turnDir: TurnWarning;

    public constructor(proxyHost = 'localhost:5000') {
        super("TurnIndicationFeature", [
            new ModuleData(TurnLever),
            new ModuleData(KafkaProducerModule, [proxyHost]),
            new ModuleData(RedisReceiverModule, [proxyHost]),
            new ModuleData(ScreenModule, ["MarkingCanvas", new T.Vector2(16, 9),
                new T.Vector3(0, 3, -8), new T.Vector3(0, 0, 0), 2, 100
                /*document.createElement("canvas"), 100*/]),
            new ModuleData(KafkaConsumerModule, [proxyHost, ["frame_detection"]])
        ])

        this.turnType = TurnMode.YIELD;
        this.turnDir = TurnWarning.STRAIGHT;
    }

    protected connectFunction(): void {
        this.turnLever = this.modules[0].instance as TurnLever;
        this.kafkaProducer = this.modules[1].instance as KafkaProducerModule;
        this.redisReceiver = this.modules[2].instance as RedisReceiverModule;
        this.displayCanvas = this.modules[3].instance as ScreenModule;
        this.kafkaConsumer = this.modules[4].instance as KafkaConsumerModule;

        this.turnLever.addEventListener(TurnLever.EVENT_LEVER_STATE_CHANGED, (event: TurnLeverEvent) => {
                                this.turnDir = event.newState == LeverState.Neutral ? TurnWarning.STRAIGHT
                                    : event.newState == LeverState.Left ? TurnWarning.LEFT : TurnWarning.RIGHT
        });

        this.redisReceiver.addEventListener(RedisReceiverModule.REDIS_DATA_RECEIVED_EVENT, this.setScreenFrame)

        this.kafkaConsumer.addEventListener(KafkaConsumerModule.MESSAGE_RECEIVED, this.drawDetections);
        document.body.appendChild(this.displayCanvas.canvases[0]);
        document.body.appendChild(this.displayCanvas.canvases[1]);
    }

    setScreenFrame = (event: RedisEvent) => {
        if(event.width != this.displayCanvas.canvases[0].width || event.height != this.displayCanvas.canvases[0].height)
            this.displayCanvas.resize(event.width / 100, event.height / 100)
        this.displayCanvas.setImageFromBlob(0, event.data, event.width, event.height).then();

    }

    drawDetections = (event: KafkaMessageEvent) => {
        if (event.type !== KafkaConsumerModule.MESSAGE_RECEIVED) return;
        if (event.topic !== "frame_detection") return;

        let val = typeof event.value === 'string' ? JSON.parse(event.value) : event.value;

        let mask = turn_masks[this.turnType];
        let classes = val['classes'];
        if (classes == undefined) return;

        this.displayCanvas.clearStrokes(1);
        for (const maskKey in mask) {
            if ((mask[maskKey] & this.turnDir) == 0) continue;

            let marks = classes[maskKey];
            if (marks == undefined) continue;

            for (const mark of marks) {
                this.displayCanvas.rectNorm(1, mark[0] - mark[2] / 2, mark[1] - mark[3] / 2, mark[2], mark[3], "red", 5)
            }
        }
        this.displayCanvas.updateStrokes(1);
    }
}

enum TurnWarning {
    NONE = 0,
    LEFT = 1,
    RIGHT = 2,
    STRAIGHT = 4,
    LEFT_STRAIGHT = LEFT | STRAIGHT,
    ALL = LEFT | STRAIGHT | RIGHT,
}

enum TurnMode {
    DEFAULT,
    PRIORITY,
    PRIORITY_TO_LEFT,
    PRIORITY_TO_RIGHT,
    YIELD,
    YIELD_LEFT_STRAIGHT,
    YIELD_RIGHT_STRAIGHT
}

const VEHICLE_L = 'vehicle_l'
const VEHICLE_R = 'vehicle_r'
const VEHICLE_S = 'vehicle_s'

const turn_masks = {
    [TurnMode.DEFAULT]: {
        [VEHICLE_L]: TurnWarning.NONE,
        [VEHICLE_R]: TurnWarning.LEFT_STRAIGHT,
        [VEHICLE_S]: TurnWarning.LEFT
    },
    [TurnMode.PRIORITY]: {
        [VEHICLE_L]: TurnWarning.NONE,
        [VEHICLE_R]: TurnWarning.NONE,
        [VEHICLE_S]: TurnWarning.LEFT
    },
    [TurnMode.PRIORITY_TO_LEFT]: {
        [VEHICLE_L]: TurnWarning.NONE,
        [VEHICLE_R]: TurnWarning.NONE,
        [VEHICLE_S]: TurnWarning.LEFT
    },
    [TurnMode.PRIORITY_TO_RIGHT]: {
        [VEHICLE_L]: TurnWarning.NONE,
        [VEHICLE_R]: TurnWarning.LEFT_STRAIGHT,
        [VEHICLE_S]: TurnWarning.NONE
    },
    [TurnMode.YIELD]: {
        [VEHICLE_L]: TurnWarning.ALL,
        [VEHICLE_R]: TurnWarning.LEFT_STRAIGHT,
        [VEHICLE_S]: TurnWarning.LEFT
    },
    [TurnMode.YIELD_LEFT_STRAIGHT]: {
        [VEHICLE_L]: TurnWarning.ALL,
        [VEHICLE_R]: TurnWarning.LEFT_STRAIGHT,
        [VEHICLE_S]: TurnWarning.ALL
    },
    [TurnMode.YIELD_RIGHT_STRAIGHT]: {
        [VEHICLE_L]: TurnWarning.NONE,
        [VEHICLE_R]: TurnWarning.ALL,
        [VEHICLE_S]: TurnWarning.ALL
    }

}