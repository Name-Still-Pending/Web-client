import * as T from 'three'
import {BaseModule} from "./BaseClasses";
import {DisplayManager} from "../DisplayManager";

export class ScreenModule extends BaseModule {
    size: T.Vector2;
    pos: T.Vector3;
    rot: T.Vector3;
    object: T.Mesh;
    canvas: HTMLCanvasElement
    context: CanvasRenderingContext2D;
    pixelScale: number;

    //optional drawing functions
    updateStrokes: () => void;
    clearStrokes: () => void;
    rect: (x: number, y: number, w: number, h: number, c: string, t: number) => void;
    rectNorm: (x: number, y: number, w: number, h: number, c: string, t: number) => void;

    constructor(name: string,
                size: T.Vector2,
                pos: T.Vector3,
                rot: T.Vector3,
                canvas?: HTMLCanvasElement,
                pixelScale = 100) {
        super(name)
        this.pos = pos;
        this.rot = rot;
        this.size = size;

        if (canvas != undefined) {
            this.canvas = canvas;
            this.canvas.width = this.size.width * pixelScale;
            this.canvas.height = this.size.height * pixelScale;
            this.context = this.canvas.getContext("2d");
            this.updateStrokes = this._updateStrokes;
            this.clearStrokes = this._clearStrokes;
            this.rect = this._rect;
            this.rectNorm = this._rectNorm;
        }

        this.pixelScale = pixelScale;
    }

    public setImageFromBlob(data: ArrayBuffer, width: number, height: number, format: T.PixelFormat = T.RGBAFormat){
        let tex = new T.DataTexture(data, width, height, format);
        tex.needsUpdate = true;
        this.setTexture(tex, 0);
    }

    private setTexture(texture: T.Texture, layer: number) {
        let oldTex = (this.object.material as T.MeshBasicMaterial[])[layer].map;
        (this.object.material as T.MeshBasicMaterial[])[layer].map = texture;
        if (oldTex != null) oldTex.dispose()
    }

    public init(display: DisplayManager) {
        let geometry = new T.PlaneGeometry(this.size.width, this.size.height);
        geometry.clearGroups();
        geometry.addGroup(0, Infinity, 0);
        let baseLayer = new T.MeshBasicMaterial({color: 0xffffff});
        baseLayer.transparent = false;
        let materials = [baseLayer];

        geometry.addGroup(0, Infinity, 1);
        if(this.canvas != undefined){
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let drawingLayer = new T.MeshBasicMaterial({color: 0x0});
            drawingLayer.transparent = true;
            drawingLayer.map = new T.CanvasTexture(this.canvas, T.UVMapping);
            materials.push(drawingLayer);
            geometry.addGroup(0, Infinity, 1);
        }

        this.object = new T.Mesh(geometry, materials);
        this.object.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.object.rotateX(this.rot.x);
        this.object.rotateY(this.rot.y);
        this.object.rotateZ(this.rot.z);

        display.scene.add(this.object);

        super.init(display);
    }

    private _updateStrokes() {
        let tex = new T.CanvasTexture(this.canvas, T.UVMapping);
        tex.needsUpdate = true;
        this.setTexture(tex, 1);
    }

    private _clearStrokes() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // this.context.stroke();
    }

    private _rect(x: number, y: number, w: number, h: number, c: string, t: number) {
        this.context.strokeStyle = c;
        this.context.lineWidth = t;

        this.context.rect(x, y, w, h);
        this.context.stroke();
    }

    private _rectNorm(x: number, y: number, w: number, h: number, c: string, t: number) {
        this._rect(x * this.canvas.width, y * this.canvas.height, w * this.canvas.width, h * this.canvas.height, c, t);
    }

    public enable(): void {
        throw new Error('Method not implemented.');
    }

    public disable(): void {
        throw new Error('Method not implemented.');
    }

}