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

//API 처리를 위한 HTTP URI 설정
apiConfigReader.setRouter(app);

let dba = new DBAccessor();

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
