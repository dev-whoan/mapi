class InappropriateConfigKeyException extends Error{
    constructor(message){
        super(message);
        this.name = 'InappropriateConfigKeyException';
    }    
}

export default InappropriateConfigKeyException;