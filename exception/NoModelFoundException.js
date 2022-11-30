class NoModelFoundException extends Error{
    constructor(message){
        super(message);
        this.name = 'NoModelFoundException';
    }    
}

export default NoModelFoundException;