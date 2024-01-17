import {Environment} from "./common_modules/Environment";
import {DisplayManager} from "./DisplayManager";
import * as T from "three";



export class CarLoad extends Environment{
    private _carMesh: T.Mesh = null;
    constructor() {
        super("CarLoad");

        this.meshList = [{
            // model by KrStolorz (Krzysztof Stolorz) on https://shetchfab.com
            path: "./res/Golf/Volkswagen Golf.obj",
            pos: new T.Vector3(0, -1.5, 0),
            rot: new T.Vector3(0, Math.PI, 0),
        },
       /* {
            path: "./res/Painel.obj",
            pos: new T.Vector3(0, -0.9, -0.9),
            rot: new T.Vector3(0, 0, 0),
        }*/];
    }

    init(display: DisplayManager) {
        super.init(display);

        let light = new T.PointLight(0xffffff, 0.6)
        light.position.set(0.1, -0.2, 0)
        light.castShadow = true;
        display.scene.add(light);
    }
}