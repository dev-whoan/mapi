import FileTransferConfigObject from "../../data/object/filetransferConfigObject";
import FileController from "./fileController";

export default class FileTransferDataHandler {
    constructor(){
        this.controller = new FileController();
    }

    async doWrite(uri, body, fileInfo){

    }

    async doRead(uri, body){

    }

    async doDelete(uri, body){

    }
}