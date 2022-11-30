# Welcome to MAPI!

# API Express(Nodejs, javascript) Web Server based on MAP

## The previous project is MkWeb(based on java, servlet)

---

# List of page
[How it works](#how-it-works)

[Installation](#installation)

---

# How it works

---

All the requests to Web server is processed through HTTP Methods.

I try to apply MVC pattern for MAPI, so there are `Model`, `Controller` Objects.(but no View because which is depends on Client side.)

Controllers are defining a task what it should do, working with proxy-list (Explained below).

Once you define controller with proxy-list and order to the controller taks should call, of course there could no proxy-list, it will run sequentially.

For example, proxy-list with pre-defined functions `start, end`, and proxy-order with `1`, it will call `start` task, and controller task, and `end` task.

So you can think Controller is actually method which you want to run.

`HTTP Request for Controller -> Added to Proxy Worker -> Run Tasks Based on Proxy-List`

You have to set all the needed things `JSON` file, according to its' right path under the `configs` folder.

## Default setting for MAPI

You need to set default setting for using MAPI.

Which setting is for using which controller, and the base-line setting for the controller.

For example, in REST API, you can set pre-fixed uri for requesting REST API. Database, you can set ip(host) of database, id, pw, port and scheme to use.

So the file is located right under `configs/`, it will be `configs/default.json`

```json
{
    "cors": {
        "default": "http://localhost:3000",
        "origin": ["http://localhost:3000", "http://localhost:5000"],
        "methods": "GET,PUT,POST,DELETE,HEAD,OPTIONS",
        "allow-headers": "Authorization, Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Access-Control-Allow-Origin"
    },
    "restapi":{
        "base-uri": "/"
    },
    "database": {
        "type": "mysql"
        "id": "RDB_ID",
        "pw": "RDB_PW",
        "host": "RDB_IP",
        "port": "RDB_PORT",
        "scheme": "RDB_SCHEME"
    },
    "jwt": {
        "use": "yes",
        "generate-uri": "/auth/do",
        "verify-uri": "/auth/verify",
        "lifetime": "600",
        "secret": "JWT_SECRET",
        "auth-table": "JWT_AUTH",
        "auth-columns": ["name", "password"],
        "alg": "HS256",
        "columns": ["SEQ", "name", "email"],
        "keys": {
            "SEQ": "index",
            "name": "nickname",
            "email": "contact"
        }
    }
}
```

If mapi cannot connect to database, mapi will be shutdown with information such that `Access Denied, Fail to connect.`

If one of the property is missing, mapi will be shutdown with information about what went wrong.

### cors Property

cors property let MAPI allow cross-origin-servers to use the api.

`default`: Define your base server address which use MAPI. If your front server or any others are operating in http://localhost:3000, then it will be your value. If you are operating MAPI in server-less environment, it will be hostname of MAPI.

`origin`: Define cross-origins where is allowed to use MAPI. `["*"]` for wildcard.

`methods`: Define methods that can be called to use MAPI.

`allow-headers`: Default headers to use MAPI. You can add other headers, but should not remove any of it.

### restapi Property

restapi property define essential information to use REST-API call.

`base-uri`: Define prefix uri to use rest-api. If it is set to `/mapi` and your rest api controller's uri have defined into `/api/user`, the whole request uri will be `/mapi/api/user`.

### database Property

database property define Database connect information. If any of config is wrong, hence MAPI cannot connect to the database, MAPI will be shutdown with database error.

`type`: Type of Database. Now only supports MySQL, MariaDB, MongoDB. (Value: `mysql, mongo`)

`id`: User id of Database

`password`: User password of Database

`host`: Hostname of Database

`port`: Port of Database

`scheme`: Database(scheme, collection) to use. It must be created in the Database.

### jwt Property

jwt property define Json Web Token settings. If your any controller require authorization, jwt will be used.

`use`: Whether use JWT or not.

`generate-uri`: Uri to generate token. It must not be duplicated with any other API uri. You can generate token to the uri with POST method.

`verify-uri`: Uri to verify given token. You must send token into request header, `Authorization` field, value with Bearer token (`Bearer eyJhbGciOiJIUzI1NiIsInR5cGUiOiJKV...`).

`lifetime`: Lifetime of the generated token. If given token lived more than lifetime, you cannot authorize with the token. If so, you must get new token. (Unit: seconds)

`secret`: Secret to create JWT Signature. IT MUST NOT BE EXPOSED.

`auth-table`: Database table that must be created in RDB. JWT is issued based on user information, so this table will carry the users' information. It is used with `auth-columns`, `columns`, `keys` properties. (Table is corresponded to `Collection` in `MongoDB`.)

`alg`: Algorithm that is used to make JWT Signature.

`columns`: Columns that generate JWT payload. These values are raw column name of `RDB -> auth-table`. For security, this columns must not be EXPOSED. The columns' names will be refactor through `keys` property. (Columns are corresponded to `field` in `MongoDB`.)

`keys`: New key to refactor original `columns`. For example, based on following properties, JWT payload will have `number, nickname, contact` keys not `id, name, email`. (Columns are corresponded to `field` in `MongoDB`.)

```json
/* EXAMPLE */
"jwt": {
    ...
    "columns": ["id", "name", "email"],
    "keys": {
        "id": "number",
        "name": "nickname",
        "email": "contact"
    }
    ...
}
```

## Controller

## Controller is the same as I commented before. For now, it is on building level, I will update this docs later when it fixed.

I'm planning to create Controller which offers `JWT, REST API for fetching Data from Database, FTP`. However, FTP and REST API for NoSQL DB will be considered and programming later.

Controller you need to

### General Properties

There are general properties for JSON files. (But not in default.json)

This properties are setting the controller what it would be.

- `id`: the unique string in same type. it is used to identify and call the control
- `type`: the type of control. it set what controller will run.
- `auth`: the option requires authorization or not. need to set jwt before to use this option.
- `proxy-list`: proxy method to use with this control. default proxies are: `start, end, auth`.
- `proxy-order`: when this method is called.
- `log`: allow to log about the event or not. `debug, warn, info, error`

```json
{
    "id": "test",
    "type": "api",
    "auth": "no",
    "proxy-list": ["start", "end"],
    "proxy-order": 1,
    "log": "debug",
}
```

### REST API Properties

There are more properties for REST API setting.

- `uri`: The uri to request this property.
- `model`: the data model to control and which must define in `configs/model`.
- `dml`: what dml type will it offer. `select, insert, update, delete` are matching with http methods, `get, post, put, delete`.

The id of REST API controller could be duplicate, however, it should be identified by `uri@id`.

For example, if the id is `test` and uri is `/api`, it's key will be `/api@test`. It means, concatenation of `uri@id` must be unique.

```json
{
    "uri": "/api",
    "model": "user",
    "dml": ["select", "insert", "update", "delete"]
}
```

So total JSON file for REST API,

```json
{
    "id": "test",
    "type": "api",
    "auth": "no",
    "proxy-list": ["start", "end"],
    "proxy-order": 1,
    "log": "debug",
    "uri": "/api",
    "model": "user",
    "dml": ["select", "insert", "update", "delete"]
}
```

If the json file's name is `test.json`, then the file must be exist on `configs/controller/rest/test.json` (`configs/controller/rest` is pre-fixed path).

## Model

Model is the data what you want to get, modify, and so on.

So the model is related with database. For now, only support RDB, tested on `mariadb`.

### Model Setting

It follows default knowledge with the controller.

There are more properties for Model setting. 

- `id`: it is not same as general property, it is pointing table of database. it must be unique among the model setting. (Table is corresponded to `Collection` in `MongoDB`.)
- `columns`: columns to support for rest api, which must column of database's table. (Columns are corresponded to `field` in `MongoDB`.)
- `not-null`: not null columns for when sending request about this model. it is usually match with database's not null column.

* Please be-care that, you must specify the data type for number, `long, double` in MongoDB if you use MongoDB Collection's validation.
* In MongoDB, if you don't specify into right data type, it can bring about `Fail to Validation` Error.
* It means, for MySQL(MariaDB), you can just right integer, float, however, it can be reason of overflow.

```json
{
    "columns": {
        "SEQ": "integer",
        "NAME": "string",
        "AGE": "integer"
    },
    "not-null": ["NAME"] 
}
```

So total JSON file for Model,

```json
{
    "id": "user",
    "type": "model",
    "proxy-list": [],
    "log": "true",
    "columns": {
        "SEQ": "integer",
        "NAME": "string",
        "AGE": "integer"
    },
    "not-null": ["NAME"]
}
```

If the json file's name is `user.json`, then the file must be exist on `configs/model/user.json` (`configs/model` is pre-fixed path).

# How to Request

## REST-API



## JWT

The uri for JWT is set on `default.json -> "jwt" property`. You need `generate-uri` and `verify-uri`.


# Installation

## Prerequisites

You should prepare configuration for MAPI. The base files are `default.json`, `model directory`, `controller directory`, and `services directory`.

```
configs
│    default.json
└─── controller
│    │    jwt
│    │    └─── [json_for_jwt_setting.json]
│    └    rest
│         └─── [some_jsons_for_rest_setting.json]
└─── model
     └─── [some_jsons_for_model_setting.json]     
```


## Docker

If you finished to set the `Prerequisites` files such that controller and model in some location with name `/path/to/configs/` (ex. `/home/mapi/configs`), you can run with following docker commands

docker run -d -p 3000:[PORT] -v [/path/to/configs]:/app/configs --name mapi devwhoan/mapi



## Code based Nodejs

If you want to modify and change some codes or whatever, download the code, and just run the nodejs.

As I commented uphead, you need to set `Prerequisites` for running the node process.
