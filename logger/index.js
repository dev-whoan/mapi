import fs from 'fs';
import path from 'path';

import ConfigReader from '../configReader/configReader.js';
import API_TYPE from '../enum/apiType.js';

export default class Logger {
    
    constructor(level, caller){
        this.logSetting = ConfigReader.instance.getConfig()[API_TYPE.LOGGER];
        this.logFile = path.join(process.env.PWD, 'logs', 'mapi.log');
        this.logLevel = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        }

        this.level = level ? level : 'info';
        this.TAG = "[Mapi Logger]";
        this.caller = caller ? caller : '';
        this.tempMessage = null;
    }

    /* Call Only When Boot Up */
    initialize(){
        try{
            if(!fs.existsSync(this.logFile)){
                fs.writeFileSync(this.logFile, '', 'utf-8');
            }
        } catch (e){
            console.error("Internal error occured while creating mapi.log", e);
        }
    }

    log(msg){
        if(this.logLevel[this.level] < this.logLevel[this.logSetting.level])
            return;
        try {
            let prefix = this.TAG;
            prefix += `[${this.caller}]`
			if(this.logSetting['time-log'] === 'yes')
			{
                prefix += `(${new Date().toLocaleString()})`;
			}
            prefix += ': '

            const outstream = `${prefix} ${msg}`
            fs.appendFileSync(this.logFile, `${outstream}\r\n`, 'utf-8');
            console.log(outstream);
		}catch (e){
            console.error(e.stack || e);
            console.error("Unknown error occured while logging msg::\n", msg);
		}
    }

    debug(msg){
        if(this.logSetting.level) {
			switch(this.logSetting.level) {
			case "error": case "warn": case "info":
				return;
			}
		}

		switch(this.level)
		{
		case "debug":
			this.log(`[-DEBUG-] ${msg}`);
			break;
		}
    }

    info(msg){
        if(this.logSetting.level) {
			switch(this.logSetting.level) {
			case "error": case "warn":
				return;
			}
		}

		switch(this.level)
		{
		case "info": case "debug":
			this.log(msg);
			break;
		}
    }

    warn(msg){
        if(this.logSetting.level) {
			switch(this.logSetting.level) {
			case "error":
				return;
			}
		}

		switch(this.level)
		{
        case "info": case "warn": case "debug":
			this.log(`[*WARN*] ${msg}`);
			break;
		}
    }

    error(msg){
        switch(this.level)
		{
		case "info": case "warn": case "error": case "debug":
			this.log(`[**ERROR**] ${msg}`);
			break;
		}
    }

    temp(msg, doFlush){
        if(this.tempMessage != null) {
			if(doFlush)
			{
				warn(" --AUTO FLUSHING--: " + this.tempMessage);
				this.tempMessage = null;
				return;
			}

			if(msg != null)
				this.tempMessage += "\n" + msg;
		}else {
			if(msg != null)
				this.tempMessage = msg;
		}
    }

    flush(msgType){
        if(this.tempMessage != null)
		{
			if(msgType == "info")
				this.info(this.tempMessage);
			else if(msgType == "warn")
				this.warn(this.tempMessage);
			else if(msgType == "error")
				this.error(this.tempMessage);
			else if(msgType == "debug")
				this.debug(this.tempMessage);

			this.tempMessage = null;
		}
    }
}