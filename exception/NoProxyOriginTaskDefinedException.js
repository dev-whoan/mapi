class NoProxyOriginTaskDefinedException extends Error{
    constructor(message){
        super(message);
        this.name = 'NoProxyOriginTaskDefinedException';
    }    
}

export default NoProxyOriginTaskDefinedException;