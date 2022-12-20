import HTTP_RESPONSE from '../../core/enum/httpResponse.js';
import ModelConfigReader from '../../core/modelReader.js';
import ApiDataHandler from '../db/apiDataHandler.js';
import { objectKeysToArray } from '../../core/utils.js';
import ConfigReader from '../../core/configReader.js';
import API_TYPE from '../../core/enum/apiType.js';
import DB_TYPE from '../../core/enum/dbType.js';
import { URL } from 'url';

export default class ApiResponser{
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

    /* HTTP Methods
    *  1. Get: Get Data
    *  2. Post: Create Data
    *  3. Put: Modify Data
    *  4. Delete: Delete Data
    */

    /* HTTP Methods Functions
    *  return: HTTP Response
    *  1. apiDataGenerator에 요청
    *  2. 데이터 획득
    *  3. HTTP JSON 응답 생성
    *  4. HTTP 응답 반환
    */

    /* {}ApiData Functions
    *  return: Object
    *  1. Process Request Info
    *  2. Check Validity
    *  3. Fetch Data From ApiDataHandler
    *  4. Return
    */

    getApiData(uri, query){
        let apiDataHandler = new ApiDataHandler();
        let modelConfigReader = new ModelConfigReader();

        let model = this.apiConfigObject.data.model;
        let modelObject = modelConfigReader.getConfig(model);
        
        let conditionUri = uri.split(this.originalUri)[1];
        let _requestConditions = conditionUri.split('/');
        _requestConditions.splice(0, 1);

        if(_requestConditions.length === 1 && _requestConditions[0] === ''){
            _requestConditions.splice(0, 1);
        }

        if(_requestConditions.length % 2 != 0){
            console.log(`Condition must match follow rule: /key1/{value1}/key2/{value2}... but given condition is [${_requestConditions}]`)
            return {
                code: 400
            };
        }
        let _condition = null;

        const queryOption = {
            'pagination-key': this.apiConfigObject.data.pagingQuery,
            'pagination-value': query[this.apiConfigObject.data.pagingQuery],
            'pagination-column': this.apiConfigObject.data.autoIncrementColumn,
            count: ConfigReader.instance.getConfig()[API_TYPE.REST].count,
        };

        if(_requestConditions.length !== 0){
            _condition = {};

            for(let i = 0; i < _requestConditions.length; i += 2){
                _condition[_requestConditions[i]] = _requestConditions[i+1];
            }
            
            for(let key in _condition){
                if(!modelObject.data.columns[key]){
                    console.log(`Model does not have the request column [${key}]`);
                    return {
                        code: 400
                    };
                }
            }
        }

        let table = modelObject.data.id;
        let _columns = '';
        let _modelObjectColumns = objectKeysToArray(modelObject.data.columns);
        _modelObjectColumns.forEach( (item, index) => {
            _columns += item;
            if(index < _modelObjectColumns.length - 1)
                _columns += ', '
        })

        return apiDataHandler.doSelect(table, _columns, _condition, queryOption);
    }

    putApiData(uri, body, query){
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
            console.log(`Condition for put data is not given`);
            return {
                code: 400
            };
        }

        if(_requestConditions.length % 2 != 0){
            console.log(`Condition must match follow rule: /key1/{value1}/key2/{value2}... but given condition is [${_requestConditions}]`)
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
                    console.log(`Model does not have the request column [${key}]`);
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
                console.log(`Model does not have the request column [${key}]`);
                return {
                    code: 400
                };
            }
            _columnList.push(key);
            _dataList.push(body[key]);
        }

        for(let i = 0; i < modelObject.data.notNull.length; i++){
            if(!body[modelObject.data.notNull[i]]){
                console.log(`Require column is null [${modelObject.data.notNull[i]}] and you sent`);
                console.log(body);
                return {
                    code: 400
                };
            }
        }
        /* Create Post Info */

        const queryOption = {
            'pagination-key': this.apiConfigObject.data.pagingQuery,
            'pagination-value': query[this.apiConfigObject.data.pagingQuery],
            'pagination-column': this.apiConfigObject.data.autoIncrementColumn,
            count: ConfigReader.instance.getConfig()[API_TYPE.REST].count,
        };

        let table = modelObject.data.id;
        return apiDataHandler.doModify(table, _columnList, _dataList, _condition, modelObject, queryOption);
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
                console.log(`Model does not have the request column [${key}]`);
                return {
                    code: 400
                };
            }
            _columnList.push(key);
            _dataList.push(body[key]);
        }

        for(let i = 0; i < columnNotNull.length; i++) {
            if(!body[columnNotNull[i]]){
                console.log(`Require column is null [${columnNotNull[i]}] and you sent`);
                console.log(body);
                return {
                    code: 400
                };
            }
        }

        let table = modelObject.data.id;

        return apiDataHandler.doInsert(table, _columnList, _dataList, modelObject);
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
        let _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
        let result = await apiResponser.getApiData(_requestedUri, req.query);
        let _code = 200;
        if(!result || result.length == 0){
            _code = 204;
        } else if(result && result.code == 400){
            _code = 400;
        }

        const CONFIG_PAGING_COUNT = ConfigReader.instance.getConfig()[API_TYPE.REST].count;
        let nextUri = null, prevUri = null;
        
        if(result instanceof Array && result.length != 0){
            const aiColumn = apiResponser.apiConfigObject.data.autoIncrementColumn;
            result.sort((a, b) => { 
                return a[aiColumn] > b[aiColumn] ? 1 : -1  
            });
        }

        let msg = {
            message: HTTP_RESPONSE[_code],
            data: result,
            code: _code,
            'next-uri': null,
            'prev-uri': null
        };
        
        if(ConfigReader.instance.getConfig()[API_TYPE.DB].type === DB_TYPE.MONGO){
            msg['next-uri'] = 'Not Supported (MongoDB) Yet';
            msg['prev-uri'] = 'Not Supported (MongoDB) Yet';
        }

        return msg;
    }

    async post(proxied, apiResponser, req, res, next, model){
        let result = await apiResponser.postApiData(req.body, model);
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

    async put(proxied, apiResponser, req, res, next){
        let _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
        let result = await apiResponser.putApiData(_requestedUri, req.body, req.query);
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