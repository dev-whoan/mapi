import baseConfigObj from './baseConfigObject.js';

export default class ApiConfigObject{
    constructor(id, type, auth, proxyList, proxyOrder, log, uri, model, dml){
        this.data = new baseConfigObj(id, type, auth, proxyList, proxyOrder, log);
        this.data.uri = uri;
        this.data.model = model;
        this.data.dml = dml;
    }

    get(key){
        return this.data[key];
    }
}