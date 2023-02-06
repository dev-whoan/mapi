import apiType from '../enum/apiType.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';
import ApiConfigObject from '../data/object/apiConfigObject.js';
import ModelConfigReader from './modelReader.js';
import NoModelFoundException from '../exception/NoModelFoundException.js';
import { DocsRequestHandler } from '../middleware/http/index.js';
import ConfigReader from './configReader.js';
import API_TYPE from '../enum/apiType.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.join(__dirname, '..', 'configs', 'controller', 'rest');

let configsInApi;

const allowedFormat = [
    "id", "type", "auth", "proxy-list", "proxy-order", "log", "uri", "services"
];

export default class ApiConfigReader{
    static instance;

    constructor(){
        if(ApiConfigReader.instance) return ApiConfigReader.instance;
        this.updateConfigs();
        ApiConfigReader.instance = this;
    }
    
    updateConfigs(){
        this.#readConfigs();

        /* Rest Api Docs */
        if(ConfigReader.instance.getConfig()[API_TYPE.DOCS].use && ConfigReader.instance.getConfig()[API_TYPE.DOCS].use === 'yes'){
            const docsRequestHandler = new DocsRequestHandler();
            docsRequestHandler.setRouter(this.configInfo);
        }
        /* Rest Api Docs */
    }

    #readConfigs(){
        this.configInfo = new Map();

        configsInApi = fs.readdirSync(BASE_PATH).filter(file => path.extname(file) === '.json');
        configsInApi.forEach(file => {
            const fileData = fs.readFileSync(path.join(BASE_PATH, file));
            const fileStat = fs.lstatSync(path.join(BASE_PATH, file));
            const jsonData = JSON.parse(fileData.toString());

            const filePath = path.join(BASE_PATH, file);
            const fileModified = fileStat ? fileStat.mtimeMs : null;
            this.checkValidity(jsonData);
            
            const oneObject = new ApiConfigObject(
                jsonData.id,
                jsonData.type,
                jsonData.auth,
                jsonData['proxy-list'],
                jsonData['proxy-order'],
                jsonData.log,
                filePath,
                fileModified,
                jsonData.uri,
                jsonData.services,
                jsonData['page-count'],
                jsonData['page-query']
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

    getData(configId){
        return 
    }

    printConfigs(){
        console.log("=========RESTful API Config Info=========");
        this.configInfo.forEach((item, index) => {
            console.log(item.data);
        });
        console.log("=========RESTful API Config Info=========");
    };

    modelCheck(){
        let _configInfo = ApiConfigReader.instance.configInfo;
        
        let keys = _configInfo.keys();
        let _key = null;
        
        while( (_key = keys.next().value) ){
            let oneObject = _configInfo.get(_key);
            let modelId = oneObject.data.model;
            let model = new ModelConfigReader().getConfig(modelId);
            console.log(`** Model [${modelId}] checking...`);
            if(!model){
                throw new NoModelFoundException(
                    `No Model is Found for API Config -> ${modelId}`
                );
            }
            console.log(`** Model [${modelId}] Ok!`);
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