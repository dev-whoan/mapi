import configReader from '../../core/configReader.js';
import MysqlAccessor from './mysql/index.js';
import MongoAccessor from './mongo/index.js';
import unknownDatabaseAccessorException from '../../exception/unknownDatabaseAccessorException.js';
import DB_TYPE from '../../core/enum/dbType.js';
import FirebaseAccessor from './firebase/index.js';
import FirestoreAccessor from './firebase/firestore.js';
export default class DBAccessor {
    constructor(){
        this.type = configReader.instance.getConfig().database.type;
                    console.log(this.type);
                    console.log(DB_TYPE);
        switch(this.type){

            case DB_TYPE.MYSQL:
                this.operator = new MysqlAccessor();
                break;
            case DB_TYPE.MONGO:
                this.operator = new MongoAccessor();
                break;
            case DB_TYPE.FIREBASE:
                this.operator=new FirebaseAccessor();
                break;
            case DB_TYPE.FIRESTORE:
                this.operator=new FirestoreAccessor();
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