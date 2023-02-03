import baseConfigObj from './baseConfigObject.js';

export default class ServiceConfigObject{
    constructor(id, log, create, read, update, _delete){
        this.data = new baseConfigObj(id, "service", "no", [], 1, "yes");
        this.data.create = create;
        this.data.read   = read;
        this.data.update = update;
        this.data.delete = _delete;
    }

    get(key){
        return this.data[key];
    }
}