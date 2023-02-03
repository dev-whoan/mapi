import HTTP_RESPONSE from '../../enum/httpResponse.js';
import ModelConfigReader from '../../configReader/modelReader.js';
import ApiDataHandler from '../db/apiDataHandler.js';
import { objectKeysToArray } from '../../configReader/utils.js';
import ConfigReader from '../../configReader/configReader.js';
import API_TYPE from '../../enum/apiType.js';
import DB_TYPE from '../../enum/dbType.js';
import { SERVICE_TYPE, SERVICE_ID } from '../../enum/serviceType.js';
import { URL } from 'url';
import ServiceConfigReader from '../../configReader/serviceReader.js';

export default class ApiResponser{
    constructor(apiConfigObject){
        this.apiConfigObject = apiConfigObject;
        this.apiId = this.apiConfigObject.data.uri + '@' + this.apiConfigObject.data.id;
        this.originalUri = this.apiConfigObject.data.uri === '/'
                    ? '/' + this.apiConfigObject.data.id
                    : this.apiConfigObject.data.uri + '/' + this.apiConfigObject.data.id;
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

    getConditionFromUri(uri){
        let conditionUri = uri.split(this.originalUri)[1];
        let _requestConditions = conditionUri.split('/');
        _requestConditions.splice(0, 1);

        if(_requestConditions.length === 1 && _requestConditions[0] === ''){
            _requestConditions.splice(0, 1);
        }

        if(_requestConditions.length % 2 != 0){
            console.error("[apiResponser-getApiData]: User sent incorrect request.");
            console.error(`Condition must match follow rule: /key1/{value1}/key2/{value2}... but given condition is [${_requestConditions}]`)
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
        }

        return _condition;
    }

    getApiData(uri, query){
        console.log(`[MariaDB] Read request arrived(${uri}) `);

        const serviceConfigReader = new ServiceConfigReader();
        let apiDataHandler = new ApiDataHandler();
        let modelConfigReader = new ModelConfigReader();

        const service = this.apiConfigObject.data.services.get;
        
        if(service.type === SERVICE_TYPE.DB){
            const serviceKey = `${SERVICE_ID.DB}@${service.id}`
            const serviceData = serviceConfigReader.getConfig(serviceKey);
            if(!serviceData){
                console.error(`Cannot find service [${serviceKey}].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }

            const serviceRawQuery = (serviceData.data.read) ? serviceData.data.read : null;
            if(!serviceRawQuery){
                console.error(`Cannot find service query [${serviceKey}.read].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }
            const serviceQuery = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
            const modelObject = modelConfigReader.getConfig(serviceRawQuery.model);
            
            const _condition = this.getConditionFromUri(uri);

            const queryOption = {
                'pagination-key': this.apiConfigObject.data.pagingQuery,
                'pagination-value': query[this.apiConfigObject.data.pagingQuery],
                'pagination-column': modelObject.data.aiKey,
                count: ConfigReader.instance.getConfig()[API_TYPE.REST].count,
            };

            return apiDataHandler.doSelect(serviceRawQuery.model, serviceQuery, _condition, queryOption);
        }

        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    async putApiData(uri, body, query){
        console.log(`[MariaDB] Update request arrived(${uri}): `, body);
        const serviceConfigReader = new ServiceConfigReader();
        let apiDataHandler = new ApiDataHandler();
        
        const service = this.apiConfigObject.data.services.get;
        
        if(service.type === SERVICE_TYPE.DB){
            const getInfo = await this.getApiData(uri, query);
            
            console.log(getInfo);
            if(getInfo.length === 0){
                //post
                const result = await this.postApiData(body);
                console.log("Data Inserted")
                return result;
            }

            const serviceKey = `${SERVICE_ID.DB}@${service.id}`
            const serviceData = serviceConfigReader.getConfig(serviceKey);
            if(!serviceData){
                console.error(`Cannot find service [${serviceKey}].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }

            const serviceRawQuery = (serviceData.data.update) ? serviceData.data.update : null;
            if(!serviceRawQuery){
                console.error(`Cannot find service query [${serviceKey}.read].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }
            
            let _serviceQuery = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
            let _condition = this.getConditionFromUri(uri);
            let _conditionKey = objectKeysToArray(_condition);

            const condition = [];

            const bodyKeys = objectKeysToArray(body);
            for(let _key in bodyKeys){
                const key = bodyKeys[_key];
                const substitutionString = `{{ body.${key} }}`;
                if(_serviceQuery.indexOf(substitutionString) === -1){
                    console.warn(`[MariaDB]: Unknown field is given to create data [ ${substitutionString} ].`);
                    return {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    };
                }
                _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
                condition.push(body[key]);
            }

            for(let _key in _conditionKey){
                const key = _conditionKey[_key];
                const substitutionString = `{{ condition.${key} }}`;
                if(_serviceQuery.indexOf(substitutionString) === -1){
                    console.warn(`[MariaDB]: Unknown field is given to create data [ ${substitutionString} ].`);
                    return {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    };
                }
                _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
                condition.push(_condition[key]);
            }

            const serviceQuery = _serviceQuery;

            return apiDataHandler.doModify(serviceRawQuery.model, serviceQuery, condition);
        }
        
        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    postApiData(uri, body){
        console.log(`[MariaDB] Create request arrived(${uri}): `, body);
        const serviceConfigReader = new ServiceConfigReader();
        let apiDataHandler = new ApiDataHandler();

        const service = this.apiConfigObject.data.services.get;
        
        if(service.type === SERVICE_TYPE.DB){
            const serviceKey = `${SERVICE_ID.DB}@${service.id}`
            const serviceData = serviceConfigReader.getConfig(serviceKey);
            if(!serviceData){
                console.error(`Cannot find service [${serviceKey}].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }

            const serviceRawQuery = (serviceData.data.create) ? serviceData.data.create : null;
            if(!serviceRawQuery){
                console.error(`Cannot find service query [${serviceKey}.read].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }
            const serviceRawQueryWithModel = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
            const bodyKeys = objectKeysToArray(body);
            let _serviceQuery = serviceRawQueryWithModel;
            const condition = [];
            for(let _key in bodyKeys){
                const key = bodyKeys[_key];
                const substitutionString = `{{ body.${key} }}`;
                if(_serviceQuery.indexOf(substitutionString) === -1){
                    console.warn(`[MariaDB]: Unknown field is given to create data [ ${substitutionString} ].`);
                    return {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    };
                }
                _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
                condition.push(body[key]);
            }

            const serviceQuery = _serviceQuery;

            return apiDataHandler.doInsert(serviceRawQuery.model, serviceQuery, condition);
        }

        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    deleteApiData(uri, body){
        console.log(`[MariaDB] Delete request arrived(${uri}): `, body);

        const serviceConfigReader = new ServiceConfigReader();
        let apiDataHandler = new ApiDataHandler();

        const service = this.apiConfigObject.data.services.get;
        
        if(service.type === SERVICE_TYPE.DB){
            const serviceKey = `${SERVICE_ID.DB}@${service.id}`
            const serviceData = serviceConfigReader.getConfig(serviceKey);
            if(!serviceData){
                console.error(`Cannot find service [${serviceKey}].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }

            const serviceRawQuery = (serviceData.data.delete) ? serviceData.data.delete : null;
            if(!serviceRawQuery){
                console.error(`Cannot find service query [${serviceKey}.read].`);
                return {
                    code: 500,
                    message: "Internal Server Error"
                };
            }
            const serviceRawQueryWithModel = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
            const bodyKeys = objectKeysToArray(body);
            let _serviceQuery = serviceRawQueryWithModel;
            
            const condition = [];
            for(let _key in bodyKeys){
                const key = bodyKeys[_key];
                const substitutionString = `{{ body.${key} }}`;
                if(_serviceQuery.indexOf(substitutionString) === -1){
                    console.warn(`[MariaDB]: Unknown field is given to delete data [ ${substitutionString} ].`);
                    return {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    };
                }
                _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
                condition.push(body[key]);
            }
            const serviceQuery = _serviceQuery;
            
            return apiDataHandler.doDelete(serviceRawQuery.model, serviceQuery, condition);
        }

        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    async get(proxied, apiResponser, req, res, next){
        const _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
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
        const _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
        const result = await apiResponser.postApiData(_requestedUri, req.body, model);
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
        const _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
        const result = await apiResponser.putApiData(_requestedUri, req.body, req.query);
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
        const _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
        const result = await apiResponser.deleteApiData(_requestedUri, req.body);
        
        let msg = {
            message: HTTP_RESPONSE[204] ,
            data: result,
            code: 204
        };

        return msg;
    }
}