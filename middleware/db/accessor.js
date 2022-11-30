import ConfigReader from '../../core/configReader.js';
import mariadb from "mariadb";
import InvalidSqlInsertExecuteException from '../../exception/InvalidSqlInsertExecuteException.js';
import HTTP_RESPONSE from '../../core/enum/httpResponse.js';
import { objectKeysToArray, objectValuesToArray } from '../../core/utils.js';
import PROCESS_EXIT_CODE from '../../core/enum/processExitCode.js';
import NullOrUndefinedException from '../../exception/nullOrUndefinedException.js';

const baseConfigReader = new ConfigReader();
const dbInfo = baseConfigReader.configInfo.get('general').database;

const pool = mariadb.createPool({
    host: dbInfo.host,
    port: dbInfo.port,
    user: dbInfo.id,
    password: dbInfo.pw,
    connectionLimit: 5,
    database: dbInfo.scheme
});

export default class DBAccessor{
    constructor(){
        
    }

    async initTest(){
        let conn = null;
        try{
            conn = await pool.getConnection();
            const result = await conn.query("SELECT 1");
            console.log("Initialize Test Passed !");
        } catch (e) {
            console.log(`Fail to connect database:: [${dbInfo.user}]@${dbInfo.host}:${dbInfo.port}`);
            console.log(e.message);
            if(e.message.toString().includes("retrieve connection from pool timeout after")){
                console.error("Fail to connect to the Database. Please check [/app/configs/controller/default.json]");
                return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
            }

            if(e.message.toString().includes("Access denied")){
                console.error("Fail to connect to the Database. (Access Denied)");
                return PROCESS_EXIT_CODE.DB_ACCESS_DENIED;
            }
        } finally {
            if(conn != null){
                conn.close();
                conn.end();
            }
        }
        return 0;
    }
    
    async jwtAuthorize(table, keyColumns, selectColumns, body){
        if(!table || !keyColumns){
            throw new NullOrUndefinedException(
                `Table(${table}) or Key Columns(${keyColumns}) is Null.`
            );
        }
        if(!body){
            throw new NullOrUndefinedException(
                `Body parameter(${body}) for JWTAuthorize is Null.`
            );
        }
        let cond = '';
        // size: 5
        let _value = [];
        for(let i = 0; i < keyColumns.length; i++){
            cond += `${keyColumns[i]} = ?`
            _value.push(body[keyColumns[i]]);
            if(i < keyColumns.length -1){
                cond += ' AND ';
            }
        }
        let _columns = '';
        for(let i = 0; i < selectColumns.length; i++){
            _columns += `${selectColumns[i]}`;
            if(i < selectColumns.length -1) {
                _columns += ', ';
            }
        }
    
        console.log(cond);
        console.log(_value);
        let conn = await pool.getConnection();
        let result = await conn.query(`SELECT ${_columns} FROM ${table} WHERE ${cond}`, _value);
        conn.close();
        conn.end();

        return result;
    }

    async select(table, columnList, condition){
        let cond = (condition ? '' : null);
        let conn = await pool.getConnection();

        let i = 0;
        for(let key in condition){
            cond += `${key} = ?`;
            if(i++ < condition.length - 1){
                cond += ' AND ';
            }
        }

        if(!columnList){
            throw new NullOrUndefinedException(
                `Column should be specified in [Model] for REST API`
            );
        }

        let result = null;
        if(cond)
            result = await conn.query(`SELECT ${columnList} FROM ${table} WHERE ${cond}`, objectValuesToArray(condition));
        else
            result = await conn.query(`SELECT ${columnList} FROM ${table}`);

        conn.close();
        conn.end();
        
        return result;
    }

    async update(table, columnList, dataList, condition){
        let getResult = await this.select(table, null, condition);
        if(getResult.length != 1){
            if(getResult.length > 1){
                return {
                    code: 600
                }
            } 

            return this.insert(table, columnList, dataList);
        }
        
        if(!columnList || !dataList || (columnList.length != dataList.length)){
            throw new InvalidSqlInsertExecuteException(
                `ColumnList(${columnList}) or DataList(${dataList}) is null. Or size of ColumnList and DataList are not match.`
            );
        }

        let values = '';
        for(let i = 0; i < columnList.length; i++){
            values += columnList[i] + '=?';
            if(i < columnList.length - 1){
                values += ', ';
            }
        }

        let cond = (condition ? '' : null);
        let i = 0;
        for(let key in condition){
            cond += `${key} = ?`;
            if(i++ < condition.length - 1){
                cond += ' AND ';
            }
        }

        let conn = await pool.getConnection();

        let _query = `UPDATE ${table} SET ${values} WHERE ${cond}`;
        let result = await conn.query(_query, dataList.concat(objectValuesToArray(condition)));

        return result;
    }

    // currently single insert
    async insert(table, columnList, dataList){
        if(!columnList || !dataList || (columnList.length != dataList.length)){
            throw new InvalidSqlInsertExecuteException(
                `ColumnList ${columnList} or DataList ${dataList} is null || Size of ColumnList and DataList are not match.`
            );
        }
        let conn = await pool.getConnection();
        let result = null;
        let _columnList = '';
        let _dataQuestionMark = '';

        for(let i = 0; i < columnList.length; i++){
            _columnList += columnList[i];
            _dataQuestionMark += '?'

            if(i < columnList.length -1){
                _columnList += ', ';
                _dataQuestionMark += ', ';
            }
        }

        let query = `INSERT INTO ${table} (${_columnList}) VALUES (${_dataQuestionMark})`;
        try{
            result = await conn.query(query, dataList);
        } catch (e) {
            if(e.message.toString().includes('Duplicate entry')){
                return {
                    code: 200,
                    message: HTTP_RESPONSE[200]
                };
            }
        } finally {
            conn.close();
            conn.end();
        }

        return result;
    }

    async delete(table, condition){
        let cond = '';
        let conn = await pool.getConnection();
        
        let i = 0;
        for(let key in condition){
            cond += `${key} = ?`;
            if(i++ < condition.length - 1){
                cond += ' AND ';
            }
        }

        let result = null;
        try{
            result = await conn.query(`DELETE FROM ${table} WHERE ${cond}`, objectValuesToArray(condition));
        } catch (e) {
            if(e.message.toString().includes('Unknown column')){
                return {
                    code: 204,
                    message: HTTP_RESPONSE[204]
                }
            }
        } finally {
            conn.close();
            conn.end();
        }
        
        conn.close();
        conn.end();
        
        return result;
    }
}