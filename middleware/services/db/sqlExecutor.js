import ConfigReader from "../../../configReader/configReader.js";
import ModelConfigReader from "../../../configReader/modelReader.js";
import ServiceConfigReader from "../../../configReader/serviceReader.js";
import { objectKeysToArray } from "../../../configReader/utils.js";
import API_TYPE from "../../../enum/apiType.js";
import DB_TYPE from "../../../enum/dbType.js";
import HTTP_RESPONSE from "../../../enum/httpResponse.js";
import { SERVICE_ID } from "../../../enum/serviceType.js";
import ApiDataHandler from "../../db/apiDataHandler.js";

const getConditionFromUri = (uri, originalUri) => {
    let conditionUri = uri.split(originalUri)[1];
    let _requestConditions = conditionUri.split('/');
    _requestConditions.splice(0, 1);
 
    if(_requestConditions.length === 1 && _requestConditions[0] === ''){
        _requestConditions.splice(0, 1);
    }

    if(_requestConditions.length % 2 != 0){
        console.error("[apiResponser-getApiData]: User sent incorrect request.");
        console.error(`Condition must match follow rule: /key1/{value1}/key2/{value2}... but given condition is [${_requestConditions}]`)
        return {
            code: 400
        };
    }
    let _condition = null;

    if(_requestConditions.length !== 0){
        _condition = {};

        for(let i = 0; i < _requestConditions.length; i += 2){
            _condition[_requestConditions[i]] = _requestConditions[i+1];
        }
    }

    return _condition;
}

const getServiceData = (serviceKey) => {
    const serviceConfigInfo = ServiceConfigReader.instance.getConfig(serviceKey);
    if (!serviceConfigInfo) {
        console.error(`[sqlExecutor -> getServiceData]: Cannot find service [${serviceKey}].`);
        return null;
    }
    try{
        serviceConfigInfo.updateConfigs();
        return ServiceConfigReader.instance.getConfig(serviceKey).getData();
    } catch (e) {
        console.error(e.stack || e);
        return null;
    }
}

const getModelData = (model) => {
    const modelObject = ModelConfigReader.instance.getConfig(model);

    if (!modelObject) {
        console.error(`[sqlExecutor -> getModelData]: Cannot find model [${model}].`);
        return null;
    }

    try{
        modelObject.updateConfigs();
        return ModelConfigReader.instance.getConfig(model).getData();
    } catch (e) {
        console.error(e.stack || e);
        return null;
    }
    
}

const read = async (uri, query, originalUri, apiConfigDataObject, service) => {
    const apiDataHandler = new ApiDataHandler();
    const serviceKey = `${SERVICE_ID.DB}@${service.id}`
    const serviceData = getServiceData(serviceKey);
    if(!serviceData){
        console.error(`NoSuchMapiSettingConfigFoundException: [${serviceKey}]`);
        return {
            code: 500,
            message: HTTP_RESPONSE[500]
        };
    }

    const serviceRawQuery = (serviceData.read) ? serviceData.read : null;
    if (!serviceRawQuery) {
        console.error(`Cannot find service query [${serviceKey}.read].`);
        return {
            code: 500,
            message: "Internal Server Error"
        };
    }

    const modelData = getModelData(serviceRawQuery.model);
    if(!modelData){
        console.error(`NoSuchMapiSettingConfigFoundException: [${serviceRawQuery.model}]`);
        return {
            code: 500,
            message: HTTP_RESPONSE[500]
        }
    }

    const serviceQuery = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
    const _condition = getConditionFromUri(uri, originalUri);

    if (_condition && _condition.code && _condition.code === 400) {
        return {
            code: 400,
            message: HTTP_RESPONSE[400]
        }
    }

    const queryOption = {
        'pagination-key': apiConfigDataObject.pagingQuery,
        'pagination-value': query[apiConfigDataObject.pagingQuery],
        'pagination-column': modelData.aiKey,
        count: ConfigReader.instance.getConfig()[API_TYPE.REST].count,
    };

    return apiDataHandler.doSelect(serviceRawQuery.model, serviceQuery, _condition, queryOption);
};

const create = async (uri, body, service) => {
    const apiDataHandler = new ApiDataHandler();
    const serviceKey = `${SERVICE_ID.DB}@${service.id}`
    const serviceData = getServiceData(serviceKey);

    if (!serviceData) {
        console.error(`Cannot find service [${serviceKey}].`);
        return {
            code: 500,
            message: "Internal Server Error"
        };
    }

    const serviceRawQuery = (serviceData.create) ? serviceData.create : null;
    
    if (!serviceRawQuery) {
        console.error(`Cannot find service query [${serviceKey}.read].`);
        return {
            code: 500,
            message: "Internal Server Error"
        };
    }
    const modelData = getModelData(serviceRawQuery.model);
    if(!modelData){
        console.error(`NoSuchMapiSettingConfigFoundException: [${serviceRawQuery.model}]`);
        return {
            code: 500,
            message: HTTP_RESPONSE[500]
        }
    }

    const serviceRawQueryWithModel = serviceRawQuery.query.replaceAll('{{ model }}', modelData.id);
    
    const bodyKeys = objectKeysToArray(body);
    let _serviceQuery = serviceRawQueryWithModel;
    const condition = [];
    for (let _key in bodyKeys) {
        const key = bodyKeys[_key];
        const substitutionString = `{{ body.${key} }}`;
        if (_serviceQuery.indexOf(substitutionString) === -1) {
            console.warn(`[RESTful API]: Unknown field is given to create data [ ${substitutionString} ].`);
            return {
                code: 400,
                message: HTTP_RESPONSE[400]
            };
        }
        _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
        condition.push(body[key]);
    }

    const serviceQuery = _serviceQuery;

    return apiDataHandler.doInsert(modelData.id, serviceQuery, condition);
};

const update = async (uri, query, body, originalUri, apiConfigDataObject, service) => {
    const apiDataHandler = new ApiDataHandler();
    const getInfo = await read(uri, query, originalUri, apiConfigDataObject, service);
    if (getInfo.length === 0) {
        const result = await create(uri, body, service);

        return result;
    }

    const serviceKey = `${SERVICE_ID.DB}@${service.id}`
    const serviceData = getServiceData(serviceKey);
    if (!serviceData) {
        console.error(`Cannot find service [${serviceKey}].`);
        return {
            code: 500,
            message: "Internal Server Error"
        };
    }

    const serviceRawQuery = (serviceData.update) ? serviceData.update : null;
    if (!serviceRawQuery) {
        console.error(`Cannot find service query [${serviceKey}.read].`);
        return {
            code: 500,
            message: "Internal Server Error"
        };
    }

    const modelData = getModelData(serviceRawQuery.model);
    if(!modelData){
        console.error(`NoSuchMapiSettingConfigFoundException: [${serviceRawQuery.model}]`);
        return {
            code: 500,
            message: HTTP_RESPONSE[500]
        }
    }

    let _serviceQuery = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
    let _condition = getConditionFromUri(uri, originalUri);
    let _conditionKey = objectKeysToArray(_condition);

    const preparedValues = [];

    const bodyKeys = objectKeysToArray(body);
    for (let _key in bodyKeys) {
        const key = bodyKeys[_key];
        const substitutionString = `{{ body.${key} }}`;
        if (_serviceQuery.indexOf(substitutionString) === -1) {
            console.warn(`[RESTful API]: Unknown field is given for creating data [ ${substitutionString} ].`);
            return {
                code: 400,
                message: HTTP_RESPONSE[400]
            };
        }
        _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
        preparedValues.push(body[key]);
    }

    if (ConfigReader.instance.configInfo.get('general')[API_TYPE.DB].type === DB_TYPE.MONGO||ConfigReader.instance.configInfo.get('general')[API_TYPE.DB].type === DB_TYPE.FIRESTORE) {
        const serviceQuery = _serviceQuery;

        return apiDataHandler.doModify(serviceRawQuery.model, serviceQuery, preparedValues, _condition);
    }

    for (let _key in _conditionKey) {
        const key = _conditionKey[_key];
        const substitutionString = `{{ condition.${key} }}`;
        if (_serviceQuery.indexOf(substitutionString) === -1) {
            console.warn(`[RESTful API]: Unknown field is given as a condition for creating data [ ${substitutionString} ].`);
            return {
                code: 400,
                message: HTTP_RESPONSE[400]
            };
        }
        _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
        preparedValues.push(_condition[key]);
    }

    const serviceQuery = _serviceQuery;

    return apiDataHandler.doModify(serviceRawQuery.model, serviceQuery, preparedValues);
};

const _delete = async (uri, body, service) => {
    const apiDataHandler = new ApiDataHandler();
    const serviceKey = `${SERVICE_ID.DB}@${service.id}`
    const serviceData = getServiceData(serviceKey);
    if(!serviceData){
        console.error(`Cannot find service [${serviceKey}].`);
        return {
            code: 500,
            message: "Internal Server Error"
        };
    }

    const serviceRawQuery = (serviceData.delete) ? serviceData.delete : null;
    if(!serviceRawQuery){
        console.error(`Cannot find service query [${serviceKey}.read].`);
        return {
            code: 500,
            message: "Internal Server Error"
        };
    }

    const modelData = getModelData(serviceRawQuery.model);
    if(!modelData){
        console.error(`NoSuchMapiSettingConfigFoundException: [${serviceRawQuery.model}]`);
        return {
            code: 500,
            message: HTTP_RESPONSE[500]
        }
    }

    const serviceRawQueryWithModel = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
    
    const bodyKeys = objectKeysToArray(body);
    let _serviceQuery = serviceRawQueryWithModel;
    
    const condition = [];
    for(let _key in bodyKeys){
        const key = bodyKeys[_key];
        const substitutionString = `{{ body.${key} }}`;
        if(_serviceQuery.indexOf(substitutionString) === -1){
            console.warn(`[RESTful API]: Unknown field is given to delete data [ ${substitutionString} ].`);
            return {
                code: 400,
                message: HTTP_RESPONSE[400]
            };
        }
        _serviceQuery = _serviceQuery.replaceAll(substitutionString, '?');
        condition.push(body[key]);
    }
    const serviceQuery = _serviceQuery;

    return apiDataHandler.doDelete(serviceRawQuery.model, serviceQuery, condition);
};

export {
    create, read, update, _delete
};