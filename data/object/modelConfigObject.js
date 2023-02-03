import baseConfigObj from './baseConfigObject.js';

export default class ModelConfigObject{
    constructor(id, type, auth, proxyList, proxyOrder, log, aiKey){
        this.data = new baseConfigObj(id, type, auth, proxyList, proxyOrder, log);
        this.data.aiKey = aiKey;
    }

    get(key){
        return this.data[key];
    }
}