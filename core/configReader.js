import InappropriateConfigKeyException from '../exception/inappropriateConfigKeyException.js';
import OutofConfigKeyException from '../exception/outofConfigKeyException.js';

import ApiReader from './apiReader.js';
import generalInfo from '../configs/default.json' assert {type: "json"};
import apiType from './enum/apiType.js';


const controlList = [
    "cors", "restapi", "database", "jwt"
]

const properties = [
    [
        'default', 'origin', 'methods', 'allow-headers'
    ],
    [
        'base-uri'
    ],
    [
        'id', 'pw', 'host', 'port', 'scheme'
    ],
    [
        'use',
        'generate-uri',
        'lifetime',
        'secret',
        'auth-table',
        'auth-columns',
        'alg',
        'columns',
        'keys'
    ]
]

export default class ConfigReader{
    static instance;

    constructor(){
        if(ConfigReader.instance) return ConfigReader.instance;
        this.configInfo = new Map();
        this.readGeneralInfo();
        ConfigReader.instance = this;
    }

    getConfig(){
        return this.configInfo.get(apiType.GENERAL)
    }

    setConfigReaders(){
        this.configInfo.set(apiType.REST, new ApiReader());
    }

    readGeneralInfo() {
        this.checkControlSetting(generalInfo);
        this.configInfo.set(apiType.GENERAL, generalInfo);
    };
    
    checkControlSetting(json){
        let i_list = [controlList];

        for(let i = 0; i < i_list.length; i++){
            let current_object = i_list[i];

            for(let index in current_object){
                if(!json[current_object[index]]){
                    throw new OutofConfigKeyException(
                        `Out of Key '${current_object[index]}' for '${apiType.GENERAL}' config file.`
                    );
                }

                for(let jdex in properties[index]){
                    if(! (json[current_object[index]])[properties[index][jdex]] ){
                        throw new OutofConfigKeyException(
                            `Out of Key '${properties[index][jdex]}' for '${apiType.GENERAL}->${current_object[index]};' config file.`
                        );  
                    }
                }
            }
        }
    };

    printConfigs(){
        console.log(this.configInfo);
    }
}