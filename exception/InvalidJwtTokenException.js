class InvalidJwtTokenException extends Error{
    constructor(message){
        super(message);
        this.name = 'InvalidJwtTokenException';
    }    
}

export default InvalidJwtTokenException;