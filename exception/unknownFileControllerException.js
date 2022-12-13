class UnknownFileControllerException extends Error{
    constructor(message){
        super(message);
        this.name = 'UnknownFileControllerException';
    }    
}

export default UnknownFileControllerException;