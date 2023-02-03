import HTTP_RESPONSE from "../../enum/httpResponse.js";
import DBAccessor from "./accessor.js";

export default class ApiDataHandler{
    constructor(){
        this.dba = new DBAccessor();
    }

    async doSelect(model, query, condition, paging){
        let result = await this.dba.select(model, query, condition, paging);
    
        let data = [];
        for(let i = 0; i < result.length; i++){
            data.push(result[i]);
        }
        
        return data;
    }

    async doInsert(model, query, dataList){
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

        return {
            code: 204,
            message: HTTP_RESPONSE[204]
        };
    }

    async doModify(model, query, preparedValues){
        let result = await this.dba.update(model, query, preparedValues);
        
        if(result){
            if(result.affectedRows){
                let _result = {
                    '_afftected_rows_': Number(result.affectedRows)
                };
    
                return _result;
            }
        }
        
        return result;
    }

    async doDelete(model, query, condition){
        let result = await this.dba.delete(model, query, condition);
        
        if(!result){
            return {
                deleted: 0
            };
        }

        if(result.affectedRows){
            return {
                deleted: Number(result.affectedRows)
            };
        }

        return {
            deleted: 0
        };
    }
}