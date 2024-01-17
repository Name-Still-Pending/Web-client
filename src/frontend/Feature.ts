import {BaseModule} from "./common_modules/BaseClasses";
import {DisplayManager} from "./DisplayManager";
import {EventDispatcher} from "three";


export abstract class Feature extends EventDispatcher{
    readonly id: string;
    modules: ModuleData<BaseModule>[];


    protected constructor(id: string, modules: ModuleData<BaseModule>[]) {
        super();
        this.id = id;
        this.modules = modules;
    }

    init(display: DisplayManager){
        for (const module of this.modules) {
            module.init(display, this.id);
        }
        this.connectFunction();
    }

    protected abstract connectFunction(): void;
}

export class ModuleData<T extends BaseModule>{
    get instance(): T {
        return this._instance;
    }
    private readonly module: new (...Params: any[]) => T;
    private readonly params?: any[];
    private _instance: T;


    constructor(module: new (...Params: any[]) => T, params?: any[]) {
        this.module = module;
        this.params = params;
    }

    init(display: DisplayManager, featureId: string){
        this._instance = this.params === undefined ? new this.module() : new this.module(...this.params);
        if(display.modules[this._instance.id] != undefined) {
            this._instance = display.modules[this._instance.id];
        }
        else display.addModule(this._instance, true);
        this._instance.users.push(featureId);
    }
}