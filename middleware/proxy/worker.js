import NoProxyOriginTaskDefinedException from "../../exception/NoProxyOriginTaskDefinedException.js";
import OutofProxyTaskIndexException from "../../exception/OutofProxyTaskIndexException.js";
import { startLogProxy, endLogProxy, authorizeProxy } from './baseProxyTask.js';

const prefixJob = [
    'start', 'end', 'authorize'
];

export default class ProxyWorker{
    constructor(auth, proxyList, taskName, originTask, originParams, originTaskOrder){
        this.checkValidity(proxyList, taskName, originTask, originTaskOrder);
        this.auth = auth;
        this.proxyList = [...proxyList];
        
        this.proxyList.splice(originTaskOrder, 0, originTask);

        this.taskName = taskName;
        this.originTask = originTask; 
        this.originParams = [...originParams];
        this.originTaskOrder = originTaskOrder;
    }

    checkValidity(proxyList, taskName, originTask, originTaskOrder){
        if(!originTask){
            throw new NoProxyOriginTaskDefinedException(
                `No origin task function defined for proxy ${taskName}.`
            );
        }

        if(originTaskOrder < 0 || originTaskOrder > proxyList.length){
            throw new OutofProxyTaskIndexException(
                `Out of proxy task index ${originTaskOrder} of ${proxyList.length}:: ${taskName}`
            );
        }
    }

    async doTask(req, res){
        let startJob = (this.proxyList.indexOf('start') !== -1);
        let endJob = (this.proxyList.indexOf('end') !== -1);
        let jobIndex = 0;
        let __result = null;
        //start, auth, end
        //originTaskOrder = 2

        if(startJob){
            startLogProxy(this.taskName);
        }

        if(this.auth === true){
            let _authresult = authorizeProxy('authorize', req);
            if(!_authresult){
                if(endJob){
                    endLogProxy(this.taskName);
                }
                return {
                    code: 403,
                    success: false,
                    message: 'Authentication Failed'
                };
            }
        }

        // Authorize, Origin Task 등 특화된 파라미터 어떻게 전달?
        while(jobIndex < this.proxyList.length){
            if(startJob && jobIndex == this.proxyList.indexOf('start')){
                jobIndex++;
                continue;
            }

            if(jobIndex == this.proxyList.indexOf('auth')){
                jobIndex++;
            }

            /*
            if(jobIndex == this.proxyList.indexOf('auth')){
                jobIndex++;
                let _authresult = authorizeProxy('authorize', req);
                if(!_authresult){
                    if(endJob){
                        endLogProxy(this.taskName);
                    }
                    return {
                        code: 403,
                        success: false,
                        message: 'Authentication Failed'
                    };
                }
            }
            */

            if(endJob && jobIndex == this.proxyList.indexOf('end')){
                jobIndex++;
                continue;
            }
            if(typeof this.proxyList[jobIndex] === 'function' && this.proxyList[jobIndex] === this.originTask){
                __result = await this.originTask.call(this, ...this.originParams);
                jobIndex++;
                continue;
            }

            jobIndex++;
        }

        if(endJob){
            endLogProxy(this.taskName);
        }

        if(jobIndex < this.proxyList.length){
            console.warn("Although all the proxy job have finished, there are still some proxy task list is remained. The remain tasks will be skipped.");
        }

        return __result;
    }
}