import ConfigReader from "../../core/configReader.js";
import FILETRANSFER_TYPE from "../../core/enum/fileTransfer.js";
import HostpathFileController from './hostpath/index.js';
import S3FileController from './s3/index.js';

export default class FileController{
    constructor(){
        this.ftType = ConfigReader.instance.getConfig()[API_TYPE.FILE_TRANSFER].type;
        switch(this.dbType){
            case FILETRANSFER_TYPE.HOSTPATH:
                this.operator = new HostpathFileController();
                break;
            case FILETRANSFER_TYPE.S3:
                this.operator = new S3FileController();
                break;
            default:
                this.operator = null;
                throw new UnknownFileControllerException(
                    `Unknown File Controller was requested to be set. [${dbType}]`
                );
        }
    }
}