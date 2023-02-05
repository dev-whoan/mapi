import ConfigReader from "../../configReader/configReader.js";
import API_TYPE from "../../enum/apiType.js";
import HTTP_RESPONSE from "../../enum/httpResponse.js";
import { objectKeysToArray } from "../../configReader/utils.js";
import JwtHandler from "../auth/jwtHandler.js";
import DBAccessor from "../db/accessor.js";
import ProxyWorker from "../proxy/worker.js";
import ApiResponser from "./apiResponser.js";
import FileTransferResponser from "./fileTransferResponser.js";
import ApiConfigObject from "../../data/object/apiConfigObject.js";
import ApiConfigReader from "../../configReader/apiReader.js";
import FileTransferConfigReader from "../../configReader/filetransferReader.js";

class RestApiHttpRequestHandler {
    static restApiHttpRequestHandlerInstance;
    constructor(app){
        if(RestApiHttpRequestHandler.instance)  return RestApiHttpRequestHandler.restApiHttpRequestHandlerInstance;
        this.app = app;
        RestApiHttpRequestHandler.restApiHttpRequestHandlerInstance = this;
    }

    get(uri, configInfo, configKey){
        this.app.get(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                if(uri !== req.originalUrl){
                    console.log(`API Worker - [GET] Unknown Page Requested:: ${req.originalUrl}(${_cip})`);
                    return res.status(404).json({
                        code: 404,
                        message: HTTP_RESPONSE['404']
                    });
                }
                
                try{
                    configInfo.updateConfigs();
                    const configData = ApiConfigReader.instance.configInfo.get(configKey).getData();
                    const apiResponser = new ApiResponser(configData);
                    const proxyWorker = new ProxyWorker(
                        configData.auth === 'yes',
                        configData.proxyList,
                        `API Worker - [GET]${configData.uri}@${configData.id}(${_cip})`,
                        apiResponser.get,
                        [true, apiResponser, req, res, next],
                        configData.proxyOrder
                    );
                
                    // result = { code: ..., message: ...}
                    const result = await proxyWorker.doTask(req, res);  
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
                } catch (e) {
                    console.error(e.stack || e);
                    return {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    }
                }
            }
        );
        this.app.get(
            uri + '/*',
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                if(!req.originalUrl.includes(uri)){
                    console.log(`API Worker - [GET] Unknown Page Requested:: ${req.originalUrl}(${_cip})`);
                    return res.status(404).json({
                        code: 404,
                        message: HTTP_RESPONSE['404']
                    });
                }

                try{
                    configInfo.updateConfigs();
                    const configData = ApiConfigReader.instance.configInfo.get(configKey).getData();
                    const apiResponser = new ApiResponser(configData);

                    const proxyWorker = new ProxyWorker(
                        configData.auth === 'yes',
                        configData.proxyList,
                        `API Worker - [GET]${configData.uri}@${configData.id}(${_cip})`,
                        apiResponser.get,
                        [true, apiResponser, req, res, next],
                        configData.proxyOrder
                    );
                    
                    const result = await proxyWorker.doTask(req, res);
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
                } catch (e) {
                    console.error(e.stack || e);
                    return {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    }
                }
            }
        );
    }

    post(uri, configInfo, configKey){
        this.app.post(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                
                if(uri !== req.originalUrl){
                    console.log(`API Worker - [POST] Unknown Page Requested:: ${req.originalUrl}(${_cip})`);
                    return res.status(404).json({
                        code: 404,
                        message: HTTP_RESPONSE['404']
                    });
                }

                try{
                    configInfo.updateConfigs();
                    const configData = ApiConfigReader.instance.configInfo.get(configKey).getData();
                    const apiResponser = new ApiResponser(configData);

                    const proxyWorker = new ProxyWorker(
                        configData.auth === 'yes',
                        configData.proxyList,
                        `API Worker - [POST]${configData.uri}@${configData.id}(${_cip})`,
                        apiResponser.post,
                        [true, apiResponser, req, res, next],
                        configData.proxyOrder
                    );
                    
                    const result = await proxyWorker.doTask(req, res);
                    if(!result || !result.code){
                        result = {
                            code: 500,
                            message: HTTP_RESPONSE[500]
                        };
                    }                                                        
    //                        return result;
                    return res.status(result.code).json(result);    
                } catch (e) {
                    console.error(e.stack || e);
                    return {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    }
                }
            }
        );
    }

    put(uri, configInfo, configKey){
        this.app.put(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                if(uri !== req.originalUrl){
                    console.log(`API Worker - [PUT] Unknown Page Requested:: ${req.originalUrl}(${_cip})`);
                    return res.status(404).json({
                        code: 404,
                        message: HTTP_RESPONSE['404']
                    });
                }

                try{
                    configInfo.updateConfigs();
                    const configData = ApiConfigReader.instance.configInfo.get(configKey).getData();
                    const apiResponser = new ApiResponser(configData);

                    const proxyWorker = new ProxyWorker(
                        configData.auth === 'yes',
                        configData.proxyList,
                        `API Worker - [PUT]${configData.uri}@${configData.id}(${_cip})`,
                        apiResponser.put,
                        [true, apiResponser, req, res, next],
                        configData.proxyOrder
                    );
                    
                    const result = await proxyWorker.doTask(req, res);

                    if(!result || !result.code){
                        result = {
                            code: 500,
                            message: HTTP_RESPONSE[500]
                        };
                    }
    
                    return res.status(result.code).json(result);
                } catch (e) {
                    console.error(e.stack || e);
                    return {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    }
                }
            }
        );
        this.app.put(
            uri + '/*',
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                if(!req.originalUrl.includes(uri)){
                    console.log(`API Worker - [PUT] Unknown Page Requested:: ${req.originalUrl}(${_cip})`);
                    return res.status(404).json({
                        code: 404,
                        message: HTTP_RESPONSE['404']
                    });
                }

                try{
                    configInfo.updateConfigs();
                    const configData = ApiConfigReader.instance.configInfo.get(configKey).getData();
                    const apiResponser = new ApiResponser(configData);

                    const proxyWorker = new ProxyWorker(
                        configData.auth === 'yes',
                        configData.proxyList,
                        `API Worker - [PUT]${configData.uri}@${configData.id}(${_cip})`,
                        apiResponser.put,
                        [true, apiResponser, req, res, next],
                        configData.proxyOrder
                    );
                    
                    const result = await proxyWorker.doTask(req, res);
                    
                    if(!result || !result.code){
                        result = {
                            code: 500,
                            message: HTTP_RESPONSE[500]
                        };
                    }

                    return res.status(result.code).json(result);   
                } catch (e) {
                    console.error(e.stack || e);
                    return {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    }
                }      
            }
        );
    }

    delete(uri, configInfo, configKey){
        this.app.delete(
            uri,
            async (req, res, next) => {
                const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                if(uri !== req.originalUrl){
                    console.log(`API Worker - [DELETE] Unknown Page Requested:: ${req.originalUrl}(${_cip})`);
                    return res.status(404).json({
                        code: 404,
                        message: HTTP_RESPONSE['404']
                    });
                }

                try{
                    configInfo.updateConfigs();
                    const configData = ApiConfigReader.instance.configInfo.get(configKey).getData();
                    const apiResponser = new ApiResponser(configData);

                    const proxyWorker = new ProxyWorker(
                        configData.auth === 'yes',
                        configData.proxyList,
                        `API Worker - [DELETE]${configData.uri}@${configData.id}(${_cip})`,
                        apiResponser.delete,
                        [true, apiResponser, req, res, next],
                        configData.proxyOrder
                    );
                    
                    const result = await proxyWorker.doTask(req, res);
                    if(!result || !result.code){
                        result = {
                            code: 500,
                            message: HTTP_RESPONSE[500]
                        };
                    }                                                        

                    return res.status(result.code).json(result);     
                } catch (e) {
                    console.error(e.stack || e);
                    return {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    }
                }     
            }
        );
    }

    /**
     * Set Router for RESTful API that manipulating Database
     * @param {Map(ApiConfigObject)} configInfo from ApiConfigReader
     */
    setRouter(configInfo){
        let URIs = configInfo.keys();
        let uri;
        let baseConfig = ConfigReader.instance.getConfig();
        let baseUri = (baseConfig[API_TYPE.REST])['base-uri'];
        baseUri = (baseUri === '/' ? '' : baseUri);
        while( (uri = URIs.next().value) ){
            const rawUri = uri.toString().split('@');
            const _uri = (rawUri[0] !== '/')
                 ? baseUri + rawUri[0] + '/' + rawUri[1]
                 : baseUri + rawUri[0] + rawUri[1];
            const _configInfo = configInfo.get(uri);
           
            if(_configInfo.data.services.get) {
                this.get(_uri, _configInfo, uri);
            }
            if(_configInfo.data.services.post) {
                this.post(_uri, _configInfo, uri);
            }
            if(_configInfo.data.services.put) {
                this.put(_uri, _configInfo, uri);
            }
            if(_configInfo.data.services.delete) {
                this.delete(_uri, _configInfo, uri);
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

            try{
                const fileTransferResponser = new FileTransferResponser(configInfo);
                configInfo.updateConfigs();
                const configData = FileTransferConfigReader.instance.configInfo.get(configKey).getData();
                const proxyWorker = new ProxyWorker(
                    configData.auth === 'yes',
                    ["start", "end"],
                    `File Transfer Worker - [GET]${configData.directory}@${configData.id}(${_cip})`,
                    fileTransferResponser.post,
                    [true, fileTransferResponser, req, res, next],
                    1
                );
                
                const result = await proxyWorker.doTask(req, res);

                if(!result || !result.code){
                    result = {
                        code: 500,
                        message: HTTP_RESPONSE[500]
                    };
                }                       
                
                return res.status(result.code).json(result);         
            } catch (e) {
                console.error(e.stack || e);
                return {
                    code: 500,
                    message: HTTP_RESPONSE[500]
                }
            }
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