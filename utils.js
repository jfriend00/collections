// return a random number between low and high (not including high)
function rand(low, high) {
    return Math.floor((Math.random() * (high - low)) + low);
}

// Copy own properties from source to target (functions only)
// generally used for copying methods from a class prototype to an existing object
// Will not overwrite an existing property of the same name
function mix(target, source) {
    let descriptors = Object.getOwnPropertyDescriptors(source);
    for (let prop in descriptors) {
        if (target[prop] || typeof descriptors[prop].value !== "function") {
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

// copy own properties from source to target, but make them
// static properties that take the object as the first argument
function mixStatic(target, source) {
    let descriptors = Object.getOwnPropertyDescriptors(source);
    for (let prop in descriptors) {
        if (prop !== "constructor" && !target[prop] && typeof descriptors[prop].value === "function") {
            let propertyObj = descriptors[prop];
            let fn = propertyObj.value;
            propertyObj.value = callWithObj(fn);
            Object.defineProperty(target, prop, propertyObj);
        }
    }
    return target;
}

// create a new object using the class of an existing object (which might be a sub-class)
// by following the ECMAScript procedure except it leaves out the realm detection part
// See https://stackoverflow.com/questions/62010217/how-to-create-a-new-object-of-same-class-as-current-object-from-within-a-method#62010482 for details

// no real way to see if it's a real constructor from plain JS other than these two checks
//   unless you use new to execute it and use try/catch to catch errors
function isConstructor(f) {
    return typeof f === "function" && !!f.prototype;
}

function speciesCreate(originalObject, fallbackConstructor, ...args) {
    const {constructor} = originalObject;
    if (constructor) {
        const C = constructor[Symbol.species];
        if (isConstructor(C)) {
            return new C(...args);
        } else if (isConstructor(constructor)) {
            return new constructor(...args);
        }
    }
    return new fallbackConstructor(...args);
}

module.exports = { rand, mix, mixStatic, speciesCreate };
