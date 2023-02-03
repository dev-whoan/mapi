import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

var app = express();

import { fileURLToPath } from 'url';
import ApiConfigReader from './configReader/apiReader.js';
import FileTransferConfigReader from './configReader/filetransferReader.js';
import ConfigReader from './configReader/configReader.js';
import ModelConfigReader from './configReader/modelReader.js';

import DBAccessor from './middleware/db/accessor.js';
import ProxyWorker from './middleware/proxy/worker.js';
import API_TYPE from './enum/apiType.js';
import NullOrUndefinedException from './exception/nullOrUndefinedException.js';

/* Http Request Handler */
import { RestApiHttpRequestHandler, FileTransferHttpRequestHandler, JsonWebTokenHttpRequestHandler } from './middleware/http/index.js';
import ServiceConfigReader from './configReader/serviceReader.js';
/* Http Request Handler */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('port', process.env.HOST_PORT);
app.set('host', process.env.HOST_NAME);
app.set('json spaces', 4);

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname)));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

/* Default */
const baseConfigReader = new ConfigReader();
baseConfigReader.printConfigs();
/* Default */

/* CORS */
const corsList = baseConfigReader.getConfig()[API_TYPE.CORS]
if(!corsList.origin || !corsList.default || !corsList.methods || !corsList['allow-headers']){
    throw new NullOrUndefinedException(
        `Cannot find CORS setting in default.json. ${corsList}:: origin, default, methods, allow-headers must be defined.`
    );
}

if(corsList.origin.length === 1){
    if(corsList.origin[0] !== '*' && !corsList.origin.includes(corsList.default)
    ){
        corsList.origin.push(corsList.default);
    }
}

app.all('*', function(req, res, next) {
    let origin;

    try{
        if(corsList.origin.length === 1 && corsList.origin[0] === '*'){
            origin = req.headers.origin;
        } else {
            origin = corsList.origin.includes(req.headers.origin.toLowerCase())
                ? req.headers.origin
                : corsList.default;
        }
    } catch (e) {
        origin = corsList.default;
    }

    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", corsList.methods);
    res.header("Access-Control-Allow-Headers", corsList['allow-headers']);

    if(req.method === 'OPTIONS'){
        return res.status(200).send();
    }

    next();
});
/* CORS */

/* Model */
const modelConfigReader = new ModelConfigReader();
modelConfigReader.printConfigs();

let dba = new DBAccessor();

/* Initialize Check */
let dbaInit = await dba.initTest();
if(dbaInit != 0){
    process.exit(dbaInit);
}
/* Model */

/* Service */
const serviceConfigReader = new ServiceConfigReader();
serviceConfigReader.printConfigs();
/* Service */

/* Rest Api */
if(baseConfigReader.getConfig()[API_TYPE.REST].use && baseConfigReader.getConfig()[API_TYPE.REST].use === 'yes'){
    const apiConfigReader = new ApiConfigReader();
    apiConfigReader.printConfigs();
    baseConfigReader.setConfigReaders();

    /*
    let proxyWorker = new ProxyWorker(
        false,
        ["start", "end"],
        `Rest API Model Check`,
        apiConfigReader.modelCheck,
        [],
        1
    );

    await proxyWorker.doTask();
    */

    const restApiHttpRequestHandler = new RestApiHttpRequestHandler(app);
    restApiHttpRequestHandler.setRouter(apiConfigReader.configInfo);
}
/* Rest Api */

/* File Transfer */
if(baseConfigReader.getConfig()[API_TYPE.FILE_TRANSFER].use && baseConfigReader.getConfig()[API_TYPE.FILE_TRANSFER].use === 'yes'){
    const filetransferConfigReader = new FileTransferConfigReader();
    filetransferConfigReader.printConfigs();

    /*
    let proxyWorker = new ProxyWorker(
        false,
        ["start", "end"],
        `File Transfer Model Check`,
        filetransferConfigReader.modelCheck,
        [],
        1
    );

    await proxyWorker.doTask();
    */

    const fileTransferHttpRequestHandler = new FileTransferHttpRequestHandler(app);
    fileTransferHttpRequestHandler.setRouter(filetransferConfigReader.configInfo);
}
/* File Transfer */

/* JWT */
if(baseConfigReader.getConfig()[API_TYPE.JWT].use && baseConfigReader.getConfig()[API_TYPE.JWT].use === 'yes'){
    const jwtObject = baseConfigReader.getConfig().jwt;
    const jwtHttpRequestHandler = new JsonWebTokenHttpRequestHandler(app);
    jwtHttpRequestHandler.setRouter(jwtObject);
}
/* JWT */

app.all('*', (req, res) => {
    const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`${_cip} requested unkonwn page [${req.url}]`);
	return res.status(404).json({code: 404, message: '404 Not Found'});
});

export default app