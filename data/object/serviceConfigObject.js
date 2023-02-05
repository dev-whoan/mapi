import ServiceConfigReader from '../../configReader/serviceReader.js';
import baseConfigObj from './baseConfigObject.js';
import fs from 'fs';
import NoSuchMapiSettingFoundException from '../../exception/NoSuchMapiSettingFoundException.js';

export default class ServiceConfigObject{
    constructor(id, log, filePath, fileModifiedTime, create, read, update, _delete){
        this.data = new baseConfigObj(id, "service", "no", [], 1, "yes", filePath, fileModifiedTime);
        this.data.create = create;
        this.data.read   = read;
        this.data.update = update;
        this.data.delete = _delete;
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
                console.log("=========Reload Service Config Files=========");
                console.log("======== Caused by File Update...========");
                console.log("File: ", this.data.filePath);
                console.log("Config Last Modified Time: ", lastModified);
                console.log("New Config  Modified Time: ", newModified );
                console.log("======== Caused by File Update...========");
                ServiceConfigReader.instance.updateConfigs();
                ServiceConfigReader.instance.printConfigs();
                console.log("=========Successfuly ** Reloaded=========");
                console.log("=========Reload Service Config Files=========");
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