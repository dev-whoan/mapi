import FileTransferConfigReader from '../../configReader/filetransferReader.js';
import baseConfigObj from './baseConfigObject.js';
import fs from 'fs';

export default class FileTransferConfigObject{
    constructor(id, type, auth, log, filePath, fileModifiedTime, directory, extension, customDatabase, count){
        this.data = new baseConfigObj(id, type, auth, null, null, log, filePath, fileModifiedTime);
        this.data.directory = directory;
        this.data.extension = extension;
        this.data.customDatabase = customDatabase;
        this.data.count = count ? count : 10;
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
                console.log("=========Reload FileTransfer Config Files=========");
                console.log("======== Caused by File Update...========");
                console.log("File: ", this.data.filePath);
                console.log("Config Last Modified Time: ", lastModified);
                console.log("New Config  Modified Time: ", newModified);
                console.log("======== Caused by File Update...========");
                FileTransferConfigReader.instance.updateConfigs();
                console.log("=========Successfuly ** Reloaded=========")
                console.log("=========Reload FileTransfer Config Files=========")
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