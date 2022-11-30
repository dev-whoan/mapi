class OutofProxyTaskIndexException extends Error{
    constructor(message){
        super(message);
        this.name = 'OutofProxyTaskIndexException';
    }    
}

export default OutofProxyTaskIndexException;