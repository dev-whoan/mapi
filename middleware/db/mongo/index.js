import PROCESS_EXIT_CODE from "../../../core/enum/processExitCode.js";
import { MongoClient, Long, Double, ObjectID, ObjectId } from "mongodb";
import ConfigReader from '../../../core/configReader.js';
import NullOrUndefinedException from "../../../exception/nullOrUndefinedException.js";
import InvalidSqlInsertExecuteException from "../../../exception/InvalidSqlInsertExecuteException.js";
import { objectKeysToArray } from "../../../core/utils.js";
import ModelConfigReader from "../../../core/modelReader.js";

const baseConfigReader = new ConfigReader();
const dbInfo = baseConfigReader.configInfo.get('general').database;
/*
// Replace the following with your MongoDB deployment's connection string.
const uri =
   "mongodb+srv://<user>:<password>@<cluster-url>?retryWrites=true&writeConcern=majority";
*/

const uri = `mongodb://${dbInfo.id}:${dbInfo.pw}@${dbInfo.host}:${dbInfo.port}/${dbInfo.scheme}?authSource=${dbInfo.scheme}&retryWrites=true&writeConcern=majority`

export default class MongoAccessor {
    constructor(){
        this.client = new MongoClient(uri);
    }

    async initTest(){
        try{
            await this.client.connect();
            console.log("MongoDB Initialize Test Passed !");
        } catch (e){
            console.log(e.message.toString());
            if(e.codeName === 'AuthenticationFailed'){
                console.error("[Access Denied]:: Fail to connect to the Database.");
                console.error(e);
                return PROCESS_EXIT_CODE.DB_ACCESS_DENIED;
            }

            if(e.message.toString().includes("ECONNREFUSED")){
                console.error("Fail to connect to the Database. Please check [/app/configs/controller/default.json]");
                return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
            }
        }
        
        return 0;
    }

    async setAutoIncrement(collection){
        return {
            COLUMN_NAME: '_id'
        };
    }

    async jwtAuthorize(collection, keyFields, selectFields, body){
        if(!collection || !keyFields){
            throw new NullOrUndefinedException(
                `Collection(${collection}) or Key Columns(${keyFields}) is Null.`
            );
        }
        if(!body){
            throw new NullOrUndefinedException(
                `Body parameter(${body}) for JWTAuthorize is Null.`
            );
        }

        let query = {};
        // size: 5
        for(let i = 0; i < keyFields.length; i++){
            query[keyFields[i]] = body[keyFields[i]];
        }

        const _collection = this.client.db(dbInfo.scheme).collection(collection);
        let options = {};
        const count = await _collection.countDocuments(query, options);
        
        if(count === 0){
            return []
        }

        const cursor = await _collection.findOne(query, options);
        let result = [];
        result.push(cursor);
        return result;
    }

    async select(collection, fieldList, condition, queryOption){
        if(!fieldList){
            throw new NullOrUndefinedException(
                `Column should be specified in [Model] for REST API`
            );
        }

        const _collection = this.client.db(dbInfo.scheme).collection(collection);
        
        const query = condition ? condition : {};
        /*
            {
                _id: {
                    $gt: ObjectId(id)
                }
            }
        */
        const modelObject = ModelConfigReader.instance.getConfig(collection);
        
        for(let key in condition){
            if(modelObject.data.columns[key] === 'integer'){
                query[key] = parseInt(condition[key]);
                continue;
            }
            if(modelObject.data.columns[key] === 'long'){
                query[key] = new Long(condition[key]);
                continue;
            }

            if(modelObject.data.columns[key] === 'float'){
                query[key] = parseFloat(condition[key]);
                continue;
            }
            if(modelObject.data.columns[key] === 'double'){
                query[key] = new Double(condition[key]);
                continue;
            }

        }

        const options = {};
        const count = await _collection.countDocuments(query, options);
        
        if(count === 0){
            return [];
        }

        const _skipIndex = queryOption['pagination-value'] >= 1 ? queryOption['pagination-value']-1 : 0;
        const cursor = await _collection.find(query, options).skip(_skipIndex * queryOption.count).limit(queryOption.count);
        let result = [];
        
        await cursor.forEach((item, index) => {
            result.push(item);          
        });
        
        return result;
    }

    async update(collection, fieldList, valueList, condition, modelObject){
        if(!fieldList || !valueList || (fieldList.length != valueList.length)){
            throw new InvalidSqlInsertExecuteException(
                `ColumnList(${fieldList}) or DataList(${valueList}) is null. Or size of ColumnList and DataList are not match.`
            );
        }

        const document = {};

        const specialNumber = {};
        const objectFields = objectKeysToArray(modelObject.data.columns);

        for(let i = 0; i < objectFields.length; i++){
            let oneKey = objectFields[i];
            let oneValue = modelObject.data.columns[oneKey];
            
            if(oneValue.toLowerCase() === 'long' || oneValue.toLowerCase() === 'double'){
                specialNumber[oneKey] = oneValue;
            }
        }

        for(let i = 0; i < fieldList.length; i++){
            let sn = specialNumber[fieldList[i]];
            let value = valueList[i];
            if(sn){
                if(sn === 'integer'){
                    value = parseInt(value);
                } else if(sn === 'long'){
                    value = new Long(value);
                } else if(sn === 'float'){
                    value = parseFloat(value);
                } else if(sn === 'double'){
                    value = new Double(value);
                }
            }
            document[fieldList[i]] = value;
        }

        if(Object.keys(document).length != fieldList.length){
            throw new InvalidSqlInsertExecuteException(
                `Fail to create update document :: ${document}`
            );
        }
        
        const _collection = this.client.db(dbInfo.scheme).collection(collection);
        const options = { upsert: true };
        const updateDoc = {
            $set: document,
        };
        
        let result = null;
        try{
            result = await _collection.updateOne(condition, updateDoc, options);
        } catch (e) {
            console.error(e);
            if(e.message.includes("failed validation")){
                return {
                    affectedRows: 0,
                    success: false,
                    code: 400,
                    message: "Request body failed validation"
                }
            }
        }

        return {
            code: (result.upsertedCount === 1) ? 201 : 200,
            affectedRows: result.modifiedCount,
            acknowledged: result.acknowledged,
            document: document,
            mongo: true
        }

    }

    /* Multiple Insertion */
/*
    const database = client.db("insertDB");
    const foods = database.collection("foods");

    // create an array of documents to insert
    const docs = [
        { name: "cake", healthy: false },
        { name: "lettuce", healthy: true },
        { name: "donut", healthy: false }
    ];

    // this option prevents additional documents from being inserted if one fails
    const options = { ordered: true };

    const result = await foods.insertMany(docs, options);
    console.log(`${result.insertedCount} documents were inserted`);
*/
    /* Multiple Insertion */

    async insert(collection, fieldList, valueList, modelObject){

        if(!fieldList || !valueList || (fieldList.length != valueList.length)){
            throw new InvalidSqlInsertExecuteException(
                `FieldList ${fieldList} or ValueList ${valueList} is null || Size of FieldList and ValueList are not match.`
            );
        }

        const specialNumber = {};
        const objectFields = objectKeysToArray(modelObject.data.columns);

        for(let i = 0; i < objectFields.length; i++){
            let oneKey = objectFields[i];
            let oneValue = modelObject.data.columns[oneKey];
            
            if(oneValue.toLowerCase() === 'long' || oneValue.toLowerCase() === 'double'){
                specialNumber[oneKey] = oneValue;
            }
        }

        const _collection = this.client.db(dbInfo.scheme).collection(collection);
        
        const document = {};
        for(let i = 0; i < fieldList.length; i++){
            let sn = specialNumber[fieldList[i]];
            let value = valueList[i];
            if(sn){
                if(sn === 'integer'){
                    value = parseInt(value);
                } else if(sn === 'long'){
                    value = new Long(value);
                } else if(sn === 'float'){
                    value = parseFloat(value);
                } else if(sn === 'double'){
                    value = new Double(value);
                }
            }
            document[fieldList[i]] = value;
        }

        let result = null;
        try{
            result = await _collection.insertOne(document);
        } catch (e) {
            console.error(e);
            if(e.message.includes("failed validation")){
                return {
                    affectedRows: 0,
                    success: false,
                    code: 400,
                    message: "Request body failed validation"
                }
            }
        }

        return {
            code: 201,
            affectedRows: 1,
            acknowledged: result.acknowledged,
            insertedId: result.insertedId,
            document: document,
            mongo: true
        }
    }

    /* Default: Multiple Deletion */
    async delete(collection, condition){
        const _collection = this.client.db(dbInfo.scheme).collection(collection);
        const result = await _collection.deleteMany(condition);
        return result;
    }
}