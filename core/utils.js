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

export {
    getUTCTime, arrayToObject, arrayToMap, objectKeysToArray, objectValuesToArray,
    stringToBase64, base64ToString, stringToBase64UrlSafe, base64UrlSafeToString, hmac256
};