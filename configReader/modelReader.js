import apiType from '../enum/apiType.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';
import ModelConfigObject from '../data/object/modelConfigObject.js';
import Logger from '../logger/index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.join(__dirname, '..', 'configs', 'model');

let configsInApi;

const allowedFormat = [
    "id", "type", "auth", "proxy-list", "log", "ai-key"
]

export default class ModelConfigReader{
    static instance;

    constructor(){
        if(ModelConfigReader.instance) return ModelConfigReader.instance;
        this.#readConfigs();
        this.logger = new Logger('info', 'ModelConfigReader.js');
        ModelConfigReader.instance = this;
    }

    updateConfigs(){
        this.#readConfigs();
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
            
            const oneObject = new ModelConfigObject(
                jsonData.id,
                jsonData.type,
                jsonData.auth,
                jsonData['proxy-list'],
                jsonData['proxy-order'],
                jsonData.log,
                filePath,
                fileModified,
                jsonData.columns,
                jsonData['ai-key']
            );
            
            let configId = oneObject.data.id;
            this.configInfo.set(configId, oneObject);
        });
    };

    getConfig(key){
        return this.configInfo.get(key);
    };

    printConfigs(){
        this.logger.info("=========Model Config Info=========");
        this.configInfo.forEach((item, index) => {
            this.logger.info(
                JSON.stringify(item.data, null, 4)
            );
        });
        this.logger.info("=========Model Config Info=========");
    };

    checkValidity(json){
        let i_list = [allowedFormat];
        for(let i = 0; i < i_list.length; i++){
            let current_object = i_list[i];

            for(let index in current_object){
                if(!json[current_object[index]]){

                    throw new OutofConfigKeyException(
                        `Out of Key '${current_object[index]}' for '${apiType.MODEL}' config file.`
                    );
                }
            }
        }
    };
}