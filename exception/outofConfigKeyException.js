class OutofConfigKeyException extends Error{
    constructor(message){
        super(message);
        this.name = 'OutofConfigKeyException';
    }    
}

export default OutofConfigKeyException;