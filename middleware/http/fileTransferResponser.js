
import FileTransferConfigReader from '../../core/fileTransferReader';
import HTTP_RESPONSE from '../../core/enum/httpResponse.js';
import ModelConfigReader from '../../core/modelReader.js';
import FileTransferDataHandler from '../db/apiDataHandler.js';
import { arrayToObject, objectKeysToArray } from '../../core/utils.js';

export default class FileTransferResponser{
    constructor(apiConfigObject){
        this.apiConfigObject = apiConfigObject;
        this.apiId = this.apiConfigObject.data.uri + '@' + this.apiConfigObject.data.id;
        this.originalUri = this.apiConfigObject.data.uri + '/' + this.apiConfigObject.data.id;
        /*
            apiConfigObject = (
                jsonData.id,
                jsonData.type,
                jsonData.auth,
                jsonData['proxy-list'],
                jsonData.log,
                jsonData.uri,
                jsonData.model,
                jsonData.dml
            );
            apiConfigObject.data.id
        */
    }

    putApiData(uri, body){
        let apiDataHandler = new ApiDataHandler();
        let modelConfigReader = new ModelConfigReader();

        let model = this.apiConfigObject.data.model;
        let modelObject = modelConfigReader.getConfig(model);

        /* Create Get Info */
        let conditionUri = uri.split(this.originalUri)[1];
        let _requestConditions = conditionUri.split('/');
        _requestConditions.splice(0, 1);

        if( (_requestConditions.length === 1 && _requestConditions[0] === '') 
        ||  _requestConditions.length === 0){
            return {
                code: 400
            };
        }

        if(_requestConditions.length % 2 != 0){
            return {
                code: 400
            };
        }

        let _condition = null;
        if(_requestConditions.length !== 0){
            _condition = {};

            for(let i = 0; i < _requestConditions.length; i += 2){
                _condition[_requestConditions[i]] = _requestConditions[i+1];
            }
            
            for(let key in _condition){
                if(!modelObject.data.columns[key]){
                    return {
                        code: 400
                    };
                }
            }
        }
        /* Create Get Info */

        /* Create Post Info */
        let _columnList = [];
        let _dataList = [];

        for(let key in body){
            if(!modelObject.data.columns[key]){
                return {
                    code: 400
                };
            }
            _columnList.push(key);
            _dataList.push(body[key]);
        }

        for(let i = 0; i < modelObject.data.notNull.length; i++){
            if(!body[modelObject.data.notNull[i]]){
                return {
                    code: 400
                };
            }
        }
        /* Create Post Info */

        let table = modelObject.data.id;
        return apiDataHandler.doModify(table, _columnList, _dataList, _condition);
    }

    postApiData(body){
        let apiDataHandler = new ApiDataHandler();
        let modelConfigReader = new ModelConfigReader();
        let model = this.apiConfigObject.data.model;
        let modelObject = modelConfigReader.getConfig(model);
        let columnNotNull = modelObject.data.notNull;
        let _code = 400;
    
        let msg = {
            message: HTTP_RESPONSE[_code],
            data: [],
            code: _code        
        };

        let _columnList = [];
        let _dataList = [];

        for(let key in body){
            if(!modelObject.data.columns[key]){
                return {
                    code: 400
                };
            }
            _columnList.push(key);
            _dataList.push(body[key]);
        }

        for(let i = 0; i < columnNotNull.length; i++){
            if(!body[columnNotNull[i]]){
                return {
                    code: 400
                };
            }
        }

        let table = modelObject.data.id;

        return apiDataHandler.doInsert(table, _columnList, _dataList);
    }

    deleteApiData(body){
        let apiDataHandler = new ApiDataHandler();
        let modelConfigReader = new ModelConfigReader();
        let model = this.apiConfigObject.data.model;
        let modelObject = modelConfigReader.getConfig(model);
        let table = modelObject.data.id;

        return apiDataHandler.doDelete(table, body);
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

//        return res.status(msg.code).json(msg);
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

//        return res.status(msg.code).json(msg);
        return msg;
    }

    async put(proxied, apiResponser, req, res, next){
        let result = await apiResponser.putApiData(req.originalUrl, req.body);
        let _code = 200;
        if(!result || result.length == 0){
            _code = 204;
        } else if(result && result.code == 400){
            _code = 400;
        }
        
        let msg = {
            message: HTTP_RESPONSE[_code],
            data: result,
            code: _code
        };

//        return res.status(msg.code).json(msg);
        return msg;
    }

    async delete(proxied, apiResponser, req, res, next){
        let result = await apiResponser.deleteApiData(req.body);
        
        let msg = {
            message: HTTP_RESPONSE[204] ,
            data: result,
            code: 204
        };

//        return res.status(200).json(msg);
        return msg;
    }
}