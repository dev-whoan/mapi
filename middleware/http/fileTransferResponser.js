import FileTransferConfigObject from "../../data/object/filetransferConfigObject";

import HTTP_RESPONSE from '../../core/enum/httpResponse.js';
import ModelConfigReader from '../../core/modelReader.js';
import { arrayToObject, objectKeysToArray } from '../../core/utils.js';

export default class FileTransferResponser{
    constructor(fileTransferConfigObject){
        this.fileTransferConfigObject = fileTransferConfigObject;
        this.configId = this.fileTransferConfigObject.data.directory + '@' + this.apiConfigObject.data.id;
        this.originalUri = this.fileTransferConfigObject.data.id;
    }

    async get(proxied, apiResponser, req, res, next){
        let result = await apiResponser.getApiData(req.originalUrl);
        let _code = 200;
        if(!result || result.length == 0){
            _code = 204;
        } else if(result && result.code == 400){
            _code = 400;
        }
        
        let msg = {
            message: HTTP_RESPONSE[_code] ,
            data: result,
            code: _code
        };

        return msg;
    }

    async post(proxied, apiResponser, req, res, next){
        let result = await apiResponser.postApiData(req.body);
        let _code = 201;

        if(!result || result.length == 0){
            _code = 204;
        } else if(result && result.code == 400){
            _code = 400;
        }

        let msg = {
            message: HTTP_RESPONSE[_code] ,
            data: result,
            code: _code
        };

        if(result.code === 200){
            msg.code = 200;
            msg.message = "Content Already Exist";
            msg.data.message = "Content Already Exist";
        } else if(result.code === 204){
            msg.code = 204;
            msg.message = HTTP_RESPONSE[204];
            msg.data.message = HTTP_RESPONSE[204];
        }

        return msg;
    }

    async delete(proxied, apiResponser, req, res, next){
        let result = await apiResponser.deleteApiData(req.body);
        
        let msg = {
            message: HTTP_RESPONSE[204] ,
            data: result,
            code: 204
        };

        return msg;
    }
}