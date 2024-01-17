import * as T from 'three'
import {BaseModule} from "./BaseClasses";
import {DisplayManager} from "../DisplayManager";

export class ScreenModule extends BaseModule {
    size: T.Vector2;
    pos: T.Vector3;
    rot: T.Vector3;
    object: T.Mesh;
    layerCount: number;
    canvases: HTMLCanvasElement[]
    contexts: CanvasRenderingContext2D[];
    pixelScale: number;

    constructor(name: string,
                size: T.Vector2,
                pos: T.Vector3,
                rot: T.Vector3,
                layers: number,
                pixelScale = 100) {
        super(name)
        this.pos = pos;
        this.rot = rot;
        this.size = size;

        this.canvases = new Array<HTMLCanvasElement>()
        this.contexts = new Array<CanvasRenderingContext2D>()
        this.layerCount = layers;
        this.pixelScale = pixelScale;
    }

    public resize(newWidth: number, newHeight: number){
        // let geo = this.object.geometry as T.PlaneGeometry
        // let scale = new T.Vector2(newWidth / this.size.width, newHeight / this.size.height);
        // geo.scale(scale.x, scale.y, 1)

        for (let canvas of this.canvases) {
            canvas.width = newWidth * this.pixelScale;
            canvas.height = newHeight * this.pixelScale;
        }

    }

    public async setImageFromBlob(layer: number, data: Blob, width: number, height: number) {
        let con = this.contexts[layer];
        data.arrayBuffer().then((buffer) => {
            let imdata = new ImageData(new Uint8ClampedArray(buffer), width, height, {colorSpace: "srgb"});
            let canvas = this.canvases[layer];
            canvas.width = width;
            canvas.height = height;
            con.putImageData(imdata, 0, 0)
            this.object.material[layer].map.needsUpdate = true;
            this.object.material[layer].needsUpdate = true;
        })
    }

    public init(display: DisplayManager) {
        let geometry = new T.PlaneGeometry(this.size.width, this.size.height);
        geometry.clearGroups();
        let materials = new Array<T.MeshBasicMaterial>();

        for (let i = 0; i < this.layerCount; ++i) {
            let canvas = document.createElement("canvas");
            canvas.width = this.size.width * this.pixelScale;
            canvas.height = this.size.height * this.pixelScale;
            this.canvases.push(canvas);
            this.contexts.push(this.canvases[i].getContext("2d"))
            this.contexts[i].clearRect(0, 0, canvas.width, canvas.height);

            let tex = new T.CanvasTexture(canvas, T.UVMapping);
            let mat = new T.MeshBasicMaterial({map: tex, transparent: true})
            materials.push(mat);
            geometry.addGroup(0, Infinity, i);
        }

        this.object = new T.Mesh(geometry, materials);
        this.object.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.object.rotateX(this.rot.x);
        this.object.rotateY(this.rot.y);
        this.object.rotateZ(this.rot.z);

        display.scene.add(this.object);

        super.init(display);
    }

    public updateStrokes(layer: number) {
        this.object.material[layer].map.needsUpdate = true;
    }

    public clearStrokes(layer: number) {
        this.contexts[layer].beginPath();
        this.contexts[layer].clearRect(0, 0, this.canvases[layer].width, this.canvases[layer].height);
        // this.contexts[layer].stroke();
    }

    public rect(layer: number, x: number, y: number, w: number, h: number, c: string, t: number) {
        let con = this.contexts[layer];
        con.strokeStyle = c;
        con.lineWidth = t;

        con.rect(x, y, w, h);
        con.stroke();
    }

    public rectNorm(layer: number, x: number, y: number, w: number, h: number, c: string, t: number) {
        this.rect(
            layer,
            x * this.canvases[layer].width,
            y * this.canvases[layer].height,
            w * this.canvases[layer].width,
            h * this.canvases[layer].height, c, t);
    }

    public enable(): void {
        throw new Error('Method not implemented.');
    }

    public disable(): void {
        throw new Error('Method not implemented.');
    }
}