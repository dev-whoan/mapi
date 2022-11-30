import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

var app = express();

import { fileURLToPath } from 'url';
import ApiConfigReader from './core/apiReader.js';
import ConfigReader from './core/configReader.js';
import ModelConfigReader from './core/modelReader.js';
import DBAccessor from './middleware/db/accessor.js';
import { exit } from 'process';
import ProxyWorker from './middleware/proxy/worker.js';
import HTTP_RESPONSE from './core/enum/httpResponse.js';
import e from 'express';
import JwtHandler from './middleware/auth/jwtHandler.js';
//import FileTransferConfigReader from './core/fileTransferReader.js';
import API_TYPE from './core/enum/apiType.js';
import NullOrUndefinedException from './exception/nullOrUndefinedException.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('port', process.env.HOST_PORT);
app.set('host', process.env.HOST_NAME);

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname)));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

let apiConfigReader = new ApiConfigReader();
let modelConfigReader = new ModelConfigReader();
let baseConfigReader = new ConfigReader();
let jwtObject = baseConfigReader.getConfig().jwt;

baseConfigReader.setConfigReaders();

baseConfigReader.printConfigs();
modelConfigReader.printConfigs();
apiConfigReader.printConfigs();

let proxyWorker = new ProxyWorker(
    false,
    ["start", "end"],
    `Rest API Model Check`,
    apiConfigReader.modelCheck,
    [],
    1
);

await proxyWorker.doTask();

const corsList = baseConfigReader.getConfig()[API_TYPE.CORS]
if(!corsList.origin || !corsList.default || !corsList.methods || !corsList['allow-headers']){
    throw new NullOrUndefinedException(
        `Cannot find CORS setting in default.json. ${corsList}:: origin, default, methods, allow-headers must be defined.`
    );
}

if(corsList.origin.length === 1){
    if(corsList.origin[0] !== '*' && !corsList.origin.includes(corsList.default)){
        corsList.origin.push(corsList.default);
    }
}

app.all('*', function(req, res, next) {
    let origin;
    
    try{
        origin = corsList.origin.includes(req.headers.origin.toLowerCase()) ? req.headers.origin : corsList.default;
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


//API 처리를 위한 HTTP Router 설정
apiConfigReader.setRouter(app);


let dba = new DBAccessor();

/* Initialize Check */
let dbaInit = await dba.initTest();
if(dbaInit != 0){
    process.exit(dbaInit);
}
/* Initialize Check */
/*
dba.insert('test', ['name', 'age'], ['insert-test', '6']);
dba.select('test');
dba.delete('test2', {
    'title': 31
});
*/

if(jwtObject.use === "yes"){
    app.post(jwtObject['generate-uri'], async (req, res) => {
        let body = req.body;
        let result = await dba.jwtAuthorize(
            jwtObject['auth-table'],
            jwtObject['auth-columns'],
            jwtObject['columns'],
            body
        );

        if(result.length == 0){
            return res.status(401).json({
                code: 401,
                message: HTTP_RESPONSE[401]
            });
        }
        
        let _data = result[0];
        let jwtHandler = new JwtHandler();
        jwtHandler.setPayload(_data);
        jwtHandler.generateSignature();
        let _token = jwtHandler.getJwtString();
        let msg = {
            code: 200,
            success: true,
            token: _token
        };
        if(!_token){
            msg = {
                code: 500,
                success: false
            };
        };

        return res.status(msg.code).json(msg);
    });

    app.post(jwtObject['verify-uri'], async (req, res) => {
        let token = req.headers.authorization;
        if(!token){
            return res.status(403).json({
                success: false,
                message: 'Authentication failed'
            });
        }

        let jwtToken = token.split(" ")[1];
        let jwtHandler = new JwtHandler();
        let verifyResult = jwtHandler.verify(jwtToken);

        if(!verifyResult){
            return res.status(403).send();
        }
        
        return res.status(200).json({
            code: 200,
            success: true,
            message: 'Token is valid'
        });
    });
}

app.all('*', (req, res) => {
    const _cip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(`${_cip} requested unkonwn page [${req.url}]`);
	return res.status(404).json({code: 404, message: '404 Not Found'});
});

export default app