# Welcome to MAPI!

# API Express(Nodejs, javascript) Web Server based on MAP
---

# List of page
[About](#about-mapi)

[How it Works](#how-it-works)

[How to Request](#how-to-request)

[Installation](#installation)

---

# About MAPI
MAPI is well created Web Server Framework. I noticed that developers need to consider lots of things when they started to create new services such that App, Web Service, Science Experimental, etc. And the services can be simply divided into Front-End and Back-End.

But actually, the idea is simply started from Front-End side, the UX like: 'How about creating a food delivery service? People can choose the foods what they want to eat, and the page will show the information about the food. Furthermore, when the order it, the seller will receive the infor where the location to deliver, and information they need.' It means that although the idea is started with User Experience(or User Interface, simply Frontend), developer must design and implement the BackEnd side.

So the concept of MAPI is 'Let the developers be able to just focus on the UX part. Let MAPI take responsibiliity for the Backend, so they can build differentiated, stand out service!'

So the MAPI borned. The MAPI provides DB Fetching, File Server, User Authentication with setting JSON files and process the features with RESTful API Calls.

---

# How it works

---

All the requests to MAPI is processed through HTTP Methods.

MAPI is designed using the MVC pattern. Hence there are `Model`, and `Controller` but no View.

Controller is about the task what the response is made from for the request. The actions are defined as `Service`.

For example you can define `CRUD` task(here in after referred to as task) and `HTTP Methods` correspondly. And when the request is coming to MAPI with one of defined `HTTP Method`, the corresponding task will be processed.

The task is defined as `Service`. `Service` can define the corresponding request and task that is explained above. However, each `HTTP Methods` can defined only once. It means, no duplicated `HTTP Method` is allowed.

In summary, when http request is come, router will searching for corresponding `Controller`. And then, `Controller` will look for corresponding `Service`. If there is any corresponding `Service` and `Controller`, the things will be processed, and return the result.

It's similiar with `Dependency Injection`, and `Inversion of Control`.

## Define
- `Router` -> `Controller` -> `Service`

## Procedure
- `Router` <- `Controller` <- `Service`

You have to set all the needed things `JSON` file, according to its' right path under the `configs` folder.

## Prerequisites

You should prepare configuration for MAPI. The base files are `default.json`, `model`, `controller`, and `service`.

```
configs
│    default.json
└─── controller
│    └    rest
│         └─── [some_jsons_for_rest_setting.json]
└─── services
│    └    db
│         └─── [some_jsons_for_db_sql_setting.json]
│    └    function
│         └─── [some_jsons_for_function_setting.json]
└─── model
     └─── [some_jsons_for_model_setting.json]     
```

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
        "use": "yes",
        "base-uri": "/",
        "count": 10
    },
    "file-transfer":{
        "use": "yes",
        "base-uri": "/upload",
        "read-uri": "file",
        "base-directory": "/files",
        "count": 10,
        "type": "hostpath",
        "table": "MAPI_FILE",
        "columns": {
            "parent-path": "parent",
            "file-name": "file",
            "timestamp": "timestamp",
            "owner": "owner" 
        }
    },
    "database": {
        "type": "mariadb|mongo",
        "id": "DB_USER",
        "pw": "DB_PW",
        "host": "DB_IP",
        "port": "DB_PORT",
        "scheme": "DB_SCHEME|COLLECTION"
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

restapi property define essential information for REST API Controller (which for fetching data from database).

`use`: Whether use REST API for fetching datas from `database`. If no, the rest api properties & settings will be ignored. (Value: yes|no)

`base-uri`: Define prefix uri to call rest-api protocol. If it is set to `/mapi` and your rest api controller's uri have defined into `/api/user`, the whole request uri will be `/mapi/api/user`.

`count`: Amount for pagination algorithm. REST API will fetch the amoutn of datas from database as defined. The key for query of pagination must be defined on `REST API Properties`.

## file-transfer Property

It is not supported currently. Will be updated later.

### database Property

database property define Database connect information. If any of config is wrong, hence MAPI cannot connect to the database, MAPI will be shutdown with database error.

`type`: Type of Database. Now only supports MariaDB, MongoDB, and Firestore. (Value: `mariadb, mongo, firestore`)

`id`: User id of Database

`password`: User password of Database

`host`: Hostname of Database

`port`: Port of Database

`scheme`: Database(scheme, collection) to use. It must be created in the Database.

### jwt Property

jwt property define Json Web Token settings. If your any controller require authorization, jwt will be used.

`use`: Whether use JWT or not. If no, the jwt properties & settings will be ignored. (Value: yes|no)

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
- `page-query`: The query key for using pagination. if the value is `page`, you can call rest api protocol with pagination request; /{base-uri}/{uri}/{id}?page=1
- `page-count`: The query key for using pagination. if the value is `10`, response will be include maximum 10 datas per each page. Deprecated, use `configs/default.json -> count` instead.
- `services`: The services that defining `crud task` for `http request`. If there is no method defined for the `http method`, it will return `404 Not Found`. Also each services must be defined under `configs/services/[db|function] -> one of json`.

The id of REST API controller could be duplicate, however, it should be identified by `uri@id`.

For example, if the id is `test` and uri is `/api`, it's key will be `/api@test`. It means, concatenation of `uri@id` must be unique.

```json
{
    "uri": "/api",
    "page-query": "page",
    "page-count": 10,
    "services": {
        "get": {
            "type": "db",
            "id": "user_api",
            "service": "read"
        },
        "post": {
            "type": "db",
            "id": "user_api",
            "service": "create"
        },
        "put": {
            "type": "db",
            "id": "user_api",
            "service": "update"
        },
        "delete": {
            "type": "db",
            "id": "user_api",
            "service": "delete"
        }
    }
}
```

According to above json format, it infer that there is service named `user_api` under `configs/services/db/ one of json`. Note that, the `id` of service doesn't mean the `file name of json` is user_api.

Also the view can request with `get, post, put, delete` http methods.

So total JSON file for REST API,

```json
{
    "id": "test",
    "type": "api",
    "auth": "no",
    "proxy-list": ["start", "end"],
    "proxy-order": 1,
    "log": "debug",
    "uri": "/",
    "page-query": "page",
    "page-count": 10,
    "services": {
        "get": {
            "type": "db",
            "id": "user_api",
            "service": "read"
        },
        "post": {
            "type": "db",
            "id": "user_api",
            "service": "create"
        },
        "put": {
            "type": "db",
            "id": "user_api",
            "service": "update"
        },
        "delete": {
            "type": "db",
            "id": "user_api",
            "service": "delete"
        }
    }
}
```

If the json file's name is `test.json`, then the file must be exist on `configs/controller/rest/test.json` (`configs/controller/rest` is pre-fixed path).

## Model

Model is the data what you want to get, modify, and so on.

So the model is related with database. For now, `mariadb, mongodb, firestore of Google` is supported.

### Model Setting

It follows default knowledge with the controller.

There are more properties for Model setting. 

- `id`: It is not same as general property, it is pointing table of database. it must be unique among the model setting. (Table is corresponded to `Collection` in `MongoDB`.)
- `columns`: Columns to support Document DB for rest api. If your Collection uses any validation rule, it must be defined. support values: `integer, long, float, double`. Other things you should put with stringify value (i.e, json, yaml, ...).
- `ai-key`: It is one of column(field) for identifying the data. For RDB, it is name of `auto-increment` column, and Document DB, name of uuid column.

* Please be-care that, you must specify the data type for number, `long, double` in MongoDB if you use MongoDB Collection's validation.
* In MongoDB, if you don't specify into right data type, it can bring about `Fail to Validation` Error.

```json
{
    "columns": {
        "SEQ": "integer",
        "NAME": "string",
        "AGE": "long"
    },
    "ai-key": "SEQ"
}
```

So total JSON file for Model,

```json
{
    "id": "client",
    "type": "model",
    "auth": "no",
    "proxy-list": [],
    "log": "true",
    "columns": {
        "SEQ": "integer",
        "NAME": "string",
        "AGE": "long"
    },
    "ai-key": "SEQ"
}
```

If the json file's name is `user.json`, then the file must be exist on `configs/model/user.json` (`configs/model` is pre-fixed path).

## Service

There are 2 type for the `Service`. First one is about db sql, and another is about function. As explained above, the service is one of excutable things when the `HTTP Request` is come.

Prefix path for Service json files is: `configs/services`

### Common format for Service

```
{
    "id": "user_api",
    "log": "yes",
    "create": {
        ...
    },
    "read": {
        ...
    },
    "update": {
        ...
    },
    "delete": {
        ...
    }
}
```

According to above json, `user_api` service can process totally 4 `CRUD tasks`.
- `create`: corresponding to `post http method`
- `read`: corresponding to `get http method`
- `update`: corresponding to `put http method`
- `delet `: corresponding to `delete http method`

### db Service Setting

`db` is set of sqls. It consists of `model` and `query`.

- `model`: It is one of `Model` you defined in `configs/model`. If it is not defined, when your service try to process the http request, error will be occured.
- `query`: It describe sql to execute. query will have dynamic value capsuled with `{{ }}`, for example `{{ body.NAME }}`. `query` can have 3 type of `{{ }}`: `{{ model }}`, `{{ body. }}`, and `{{ condition. }}`

    + `{{ model }}` is pointing right above `model` property.
    + `{{ body. }}` is corresponding to body parameter. For example, `{{ body.NAME }}`, http request must include NAME field on body parameter. If body parameter include `NAME: Eugene`, `{{ body.NAME }}` will be changed into `Eugene`.
    + `{{ condition. }}` is corresponding to URI segment. For example, `{{ condition.NAME }}`, http uri must looks like: `/{uri_to_request_api}/NAME/Eugene`. It means, `{{ condition.NAME }}` will be changed into `Eugene`

If you defined sql with `{{ }}` option, however, your request doesn't include it, it will occur error.

#### RDB Example

```
{
    "id": "user_api",
    "log": "yes",
    "create": {
        "model": "client",
        "query": "INSERT INTO {{ model }} ( NAME, AGE, DESCRIPTION ) VALUES ( {{ body.NAME }}, {{ body.AGE }}, 'hello' )"
    },
    "read": {
        "model": "client",
        "query": "SELECT * FROM {{ model }}"
    },
    "update": {
        "model": "client",
        "query": "UPDATE {{ model }} SET NAME = {{ body.NAME }}, AGE = {{ body.AGE }} WHERE SEQ = {{ condition.SEQ }}"
    },
    "delete": {
        "model": "client",
        "query": "DELETE FROM {{ model }} WHERE SEQ = {{ body.SEQ }}"
    }
}
```

#### Document DB Example

```
{
    "id": "user_api_mongo",
    "log": "yes",
    "create": {
        "model": "client",
        "query": "{ 'NAME': {{ body.NAME }}, 'AGE': {{ body.AGE }} }"
    },
    "read": {
        "model": "client",
        "query": ""
    },
    "update": {
        "model": "client",
        "query": "{ 'NAME': {{ body.NAME }}, 'AGE': {{ body.AGE }} }"
    },
    "delete": {
        "model": "client",
        "query": "{ 'NAME': {{ body.NAME }} }"
    }
}
```

### File-Transfer Properties

File Transfer is not supported currently. Will be updated later.


# How to Request

## REST-API

Uri to request model information, you need 3 things from configuration.

- `default.json`: `restapi['base-uri']`
- `controller.rest.*.json`: `uri`, `id`

You need to concatenate both things, so the result uri would be `/restapi['base-uri']/`controller.rest.*.json.uri`/`controller.rest.*.json.id`.

For example, with the below configuration, you can request to `/api/user`.

```shell
# default.json
{
     ...
     "restapi": {
          "use": "yes",
          "base-uri": "/",
          "count": 10
     },
     ...
}

# controller/rest/user.json
{
     ...
     "id": "user",
     "uri": "/api",
     ...
}
```

### HTTP 6 Methods

You may want to manipulate database's model, and here is a solution to `select, insert, update, delete` methods (`get, create, update, remove`). I will update this article with details later.

`GET`: Method to `select` data from database. The result will be selected based on model configuration. If succeed, http response code will be 200 or 204.

`POST`: Method to `insert` data to database. Http response code will be 201 or 200. (201: created, 200: already exists)

`PUT`: Method to `update` data of database. You must specify exist data to modify with URI segments to specify it. Http response code will be 200, 201. (200: updated, 201: created)

`DELETE`: Method to `delete` data from database. You must specify exist data to modify in body parameter. Http response code will be 204 whether deleted or not.

`OPTIONS`: not supported yet.

`HEAD`: not supported yet.

## JWT

The uri for JWT is set on `default.json -> "jwt" property`. You need `generate-uri` and `verify-uri` from the `jwt` property.

# Installation

## Config Direcotry Structure

```
configs
│    default.json
└─── controller
│    └    rest
│         └─── [some_jsons_for_rest_setting.json]
└─── services
│    └    db
│         └─── [some_jsons_for_db_sql_setting.json]
│    └    function
│         └─── [some_jsons_for_function_setting.json]
└─── model
     └─── [some_jsons_for_model_setting.json]    
```

## Docker

### Lateset Version:: 0.0.6

If you finished to set the `Prerequisites` files such that controller and model in some location with name `/path/to/configs/` (ex. `/home/mapi/configs`), you can run with following docker commands

```shell
~$ mkdir -p mapi/configs
# Copy Prerequisites configuration into configs
~$ cd mapi
mapi$ cp -r [/path/to/pre-configs/] ./configs
~$ docker run -d -p 3000:[PORT] -v ./configs:/app/configs --name mapi devwhoan/mapi:0.0.6
```
## Nodejs

### Latest Version: 0.0.6

* The developed environment uses `Nodejs 16.16.0`

If you want to modify and change some codes or whatever, download the code, and just run the nodejs.

As I commented uphead, you need to set `Prerequisites` for running the node process.

```shell
~$ git clone https://github.com/dev-whoan/mapi.git
~$ cd mapi
# Copy Prerequisites configuration into configs
mapi$ mkdir configs
mapi$ cp -r [/path/to/pre-configs/] ./configs

mapi$ npm install
mapi$ npm start
```
