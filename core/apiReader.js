import apiType from './enum/apiType.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';
import ApiConfigObject from '../data/object/apiConfigObject.js';
import ApiResponser from '../middleware/http/apiResponser.js';
import ProxyWorker from '../middleware/proxy/worker.js';
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
            
            // uri나 id가 @포함하고 있는지 검사할 것
            let configId = oneObject.data.uri + '@' + oneObject.data.id;
            this.configInfo.set(configId, oneObject);
        });
    };

    getConfig(key){
        return this.configInfo.get(key);
    };

    setRouter(base_app){
        let URIs = this.configInfo.keys();
        let uri;
        while( (uri = URIs.next().value) ){
            let rawUri = uri.toString().split('@');
            let _uri = rawUri[0] + '/' + rawUri[1];
            let _configInfo = this.configInfo.get(uri);
            /*
            BEFORE PROXY
            
            let apiResponser = new ApiResponser(_configInfo);
            return apiResponser.get(req, res, next);         
            */
            if(_configInfo.data.dml.indexOf('select') !== -1){
                base_app.get(
                    _uri,
                    function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.proxyList,
                            `API Worker - [GET]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.get,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
                        );
                    
                        let result = proxyWorker.doTask();            
                        return result;
                    }
                );
                base_app.get(
                    _uri + '/*',
                    function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.proxyList,
                            `API Worker - [GET]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.get,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrde
                        );
                        
                        let result = proxyWorker.doTask();
                              
                        return result;
                    }
                );
            }

            if(_configInfo.data.dml.indexOf('insert') !== -1){
                base_app.post(
                    _uri,
                    function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.proxyList,
                            `API Worker - [POST]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.post,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
                        );
                        
                        let result = proxyWorker.doTask();
                              
                        return result;      
                    }
                );
            }

            if(_configInfo.data.dml.indexOf('update') !== -1){
                base_app.put(
                    _uri,
                    function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.proxyList,
                            `API Worker - [PUT]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.put,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
                        );
                        
                        let result = proxyWorker.doTask();
                              
                        return result; 
                    }
                )
                base_app.put(
                    _uri + '/*',
                    function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.proxyList,
                            `API Worker - [PUT]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.put,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
                        );
                        
                        let result = proxyWorker.doTask();
                              
                        return result;          
                    }
                );
            }

            if(_configInfo.data.dml.indexOf('delete') !== -1){
                base_app.delete(
                    _uri,
                    function(req, res, next){
                        const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                        let apiResponser = new ApiResponser(_configInfo);
                        let proxyWorker = new ProxyWorker(
                            _configInfo.data.proxyList,
                            `API Worker - [DELETE]${_configInfo.data.uri}@${_configInfo.data.id}(${_cip})`,
                            apiResponser.delete,
                            [true, apiResponser, req, res, next],
                            _configInfo.data.proxyOrder
                        );
                        
                        let result = proxyWorker.doTask();
                              
                        return result;          
                    }
                );
            }
        }
    }

    printConfigs(){
        console.log(this.configInfo);
    };

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