class NullOrUndefinedException extends Error{
    constructor(message){
        super(message);
        this.name = 'NullOrUndefinedException';
    }    
}

export default NullOrUndefinedException;