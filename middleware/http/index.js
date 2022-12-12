import ConfigReader from "../../core/configReader.js";
import API_TYPE from "../../core/enum/apiType.js";
import HTTP_RESPONSE from "../../core/enum/httpResponse.js";
import ProxyWorker from "../proxy/worker.js";
import ApiResponser from "./apiResponser.js";

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

    setRouter(configInfo){
        let URIs = configInfo.keys();
        let uri;
        let baseConfig = ConfigReader.instance.getConfig();
        let baseUri = (baseConfig[API_TYPE.FILE_TRANSFER])['base-uri'];
        baseUri = (baseUri === '/' ? '' : baseUri);

        while( (uri = URIs.next().value) ){
            let rawUri = uri.toString().split('@');
            let _uri = baseUri + rawUri[0] + '/' + rawUri[1];
            let _configInfo = configInfo.get(uri);
//            console.log(_configInfo);
        }
    }
}

export {
    RestApiHttpRequestHandler, FileTransferHttpRequestHandler
}