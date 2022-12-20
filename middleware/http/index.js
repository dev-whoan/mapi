import ConfigReader from "../../core/configReader.js";
import API_TYPE from "../../core/enum/apiType.js";
import HTTP_RESPONSE from "../../core/enum/httpResponse.js";
import { objectKeysToArray } from "../../core/utils.js";
import JwtHandler from "../auth/jwtHandler.js";
import DBAccessor from "../db/accessor.js";
import ProxyWorker from "../proxy/worker.js";
import ApiResponser from "./apiResponser.js";
import FileTransferResponser from "./fileTransferResponser.js";

class RestApiHttpRequestHandler {
    static restApiHttpRequestHandlerInstance;
    constructor(app){
        if(RestApiHttpRequestHandler.instance)  return RestApiHttpRequestHandler.restApiHttpRequestHandlerInstance;
        this.app = app;
        RestApiHttpRequestHandler.restApiHttpRequestHandlerInstance = this;
    }

    get(uri, configInfo){
        this.app.get(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                let apiResponser = new ApiResponser(configInfo);
                let proxyWorker = new ProxyWorker(
                    configInfo.data.auth === 'yes',
                    configInfo.data.proxyList,
                    `API Worker - [GET]${configInfo.data.uri}@${configInfo.data.id}(${_cip})`,
                    apiResponser.get,
                    [true, apiResponser, req, res, next],
                    configInfo.data.proxyOrder
                );
            
                // result = { code: ..., message: ...}
                let result = await proxyWorker.doTask(req, res);  
                if(!result || !result.code){
                    result = {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    };
                }                       
                
                if(result.code === 200){
                    result.size = result.data.length;
                }                
//                        return result;
                return res.status(result.code).json(result);
            }
        );
        this.app.get(
            uri + '/*',
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                
                let apiResponser = new ApiResponser(configInfo);
                let proxyWorker = new ProxyWorker(
                    configInfo.data.auth === 'yes',
                    configInfo.data.proxyList,
                    `API Worker - [GET]${configInfo.data.uri}@${configInfo.data.id}(${_cip})`,
                    apiResponser.get,
                    [true, apiResponser, req, res, next],
                    configInfo.data.proxyOrde
                );
                
                let result = await proxyWorker.doTask(req, res);
                if(!result || !result.code){
                    result = {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    };
                }
                if(result.code === 200){
                    result.size = result.data.length;
                }                                                                        
//                        return result;
                return res.status(result.code).json(result);
            }
        );
    }

    post(uri, configInfo){
        this.app.post(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                
                let apiResponser = new ApiResponser(configInfo);
                let proxyWorker = new ProxyWorker(
                    configInfo.data.auth === 'yes',
                    configInfo.data.proxyList,
                    `API Worker - [POST]${configInfo.data.uri}@${configInfo.data.id}(${_cip})`,
                    apiResponser.post,
                    [true, apiResponser, req, res, next],
                    configInfo.data.proxyOrder
                );
                
                let result = await proxyWorker.doTask(req, res);
                if(!result || !result.code){
                    result = {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    };
                }                                                        
//                        return result;
                return res.status(result.code).json(result);    
            }
        );
    }

    put(uri, configInfo){
        this.app.put(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                let apiResponser = new ApiResponser(configInfo);
                let proxyWorker = new ProxyWorker(
                    configInfo.data.auth === 'yes',
                    configInfo.data.proxyList,
                    `API Worker - [PUT]${configInfo.data.uri}@${configInfo.data.id}(${_cip})`,
                    apiResponser.put,
                    [true, apiResponser, req, res, next],
                    configInfo.data.proxyOrder
                );
                
                let result = await proxyWorker.doTask(req, res);
                if(!result || !result.code){
                    result = {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    };
                }                                                        
//                        return result;
                return res.status(result.code).json(result);
            }
        );
        this.app.put(
            uri + '/*',
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                let apiResponser = new ApiResponser(configInfo);
                let proxyWorker = new ProxyWorker(
                    configInfo.data.auth === 'yes',
                    configInfo.data.proxyList,
                    `API Worker - [PUT]${configInfo.data.uri}@${configInfo.data.id}(${_cip})`,
                    apiResponser.put,
                    [true, apiResponser, req, res, next],
                    configInfo.data.proxyOrder
                );
                
                let result = await proxyWorker.doTask(req, res);
                if(!result || !result.code){
                    result = {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    };
                }                                                        
//                        return result;
                return res.status(result.code).json(result);         
            }
        );
    }

    delete(uri, configInfo){
        this.app.delete(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                let apiResponser = new ApiResponser(configInfo);
                let proxyWorker = new ProxyWorker(
                    configInfo.data.auth === 'yes',
                    configInfo.data.proxyList,
                    `API Worker - [DELETE]${configInfo.data.uri}@${configInfo.data.id}(${_cip})`,
                    apiResponser.delete,
                    [true, apiResponser, req, res, next],
                    configInfo.data.proxyOrder
                );
                
                let result = await proxyWorker.doTask(req, res);
                if(!result || !result.code){
                    result = {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    };
                }                                                        
//                        return result;
                return res.status(result.code).json(result);          
            }
        );
    }

    setRouter(configInfo){
        let URIs = configInfo.keys();
        let uri;
        let baseConfig = ConfigReader.instance.getConfig();
        let baseUri = (baseConfig[API_TYPE.REST])['base-uri'];
        baseUri = (baseUri === '/' ? '' : baseUri);
        while( (uri = URIs.next().value) ){
            let rawUri = uri.toString().split('@');
            let _uri = baseUri + rawUri[0] + '/' + rawUri[1];
            let _configInfo = configInfo.get(uri);
           
            if(_configInfo.data.dml.indexOf('select') !== -1){
                this.get(_uri, _configInfo);   
            }

            if(_configInfo.data.dml.indexOf('insert') !== -1){
                this.post(_uri, _configInfo);
            }

            if(_configInfo.data.dml.indexOf('update') !== -1){
                this.put(_uri, _configInfo);
            }

            if(_configInfo.data.dml.indexOf('delete') !== -1){
                this.delete(_uri, _configInfo);
            }
        }
    }
}

class FileTransferHttpRequestHandler {
    static fileTransferHttpRequestHandlerInstance;
    constructor(app){
        if(FileTransferHttpRequestHandler.instance)  return FileTransferHttpRequestHandler.fileTransferHttpRequestHandlerInstance;
        this.app = app;
        FileTransferHttpRequestHandler.fileTransferHttpRequestHandlerInstance = this;
    }

    post(uri, configInfo){
        this.app.post(uri, async (req, res, next) => {
            const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            let fileTransferResponser = new FileTransferResponser(configInfo);
            let proxyWorker = new ProxyWorker(
                configInfo.data.auth === 'yes',
                ["start", "end"],
                `File Transfer Worker - [GET]${configInfo.data.directory}@${configInfo.data.id}(${_cip})`,
                fileTransferResponser.post,
                [true, fileTransferResponser, req, res, next],
                1
            );
            
            let result = await proxyWorker.doTask(req, res);

            if(!result || !result.code){
                result = {
                    code: 500,
                    message: HTTP_RESPONSE[500]
                };
            }                       
            
            return res.status(result.code).json(result);         
        });
    }

    delete(uri, configInfo){

    }

    get(configInfo){
        let baseConfig = ConfigReader.instance.getConfig();
        let baseUri = (baseConfig[API_TYPE.FILE_TRANSFER])['read-uri'];
        baseUri = (baseUri === '/' ? '' : baseUri);
        baseUri += `/${configInfo.data.id}`;

        console.log(baseUri);
        console.log(configInfo);
    }

    setRouter(configInfo){
        let URIs = configInfo.keys();
        let uri;
        let baseConfig = ConfigReader.instance.getConfig();
        let baseUri = (baseConfig[API_TYPE.FILE_TRANSFER])['base-uri'];
        baseUri = (baseUri === '/' ? '' : baseUri);

        while( (uri = URIs.next().value) ){
            let rawUri = uri.toString().split('@');
            let _uri = `${baseUri}/${rawUri[1]}`;
            let _configInfo = configInfo.get(uri);
            this.post(_uri, _configInfo);
            this.delete(_uri, _configInfo);
            this.get(_configInfo);
        }
    }
}

class JsonWebTokenHttpRequestHandler {
    static jsonWebTokenHttpRequestHandlerInstance;
    constructor(app){
        if(JsonWebTokenHttpRequestHandler.instance)  return JsonWebTokenHttpRequestHandler.jsonWebTokenHttpRequestHandlerInstance;
        this.app = app;
        JsonWebTokenHttpRequestHandler.jsonWebTokenHttpRequestHandlerInstance = this;
    }

    post(jwtObject){
        this.app.post(jwtObject['generate-uri'], async (req, res) => {
            let dba = new DBAccessor();
            let body = req.body;
            let result = await dba.jwtAuthorize(
                jwtObject['auth-table'],
                jwtObject['auth-columns'],
                jwtObject['columns'],
                body
            );
    
            if(result.length == 0){
                return res.status(401).json({
                    code: 401,
                    message: HTTP_RESPONSE[401]
                });
            }
            
            let _data = result[0];
            let payloadData = {};
            if(jwtObject.keys){
                let _columns = objectKeysToArray(_data);
    
                _columns.forEach( (item, index) => {
                    let temp = jwtObject.keys[item];
                    payloadData[temp] = _data[item];
                });
                _data = null;
            } else {
                payloadData = _data;
            }
            
            let jwtHandler = new JwtHandler();
            jwtHandler.setPayload(payloadData);
            jwtHandler.generateSignature();
            let _token = jwtHandler.getJwtString();
            let msg = {
                code: 200,
                success: true,
                token: _token
            };
            if(!_token){
                msg = {
                    code: 500,
                    success: false
                };
            };
    
            return res.status(msg.code).json(msg);
        });
    }

    get(jwtObject){
        this.app.get(jwtObject['verify-uri'], async (req, res) => {
            let token = req.headers.authorization;
            if(!token){
                return res.status(403).json({
                    success: false,
                    message: 'Authentication failed'
                });
            }
    
            let jwtToken = token.split(" ")[1];
            let jwtHandler = new JwtHandler();
            let verifyResult = jwtHandler.verify(jwtToken);
    
            if(!verifyResult){
                return res.status(403).json({
                    code: 403,
                    success: false,
                    message: 'Token is invalid'
                });
            }
            
            return res.status(200).json({
                code: 200,
                success: true,
                message: 'Token is valid'
            });
        });
    }
    
    setRouter(jwtObject){
        if(jwtObject.use !== "yes") return;
    
        this.post(jwtObject);
        this.get(jwtObject);    
    }
}

export {
    RestApiHttpRequestHandler, FileTransferHttpRequestHandler, JsonWebTokenHttpRequestHandler
}