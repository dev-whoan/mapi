class InvalidCrudOptionException extends Error{
    constructor(message){
        super(message);
        this.name = 'InvalidCrudOptionException';
    }    
}

export default InvalidCrudOptionException;