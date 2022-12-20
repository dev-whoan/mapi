import HTTP_RESPONSE from "../../core/enum/httpResponse.js";
import DBAccessor from "./accessor.js";

export default class ApiDataHandler{
    constructor(){
        this.dba = new DBAccessor();
    }

    async doSelect(table, columnList, condition, paging){
        let result = await this.dba.select(table, columnList, condition, paging);
    
        let data = [];
        for(let i = 0; i < result.length; i++){
            data.push(result[i]);
        }
        
        return data;
    }

    async doInsert(table, columnList, dataList, modelObject){
        let result = await this.dba.insert(table, columnList, dataList, modelObject);
        if(typeof result === 'object' && ( result.code && result.code === 200 ) ){
            return result;
        }

        if(result.affectedRows){
            let _result = null;
            
            if(result.mongo){
                _result = {
                    '_next_id_': result.insertedId
                };

                return _result;
            }

            if(result.mysql){
                _result = {
                    '_next_id_': Number(result.insertId)
                };

                return _result;
            }
        }

        return {
            code: 204,
            message: HTTP_RESPONSE[204]
        };
    }

    async doModify(table, columnList, dataList, condition, modelObject, queryOption){
        let result = await this.dba.update(table, columnList, dataList, condition, modelObject, queryOption);
        
        if(result.affectedRows){
            let _result = {
                '_afftected_rows_': Number(result.affectedRows)
            };

            return _result;
        }

        return result;
    }

    async doDelete(table, condition){
        let result = await this.dba.delete(table, condition);
        
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