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

app.all('*', function(req, res){
	res.status(404).send("<h1>ERROR - 페이지를 찾을 수 없습니다.</h1>");
});

export default app
