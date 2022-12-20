import Busboy from 'busboy';
import { randomFillSync } from 'crypto';

const random = () => {
    const buf = Buffer.alloc(16);
    return () => randomFillSync(buf).toString('hex');
};

import path from 'path';
import { fileURLToPath } from 'url';
import ConfigReader from '../../../core/configReader.js';
import API_TYPE from '../../../core/enum/apiType.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDirectory = path.join(__dirname, '..', '..', ConfigReader.instance.getConfig()[API_TYPE.FILE_TRANSFER]['base-directory']);

/*
https://gist.github.com/shobhitg/5b367f01b6daf46a0287
*/
export default class HostpathFileController{
    constructor(){
        this.files = [];
        this.buffers = {};
        this.params = [];
        this.info = [];
    }

    saveBufferToFile(){
        /*
            Step 1. Write File
        */
        /*
            const saveTo = path.join(os.tmpdir(), `busboy-upload-${random()}`);
            file.pipe(fs.createWriteStream(saveTo));
        */

        /*
            Step 2. Add the file info on Database
        */
       
        this.files.forEach( (item, index) => {
            console.log("writing..");
            const saveTo = path.join(baseDirectory, item.fileName);
            item.fileRaw.pipe(fs.createWriteStream(saveTo));
        });
        
    }

    fileHandler(param, file, info) {
        
    }

    finishHandler(req){
        console.log("** File Upload Finished");

        return 
    }

    errorHandler(req, busboy, resolve, reject){
        console.error("Error occured!")
        req.unpipe(busboy);
        reject();
    }

    /*
return new Promise((resolve, reject) => {
    const form = new Busboy({ headers: req.headers })
    const files = [] // create an empty array to hold the processed files
    const buffers = {} // create an empty object to contain the buffers
    form.on('file', (field, file, filename, enc, mime) => {
      buffers[field] = [] // add a new key to the buffers object
      file.on('data', data => {
        buffers[field].push(data)
      })
      file.on('end', () => {
        files.push({
          fileBuffer: Buffer.concat(buffers[field]),
          fileType: mime,
          fileName: filename,
          fileEnc: enc,
        })
      })
    })
    form.on('error', err => {
      reject(err)
    })
    form.on('finish', () => {
      resolve(files)
    })
    req.pipe(form) // pipe the request to the form handler
  })
    */
    async writeFile(req, fileInfo, modelObject){
        return new Promise((resolve, reject) => {
            const form = Busboy({ headers: req.headers })
            // const files = [] // create an empty array to hold the processed files
            // const buffers = {} // create an empty object to contain the buffers
            form.on('file', (param, file, info)=> {
                this.buffers[param] = [] // add a new key to the buffers object
                file.on('data', data => {
                    this.buffers[param].push(data)
                })
                file.on('end', () => {
                    this.files.push({
                        fileBuffer: Buffer.concat(this.buffers[param]),
                        fileType: info.mimeType,
                        fileName: info.filename,
                        fileEnc: info.encoding,
                        fileRaw: file
                    })
                })
            })
            form.on('error', err => {
                return this.errorHandler(req, form, null, reject);
            })
            req.on('aborted', () => {
                return this.errorHandler(req, form, null, reject);
            })
            form.on('finish', () => {
                try{
                    this.saveBufferToFile();
                    resolve(true);
                } catch (err) {
                    console.log("Fail to finish", err)
                    reject(err);
                }
            })
            req.pipe(form) // pipe the request to the form handler
        });

        // const busboy = Busboy({ headers: req.headers });
        // busboy.on('file', this.fileHandler);
        // busboy.on('close', () => {
        //     return this.finishHandler(req);
        // });
        // req.on('aborted', () => {
        //     return this.errorHandler(req, busboy);
        // });
        // req.on('error', () => {
        //     return this.errorHandler(req, busboy);
        // });
        // req.pipe(busboy);
    }

    async deleteFile(req, fileInfo, modelObject){

        return null;
    }
}