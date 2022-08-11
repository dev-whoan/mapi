import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';

//import homeRouter from './routes/home/index.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('port', process.env.HOST_PORT);
app.set('host', process.env.HOST_NAME);

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname)));

app.use(express.urlencoded({extended: true}));
app.use(express.json());

// homeRouter 연결
// app.use('/', homeRouter);

// app.use('/img', express.static(path.join(__dirname, 'public', 'img')));


let apiConfigReader = new ApiConfigReader();
let modelConfigReader = new ModelConfigReader();
let baseConfigReader = new ConfigReader();
let jwtObject = baseConfigReader.getConfig().jwt;

baseConfigReader.setConfigReaders();

baseConfigReader.printConfigs();
modelConfigReader.printConfigs();
apiConfigReader.printConfigs();


let proxyWorker = new ProxyWorker(
    ["start", "end"],
    `Job Name`,
    apiConfigReader.modelCheck,
    [],
    1
);

proxyWorker.doTask();

console.log(jwtObject);

//API 처리를 위한 HTTP URI 설정
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

if(jwtObject.use){
    app.post(jwtObject['generate-uri'], async (req, res) => {
        let body = req.body;
        console.log(body);
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
	res.status(404).send("<h1>ERROR - 페이지를 찾을 수 없습니다.</h1>");
});

export default app
