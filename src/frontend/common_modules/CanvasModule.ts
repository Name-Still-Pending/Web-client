import {ScreenModule} from "./ScreenModule";
import * as T from 'three'
import {DisplayManager} from "../DisplayManager";
import {Context} from "node:vm";

export class CanvasModule extends ScreenModule{
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D;
    pixelScale: number;
    constructor(name:string, size: T.Vector2, pos: T.Vector3, rot: T.Vector3, pixelScale: number){
        super(name, size, pos, rot);
        this.pixelScale = pixelScale;
    }

    init(display: DisplayManager) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.size.width * this.pixelScale;
        this.canvas.height = this.size.height * this.pixelScale;
        this.context = this.canvas.getContext("2d");


        super.init(display);

        this.clear();
        this.update();
    }

    public update(){
        let tex = new T.CanvasTexture(this.canvas, T.UVMapping);
        tex.needsUpdate = true;
        this.setTexture(tex);
    }
    public clear(){
        this.context.clearRect(0, 0, this.size.width, this.size.height);
    }

    public rect(x: number, y: number, w: number, h: number, c: string, t: number){
        this.context.strokeStyle = c;
        this.context.lineWidth = t;

        this.context.rect(x, y, w, h);
        this.context.stroke();
    }

    public rectRel(x: number, y: number, w: number, h: number, c: string, t: number){
        this.rect(x * this.canvas.width, y * this.canvas.height, w * this.canvas.width, h * this.canvas.height, c, t);
    }
}