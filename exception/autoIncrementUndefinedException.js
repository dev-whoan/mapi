class AutoIncrementUndefinedException extends Error{
    constructor(message){
        super(message);
        this.name = 'AutoIncrementUndefinedException';
    }    
}

export default AutoIncrementUndefinedException;