import baseConfigObj from './baseConfigObject.js';

export default class FileTransferConfigObject{
    constructor(id, type, auth, log, directory, extension, customDatabase, count){
        this.data = new baseConfigObj(id, type, auth, null, null, log);
        this.data.directory = directory;
        this.data.extension = extension;
        this.data.customDatabase = customDatabase;
        this.data.count = count ? count : 10;
    }

    get(key){
        return this.data[key];
    }
}