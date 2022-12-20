import ModelConfigReader from '../../core/modelReader.js';
import FileTransferDataHandler from "../filetransfer/filetransferDataHandler.js";
import ConfigReader from "../../core/configReader.js";
import API_TYPE from "../../core/enum/apiType.js";

export default class FileTransferResponser{
    constructor(fileTransferConfigObject){
        this.fileTransferConfigObject = fileTransferConfigObject;
        this.configId = this.fileTransferConfigObject.data.directory + '@' + this.fileTransferConfigObject.data.id;
        this.originalUri = this.fileTransferConfigObject.data.id;
    }

    /*
    let msg = {
        message: HTTP_RESPONSE[204] ,
        data: result,
        code: 204
    };

    return msg;
    */

    async getFile(req){

    }

    async get(proxied, apiResponser, req, res, next){
        
        return null;
    }

    async postFileCreate(req){
        console.log(this.fileTransferConfigObject.data);
        let fileTransferHandler = new FileTransferDataHandler();
        let modelConfigReader = new ModelConfigReader();

        let model = this.fileTransferConfigObject.data.customDatabase ? 
            this.fileTransferConfigObject.data.customDatabase.model :
            ConfigReader.instance.getConfig()[API_TYPE.FILE_TRANSFER].table;
        let modelObject = modelConfigReader.getConfig(model);
        console.log("model: ", model)
        
        console.log(modelObject);

        fileTransferHandler.doWrite(req, this.fileTransferConfigObject.data, modelObject);

    }

    async post(proxied, apiResponser, req, res, next){
        let result = await apiResponser.postFileCreate(req);


        return null;
    }

    async deleteFile(req){

    }

    async delete(proxied, apiResponser, req, res, next){
        
        
        return null;
    }
}