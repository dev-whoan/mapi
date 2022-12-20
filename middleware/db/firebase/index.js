import { initializeApp } from "firebase/app";
import PROCESS_EXIT_CODE from "../../../core/enum/processExitCode.js";
import NullOrUndefinedException from "../../../exception/nullOrUndefinedException.js";
import InvalidSqlInsertExecuteException from "../../../exception/InvalidSqlInsertExecuteException.js";
import { objectKeysToArray } from "../../../core/utils.js";
import ModelConfigReader from "../../../core/modelReader.js";
import ConfigReader from "../../../core/configReader.js";

import {
  getDatabase,
  ref,
  set,
  query,
  onValue,
  update,
  remove,
  get,
  child,
  equalTo,
  orderByChild,
  limitToLast,
} from "firebase/database";

const baseConfigReader = new ConfigReader();
export default class FirebaseAccessor {
  constructor() {
    this.dbinfo = baseConfigReader.configInfo.get("general")["database"];
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
      measurementId: this.dbinfo.measurementId,
    };
    //initialize firebase

    try {
      console.log(this.dbinfo.appId);

      this.firebase = initializeApp(firebaseConfig);
    } catch (e) {
      console.log(e.message.toString());
      console.log("init eror firebase");
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
  async select(collection, fieldList, condition, paging) {
    if (!fieldList) {
      throw new NullOrUndefinedException(
        `Column should be specified in [Model] for REST API`
      );
    }

    const db = getDatabase(this.firebase);

    let output_data = [];
    let result = null;

    const dbRef = ref(getDatabase());

    //const recentRef = query(ref(dbRef, "/users"), limitToLast(1));
    // console.log(recentRef);

    const dbzd = getDatabase();
    const dbRefz = ref(db, "/users/rsr");

    let kzz = await query(
      ref(dbzd, "/users", orderByChild("username"), equalTo(13), limitToLast(1))
    );
    onValue(
      kzz,
      (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const childKey = childSnapshot.key;
          const childData = childSnapshot.val();
          // ...
          console.log(childData);
          console.log(childKey);
          console.log("next");
        });
      },
      {
        onlyOnce: true,
      }
    );

    //console.log(Object.values(kzz._queryParams));
    result = await get(child(dbRef, `/users`, kzz))
      .then((snapshot) => {
        if (snapshot.exists()) {
          //   console.log(snapshot.val());
          output_data = snapshot.val();
        } else {
          console.log("No data available");
        }
      })
      .catch((error) => {
        console.error(error);
      });
    /*
      const ref = db.ref('dinosaurs');
ref.orderByChild('height').equalTo(25).on('child_added', (snapshot) => {
  console.log(snapshot.key);
});
*/
    console.log("컨디션체크");
    console.log(condition);

    /*
    console.log("rr");
    console.log(rr);

    console.log(Object.values(rr));
    console.log("Zzd");

    console.log("Zz2d");
    let json_key = Object.keys(rr);
    let sz = Object.values(rr);
    let output_data = [];
    sz.forEach((item) => {
      //console.log(item);
      let item_s = Object.keys(item);
      console.log(item_s);
      item_s.forEach((element) => {
        console.log(item[element]);
        output_data.push();
      });
    });
*/
    //  console.log("랭스");
    // console.log(jsondecode);
    console.log(output_data);
    return Object.values(output_data);
  }
}
