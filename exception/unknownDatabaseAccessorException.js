class UnknownDatabaseAccessorException extends Error{
    constructor(message){
        super(message);
        this.name = 'UnknownDatabaseAccessorException';
    }    
}

export default UnknownDatabaseAccessorException;