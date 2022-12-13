import baseConfigObj from './baseConfigObject.js';

export default class ModelConfigObject{
    constructor(id, type, auth, proxyList, proxyOrder, log, columns, notNull){
        this.data = new baseConfigObj(id, type, auth, proxyList, proxyOrder, log);
        this.data.columns = columns;
        this.data.notNull = notNull;
    }

    get(key){
        return this.data[key];
    }
}