import JwtConfigObject from "../../data/object/jwtConfigObject.js";

export default class JwtHandler {
    constructor(header, payload){
        this.jwtObject = new JwtConfigObject();
        this.jwtObject.createHeaderObject(header);
        this.jwtObject.createPreparedPayloadObject(payload);
    }

    setPayload(data){
        this.jwtObject.createPayloadObject(data);
    }

    generateSignature(){
        this.jwtObject.generateSignature();
    }

    getJwtString(){
        return this.jwtObject.getJwtString();
    }

    verify(token){
        try{
            return this.jwtObject.verify(token);    
        } catch (err) {
            return false;
        }
    }
}