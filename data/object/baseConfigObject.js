export default class BaseConfigData{
    constructor(id, type, auth, proxyList, proxyOrder, log, filePath, fileModifiedTime){
        this.id = id;
        this.type = type;
        this.auth = auth;
        this.proxyList = proxyList;
        this.proxyOrder = proxyOrder;
        this.log = log;
        this.filePath = filePath;
        this.fileModifiedTime = fileModifiedTime;
    }
}