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

module.exports = { rand, enhance };
