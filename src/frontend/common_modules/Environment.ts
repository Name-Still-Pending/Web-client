import {BaseModule, EventListenerBinding, MeshLoadData} from "./BaseClasses";
import {DisplayManager} from "../DisplayManager";
import * as T from 'three';
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";

export abstract class Environment extends BaseModule{
    protected objects: T.Object3D[];
    protected meshList: MeshLoadData[];

    constructor(name: string, loadData?: MeshLoadData[]) {
        super("Environment_" + name);
        if (loadData != undefined) this.meshList = loadData;
        this.objects = new Array<T.Object3D>();
    }

    disable() {
        for (const mesh of this.objects) {
            mesh.visible = false;
        }
    }

    enable() {
        for (const mesh of this.objects) {
            mesh.visible = true;
        }
    }

    init(display: DisplayManager) {
        super.init(display)
        this.loadObjects(display, display.scene);
    }

    loadOBJ(path: string, pos: T.Vector3, rot: T.Vector3, parent: T.Object3D, objArray: T.Object3D[], callback?: EventListenerBinding[]): void {
        let lastDot = path.lastIndexOf('.');
        if (lastDot > 0) path = path.substring(0, lastDot);

        const mtlPath = path + ".mtl";
        const objPath = path + ".obj";

        new MTLLoader()
            .load(mtlPath,
                (materials) => {
                    materials.preload();
                    new OBJLoader()
                        .setMaterials(materials)
                        .load(objPath,
                            (object) => {
                                object.traverse((child) => {
                                    if(child instanceof T.Mesh){
                                        console.log("Loaded mesh: " + child.name);
                                        child.receiveShadow = true;
                                        child.castShadow = true;
                                        if(callback != undefined) {
                                            for (const binding of callback) {
                                                child.addEventListener(binding.type, binding.listener);
                                            }
                                        }
                                    }
                                });
                                object.position.copy(pos);
                                object.rotateOnWorldAxis(new T.Vector3(1, 0, 0), rot.x);
                                object.rotateOnWorldAxis(new T.Vector3(0, 1, 0), rot.y);
                                object.rotateOnWorldAxis(new T.Vector3(0, 0, 1), rot.z);
                                object.receiveShadow = true;
                                object.castShadow = true;
                                object.updateMatrix();

                                parent.add(object);
                                objArray.push(object);
                            },
                            function ( xhr ) {
                                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
                            },
                            // called when loading has errors
                            function ( error ) {
                                console.log( 'An error happened: ' + error );
                            }
                        );
                })
    }

    protected loadObjects(display: DisplayManager, parent?: T.Object3D){
        for (const data of this.meshList) {
            this.loadOBJ(data.path, data.pos, data.rot, parent, this.objects, data.events);
        }
    }



}