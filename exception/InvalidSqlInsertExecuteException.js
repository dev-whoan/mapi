class InvalidSqlInsertExecuteException extends Error{
    constructor(message){
        super(message);
        this.name = 'InvalidSqlInsertExecuteException';
    }    
}

export default InvalidSqlInsertExecuteException;