import ConfigReader from '../../core/configReader.js';
import { stringToBase64UrlSafe, objectValuesToArray, objectKeysToArray, hmac256, base64UrlSafeToString } from '../../core/utils.js';
import NullOrUndefinedException from '../../exception/nullOrUndefinedException.js';
import InvalidJwtTokenException from '../../exception/InvalidJwtTokenException.js';

export default class JwtConfigObject{
    constructor(){
        this.baseObject = ConfigReader.instance.getConfig().jwt;
        this.jwtKeys = objectValuesToArray(this.baseObject.keys);
        this.signature = null;
        this.timestamp = Date.now();
        this.jwtvalue = null;
        this.header = null;
        this.payload = null;
        this.signature = null;
        this.payloadObject = {};
        this.headerObject = {};
    }

    createHeaderObject(header){
        if(header){
            this.header = payload;
            return;
        }
        this.headerObject = {
            alg: this.baseObject.alg,
            type: 'JWT'
        };
        this.header = stringToBase64UrlSafe(JSON.stringify(this.headerObject));
    }
    
    createPreparedPayloadObject(payload){
        if(payload){
            this.payload = payload;
            return;
        }
        
        for(let i = 0; i < this.jwtKeys.length; i++)
            this.payloadObject[this.jwtKeys[i]] = null;
        
        this.payloadObject = {
            'timestamp': this.timestamp
        };
    }

    createPayloadObject(data){
        this.payloadObject = {};
        this.createPreparedPayloadObject();

        let _keyArray = objectKeysToArray(data);
        let _value = objectValuesToArray(data);
        for(let i = 0; i < _keyArray.length; i++){
            this.payloadObject[_keyArray[i]] = _value[i];
        }
        this.payload = stringToBase64UrlSafe(JSON.stringify(this.payloadObject));
    }

    generateSignature(){
        if(!this.header || !this.payload){
            throw new NullOrUndefinedException(
                `JWT properties are not set. Header(${this.header}), Payload(${this.payload})`
            );
        }

        let _data = this.header + "." + this.payload;
        this.signature = hmac256(
            _data,
            this.baseObject.secret
        );
    }

    getJwtString(){
        if(!this.header || !this.payload || !this.signature){
            throw new NullOrUndefinedException(
                `JWT properties are not set. Header(${this.header}), Payload(${this.payload}), Signature(${this.signature})`
            );
        }

        return this.header + "." + this.payload + "." + this.signature;
    }

    verify(token){
        if(!token){
            throw new NullOrUndefinedException(
                `No token is given for verifying JWT.`
            );
        }
        let base64array = token.split('.');

        if(base64array.length != 3){
            throw new InvalidJwtTokenException(
                `Given token(${token}) is not type of JWT.`
            );
        }
        let _header = base64array[0];
        let _payload = base64array[1];
        let _signature = base64array[2];

        let _data = _header + "." + _payload;
        let _sign = hmac256(_data, this.baseObject.secret);
        if(_sign !== _signature){
            return false;
        }
        
        try{
            let _payloadObject = JSON.parse(base64UrlSafeToString(_payload));

            let _lifetime = this.baseObject.lifetime * 1000;
            let _now = Date.now();
            return (_payloadObject.timestamp + _lifetime >= _now)
        } catch {
            return false;
        }
    }
}