import { initializeApp } from "firebase/app";
import PROCESS_EXIT_CODE from "../../../core/enum/processExitCode.js";
import NullOrUndefinedException from "../../../exception/nullOrUndefinedException.js";
import InvalidSqlInsertExecuteException from "../../../exception/InvalidSqlInsertExecuteException.js";
import { objectKeysToArray } from "../../../core/utils.js";
import ModelConfigReader from "../../../core/modelReader.js";
import ConfigReader from '../../../core/configReader.js';

import { getDatabase, ref, set, query, onValue, update, remove } from "firebase/database";

const baseConfigReader = new ConfigReader();
export default class FirebaseAccessor {
    constructor() {
        this.dbinfo = baseConfigReader.configInfo.get('general')['database'];
    }

    //init

    async initTest() {

        const firebaseConfig = {
            apiKey: this.dbinfo.appId,
            authDomain: this.dbinfo.authDomain,
            projectId: this.dbinfo.projectId,
            storageBucket: this.dbinfo.storageBucket,
            messagingSenderId: this.dbinfo.measurementId,
            appId: this.dbinfo.appId,
            measurementId: this.dbinfo.measurementId
        };
        //initialize firebase


        try {
            console.log(this.dbinfo.appId);

            this.firebase = initializeApp(firebaseConfig);
        } catch (e) {
            console.log(e.message.toString());
            console.log('init eror firebase');
            return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
        }



        try {
            this.database = getDatabase(this.firebase);
        } catch (e) {
            console.log("db init error");
            return PROCESS_EXIT_CODE.DB_ACCESS_DENIED;
        }


        //잘됫음 flag=0;   

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
        let cond = '';
        // size: 5
        let _value = [];
        for (let i = 0; i < keyColumns.length; i++) {
            cond += `${keyColumns[i]} = ?`
            _value.push(body[keyColumns[i]]);
            if (i < keyColumns.length - 1) {
                cond += ' AND ';
            }
        }
        let _columns = '';
        for (let i = 0; i < selectColumns.length; i++) {
            _columns += `${selectColumns[i]}`;
            if (i < selectColumns.length - 1) {
                _columns += ', ';
            }
        }

        let conn = await pool.getConnection();
        let result = await conn.query(`SELECT ${_columns} FROM ${table} WHERE ${cond}`, _value);
        conn.close();
        conn.end();

        return result;
    }
    async select(collection, fieldList, condition, paging) {
        if (!fieldList) {
            throw new NullOrUndefinedException(
                `Column should be specified in [Model] for REST API`
            );
        }

        console.log("컬렉션");
        console.log(collection);
        console.log("필드리스트");
        console.log(fieldList);
        console.log("컨디션");
        console.log(condition);
        console.log("페이징");
        console.log(paging);

        var result = {
            "message": "rrr",
            "code": 200,
            "data": "Rrrr"
        };
        return result;
    }


}