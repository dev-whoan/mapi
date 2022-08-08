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

const authorizeProxy = (taskName, authorization) => {
    console.log(`***************`);
    console.log(`Task: ${taskName} have started`);
    console.log(getUTCTime());
    console.log(`***************`);
    if(!authorization){
        return res.status(403).json({
            success: false,
            message: 'Authentication failed'
        });
    }

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