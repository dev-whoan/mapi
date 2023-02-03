import baseConfigObj from './baseConfigObject.js';

export default class ApiConfigObject{
    constructor(id, type, auth, proxyList, proxyOrder, log, uri, services, count, pagingQuery){
        this.data = new baseConfigObj(id, type, auth, proxyList, proxyOrder, log);
        this.data.uri = uri;
        this.data.services = services;
        this.data.count = count ? count : 10;
        this.data.pagingQuery = pagingQuery;
    }

    get(key){
        return this.data[key];
    }
}