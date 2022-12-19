import configReader from '../../core/configReader.js';
import MysqlAccessor from './mysql/index.js';
import MongoAccessor from './mongo/index.js';
import unknownDatabaseAccessorException from '../../exception/unknownDatabaseAccessorException.js';
import DB_TYPE from '../../core/enum/dbType.js';

export default class DBAccessor {
    constructor(){
        this.type = configReader.instance.getConfig().database.type;
        switch(this.type){
            case DB_TYPE.MYSQL:
                this.operator = new MysqlAccessor();
                break;
            case DB_TYPE.MONGO:
                this.operator = new MongoAccessor();
                break;
            default:
                this.operator = null;
                throw new UnknownDatabaseAccessorException(
                    `Unknown Database Accessor was requested to be set.[${type}]`
                );
        }
    }

    async setAutoIncrement(table){
        return this.operator.setAutoIncrement(table);
    }

    async initTest(){
        return this.operator.initTest();
    }

    async jwtAuthorize(table, keyColumns, selectColumns, body){
        return this.operator.jwtAuthorize(table, keyColumns, selectColumns, body);
    }

    async select(table, columnList, condition, paging){
        return this.operator.select(table, columnList, condition, paging)
    }

    async update(table, columnList, dataList, condition, modelObject, queryOption){
        return this.operator.update(table, columnList, dataList, condition, modelObject, queryOption)
    }

    async insert(table, columnList, dataList, modelObject){
        return this.operator.insert(table, columnList, dataList, modelObject);
    }

    async delete(table, condition){
        return this.operator.delete(table, condition);
    }
}