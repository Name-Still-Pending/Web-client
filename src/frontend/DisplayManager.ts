import * as T from 'three'
import {BaseModule, EventListenerBinding} from "./common_modules/BaseClasses";
// @ts-ignore
import {MTLLoader} from "three/examples/jsm/loaders/MTLLoader";
// @ts-ignore
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {MOUSE} from "three";
// @ts-ignore
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {Feature} from "./Feature";


export class DisplayManager{
    get features(): Feature[] {
        return this._features;
    }
    static ACTION_RIGHT_CLICK = "right_click"
    static ACTION_LEFT_CLICK = "left_click"
    get modules(): {} {
        return this._modules;
    }
    private _camera: T.Camera
    private _scene: T.Scene
    private renderer: T.WebGLRenderer
    private domElement: HTMLElement
    private controls: OrbitControls;
    private cam = true;
    private out = true;
    private inside = false;

    private _features: Feature[]

    private _modules: {};
    constructor(elementId: string) {
        this.domElement = document.getElementById(elementId);
        if(this.domElement == null){
            console.error("Element with ID " + elementId + " does not exist.");
            return;
        }
        if(!(this.domElement instanceof HTMLDivElement)){
            console.error(elementId + " is not a div.");
            return;
        }
        this.renderer = new T.WebGLRenderer();
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = T.PCFSoftShadowMap;
        this.renderer.setSize(this.domElement.clientWidth, this.domElement.clientHeight);
        this.renderer.setClearColor(new T.Color(0x1b1bff))
        this.renderer.domElement.oncontextmenu = (event) => false;
        this.domElement.appendChild(this.renderer.domElement);
        // this.renderer.domElement.addEventListener("mousemove", (event) => {this.onPointerMove(event)});
        // // this.renderer.domElement.addEventListener("mousedown", (event) => {this.onMouseDown()});
        this.renderer.domElement.addEventListener("mousedown", (event) => this.onMouseInteractClick(event))
        this.renderer.domElement.addEventListener( 'resize', (event) => {this.onWindowResize()});
        this._scene = new T.Scene();

        this._camera = new T.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
        this._modules = {};
        this._features = new Array<Feature>();
        this.controls = new OrbitControls( this.camera, document.getElementById("OpenGlDisplay"));
        this.controls.target.set( 0, -0.5, 0 );
        this.controls.enablePan = false;
        this.controls.enableDamping = true;

    }

    update(){
        if (this.cam === true) {
            this.controls.enabled = true;
        }
        else {
            this.controls.enabled = false;
        }
        if (this.out === true) {
            if (this.inside === true) {
                this.controls.target.set( 0, -0.5, 0 );
                this.inside = false;
            }
            this.controls.minDistance = 4;
            this.controls.maxDistance = 40;
        }
        else {
            if (this.inside === false) {
                this.controls.target.set( -0.3, -0.3, 0 );
                this.inside = true;
            }
            this.controls.minDistance = 0.0001;
            this.controls.maxDistance = 0.0001;
        }
        this.controls.update();

        this.renderer.clear(true);
        this.renderer.render(this._scene, this._camera);
    }

    get camera(): T.Camera {
        return this._camera;
    }

    get scene(): T.Scene {
        return this._scene;
    }

    addModule(module: BaseModule, init = false, force = false){
        if(!force){
            for (const key in this._modules) {
                if(key == module.id){
                    console.error("Failed to load object: " + module.id + " already exists.");
                    return;
                }
            }
        }
        this._modules[module.id] = module;
        if (init) module.init(this);
    }

    addFeature(feature: Feature){
        feature.init(this);
        this._features.push(feature);
    }



    onMouseInteractClick(event: MouseEvent){
        if (!this.cam) {
            let e: string;
            switch (event.button){
                case MOUSE.LEFT:
                    e = DisplayManager.ACTION_LEFT_CLICK;
                    break;
                case MOUSE.RIGHT:
                    e = DisplayManager.ACTION_RIGHT_CLICK;
                    break;
                default:
                    return;
            }
            let rect = this.renderer.domElement.getBoundingClientRect()
            let pointer = new T.Vector2(
                (event.clientX - rect.left) / (rect.width / 2) - 1,
                -(event.clientY - rect.top) / (rect.height / 2) + 1
            )

            console.log(`click at (${pointer.x}, ${pointer.y})`)
            let ray = new T.Raycaster();
            ray.setFromCamera(pointer, this.camera);
            let collisions = ray.intersectObjects(this.scene.children, true);
            if(collisions.length < 1) return;
            let object = collisions[0].object;
            if(object instanceof T.Mesh){
                object.dispatchEvent({type: e});
            }
        }
    }

    initAll(){
        for (const key in this._modules) {
            let module = this._modules[key];
            if (!module.initialized) module.init(this);
        }
    }

    onWindowResize() {
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}
