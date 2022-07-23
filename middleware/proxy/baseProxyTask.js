import { getUTCTime } from '../../core/utils.js';

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

const authorizeProxy = (taskName, requestInfo) => {

};


export {
    startLogProxy, endLogProxy, authorizeProxy
};