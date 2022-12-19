import ConfigReader from "../../core/configReader.js";
import API_TYPE from "../../core/enum/apiType.js";
import FILETRANSFER_TYPE from "../../core/enum/fileTransfer.js";
import HostpathFileController from './hostpath/index.js';
import S3FileController from './s3/index.js';

export default class FileController{
    constructor(){
        this.controller = null;
        this.type = ConfigReader.instance.getConfig()[API_TYPE.FILE_TRANSFER].type;
        switch(this.type){
            case FILETRANSFER_TYPE.HOSTPATH:
                this.controller = new HostpathFileController();
                break;
            case FILETRANSFER_TYPE.S3:
                this.controller = new S3FileController();
                break;
            default:
                this.controller = null;
                throw new UnknownFileControllerException(
                    `Unknown File Controller was requested to be set. [${type}]`
                );
        }
    }

    async writeFile(req, fileInfo, modelObject){
        return this.controller.writeFile(req, fileInfo, modelObject);
    }

    async deleteFile(req, fileInfo, modelObject){
        return this.controller.deleteFile(req, fileInfo, modelObject);
    }
}