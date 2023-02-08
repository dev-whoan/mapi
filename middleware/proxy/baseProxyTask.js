import { getUTCTime } from '../../configReader/utils.js';
import Logger from '../../logger/index.js';
import JwtHandler from '../auth/jwtHandler.js';

const logger = new Logger('info', 'proxy-task');
const startLogProxy = (taskName) =>{
    let now = getUTCTime();    
    logger.info(`===============================`);
    logger.info(`Task: ${taskName} have started`);
    logger.info(now);
    logger.info(`===============================`);
};

const endLogProxy = (taskName) => {
    let now = getUTCTime();    
    logger.info(`===============================`);
    logger.info(`Task: ${taskName} have finished`);
    logger.info(now);
    logger.info(`===============================`);
};

const authorizeProxy = (taskName, req) => {
    let headers = req.headers;
    logger.info(`***************`);
    logger.info(`Task: ${taskName} have started`);
    logger.info(getUTCTime());
    logger.info(`***************`);
    if(!headers){
        logger.info(`Authentication failed:: No header is given.`);
        return false;
    }
    let authorization = headers.authorization;

    if(!authorization){
        logger.info(`Authentication failed::[Token]-${req.headers.authorization}`);
        return false;
    }

    let jwtToken = authorization.split(" ")[1];
    let jwtHandler = new JwtHandler();
    logger.info(`***************`);
    logger.info(`Task: ${taskName} have finished`);
    logger.info(getUTCTime());
    logger.info(`***************`);
    return jwtHandler.verify(jwtToken);
};


export {
    startLogProxy, endLogProxy, authorizeProxy
};