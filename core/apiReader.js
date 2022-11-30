import apiType from './enum/apiType.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';
import ApiConfigObject from '../data/object/apiConfigObject.js';
import ApiResponser from '../middleware/http/apiResponser.js';
import ProxyWorker from '../middleware/proxy/worker.js';
import ModelConfigReader from './modelReader.js';
import { insertAt, objectKeysToArray } from './utils.js';
import NoModelFoundException from '../exception/NoModelFoundException.js';
import ConfigReader from './configReader.js';
import API_TYPE from './enum/apiType.js';
import HTTP_RESPONSE from './enum/httpResponse.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.join(__dirname, '..', 'configs', 'controller', 'rest');

let configsInApi;

const allowedFormat = [
    "id", "type", "auth", "proxy-list", "proxy-order", "log", "uri", "model", "dml"
];

export default class ApiConfigReader{
    static instance;

    constructor(){
        if(ApiConfigReader.instance) return ApiConfigReader.instance;
        this.readConfigs();
        ApiConfigReader.instance = this;
    }
    
    readConfigs(){
        this.configInfo = new Map();

        configsInApi = fs.readdirSync(BASE_PATH).filter(file => path.extname(file) === '.json');
        configsInApi.forEach(file => {
            const fileData = fs.readFileSync(path.join(BASE_PATH, file));
            const jsonData = JSON.parse(fileData.toString());
            this.checkValidity(jsonData);
            
            const oneObject = new ApiConfigObject(
                jsonData.id,
                jsonData.type,
                jsonData.auth,
                jsonData['proxy-list'],
                jsonData['proxy-order'],
                jsonData.log,
                jsonData.uri,
                jsonData.model,
                jsonData.dml
            );
            
            if(oneObject.data.uri.includes('@') || oneObject.data.id.includes ('@')){
                console.warn(`Attribute [uri] and [id] must not include '@' word.`);
                console.warn(`The configId ${oneObject.data.uri} + '@' + ${oneObject.data.id} will not be registered.`);
                return;
            }

            let configId = oneObject.data.uri + '@' + oneObject.data.id;
            if(this.configInfo.get(configId)){
                console.warn(`API Config is duplicated. The new config ${configId} will be set.`); 
                console.warn(`To prevent API Config duplication, please set the concatenation of uri and id into unique string.`);
            }
            this.configInfo.set(configId, oneObject);
        });
    };

    getConfig(key){
        return this.configInfo.get(key);
    };

    setRouter(base_app){
        let URIs = this.configInfo.keys();
        let uri;
        let baseConfig = ConfigReader.instance.getConfig();
        let baseUri = (baseConfig[API_TYPE.REST])['base-uri'];
        baseUri = (baseUri === '/' ? '' : baseUri);
        while( (uri = URIs.next().value) ){
            let rawUri = uri.toString().split('@');
            let _uri = baseUri + rawUri[0] + '/' + rawUri[1];
            let _configInfo = this.configInfo.get(uri);
            /*
            BEFORE PROXY
            
            let apiResponser = new ApiResponser(_configInfo);
            return apiResponser.get(req, res, next);         
            */
           
            if(_configInfo.data.dml.indexOf('select') !== -1){
                base_app.get(
                    _uri,
                    async function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        
                        /*
                        if(_configInfo.data.auth === 'yes'){
                            _configInfo.data.proxyList = _configInfo.data.proxyList.filter( i => i != 'auth' );
                            _configInfo.data.proxyList = insertAt(
                                _configInfo.data.proxyList,
                                1,
                                'auth'
                            );
                        }
                        */

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.auth === 'yes',
                            _configInfo.data.proxyList,
                            `API Worker - [GET]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.get,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
                        );
                    
                        // result = { code: ..., message: ...}
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
                base_app.get(
                    _uri + '/*',
                    async function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        
                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.auth === 'yes',
                            _configInfo.data.proxyList,
                            `API Worker - [GET]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.get,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrde
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

            if(_configInfo.data.dml.indexOf('insert') !== -1){
                base_app.post(
                    _uri,
                    async function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.auth === 'yes',
                            _configInfo.data.proxyList,
                            `API Worker - [POST]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.post,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
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

            if(_configInfo.data.dml.indexOf('update') !== -1){
                base_app.put(
                    _uri,
                    async function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.auth === 'yes',
                            _configInfo.data.proxyList,
                            `API Worker - [PUT]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.put,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
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
                )
                base_app.put(
                    _uri + '/*',
                    async function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.auth === 'yes',
                            _configInfo.data.proxyList,
                            `API Worker - [PUT]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.put,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
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

            if(_configInfo.data.dml.indexOf('delete') !== -1){
                base_app.delete(
                    _uri,
                    async function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.auth === 'yes',
                            _configInfo.data.proxyList,
                            `API Worker - [DELETE]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.delete,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
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
        }
    }

    printConfigs(){
        console.log(this.configInfo);
    };

    modelCheck(){
        let _configInfo = ApiConfigReader.instance.configInfo;
        
        let keys = _configInfo.keys();
        let _key = null;
        
        while( (_key = keys.next().value) ){
            let oneObject = _configInfo.get(_key);
            let modelId = oneObject.data.model;
            let model = new ModelConfigReader().getConfig(modelId);
            console.log(`Model [${modelId}] checking...`);
            if(!model){
                throw new NoModelFoundException(
                    `No Model is Found for API Config -> ${modelId}`
                );
            }
            console.log(`Model [${modelId}] Ok!`);
        }
    }

    checkValidity(json){
        let i_list = [allowedFormat];

        for(let i = 0; i < i_list.length; i++){
            let current_object = i_list[i];

            for(let index in current_object){
                if(!json[current_object[index]]){
                    throw new OutofConfigKeyException(
                        `Out of Key '${current_object[index]}' for '${apiType.REST}' config file.`
                    );
                }
            }
        }
    };
}