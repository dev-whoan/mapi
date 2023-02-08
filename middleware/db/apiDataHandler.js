import HTTP_RESPONSE from "../../enum/httpResponse.js";
import Logger from "../../logger/index.js";
import DBAccessor from "./accessor.js";

export default class ApiDataHandler{
    constructor(){
        this.dba = new DBAccessor();
        this.logger = new Logger('info', 'ApiDataHandler');
    }

    async doSelect(model, query, condition, paging){
        try{
            let result = await this.dba.select(model, query, condition, paging);
    
            let data = [];
            for(let i = 0; i < result.length; i++){
                data.push(result[i]);
            }
            
            return data;
        } catch (internalError){
            this.logger.error(`[ApiDataHandler]: Fail to call function [doSelect].`);
            this.logger.error(internalError.stack || internalError);
            return {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        }
    }

    async doInsert(model, query, dataList){
        try{
            let result = await this.dba.insert(model, query, dataList);
            if(typeof result === 'object' && ( result.code && result.code === 200 ) ){
                return result;
            }

            if(result.affectedRows){
                let _result = null;
                
                if(result.mongo){
                    _result = {
                        '_next_id_': result.insertedId,
                        'inserted': true
                    };

                    return _result;
                }

                if(result.mariadb){
                    _result = {
                        '_next_id_': Number(result.insertId),
                        'inserted': true
                    };

                    return _result;
                }
            }

            if(result.code === 400){
                return result;
            }

            return {
                code: 204,
                message: HTTP_RESPONSE[204]
            };
        } catch (internalError){
            this.logger.error(`[ApiDataHandler]: Fail to call function [doInsert].`);
            this.logger.error(internalError.stack || internalError);
            return {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        }
    }

    async doModify(model, query, values, condition){
        try{
            let result = await this.dba.update(model, query, values, condition);
            
            if(result){
                if(result.affectedRows){
                    let _result = {
                        '_afftected_rows_': Number(result.affectedRows)
                    };
        
                    return _result;
                }
            }
            
            return result;
        } catch (internalError){
            this.logger.error(`[ApiDataHandler]: Fail to call function [doModify].`);
            this.logger.error(internalError.stack || internalError);
            return {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        }
    }

    async doDelete(model, query, condition){
        try{
            let result = await this.dba.delete(model, query, condition);
        
            if(!result){
                return {
                    code: 200,
                    deletedCount: 0
                };
            }
    
            if(result.affectedRows){
                return {
                    code: 200,
                    deletedCount: Number(result.affectedRows)
                };
            }

            if(result.deletedCount){
                return {
                    code: 200,
                    deletedCount: Number(result.deletedCount)
                }
            }
    
            return {
                code: 200,
                deletedCount: 0
            };
        } catch (internalError){
            this.logger.error(`[ApiDataHandler]: Fail to call function [doDelete].`);
            this.logger.error(internalError.stack || internalError);
            return {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        }
    }
}