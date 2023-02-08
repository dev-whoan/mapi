import ConfigReader from '../../../configReader/configReader.js';
import mariadb from "mariadb";
import InvalidSqlInsertExecuteException from '../../../exception/InvalidSqlInsertExecuteException.js';
import HTTP_RESPONSE from '../../../enum/httpResponse.js';
import { objectValuesToArray } from '../../../configReader/utils.js';
import PROCESS_EXIT_CODE from '../../../enum/processExitCode.js';
import NullOrUndefinedException from '../../../exception/nullOrUndefinedException.js';
import AutoIncrementUndefinedException from '../../../exception/autoIncrementUndefinedException.js';
import Logger from '../../../logger/index.js';

const baseConfigReader = new ConfigReader();
const dbInfo = baseConfigReader.configInfo.get('general').database;

export default class MariaDBAccessor{
    constructor(){
        this.logger = new Logger('info', 'MariaDBAccessor.js');
    }

    async initTest(){
        let conn = null;
        const pool = this.setPool();
        try{
            conn = await pool.getConnection();
            const result = await conn.query("SELECT 1");
            this.logger.info("MariaDB Initialize Test Passed !");
        } catch (e) {
            this.logger.error(`Fail to connect database:: [${dbInfo.user}]@${dbInfo.host}:${dbInfo.port}`);
            this.logger.error(e.message);
            if(e.message.toString().includes("retrieve connection from pool timeout after")){
                this.logger.error("Fail to connect to the Database. Please check [/app/configs/controller/default.json]");
                return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
            }

            if(e.message.toString().includes("Access denied")){
                this.logger.error("Fail to connect to the Database. (Access Denied)");
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

        const pool = this.setPool();
        let conn = await pool.getConnection();
        let result = null;
        try{
            result = await conn.query(`SELECT ${_columns} FROM ${table} WHERE ${cond}`, _value);
        } catch (sqlError) {
            this.logger.error(`[MariaDB]: Fail to select data.`);
            this.logger.error(sqlError.stack || sqlError);
            result = {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        } finally {
            conn.close();
            conn.end();

            return result;
        }
    }

    async select(table, query, condition, queryOption){
        let cond = (condition ? '' : null);
        let paginationOffset = null;
        
        let i = 0;
        if(condition){
            const _leng = Object.keys(condition).length;
            for(let key in condition){
                cond += `${key} = ? `;
                if(i++ < _leng - 1){
                    cond += ' AND ';
                }
            }
        }

        if(queryOption){
            if(queryOption['pagination-value']){
                if(!condition)  condition = {};
                condition[queryOption['pagination-column']] = (queryOption['pagination-value']-1) * queryOption.count;
                paginationOffset = (queryOption['pagination-value']-1) * queryOption.count;
            }    
        }
        
        let result = null;
        const pool = this.setPool();
        const conn = await pool.getConnection();
        let __query = cond ? `${query} WHERE ${cond} LIMIT ${queryOption.count}`
                           : `${query} LIMIT ${queryOption.count}`;

        if(paginationOffset){
            __query = `${__query} OFFSET ?`;
        }

        try{
            if(cond || paginationOffset)
                result = await conn.query(__query, objectValuesToArray(condition));
            else
                result = await conn.query(__query);
        } catch (sqlError) {
            this.logger.error(`[MariaDB]: Fail to select data.`);
            this.logger.error(`Query: `, __query);
            this.logger.error(sqlError.stack || sqlError);
            result = {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        } finally {
            conn.close();
            conn.end();
            return result;
        }
    }

    async update(table, query, values){
        const pool = this.setPool();
        const conn = await pool.getConnection();

        let result = null;
        try{
            result = await conn.query(query, values);
        } catch (sqlError) {
            this.logger.error(`[MariaDB]: Fail to update data.`);
            this.logger.error(`Query: `, query);
            this.logger.error(sqlError.stack || sqlError);
            return {
                code: 500,
                message: HTTP_RESPONSE[500]
            };
        } finally {
            conn.close();
            conn.end();
        }

        return result;
    }

    // currently single insert
    async insert(model, query, dataList){
        const pool = this.setPool();
        const conn = await pool.getConnection();

        let result = null;

        try{
            result = await conn.query(query, dataList);
            result.mariadb = true;
        } catch (e) {
            if(e.message.toString().includes('Duplicate entry')){
                this.logger.warn("[MariaDB]: Data duplicated: ", query, dataList);
                return {
                    code: 200,
                    message: HTTP_RESPONSE[200]
                };
            }
            
            this.logger.error(`[MariaDB]: Fail to insert data.`);
            this.logger.error(`Query: `, query, dataList);
            this.logger.error(e.stack || e);
            return {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        } finally {
            conn.close();
            conn.end();
        }

        return result;
    }

    async delete(table, query, condition){
        const pool = this.setPool();
        const conn = await pool.getConnection();
        let result = null;
        try{
            result = await conn.query(query, condition);
        } catch (sqlError) {
            this.logger.error(`[MariaDB]: Fail to delete data.`);
            this.logger.error(`Query: `, query, condition);
            this.logger.error(e.stack || e);
            return {
                code: 500,
                message: HTTP_RESPONSE[500]
            }
        } finally {
            conn.close();
            conn.end();
        }

        return result;
    }

    setPool() {
        const pool = mariadb.createPool({
            host: dbInfo.host,
            port: dbInfo.port,
            user: dbInfo.id,
            password: dbInfo.pw,
            connectionLimit: 5,
            database: dbInfo.scheme
        });

        return pool;
    }
}