import { initializeApp } from "firebase/app";
import PROCESS_EXIT_CODE from "../../../enum/processExitCode.js";
import NullOrUndefinedException from "../../../exception/nullOrUndefinedException.js";
import HTTP_RESPONSE from "../../../enum/httpResponse.js";
import fs from 'fs';
import path from 'path';
// import firebaseConfig from "../../../configs/firebase.json" assert { type: "json" };
import ModelConfigReader from "../../../configReader/modelReader.js";
import { objectKeysToArray } from "../../../configReader/utils.js";
import {
    collection,
    doc,
    getFirestore,
    query,
    startAfter,
    getDocs,
    addDoc,
    where,
    deleteDoc,
    limit,
    updateDoc,
} from "firebase/firestore";
import Logger from "../../../logger/index.js";

export default class FirestoreAccessor {
    constructor() {
        this.firebaseConfig = null;
        this.logger = new Logger('info', 'FirestoreAccessor.js');
        this.initialize();
    }

    initialize(){
        if(!this.firebaseConfig){
            try{
                const fbPath = path.join(process.env.PWD, 'configs', 'firebase.json');
                this.firebaseConfig = fs.readFileSync(fbPath, 'utf8');
                this.firebaseConfig = JSON.parse(this.firebaseConfig);
            } catch (e){
                this.logger.error("Fail to get firebase config");
                this.logger.error(e.stack || e);
                return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
            }
            
        }
    }

    async initTest() {
        try {
            this.firebase = initializeApp(this.firebaseConfig);
        } catch (e) {
            this.logger.error("Fail to initialize Firestore");
            this.logger.error(e.stack || e);
            return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
        }
        try {
            this.database = getFirestore(this.firebase);
        } catch (e) {
            this.logger.error("Fail to initialize Firestore:: There is no firestore information in firebase.json");
            this.logger.error(e.stack || e);
            return PROCESS_EXIT_CODE.DB_ACCESS_DENIED;
        }

        return 0;
    }

    async jwtAuthorize(table, keyColumns, selectColumns, body) {
        if (!table || !keyColumns) {
            throw new NullOrUndefinedException(
                `Table(${table}) or Key Columns(${keyColumns}) is Null.`
            );
        }
        if (!body) {
            throw new NullOrUndefinedException(
                `Body parameter(${body}) for JWTAuthorize is Null.`
            );
        }
        let cond = "";
        const queryConstraints = [];

        const db = getFirestore(this.firebase);

        let result = [];
        let data = {};
        for (let key in body) {
            queryConstraints.push(where(key, "==", body[key]));

        }
        const q = query(collection(db, table), ...queryConstraints);
        const querySnapshot = await getDocs(q);
        let kk = {};
        if (querySnapshot.docs.length == 0) {
            return "";
        }
        else {
            const last = querySnapshot.docs[0];
            let db_data = last.data();
            for (let i = 0; i < selectColumns.length; i++) {
                if (db_data[selectColumns[i]] == null) {
                    return "";
                }
                data[selectColumns[i]] = db_data[selectColumns[i]];
            }
        }
        result.push(data);
        return result;
    }

    async select(_collections, _query, condition, paging) {

        if (condition && condition.page) delete condition.page;
        while (_query.includes('?')) {
            _query = _query.replace('\?', `'${valueList[i++]}'`);
        }
        _query = _query.replaceAll("'", '"');
        const db = getFirestore(this.firebase);
        let result = [];
        
        const specialNumber = {};
        const modelColumns = ModelConfigReader.instance.configInfo.get(_collections).data.columns;
        const objectFields = objectKeysToArray(modelColumns);

        for (let i = 0; i < objectFields.length; i++) {
            let oneKey = objectFields[i];
            let oneValue = modelColumns[oneKey];

            if (oneValue.toLowerCase() === 'float' || oneValue.toLowerCase() === 'integer') {
                specialNumber[oneKey] = oneValue;
            }
        }
        
        let fieldList;
        const queryConstraints = [];
        if(condition!=null)
       {
        fieldList = objectKeysToArray(condition);
        
        for (let i = 0; i < fieldList.length; i++) {
            let sn = specialNumber[fieldList[i]];
            let value = condition[fieldList[i]];
            const decodedValue=decodeURI(value);
            value = (decodedValue === value) ? condition[fieldList[i]] : decodedValue;

            if (sn) {
                if (sn === 'integer') {
                    value = parseInt(value);
                } else if (sn === 'float') {
                    value = parseFloat(value);
                }
            }
            condition[fieldList[i]] = value;
            queryConstraints.push(where(fieldList[i], "==", condition[fieldList[i]]));
        }
       }
        
        if (paging["pagination-value"]) {
            let page_count = parseInt(paging["count"]);
            let page_number = parseInt(paging["pagination-value"]);
            if (page_number == 1) {
                
                    const q = query(
                    collection(db, _collections),
                    ...queryConstraints,
                    limit(page_count)
                );
                

                try {
                    const querySnapshot = await getDocs(q);
                    querySnapshot.forEach((docs) => {
                        const lists = Object.keys(docs.data());
                        let res = {};
                        lists.forEach((val) => {
                            res[val] = docs.data()[val];
                        });

                        result.push(res);
                    });
                } catch (internalError) {
                    this.logger.error(`[Firestore]: Fail to get data. Cannot prepare query.`);
                    this.logger.error(`Query: `, _query);
                    this.logger.error(internalError.stack || internalError);
                    return {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    }
                }
            } else {
                let num = page_count * (page_number - 1);
                try {
                    const q = query(
                        collection(db, _collections),
                        ...queryConstraints,
                        limit(num)
                    );
                    const querySnapshot = await getDocs(q);
                    const last = querySnapshot.docs[querySnapshot.docs.length - 1];
                    const qury = query(
                        collection(db, collections),
                        startAfter(last),
                        limit(page_count)
                    );
                    const nextr = await getDocs(qury);
                    nextr.forEach((docs) => {
                        const lists = Object.keys(docs.data());
                        let res = {};
                        lists.forEach((val) => {
                            res[val] = docs.data()[val];
                        });
                        result.push(res);
                    });
                } catch (internalError) {
                    this.logger.error(`[Firestore]: Fail to get data. Cannot prepare query.`);
                    this.logger.error(`Query: `, _query);
                    this.logger.error(internalError.stack || internalError);
                    return {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    }
                }
            }
        } else {
            const q = query(collection(db, _collections), ...queryConstraints);
            const querySnapshot = await getDocs(q)
                .then((e) => {
                    e.forEach((docs) => {
                        const lists = Object.keys(docs.data());
                        let res = {};
                        lists.forEach((val) => {
                            res[val] = docs.data()[val];
                        });
                        result.push(res);
                    });
                })
                .catch((e) => {
                    this.logger.error(e.stack || e);
                    return {
                        affectedRows: 0,
                        success: false,
                        code: 400,
                        message: "Request body failed validation",
                    };
                });
        }

        return result;
    }
    async insert(model, _query, valueList) {

        let i = 0;

        while (_query.includes('?')) {
            _query = _query.replace('\?', `'${valueList[i++]}'`);
        }

        _query = _query.replaceAll("'", '"');

        const db = getFirestore(this.firebase);

        let result;
        let kk = {};
        const modelColumns = ModelConfigReader.instance.getConfig(model).getData().columns;
        const specialNumber = {};
        _query = JSON.parse(_query);
        const objectFields = objectKeysToArray(modelColumns);

        for (let i = 0; i < objectFields.length; i++) {
            let oneKey = objectFields[i];
            let oneValue = modelColumns[oneKey];

            if (oneValue.toLowerCase() === 'float' || oneValue.toLowerCase() === 'integer') {
                specialNumber[oneKey] = oneValue;
            }
        }
        const fieldList = objectKeysToArray(_query);
        for (let i = 0; i < fieldList.length; i++) {
            let sn = specialNumber[fieldList[i]];
            let value = valueList[i];
            const decodedValue=decodeURI(value);
            value = (decodedValue === value) ? valueList[i] : decodedValue;

            if (sn) {
                if (sn === 'integer') {
                    value = parseInt(value);
                }
                else if (sn === 'float') {
                    value = parseFloat(value);
                }
            }
            _query[fieldList[i]] = value;
        }

        try {
            result = await addDoc(collection(db, model), _query).then((e) => {
                const return_val = {
                    code: 201,
                    insertId: e.id,
                    affectedRows: 1,
                    document: _query,
                    firestore: true,
                };
                kk = return_val;
            });
        } catch (internalError) {
            this.loggererror(`[Firestore]: Fail to insert data. Cannot prepare query.`);
            this.logger.error(`Query: `, _query);
            this.logger.error(internalError.stack || internalError);
            return {
                code: 400,
                message: HTTP_RESPONSE[400]
            }
        }
        result = kk;
        return result;
    }

    async update(collections, _query, valueList, condition) {
        const document = {};
        const specialNumber = {};
        let i = 0;
        while (_query.includes('?')) {
            _query = _query.replace('\?', `'${valueList[i++]}'`);
        }
        _query = _query.replaceAll("'", '"');

        _query = JSON.parse(_query);


        const modelColumns = ModelConfigReader.instance.configInfo.get(collections).data.columns;
        const objectFields = objectKeysToArray(modelColumns);

        for (let i = 0; i < objectFields.length; i++) {
            let oneKey = objectFields[i];
            let oneValue = modelColumns[oneKey];

            if (oneValue.toLowerCase() === 'float' || oneValue.toLowerCase() === 'integer') {
                specialNumber[oneKey] = oneValue;
            }
        }
        const fieldList = objectKeysToArray(condition);
        const queryConstraints = [];
        for (let i = 0; i < fieldList.length; i++) {
            let sn = specialNumber[fieldList[i]];
            let value = condition[fieldList[i]];
            const decodedValue=decodeURI(value);
            value = (decodedValue === value) ? condition[fieldList[i]] : decodedValue;

            if (sn) {
                if (sn === 'integer') {
                    value = parseInt(value);
                    _query[fieldList[i]] = parseInt(_query[fieldList[i]]);
                } else if (sn === 'float') {
                    value = parseFloat(value);
                    _query[fieldList[i]] = parseFloat(_query[fieldList[i]]);
                }
            }
            condition[fieldList[i]] = value;

            queryConstraints.push(where(fieldList[i], "==", condition[fieldList[i]]));
        }

        try {
            const db = getFirestore(this.firebase);
            const q = query(collection(db, collections), ...queryConstraints);
            const querySnapshot = await getDocs(q);
            let _code = 200;

            if (querySnapshot.docs.length == 0) _code = 201;
            else _code = 200;
            const last = querySnapshot.docs[0];
            const executedQuery = _query;
            let kk = {};
            try{
                await updateDoc(doc(db, collections, last.id), executedQuery);
                return {
                    code: _code,
                    affectedRows: _query.length,
                    acknowledged: true,
                    document: _query,
                    firestore: true,
                };
            } catch (error) {
                this.logger.error(`[Firestore]: Fail to update data. Cannot prepare query.`);
                this.logger.error(`Query: `, executedQuery);
                this.logger.error(error.stack || error);
                return {
                    code: 400,
                    message: HTTP_RESPONSE[400]
                }
            }
        } catch (internalError) {
            this.logger.error(`[Firestore]: Fail to insert data. Cannot prepare query.`);
            this.logger.error(`Query: `, _query);
            this.logger.error(internalError.stack || internalError);
            return {
                code: 400,
                message: HTTP_RESPONSE[400]
            }
        }
    }

    async delete(_collection, _query, valueList) {
       
        let i = 0;
        while (_query.includes('?')) {
            _query = _query.replace('\?', `'${valueList[i++]}'`);
        }
        _query = _query.replaceAll("'", '"');
        try {
            const document = JSON.parse(_query);
            const specialNumber = {};

            const modelColumns = ModelConfigReader.instance.configInfo.get(_collection).data.columns;
            const objectFields = objectKeysToArray(modelColumns);

            for (let i = 0; i < objectFields.length; i++) {
                let oneKey = objectFields[i];
                let oneValue = modelColumns[oneKey];

                if (oneValue.toLowerCase() === 'float' || oneValue.toLowerCase() === 'integer') {
                    specialNumber[oneKey] = oneValue;
                }
            }

            const fieldList = objectKeysToArray(document);
            for (let i = 0; i < fieldList.length; i++) {
                let sn = specialNumber[fieldList[i]];
                let value = valueList[i];
                const decodedValue=decodeURI(value);
                value = (decodedValue === value) ? valueList[i] : decodedValue;

                if (sn) {
                    if (sn === 'integer') {
                        value = parseInt(value);
                    } else if (sn === 'float') {
                        value = parseFloat(value);
                    }
                }
                document[fieldList[i]] = value;
            }

            const queryConstraints = [];
            let object_array = objectKeysToArray(document);

            for (let i = 0; i < object_array.length; i++) {
                queryConstraints.push(where(object_array[i], "==", document[fieldList[i]]));
            }
            const db = getFirestore(this.firebase);
            const q = query(collection(db, _collection), ...queryConstraints);
            const querySnapshot = await getDocs(q);
            const idx = querySnapshot.docs.length;
            let current = 0;
            querySnapshot.forEach((docs) => {
                deleteDoc(doc(db, _collection, docs.id))
                    .then((ignore) => {
                        if(++current >= idx){
                            return {
                                deletedCount: idx
                            };
                        }
                    })
                    .catch((error) => {
                        this.logger.error(`[Firestore]: Fail to delete data. Cannot prepare query.`);
                        this.logger.error(error.stack || error);
                        return {
                            code: 400,
                            message: HTTP_RESPONSE[400],
                        };
                    });
            });
        } catch (internalError) {
            this.logger.error(`[Firestore]: Fail to delete data. Cannot prepare query.`);
            this.logger.error(`Query: `, _query);
            this.logger.error(internalError.stack || internalError);
            return {
                code: 400,
                message: HTTP_RESPONSE[400],
            }
        }
    }
}
