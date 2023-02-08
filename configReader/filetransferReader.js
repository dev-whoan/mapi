import apiType from '../enum/apiType.js';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';
import ProxyWorker from '../middleware/proxy/worker.js';
import ModelConfigReader from './modelReader.js';
import NoModelFoundException from '../exception/NoModelFoundException.js';
import ConfigReader from './configReader.js';
import API_TYPE from '../enum/apiType.js';
import HTTP_RESPONSE from '../enum/httpResponse.js';
import FileTransferConfigObject from '../data/object/filetransferConfigObject.js';
import Logger from '../logger/index.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_PATH = path.join(__dirname, '..', 'configs', 'controller', 'filetransfer');

let configsInApi;

// + custom-database
const allowedFormat = [
    'id', 'type', 'auth', 'log', 'directory', 'extension'
];

export default class FileTransferConfigReader{
    static instance;

    constructor(){
        if(FileTransferConfigReader.instance) return FileTransferConfigReader.instance;
        this.readConfigs();
        this.logger = new Logger('info', 'FileTransferConfigReader.js');
        FileTransferConfigReader.instance = this;
    }
    
    readConfigs(){
        this.configInfo = new Map();

        configsInApi = fs.readdirSync(BASE_PATH).filter(file => path.extname(file) === '.json');
        configsInApi.forEach(file => {
            const fileData = fs.readFileSync(path.join(BASE_PATH, file));
            const fileStat = fs.lstatSync(path.join(BASE_PATH, file));
            const jsonData = JSON.parse(fileData.toString());

            const filePath = path.join(BASE_PATH, file);
            const fileModified = fileStat ? fileStat.mtimeMs : null;
            
            this.checkValidity(jsonData);
            
            const oneObject = new FileTransferConfigObject(
                jsonData.id,
                jsonData.type,
                jsonData.auth,
                jsonData.log,
                filePath,
                fileModified,
                jsonData.directory,
                jsonData.extension,
                jsonData['custom-database'],
                jsonData.count
            );
            
            if(oneObject.data.directory.includes('@') || oneObject.data.id.includes ('@')){
                this.logger.warn(`Attribute [uri] and [id] must not include '@' word.`);
                this.logger.warn(`The configId ${oneObject.data.uri} + '@' + ${oneObject.data.id} will not be registered.`);
                return;
            }

            let configId = oneObject.data.directory + '@' + oneObject.data.id;
            if(this.configInfo.get(configId)){
                this.logger.warn(`API Config is duplicated. The new config ${configId} will be set.`); 
                this.logger.warn(`To prevent API Config duplication, please set the concatenation of uri and id into unique string.`);
            }
            this.configInfo.set(configId, oneObject);
        });
    };

    getConfig(key){
        return this.configInfo.get(key);
    };

    printConfigs(){
        this.logger.info("=========File Transfer Config Info=========");
        this.configInfo.forEach((item, index) => {
            this.logger.info(
                JSON.stringify(item.data, null, 4)
            );
        });
        this.logger.info("=========File Transfer Config Info=========");
    };

    modelCheck(){
        let _configInfo = FileTransferConfigReader.instance.configInfo;
        
        let keys = _configInfo.keys();
        let _key = null;
        
        while( (_key = keys.next().value) ){
            let oneObject = _configInfo.get(_key);
            if(!oneObject.data.customDatabase)  continue;

            let modelId = oneObject.data.customDatabase.model;
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