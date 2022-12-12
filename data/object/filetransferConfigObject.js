import baseConfigObj from './baseConfigObject.js';

export default class FileTransferConfigObject{
    constructor(id, type, auth, log, directory, extension, customDatabase){
        this.data = new baseConfigObj(id, type, auth, null, null, log);
        this.data.directory = directory;
        this.data.extension = extension;
        this.data.customDatabase = customDatabase;
    }

    get(key){
        return this.data[key];
    }
}