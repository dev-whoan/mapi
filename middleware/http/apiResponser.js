import HTTP_RESPONSE from '../../enum/httpResponse.js';
import ConfigReader from '../../configReader/configReader.js';
import API_TYPE from '../../enum/apiType.js';
import DB_TYPE from '../../enum/dbType.js';
import { SERVICE_TYPE, SERVICE_ID } from '../../enum/serviceType.js';
import { URL } from 'url';
import { create, read, update, _delete } from '../services/db/sqlExecutor.js';

export default class ApiResponser{
    constructor(apiConfigDataObject){
        this.apiConfigDataObject = apiConfigDataObject;
        this.apiId = this.apiConfigDataObject.uri + '@' + this.apiConfigDataObject.id;
        this.originalUri = this.apiConfigDataObject.uri === '/'
                    ? '/' + this.apiConfigDataObject.id
                    : this.apiConfigDataObject.uri + '/' + this.apiConfigDataObject.id;
        /*
            apiConfigDataObject = (
                jsonData.id,
                jsonData.type,
                jsonData.auth,
                jsonData['proxy-list'],
                jsonData.log,
                jsonData.uri,
                jsonData.model,
                jsonData.dml
            );
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
        console.log(`[RESTful API] Data Read request arrived(${uri}) `);
        const service = this.apiConfigDataObject.services.get;
        
        if(service.type === SERVICE_TYPE.DB){
            return read(uri, query, this.originalUri, this.apiConfigDataObject, service);
        }

        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    putApiData(uri, body, query){
        console.log(`[RESTful API] Data Update request arrived(${uri}): `, body);    
        const service = this.apiConfigDataObject.services.put;
        
        if(service.type === SERVICE_TYPE.DB){
            return update(uri, query, body, this.originalUri, this.apiConfigDataObject, service);
        }
        
        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    postApiData(uri, body, model){
        console.log(`[RESTful API] Data Create request arrived(${uri}): `, body);
        const service = this.apiConfigDataObject.services.post;

        if(service.type === SERVICE_TYPE.DB){
            return create(uri, body, service);
        }

        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    deleteApiData(uri, body){
        console.log(`[RESTful API] Data Delete request arrived(${uri}): `, body);
        const service = this.apiConfigDataObject.services.delete;
        
        if(service.type === SERVICE_TYPE.DB){
            return _delete(uri, body, service);
        }

        return {
            code: 500,
            message: "Service-Function is not implemented yet"
        };
    }

    async get(proxied, apiResponser, req, res, next){
        const _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
        const result = await apiResponser.getApiData(_requestedUri, req.query);
        
        if(result && result.code == 500){
            return {
                code: result.code,
                message: HTTP_RESPONSE[result.code]
            }   
        }

        let _code = 200;
        if(result.code){
            _code = result.code;
        }
        if(!result || result.length == 0){
            _code = 204;
        } else if(result && result.code == 400){
            _code = 400;
        }

        const CONFIG_PAGING_COUNT = ConfigReader.instance.getConfig()[API_TYPE.REST].count;
        let nextUri = null, prevUri = null;
        
        if(result instanceof Array && result.length != 0){
            const aiColumn = apiResponser.apiConfigDataObject.autoIncrementColumn;
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
        
//        if(ConfigReader.instance.getConfig()[API_TYPE.DB].type === DB_TYPE.MONGO){
        msg['next-uri'] = 'Not Supported Yet';
        msg['prev-uri'] = 'Not Supported Yet';
//        }

        return msg;
    }

    async post(proxied, apiResponser, req, res, next, model){
        const _requestedUri = new URL(req.url, `http://${req.headers.host}`).pathname;
        const result = await apiResponser.postApiData(_requestedUri, req.body, model);

        if(result && result.code == 500){
            return {
                code: result.code,
                message: HTTP_RESPONSE[result.code]
            }   
        }

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
        
        if(result && result.code == 500){
            return {
                code: result.code,
                message: HTTP_RESPONSE[result.code]
            }   
        }

        let _code = result && result.code ? result.code : 200;

        if(!result || result.length == 0){
            _code = 204;
        } else if(result && result.code == 400){
            _code = 400;
        } else if(result && result.inserted){
            _code = 201;
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

        if(result && result.code == 500){
            return {
                code: result.code,
                message: HTTP_RESPONSE[result.code]
            }   
        }

        return result;
    }
}