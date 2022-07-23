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

export {
    getUTCTime, arrayToObject, arrayToMap, objectKeysToArray, objectValuesToArray
};