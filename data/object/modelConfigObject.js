import ModelConfigReader from '../../configReader/modelReader.js';
import baseConfigObj from './baseConfigObject.js';
import fs from 'fs';

export default class ModelConfigObject{
    constructor(id, type, auth, proxyList, proxyOrder, log, filePath, fileModifiedTime, columns, aiKey){
        this.data = new baseConfigObj(id, type, auth, proxyList, proxyOrder, log, filePath, fileModifiedTime);
        this.data.columns = columns;
        this.data.aiKey = aiKey;
    }

    getData(){
        return this.data;
    }

    updateConfigs(){
        try{
            const fileData = fs.lstatSync(this.data.filePath);
            const newModified = fileData.mtimeMs;
            const lastModified = this.data.fileModifiedTime;

            if(lastModified < newModified){
                console.log("=========Reload Model Config Files=========");
                console.log("======== Caused by File Update...========");
                console.log("File: ", this.data.filePath);
                console.log("Config Last Modified Time: ", lastModified);
                console.log("New Config  Modified Time: ", newModified);
                console.log("======== Caused by File Update...========");
                ModelConfigReader.instance.updateConfigs();
                console.log("=========Successfuly ** Reloaded=========")
                console.log("=========Reload Model Config Files=========")
                return true;
            }
            return false;
        } catch (e) {
            throw new NoSuchMapiSettingFoundException(
                `No MAPI setting found [${this.data.filePath}].`
            );
        }
    }
}