import { getUTCTime } from '../../core/utils.js';
import JwtHandler from '../auth/jwtHandler.js';

const startLogProxy = (taskName) =>{
    let now = getUTCTime();    
    console.log(`===============================`);
    console.log(`Task: ${taskName} have started`);
    console.log(now);
    console.log(`===============================`);
};

const endLogProxy = (taskName) => {
    let now = getUTCTime();    
    console.log(`===============================`);
    console.log(`Task: ${taskName} have finished`);
    console.log(now);
    console.log(`===============================`);
};

const authorizeProxy = (taskName, req) => {
    let headers = req.headers;
    console.log(`***************`);
    console.log(`Task: ${taskName} have started`);
    console.log(getUTCTime());
    console.log(`***************`);
    if(!headers){
        console.log(`Authentication failed:: No header is given.`);
        return false;
    }
    let authorization = headers.authorization;

    if(!authorization){
        console.log(`Authentication failed::[Token]-${req.headers.authorization}`);
        return false;
    }
/*
    let failMessage = {
        code: 403,
        success: false,
        message: 'Authentication Failed'
    }
    let result = null;
    if( !req.headers.authorization || 
        !authorizeProxy('authorize', req.headers.authorization)
    ){
        console.log(`authorization failed:: ${req.headers.authorization}`);
        if(endJob){
            endLogProxy(this.taskName);
        }
        return failMessage;
    }
*/
    let jwtToken = authorization.split(" ")[1];
    let jwtHandler = new JwtHandler();
    console.log(`***************`);
    console.log(`Task: ${taskName} have finished`);
    console.log(getUTCTime());
    console.log(`***************`);
    return jwtHandler.verify(jwtToken);
};


export {
    startLogProxy, endLogProxy, authorizeProxy
};