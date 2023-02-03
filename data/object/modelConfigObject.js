import baseConfigObj from './baseConfigObject.js';

export default class ModelConfigObject{
    constructor(id, type, auth, proxyList, proxyOrder, log){
        this.data = new baseConfigObj(id, type, auth, proxyList, proxyOrder, log);
    }

    get(key){
        return this.data[key];
    }
}