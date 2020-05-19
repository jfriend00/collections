// these are TC39-proposed methods as of May 2020: https://github.com/tc39/proposal-set-methods#proposal
const standardSetMethods = [
    // creates new Set instance composed of items in both set and iterable
    ["intersection", function(iterable) {
        let newSet = new this.constructor();
        for (const item of iterable) {
            if (this.has(item)) {
                newSet.add(item);
            }
        }
        return newSet;
    }],
    // creates new Set instance as union of both set and iterable
    ["union", function(iterable) {
        let newSet = new this.constructor(this);
        for (const item of iterable) {
            newSet.add(item);
        }
        return newSet;
    }],
    // creates new Set of elements in original that are not present in iterable
    ["difference", function(iterable) {
        let newSet = new this.constructor(this);
        for (const item of iterable) {
            newSet.delete(item);
        }
        return newSet;
    }],
    // set of elements found only in one or the other, but not both
    ["symmetricDifference", function(iterable) {
        let newSet = new this.constructor(this);
        for (const item of iterable) {
            if (newSet.has(item)) {
                // if it's in both, remove it
                newSet.delete(item);
            } else {
                // if it's only in the iterable, add it
                newSet.add(item);
            }
        }
        return newSet;
    }],
    // determines if this set is a subset of the iterable
    // by determining if every item in this set is in the iterable
    ["isSubsetOf", function(iterable) {
        let targetSet = iterable instanceof Set ? iterable : new Set(iterable);
        for (const item of this) {
            if (!targetSet.has(item)) {
                return false;
            }
        }
        return true;
    }],
    // determines if this set is a superset of the iterable
    // by determining if every item in the iterable is in this set
    ["isSuperSetOf", function(iterable) {
        for (const item of iterable) {
            if (!this.has(item)) {
                return false;
            }
        }
        return true;
    }],
    // determines if this set has nothing in common with iterable
    ["isDisjointFrom", function(iterable) {
        for (const item of iterable) {
            if (this.has(item)) {
                return false;
            }
        }
        return true;
    }],
];

// As of May 2020, these are not yet on a standards track, but considered useful
const enhancedSetMethods = [
    // add all items in the arguments to the current Set
    ["addMany", function(...elements) {
        for (const item of elements) {
            this.add(item);
        }
        return this;
    }],
    // remove all items in the arguments from the current Set
    ["deleteMany", function(...elements) {
        for (const item of elements) {
            this.delete(item);
        }
        return this;
    }],
    // add the iterable collection to this Set
    ["addCollection", function(iterable) {
        for (const item of iterable) {
            this.add(item);
        }
        return this;
    }],
    // remove the iterable collection from this Set
    ["deleteCollection", function() {
        for (const item of iterable) {
            this.delete(item);
        }
        return this;
    }],
    // see if this Set and the iterable contain exactly the same elements (no extras on either side)
    ["equals", function(iterable) {
        // This implementation looks for three conditions to be equal:
        //   1) Both comparisons are unique sets
        //   2) Both unique sets are the same size
        //   3) Every item in the iterable is in this Set
        const targetSet = iterable instanceof Set ? iterable : new Set(iterable);
        if (targetSet.size != this.size) return false;
        for (const item of iterable) {
            if (!this.has(item)) {
                return false;
            }
        }
        return true;
    }],
];

function addMethods(obj, ...lists) {
    for (const array of lists)
        for (const [prop, method] of array) {
            // define methods as non-enumerable, non-configurable, non-writable
            // only add it if this property name not found on either the object or the prototype
            if (!s[prop]) {
                Object.defineProperty(s, prop, {value: method});
            }
        }
}

// you can call this on either an existing Set object or on the Set prototype
function polyfillSet(s) {
    addMethods(s, standardSetMethods);
}

// you can call this on either an existing Set object or on the Set prototype
function enhanceSet(s) {
    addMethods(s, standardSetMethods);
    addMethods(s, enhancedSetMethods);
}

module.exports = { polyfillSet, enhanceSet };
