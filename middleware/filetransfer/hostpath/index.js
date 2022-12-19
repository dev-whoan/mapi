import Busboy from 'busboy';
import { randomFillSync } from 'crypto';

const random = () => {
    const buf = Buffer.alloc(16);
    return () => randomFillSync(buf).toString('hex');
};
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

    fileHandler(param, file, info){
        console.log("file     : ", file);
        console.log("req param: ", param);
        console.log("file info: ", info);
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
    }

    finishHandler(req){
        console.log("** File Upload Finished");

        return 
    }

    errorHandler(req, busboy){
        console.error("Error occured!")
        req.unpipe(busboy);
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
        const busboy = Busboy({ headers: req.headers });
        busboy.on('file', this.fileHandler);
        busboy.on('close', () => {
            return this.finishHandler(req);
        });
        req.on('aborted', () => {
            return this.errorHandler(req, busboy);
        });
        req.on('error', () => {
            return this.errorHandler(req, busboy);
        });
        req.pipe(busboy);
    }

    async deleteFile(req, fileInfo, modelObject){

        return null;
    }
}