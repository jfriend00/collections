// return a random number between low and high (not including high)
function rand(low, high) {
    return Math.floor((Math.random() * (high - low)) + low);
}

// copy own properties from source to target (functions only)
// generally used for copying methods from a class prototype to an existing object
function enhance(source, target) {
    let descriptors = Object.getOwnPropertyDescriptors(source);
    for (let prop in descriptors) {
        if (typeof descriptors[prop].value !== "function") {
            delete descriptors[prop];
        }
    }
    Object.defineProperties(target, descriptors);
    return target;
}

// use external function so we don't create a closure inside of enhanceStatic
function callWithObj(fn) {
    return function(obj, ...args) {
        return fn.call(obj, ...args);
    }
}

// copy own properteis from source to target, but make them
// static properties that take the object as the first argument
function enhanceStatic(source, target) {
    let descriptors = Object.getOwnPropertyDescriptors(source);
    for (let prop in descriptors) {
        if (typeof descriptors[prop].value === "function") {
            let propertyObj = descriptors[prop];
            let fn = propertyObj.value;
            propertyObj.value = callWithObj(fn);
            Object.defineProperty(target, prop, propertyObj);
        }
    }
    return target;
}


module.exports = { rand, enhance, enhanceStatic };
