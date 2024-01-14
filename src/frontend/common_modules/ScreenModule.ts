import * as T from 'three'
import {BaseModule} from "./BaseClasses";
import {DisplayManager} from "../DisplayManager";

export class ScreenModule extends BaseModule{
    size: T.Vector2;
    pos: T.Vector3;
    rot: T.Vector3;
    object: T.Mesh;

    constructor(name: string, size: T.Vector2, pos: T.Vector3, rot: T.Vector3){
        super(name)
        this.pos = pos;
        this.rot = rot;
        this.size = size;
    }

    public setImageFromBuffer(buffer: ArrayBuffer, width: number, height: number){
        // let mat = new T.Material
        let newTex = new T.DataTexture(buffer, width, height);
        this.setTexture(newTex);
    }

    public setTexture(texture: T.Texture){
        let oldTex = (this.object.material as T.MeshBasicMaterial).map;
        (this.object.material as T.MeshBasicMaterial).map = texture;
        if(oldTex != null) oldTex.dispose()
    }
    
    public init(display: DisplayManager) {
        let geometry = new T.PlaneGeometry(this.size.width, this.size.height);
        let material = new T.MeshBasicMaterial({color: 0xffffff});
        material.transparent = true;

        this.object = new T.Mesh(geometry, material);
        this.object.position.set(this.pos.x, this.pos.y, this.pos.z);
        this.object.rotateX(this.rot.x);
        this.object.rotateY(this.rot.y);
        this.object.rotateZ(this.rot.z);

        display.scene.add(this.object);

        super.init(display);
    }
    public enable(): void {
        throw new Error('Method not implemented.');
    }
    public disable(): void {
        throw new Error('Method not implemented.');
    }

}