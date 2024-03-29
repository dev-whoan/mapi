import apiType from '../enum/apiType.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';
import ApiConfigObject from '../data/object/apiConfigObject.js';
import ModelConfigReader from './modelReader.js';
import NoModelFoundException from '../exception/NoModelFoundException.js';
import ServiceConfigObject from '../data/object/serviceConfigObject.js';
import { SERVICE_ID, SERVICE_TYPE } from '../enum/serviceType.js';
import Logger from '../logger/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.join(__dirname, '..', 'configs', 'services');

const allowedFormat = [
    "id", "log", "create", "read", "update", "delete"
];

export default class ServiceConfigReader{
    static instance;

    constructor(){
        if(ServiceConfigReader.instance) return ServiceConfigReader.instance;
        this.#readConfigs();
        this.logger = new Logger('info', 'ServiceConfigReader.js');
        ServiceConfigReader.instance = this;
    }

    updateConfigs(){
        this.#readConfigs();
    }

    #readServiceConfigs(_path, prefix){
        const configsInApi = fs.readdirSync(_path).filter(file => path.extname(file) === '.json');
        configsInApi.forEach(file => {
            const fileData = fs.readFileSync(path.join(_path, file));
            const fileStat = fs.lstatSync(path.join(_path, file));
            const jsonData = JSON.parse(fileData.toString());

            const filePath = path.join(_path, file);
            const fileModified = fileStat ? fileStat.mtimeMs : null;
            
            this.checkValidity(jsonData);
            const oneObject = new ServiceConfigObject(
                jsonData.id,
                jsonData.log,
                filePath,
                fileModified,
                jsonData.create,
                jsonData.read,
                jsonData.update,
                jsonData.delete
            );
            
            let configId = prefix + oneObject.data.id;
            if(this.serviceConfigInfo.get(configId)){
                this.logger.warn(`Service Config is duplicated. The new config ${configId} will be set.`); 
                this.logger.warn(`To prevent API Config duplication, please set the concatenation of uri and id into unique string.`);
            }
            
            this.serviceConfigInfo.set(configId, oneObject);
        });
    }
    
    #readConfigs(){
        this.serviceConfigInfo = new Map();
        this.#readServiceConfigs(
            path.join(BASE_PATH, SERVICE_TYPE.DB),
            `${SERVICE_ID.DB}@`
        );
        this.#readServiceConfigs(
            path.join(BASE_PATH, SERVICE_TYPE.FUNCTION),
            `${SERVICE_ID.FUNCTION}@`
        );
    };

    getConfig(key){
        return this.serviceConfigInfo.get(key);
    };

    printConfigs(){
        this.logger.info("=========Service Config Info=========");
        this.serviceConfigInfo.forEach((item, index) => {
            this.logger.info(
                JSON.stringify(item.data, null, 4)
            );
        });
        this.logger.info("=========Service Config Info=========");
    };

    modelCheck(){
        let _configInfo = ApiConfigReader.instance.configInfo;
        
        let keys = _configInfo.keys();
        let _key = null;
        
        while( (_key = keys.next().value) ){
            let oneObject = _configInfo.get(_key);
            let modelId = oneObject.data.model;
            let model = new ModelConfigReader().getConfig(modelId);
            this.logger.info(`** Model [${modelId}] checking...`);
            if(!model){
                throw new NoModelFoundException(
                    `No Model is Found for API Config -> ${modelId}`
                );
            }
            this.logger.info(`** Model [${modelId}] Ok!`);
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