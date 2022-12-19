import apiType from './enum/apiType.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';
import ApiConfigObject from '../data/object/apiConfigObject.js';
import ModelConfigReader from './modelReader.js';
import NoModelFoundException from '../exception/NoModelFoundException.js';
import DBAccessor from '../middleware/db/accessor.js';
import { stringToBase64 } from './utils.js';
import AutoIncrementUndefinedException from '../exception/autoIncrementUndefinedException.js';
import MySqlAccessor from '../middleware/db/mysql/index.js';
import MongoAccessor from '../middleware/db/mongo/index.js';
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
                jsonData.dml,
                jsonData.count,
                jsonData['paging-query']
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
            
            this.setAutoIncrement(configId);
            console.log(this.configInfo.get(configId));
        });
    };

    async setAutoIncrement(configId){
        let configInfo = this.configInfo.get(configId);
        let modelConfigReader = new ModelConfigReader();
        let model = configInfo.data.model;

        let modelObject = modelConfigReader.getConfig(model);
        let table = modelObject.data.id;

        let dba = new DBAccessor();
        let aiColumn = await dba.setAutoIncrement(table);
        if(!aiColumn || !(aiColumn.COLUMN_NAME)){
            throw new AutoIncrementUndefinedException(
                `No Auto Increment Column Detected in Table ${model}. MAPI tried to create the column manually, but it failed.`
            );
        }

        if(dba instanceof MySqlAccessor){
            modelObject.data.columns[aiColumn.COLUMN_NAME] = 'integer';
        }
        if(dba instanceof MongoAccessor){
//            modelObject.data.columns[aiColumn.COLUMN_NAME] = 'ObjectId';
        }
        configInfo.data.autoIncrementColumn = aiColumn.COLUMN_NAME;
        this.configInfo.set(configId, configInfo);
    }

    getConfig(key){
        return this.configInfo.get(key);
    };

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