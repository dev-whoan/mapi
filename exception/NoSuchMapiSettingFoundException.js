class NoSuchMapiSettingFoundException extends Error{
    constructor(message){
        super(message);
        this.name = 'NoSuchMapiSettingFoundException';
    }    
}

export default NoSuchMapiSettingFoundException;