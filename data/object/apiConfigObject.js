import baseConfigObj from './baseConfigObject.js';
import fs from 'fs';
import ApiConfigReader from '../../configReader/apiReader.js';
import NoMapiSettingFoundException from '../../exception/NoSuchMapiSettingFoundException.js';
export default class ApiConfigObject{
    constructor(id, type, auth, proxyList, proxyOrder, log, filePath, lastModified, uri, services, count, pagingQuery){
        this.data = new baseConfigObj(id, type, auth, proxyList, proxyOrder, log, filePath, lastModified);
        this.data.uri = uri;
        this.data.services = services;
        this.data.count = count ? count : 10;
        this.data.pagingQuery = pagingQuery;
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
                console.log("=========Reload REST API Config Files=========");
                console.log("======== Caused by File Update...========");
                console.log("File: ", this.data.filePath);
                console.log("Config Last Modified Time: ", lastModified);
                console.log("New Config  Modified Time: ", newModified);
                console.log("======== Caused by File Update...========");
                ApiConfigReader.instance.updateConfigs();
                ApiConfigReader.instance.printConfigs();
                console.log("=========Successfuly ** Reloaded=========");
                console.log("=========Reload REST API Config Files=========");

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