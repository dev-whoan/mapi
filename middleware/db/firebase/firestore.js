import { initializeApp } from "firebase/app";
import PROCESS_EXIT_CODE from "../../../enum/processExitCode.js";
import NullOrUndefinedException from "../../../exception/nullOrUndefinedException.js";
import InvalidSqlInsertExecuteException from "../../../exception/InvalidSqlInsertExecuteException.js";
import ConfigReader from "../../../configReader/configReader.js";
import HTTP_RESPONSE from "../../../enum/httpResponse.js";
import firebaseConfig from "../../../configs/firebase.json" assert { type: "json" };
import ModelConfigReader from "../../../configReader/modelReader.js";
import { objectKeysToArray, objectValuesToArray } from "../../../configReader/utils.js";
import {
    collection,
    doc,
    setDoc,
    getFirestore,
    query,
    startAfter,
    getDocs,
    addDoc,
    where,
    deleteDoc,
    connectFirestoreEmulator,
    limit,
    orderBy,
    updateDoc,
    queryEqual,
    QueryEndAtConstraint
} from "firebase/firestore";
import { refFromURL } from "firebase/database";

const baseConfigReader = new ConfigReader();

export default class FirestoreAccessor {
    constructor() {
        this.dbinfo = baseConfigReader.configInfo.get("general")["database"];
    }

    async initTest() {
        try {
            this.firebase = initializeApp(firebaseConfig);
        } catch (e) {
            console.log(e.message.toString());
            console.log("initialize error firebase");
            return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
        }
        try {
            this.database = getFirestore(this.firebase);
        } catch (e) {
            console.log("db firestore.json file error");
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
        const queryz = condition ? condition : {};
        while (_query.includes('?')) {
            _query = _query.replace('\?', `'${valueList[i++]}'`);
        }
        _query = _query.replaceAll("'", '"');
        const db = getFirestore(this.firebase);
        let result = [];
        let return_Val = {};
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
        const fieldList = objectKeysToArray(condition);
        const queryConstraints = [];
        for (let i = 0; i < fieldList.length; i++) {
            let sn = specialNumber[fieldList[i]];
            let value = condition[fieldList[i]];
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

        if (paging["pagination-value"]) {
            var page_count = parseInt(paging["count"]);
            var page_number = parseInt(paging["pagination-value"]);
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
                    console.error(`[Firestore]: Fail to get data. Cannot prepare query.`);
                    console.error(`Query: `, _query);
                    console.error(internalError.stack || internalError);
                    return {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    }
                }
            } else {
                var num = page_count * (page_number - 1);
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
                    console.error(`[Firestore]: Fail to get data. Cannot prepare query.`);
                    console.error(`Query: `, _query);
                    console.error(internalError.stack || internalError);
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
                    console.error(e);
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
        const ref = collection(db, model);

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

            console.error(`[Firestore]: Fail to insert data. Cannot prepare query.`);
            console.error(`Query: `, _query);
            console.error(internalError.stack || internalError);
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
            var code = 2;


            if (querySnapshot.docs.length == 0) code = 201;
            else code = 200;
            const last = querySnapshot.docs[0];
            const lists = Object.keys(last.data());
            let res = {};
            let kk = {};
            var val_ = [];
            await updateDoc(doc(db, collections, last.id), _query)
                .then((e) => {
                    const result = {
                        code: code,
                        affectedRows: _query.length,
                        acknowledged: true,
                        document: _query,
                        firestore: true,
                    };
                    kk = result;
                })
                .catch((error) => {
                    const result = {
                        code: 400,
                        message: HTTP_RESPONSE[400]
                    };
                    kk = result;
                });
            return kk;
        } catch (internalError) {
            console.error(`[Firestore]: Fail to insert data. Cannot prepare query.`);
            console.error(`Query: `, _query);
            console.error(internalError.stack || internalError);
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
            var idx = querySnapshot.docs.length;
            querySnapshot.forEach((docs) => {
                const ks = deleteDoc(doc(db, _collection, docs.id))
                    .then((i) => { })
                    .catch((error) => {
                        return {
                            code: 400,
                            message: HTTP_RESPONSE[400],
                        };
                    });
            });
            return {
                deletedCount: idx
            };
        } catch (internalError) {
            console.error(`[Firestore]: Fail to delete data. Cannot prepare query.`);
            console.error(`Query: `, _query);
            console.error(internalError.stack || internalError);
            return {
                code: 400,
                message: HTTP_RESPONSE[400],
            }
        }


    }

}
