import FileTransferConfigObject from "../../data/object/filetransferConfigObject.js";
import FileController from "./fileController.js";

export default class FileTransferDataHandler {
    constructor(){
        this.controller = new FileController();
    }

/*
    let result = await this.dba.select(table, columnList, condition);
    
    let data = [];
    for(let i = 0; i < result.length; i++){
        data.push(result[i]);
    }
    
    return data;
*/

    async doWrite(req, fileInfo, modelObject){
        console.log(fileInfo);
        console.log(modelObject);

        this.controller.writeFile(req, fileInfo, modelObject);

        return null;
    }

    async doRead(req, fileInfo, modelObject){

    }

    async doDelete(req, fileInfo, modelObject){

    }
}