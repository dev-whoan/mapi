import configReader from '../../configReader/configReader.js';
import MariaDBAccessor from './mariadb/index.js';
import MongoAccessor from './mongo/index.js';
import DB_TYPE from '../../enum/dbType.js';
import UnknownDatabaseAccessorException from '../../exception/unknownDatabaseAccessorException.js';
import FirestoreAccessor from './firestore/index.js';

export default class DBAccessor {
    constructor(){
        this.type = configReader.instance.getConfig().database.type;
        switch(this.type){
            case DB_TYPE.MARIADB:
                this.operator = new MariaDBAccessor();
                break;
            case DB_TYPE.MONGO:
                this.operator = new MongoAccessor();
                break;
            case DB_TYPE.FIRESTORE:
                this.operator = new FirestoreAccessor();
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

    async select(model, query, condition, paging){
        return this.operator.select(model, query, condition, paging)
    }

    async update(model, query, values, condition){
        return this.operator.update(model, query, values, condition)
    }

    async insert(model, query, preparedValues){
        return this.operator.insert(model, query, preparedValues);
    }

    async delete(model, query, condition){
        return this.operator.delete(model, query, condition);
    }
}