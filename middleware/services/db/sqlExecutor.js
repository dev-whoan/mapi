import ConfigReader from "../../../configReader/configReader.js";
import ModelConfigReader from "../../../configReader/modelReader.js";
import ServiceConfigReader from "../../../configReader/serviceReader.js";
import { objectKeysToArray } from "../../../configReader/utils.js";
import API_TYPE from "../../../enum/apiType.js";
import DB_TYPE from "../../../enum/dbType.js";
import HTTP_RESPONSE from "../../../enum/httpResponse.js";
import { SERVICE_CRUD_TYPE, SERVICE_ID, SERVICE_TYPE } from "../../../enum/serviceType.js";
import NoSuchMapiSettingFoundException from "../../../exception/NoSuchMapiSettingFoundException.js";
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

const getServiceRawQuery = (serviceData, type) => {
    switch(type){
        case SERVICE_CRUD_TYPE.READ:
            if(serviceData.read)
                return serviceData.read;
        case SERVICE_CRUD_TYPE.CREATE:
            if(serviceData.create)
                return serviceData.create;
        case SERVICE_CRUD_TYPE.UPDATE:
            if(serviceData.update)
                return serviceData.update;
        case SERVICE_CRUD_TYPE.DELETE:
            if(serviceData.delete)
                return serviceData.delete;
        default:
            throw new NoSuchMapiSettingFoundException(
                `No CRUD is defined at the service [${serviceData.id}]->[${type}]`
            );
    }
}

const getServiceData = (serviceKey) => {
    const serviceConfigInfo = ServiceConfigReader.instance.getConfig(serviceKey);
    if (!serviceConfigInfo) {
        throw new NoSuchMapiSettingFoundException(
            `[sqlExecutor -> getServiceData]: Cannot find service [${serviceKey}].`
        );
    }
    try{
        serviceConfigInfo.updateConfigs();
        return ServiceConfigReader.instance.getConfig(serviceKey).getData();
    } catch (e) {
        throw new NoSuchMapiSettingFoundException(
            `Cannot find service: [${serviceKey}]`
        );
    }
}

const getModelData = (model) => {
    const modelObject = ModelConfigReader.instance.getConfig(model);

    if (!modelObject) {
        throw new NoSuchMapiSettingFoundException(
            `[sqlExecutor -> getModelData]: Cannot find model [${model}]`
        );
    }

    try{
        modelObject.updateConfigs();
        return ModelConfigReader.instance.getConfig(model).getData();
    } catch (e) {
        throw new NoSuchMapiSettingFoundException(
            `Cannot find model: [${model}]`
        );
    }
    
}

const read = async (uri, query, originalUri, apiConfigDataObject, service) => {
    try {
        const apiDataHandler = new ApiDataHandler();
        const serviceKey = `${SERVICE_ID.DB}@${service.id}`
        const serviceData = getServiceData(serviceKey);
        const serviceRawQuery = getServiceRawQuery(serviceData, SERVICE_CRUD_TYPE.READ);
        const modelData = getModelData(serviceRawQuery.model);
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
    } catch (err) {
        throw err;
    }
};

const create = async (uri, body, service) => {
    try{
        const apiDataHandler = new ApiDataHandler();
        const serviceKey = `${SERVICE_ID.DB}@${service.id}`
        const serviceData = getServiceData(serviceKey);
        const serviceRawQuery = getServiceRawQuery(serviceData, SERVICE_CRUD_TYPE.CREATE);
        const modelData = getModelData(serviceRawQuery.model);
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
    } catch (err) {
        throw err;
    }
};

const update = async (uri, query, body, originalUri, apiConfigDataObject, service) => {
    try{
        const apiDataHandler = new ApiDataHandler();
        const getInfo = await read(uri, query, originalUri, apiConfigDataObject, service);
    
        if (getInfo.length === 0) {
            const result = await create(uri, body, service);
    
            return result;
        }
    
        const serviceKey = `${SERVICE_ID.DB}@${service.id}`
        const serviceData = getServiceData(serviceKey);
        const serviceRawQuery = getServiceRawQuery(serviceData, SERVICE_CRUD_TYPE.UPDATE);
        const modelData = getModelData(serviceRawQuery.model);
        
        let _serviceQuery = serviceRawQuery.query.replaceAll('{{ model }}', serviceRawQuery.model);
        let _condition = getConditionFromUri(uri, originalUri);
        if(!_condition){
            console.error(`Cannot find condition from request uri [${uri}]`);
            return {
                code: 400,
                message: HTTP_RESPONSE[400]
            };
        }
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
    
        if (ConfigReader.instance.configInfo.get('general')[API_TYPE.DB].type === DB_TYPE.MONGO) {
            const serviceQuery = _serviceQuery;
    
            return apiDataHandler.doModify(modelData.id, serviceQuery, preparedValues, _condition);
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
    
        return apiDataHandler.doModify(modelData.id, serviceQuery, preparedValues);
    } catch (err) {
        throw err;
    }
};

const _delete = async (uri, body, service) => {
    try{
        const apiDataHandler = new ApiDataHandler();
        const serviceKey = `${SERVICE_ID.DB}@${service.id}`
        const serviceData = getServiceData(serviceKey);
        const serviceRawQuery = getServiceRawQuery(serviceData, SERVICE_CRUD_TYPE.DELETE);
        const modelData = getModelData(serviceRawQuery.model);
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

        return apiDataHandler.doDelete(modelData.id, serviceQuery, condition);
    } catch (err) {
        throw err;
    }
};

export {
    create, read, update, _delete
};