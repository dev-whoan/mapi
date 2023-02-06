import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ApiConfigReader from '../../../configReader/apiReader.js';
import { objectKeysToArray } from '../../../configReader/utils.js';
import { SERVICE_CRUD_TYPE } from '../../../enum/serviceType.js';
import ServiceConfigReader from '../../../configReader/serviceReader.js';
import ModelConfigReader from '../../../configReader/modelReader.js';
import NoSuchMapiSettingFoundException from '../../../exception/NoSuchMapiSettingFoundException.js';
import HTTP_RESPONSE from '../../../enum/httpResponse.js';
import ConfigReader from '../../../configReader/configReader.js';
import API_TYPE from '../../../enum/apiType.js';
import DB_TYPE from '../../../enum/dbType.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const staticHtmlPath = path.join(__dirname);
const staticHtmlFile = path.join(staticHtmlPath, 'index.html');
const staticHtmlText = Buffer.from(fs.readFileSync(staticHtmlFile)).toString('utf-8');
const API_METHOD = {
    'read': "GET",
    'create': "POST",
    'update': "PUT",
    'delete': "DELETE"
};

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

const docsRenderer = (res, req, next, config) => {
    /* {{ API_ID }} */
    const apiId = config.data.uri + '@' + config.data.id;
    const configData = ApiConfigReader.instance.configInfo.get(apiId).getData();

    /* {{ API_AUTH }} */
    const apiAuth = configData.auth === "yes";

    /* {{ API_PATH }} */
    const apiPath = `File: ${configData.filePath.split(process.env.PWD)[1]}`;
    /* {{ API_MODIFIED }} */
    const apiModified = `Modified At: ${new Date(configData.fileModifiedTime).toLocaleString()}`;
    /* {{ API_URI }} */
    const apiUri = configData.uri === '/' ? configData.uri + configData.id
                                          : configData.uri + '/' + configData.id;
    const services = configData.services;
    const serviceKey = objectKeysToArray(services);

    let svc_body = '';
    serviceKey.forEach((item, index) => {
        try{
            const service = services[item];
            const serviceKey = `service-${service.type}@${service.id}`
            const serviceData = getServiceData(serviceKey);
            const modelData = getModelData(serviceData[service.service].model);
            const modelColumns = objectKeysToArray(modelData.columns);
            const paramLabel = service.service === SERVICE_CRUD_TYPE.READ ? `URI Parameter` : `Body Parameter`;
            svc_body += "<div class='one-service'>"
                + "<div class='one-service-metadata'>"
˙
                    + `<p class='one-service-method'>${API_METHOD[service.service]}</p>`
                    + '{{ API_AUTH }} '
                    + `<p class='one-service-type'>${service.type}</p>`
                    + `<p class='one-service-id'>${service.id}</p>`
                    + `<p class='one-service-crud'>${service.service}</p>`
                + "</div>"

                + "<div class='one-service-request-wrapper'>"
                    + `<p class='one-service-request-uri'>URI Segments: <span>${apiUri}{{ URI_SUFFIX }}</span></p>`
                    + "<div class='one-service-request-params table-wrapper'>"
                    + "{{ MODEL_COLUMN }}"
                    + `<p class='one-service-table-label'>${paramLabel}</p>`
                    + "<table class='one-service-table'>"
                        + "<tr class='table-header'>"
                            + "<th class='table-column-field'>Field</th>"
                            + "<th class='table-column-type'>Type</th>"
                        + "</tr>"
                        + "{{ SVC_PARAM }}"
                        /*
                            query 읽어서 body랑 condition 분리하고, draw
                        */
                            /*
                            + "<th class='table-column-field'>{{ columns }}</th>"
                            + "<th class='table-column-field'>{{ typeof Columns }}</th>"
                            */
                    + "</table>"
                    + "</div>"

                    + "<div class='one-service-request-responses table-wrapper'>"
                        + "<p class='one-service-table-label'>Response</p>"
                        + "<table class='one-service-table'>"
                            + "<tr class='table-header'>"
                                + "<th class='table-column-field'>Response Code</th>"
                                + "<th class='table-column-type'>Description</th>"
                            + "</tr>"
                            + "<tr class='table-body'>"
                                + `<th class="table-column-field green">200</th>`
                                + `<th class="table-column-type green">${HTTP_RESPONSE[200]}</th>`
                            + "</tr>";
                    if(service.service === SERVICE_CRUD_TYPE.CREATE || service.serivce === SERVICE_CRUD_TYPE.UPDATE){
                            svc_body += "<tr class='table-body'>"
                                + `<th class="table-column-field green">201</th>`
                                + `<th class="table-column-type green">${HTTP_RESPONSE[201]}</th>`
                            + "</tr>";
                    }
                            svc_body += "<tr class='table-body'>"
                                + `<th class="table-column-field green">204</th>`
                                + `<th class="table-column-type green">${HTTP_RESPONSE[204]}</th>`
                            + "</tr>"
                            + "<tr class='table-body'>"
                                + `<th class="table-column-field red">400</th>`
                                + `<th class="table-column-type red">${HTTP_RESPONSE[400]}</th>`
                            + "</tr>"
                            + "<tr class='table-body'>"
                                + `<th class="table-column-field red">401</th>`
                                + `<th class="table-column-type red">${HTTP_RESPONSE[401]}</th>`
                            + "</tr>"
                            + "<tr class='table-body'>"
                                + `<th class="table-column-field red">403</th>`
                                + `<th class="table-column-type red">${HTTP_RESPONSE[403]}</th>`
                            + "</tr>"
                            + "<tr class='table-body'>"
                                + `<th class="table-column-field red">404</th>`
                                + `<th class="table-column-type red">${HTTP_RESPONSE[404]}</th>`
                            + "</tr>"
                            + "<tr class='table-body'>"
                                + `<th class="table-column-field red">500</th>`
                                + `<th class="table-column-type red">${HTTP_RESPONSE[500]}</th>`
                            + "</tr>"
                        + "</table>"
                    + "</div>"
                + "</div>"
            + "</div>";
            
            let svc_model_column_body = '';
            let svc_model_column_wrapper = "<p class='one-service-table-label'>Model Columns</p>"
            + "<table class='one-service-table'>"
                + "<tr class='table-header'>"
                    + "<th class='table-column-field'>Column</th>"
                    + "<th class='table-column-type'>Type</th>"
                + "</tr>"
                + "{{ svc_model_column_value }}"
                    /*
                    + "<th class='table-column-field'>{{ columns }}</th>"
                    + "<th class='table-column-field'>{{ typeof Columns }}</th>"
                    */
            + "</table>";
            let uriSuffix = '';
            
            modelColumns.forEach((item, index) => {
                const oneColumnName = item;
                const oneColumnType = modelData.columns[item];
                
                svc_model_column_body += "<tr class='table-body'>"
                                    + `<th class='table-column-field'>${oneColumnName}</th>`
                                    + `<th class='table-column-field'>${oneColumnType}</th>`
                                + "</tr>";

                if(service.service === SERVICE_CRUD_TYPE.READ ||
                        (ConfigReader.instance.getConfig()[API_TYPE.DB].type !== DB_TYPE.MARIADB && service.service === SERVICE_CRUD_TYPE.UPDATE)
                ){
                    uriSuffix += `/${oneColumnName}/:${oneColumnName.toLowerCase()}`;
                }
            })

            if(svc_model_column_body !== ''){
                svc_model_column_wrapper = svc_model_column_wrapper.replace('{{ svc_model_column_value }}', svc_model_column_body);
            }

            if(service.service === SERVICE_CRUD_TYPE.UPDATE){
                if(ConfigReader.instance.getConfig()[API_TYPE.DB].type === DB_TYPE.MARIADB){
                    const _query = serviceData[SERVICE_CRUD_TYPE.UPDATE].query;
                    const _conditions = _query.split('{{ condition.');
                    for(let i = 1; i < _conditions.length; i++){
                        const item = _conditions[i];
                        const _key = item.split(" }}")[0];
                        uriSuffix += `/${_key}/:${_key.toLowerCase()}`;
                    }
                }
            }

            svc_body = svc_body.replace('{{ MODEL_COLUMN }}', svc_model_column_body !== '' ? svc_model_column_wrapper : svc_model_column_body)
                                .replace('{{ URI_SUFFIX }}', uriSuffix);

            svc_body += "<hr />";
        } catch (e) {
            console.error(e);
            return false;
        }
    });

    let htmlText = staticHtmlText.replaceAll('{{ API_ID }}', `Api ID: ${apiId}`)
                                .replaceAll('{{ API_PATH }}', apiPath)
                                .replaceAll('{{ API_MODIFIED }}', apiModified)
                                .replaceAll('{{ SVC_BODY }}', svc_body);
    
    htmlText = htmlText.replaceAll('{{ API_AUTH }}', apiAuth ? 'AUTH' : '');
    
    return res.send(htmlText);
}

export {
    docsRenderer
}