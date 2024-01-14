import {BaseModule} from "./common_modules/BaseClasses";
import {DisplayManager} from "./DisplayManager";
import {EventDispatcher} from "three";


export abstract class Feature extends EventDispatcher{
    readonly id: string;
    modules: ModuleData[];


    protected constructor(id: string, modules: ModuleData[]) {
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

export class ModuleData{
    private module: new (...Params: any[]) => BaseModule;
    private params?: any[];
    public instance: BaseModule;


    constructor(module: new (...Params: any[]) => BaseModule, params?: any[]) {
        this.module = module;
        this.params = params;
    }

    init(display: DisplayManager, featureId: string){
        this.instance = this.params === undefined ? new this.module() : new this.module(...this.params);
        if(display.modules[this.instance.id] != undefined) {
            this.instance = display.modules[this.instance.id];
        }
        else display.addModule(this.instance, true);
        this.instance.users.push(featureId);
    }
}