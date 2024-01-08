import {Environment} from "../common_modules/Environment";
import {DisplayManager} from "../DisplayManager";
import * as T from "three";
import {Feature, ModuleData} from "../Feature";
import {KafkaProducerModule} from "../common_modules/KafkaProducerModule";


enum LeverState{
    Neutral = 0,
    Right = 1,
    Left = -1
}

export class TurnLever extends Environment{
    static EVENT_LEVER_STATE_CHANGED = "lever_state_changed";
    private _leverState: LeverState = LeverState.Neutral;
    private _leverMesh: T.Mesh = null;
    constructor() {
        super("TurnLever");

        this.meshList = [{
            path: "./src/frontend/turn_lever/turn_lever_004.obj",
            pos: new T.Vector3(-0.5, -0.675, -0.6),
            rot: new T.Vector3(0, -Math.PI * 0.5, Math.PI * 0.6),
            events: [
                {type: DisplayManager.ACTION_RIGHT_CLICK, listener: (event) => {
                        this.onLeverRightClick();
                    }},
                {type: DisplayManager.ACTION_LEFT_CLICK, listener: (event) => {
                        this.onLeverLeftClick();
                }}
            ]
        }];
    }
    get leverState(): LeverState {
        return this._leverState;
    }

    set leverState(value: LeverState) {
        let diff = this._leverState - value;
        let leverMesh = this.objects[0].children[0] as T.Mesh;
        if(leverMesh != null) leverMesh.rotateX(diff * Math.PI / 12);
        this._leverState = value;
    }

    onLeverRightClick(){
        if(this._leverState == LeverState.Right) return;
        this.leverState += 1;
        this.dispatchEvent({type: TurnLever.EVENT_LEVER_STATE_CHANGED, message: this.leverState});
    }

    onLeverLeftClick(){
        if(this.leverState == LeverState.Left) return;
        let oldState = this.leverState;
        this.leverState -= 1;
        this.dispatchEvent({type: TurnLever.EVENT_LEVER_STATE_CHANGED, oldState: oldState, newState: this.leverState});
    }


    init(display: DisplayManager) {
        super.init(display);

        // this._leverMesh = this.objects[0].children[0] as T.Mesh;
    }
}

export class TurnLeverEvent extends Event{
    newState: LeverState
    oldState: LeverState
}

export class TurnIndicationFeature extends Feature {
    turnLever: TurnLever;
    kafkaProducer: KafkaProducerModule;
    public constructor(){
        super("TurnIndicationFeature", [
            new ModuleData(TurnLever),
            new ModuleData(KafkaProducerModule, ["localhost:5000"])
        ])
    }
    protected connectFunction(): void {
        this.turnLever = this.modules[0].instance as TurnLever;
        this.kafkaProducer = this.modules[1].instance as KafkaProducerModule;

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
                    if(!msg.ok){
                        this.turnLever.leverState = event.oldState;
                    }
                },
                (error) => {
                console.error(error)
                })
        })
    }
}