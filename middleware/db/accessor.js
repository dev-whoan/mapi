import configReader from '../../core/configReader.js';
import MysqlAccessor from './mysql/index.js';
import MongoAccessor from './mongo/index.js';
import unknownDatabaseAccessorException from '../../exception/unknownDatabaseAccessorException.js';
import DB_TYPE from '../../core/enum/dbType.js';

export default class DBAccessor {
    constructor(){
        this.dbType = configReader.instance.getConfig().database.type;
        switch(this.dbType){
            case DB_TYPE.MYSQL:
                this.operator = new MysqlAccessor();
                break;
            case DB_TYPE.MONGO:
                this.operator = new MongoAccessor();
                break;
            default:
                this.operator = null;
                throw new UnknownDatabaseAccessorException(
                    `Unknown Database Accessor was requested to be set.[${dbType}]`
                );
        }
    }

    async initTest(){
        return this.operator.initTest();
    }

    async jwtAuthorize(table, keyColumns, selectColumns, body){
        return this.operator.jwtAuthorize(table, keyColumns, selectColumns, body);
    }

    async select(table, columnList, condition){
        return this.operator.select(table, columnList, condition)
    }

    async update(table, columnList, dataList, condition, modelObject){
        return this.operator.update(table, columnList, dataList, condition, modelObject)
    }

    async insert(table, columnList, dataList, modelObject){
        return this.operator.insert(table, columnList, dataList, modelObject);
    }

    async delete(table, condition){
        return this.operator.delete(table, condition);
    }
}