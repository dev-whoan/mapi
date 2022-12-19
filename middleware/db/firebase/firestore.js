import { initializeApp } from "firebase/app";
import PROCESS_EXIT_CODE from "../../../core/enum/processExitCode.js";
import NullOrUndefinedException from "../../../exception/nullOrUndefinedException.js";
import InvalidSqlInsertExecuteException from "../../../exception/InvalidSqlInsertExecuteException.js";
import { objectKeysToArray } from "../../../core/utils.js";
import ModelConfigReader from "../../../core/modelReader.js";
import ConfigReader from "../../../core/configReader.js";

import firebaseConfig from '../../../configs/firestore.json' assert {type:"json"};


import { collection, doc, setDoc,getFirestore,getDocs,addDoc,where,deleteDoc, connectFirestoreEmulator   } from "firebase/firestore"; 

import { getDatabase , ref, set,query,onValue,update ,remove } from "firebase/database";


const baseConfigReader = new ConfigReader();
export default class FirestoreAccessor {
    constructor() {
      this.dbinfo = baseConfigReader.configInfo.get("general")["database"];
    }
  
    //init
    async initTest() {
        const firebaseConfigs = {
          apiKey: firebaseConfig.firebaseConfig.apiKey,
          authDomain: firebaseConfig.firebaseConfig.authDomain,
          projectId: firebaseConfig.firebaseConfig.projectId,
          storageBucket: firebaseConfig.firebaseConfig.storageBucket,
          messagingSenderId: firebaseConfig.firebaseConfig.messagingSenderId,
          appId: firebaseConfig.firebaseConfig.appId,
          measurementId: firebaseConfig.firebaseConfig.measurementId,
        };
        //initialize firebase
    
        try {
          console.log(this.dbinfo.appId);
    
          this.firebase = initializeApp(firebaseConfigs);
        } catch (e) {
          console.log(e.message.toString());
          console.log("initialize error firestore");
          return PROCESS_EXIT_CODE.DB_FAIL_TO_CONNECT;
        }
    
        try {
          this.database = getFirestore(this.firebase);
        } catch (e) {
          console.log("db firestore.json file error");
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
        let cond = "";
        // size: 5
        let _value = [];
        for (let i = 0; i < keyColumns.length; i++) {
          cond += `${keyColumns[i]} = ?`;
          _value.push(body[keyColumns[i]]);
          if (i < keyColumns.length - 1) {
            cond += " AND ";
          }
        }
        let _columns = "";
        for (let i = 0; i < selectColumns.length; i++) {
          _columns += `${selectColumns[i]}`;
          if (i < selectColumns.length - 1) {
            _columns += ", ";
          }
        }
    
        let conn = await pool.getConnection();
        let result = await conn.query(
          `SELECT ${_columns} FROM ${table} WHERE ${cond}`,
          _value
        );
        conn.close();
        conn.end();
    
        return result;
      }



      async select(collections, fieldList, condition, paging) {
        if (!fieldList) {
          throw new NullOrUndefinedException(
            `Column should be specified in [Model] for REST API`
          );
        }

        if(condition && condition.page)  delete condition.page;
        const queryz = condition ? condition : {};
   
        console.log("컨디션체크");
        console.log(condition);
        
        const queryConstraints = [];
        for(let key in condition)
        {
   
        console.log(key);
        console.log(condition[key]);
        queryConstraints.push(where(key, '==', condition[key]));
        }
        //console.log(queryConstraints);
        console.log("컬렉션확인");
        console.log(collections);
        const db = getFirestore(this.firebase);
       const q = query(collection(db,collections),...queryConstraints);
       
      //const q = query(collection(db, "users"), where("first", "==", "Alans"));

      console.log(":Zd");
        const querySnapshot = await getDocs(q);
        console.log("z");
         var result=[];
         

         console.log(querySnapshot);
        querySnapshot.forEach((docs)=>{
            
            console.log(`${docs.id} => ${docs.data()}`);
           
           var k={};
        
        
       const lists=Object.keys(docs.data());
       lists.forEach((val)=>{
        var ks=val;
       //k.ks=docs.data()[val];
       
       k[val]=docs.data()[val];
       });

           result.push(k);
        });

     
return result;
    }    

}
  

  