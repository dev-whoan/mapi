import crypto from 'crypto';

const getUTCTime = () => {
    return new Date().toLocaleString('en-US', { timeZone: 'UTC' });
}

const arrayToObject = (array) => {
    const object = array.reduce((newObj, obj) => {
        newObj[obj] = true;
        return newObj;
    }, {});

    return object;
}

const objectKeysToArray = (object) => {
    return Object.keys(object);
}

const objectValuesToArray = (object) => {
    return Object.values(object);
}

const arrayToMap = (array) => {
    const map = array.reduce((newMap, obj) => {
        newMap.set(obj, true);
        return newMap;
    }, new Map)
    return map;
}

const insertAt = (arr, index, elem) => [
    ...arr.slice(0, index),
    elem,
    ...arr.slice(index)
];

const stringToBase64 = (message) => {
    console.log(message);
    return Buffer.from(message, 'utf8').toString('base64');
}

const base64ToString = (base64String) => {
    return Buffer.from(base64String, 'base64').toString('utf8');
}

const stringToBase64UrlSafe = (message) => {
    return Buffer.from(message, 'utf8').toString('base64url');
}

const base64UrlSafeToString = (base64UrlString) => {
    return Buffer.from(base64UrlString, 'base64url').toString('utf8');
}

const hmac256 = (data, secret) => {
    let hmac = crypto.createHmac('sha256', secret);

    hmac.write(data);
    hmac.end();

    return hmac.read().toString('base64url');
}

const hash_md5 = (message) => {
    return crypto.createHash('md5').update(message).digest('hex');
}

const hash_sha256 = (message) => {
    return crypto.createHash('sha256').update(message).digest('hex');
}

export {
    getUTCTime, arrayToObject, arrayToMap, objectKeysToArray, objectValuesToArray,
    insertAt,
    stringToBase64, base64ToString, stringToBase64UrlSafe, base64UrlSafeToString,
    hmac256, hash_md5, hash_sha256
};