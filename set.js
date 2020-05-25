const { mix } = require('./utils.js');

// these are TC39-proposed methods as of May 2020: https://github.com/tc39/proposal-set-methods#proposal
class SetStd extends Set {
    // creates new Set instance composed of items in both set and iterable
    intersection(iterable) {
        let newSet = new this.constructor();
        for (const item of iterable) {
            if (this.has(item)) {
                newSet.add(item);
            }
        }
        return newSet;
    }

    // creates new Set instance as union of both set and iterable
    union(iterable) {
        let newSet = new this.constructor(this);
        for (const item of iterable) {
            newSet.add(item);
        }
        return newSet;
    }

    // creates new Set of elements in original that are not present in iterable
    difference(iterable) {
        let newSet = new this.constructor(this);
        for (const item of iterable) {
            newSet.delete(item);
        }
        return newSet;
    }

    // set of elements found only in one or the other, but not both
    symmetricDifference(iterable) {
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
    }

    // determines if this set is a subset of the iterable
    // by determining if every item in this set is in the iterable
    isSubsetOf(iterable) {
        let targetSet = iterable instanceof Set ? iterable : new Set(iterable);
        for (const item of this) {
            if (!targetSet.has(item)) {
                return false;
            }
        }
        return true;
    }

    // determines if this set is a superset of the iterable
    // by determining if every item in the iterable is in this set
    isSupersetOf(iterable) {
        for (const item of iterable) {
            if (!this.has(item)) {
                return false;
            }
        }
        return true;
    }

    // determines if this set has nothing in common with iterable
    isDisjointFrom(iterable) {
        for (const item of iterable) {
            if (this.has(item)) {
                return false;
            }
        }
        return true;
    }

    // Array-like methods

    // process this set and create a new set from return values
    map(fn, thisArg) {
        const newSet = new this.constructor();
        for (const item of this) {
            newSet.add(fn.call(thisArg, item, item, this));
        }
        return newSet;
    }

    // see if every item passed the callback test
    every(fn, thisArg) {
        for (const item of this) {
            if (fn.call(thisArg, item, item, this) === false) {
                return false;
            }
        }
        return true;
    }

    // if any item gets a true return value from the callback, then return true
    some(fn, thisArg) {
        for (const item of this) {
            if (fn.call(thisArg, item, item, this) === true) {
                return true;
            }
        }
        return false;
    }

    // join set items in a string (like array.join())
    join(separator) {
        return Array.from(this).join(separator);
    }

    // make new set of filtered items - return true to keep in the new set
    filter(fn, thisArg) {
        const newSet = new this.constructor();
        for (const item of this) {
            if (fn.call(thisArg, item, item, this) === true) {
                newSet.add(item);
            }
        }
        return newSet;
    }

    // same as array.reduce()
    reduce(fn, initialValue) {
        let first = true;
        let accumulator = initialValue;
        for (const item of this) {
            if (first && initialValue === undefined) {
                accumulator = item;
                first = false;
            } else {
                accumulator = fn(accumulator, item, item, this);
            }
        }
        return accumulator;
    }

    find(fn, thisArg) {
        for (const item of this) {
            if (fn.call(thisArg, item, item, this) === true) {
                return item;
            }
        }
    }
}

// As of May 2020, these are not yet on a standards track, but considered useful
class SetEx extends SetStd {
    // add all items in the arguments to the current Set
    addMany(...elements) {
        for (const item of elements) {
            this.add(item);
        }
        return this;
    }

    // remove all items in the arguments from the current Set
    deleteMany(...elements) {
        for (const item of elements) {
            this.delete(item);
        }
        return this;
    }

    // add the iterable collection to this Set
    addCollection(iterable) {
        for (const item of iterable) {
            this.add(item);
        }
        return this;
    }

    // remove the iterable collection from this Set
    deleteCollection(iterable) {
        for (const item of iterable) {
            this.delete(item);
        }
        return this;
    }

    // see if this Set and the iterable contain exactly the same elements (no extras on either side)
    // it uses the default iterator so for something like a Map, you should pass map.keys() or map.values()
    // depending upon what you want to compare to the Set
    equals(iterable) {
        // This implementation looks for three conditions to be equal:
        //   1) Both comparisons are unique sets
        //   2) Both unique sets are the same size
        //   3) Every item in the iterable is in this Set
        // Special note: If iterable is a collection with duplicates,
        //   it will never be equals to a Set
        let targetSet;
        let origSize;
        // optimization if iterable is already a Set
        if (iterable instanceof Set) {
            targetSet = iterable;
            origSize = targetSet.size;
        } else {
            targetSet = new Set();
            origSize = 0;
            // manually iterate iterable so we can count how many items
            // were originally there
            for (const item of iterable) {
                ++origSize;
                targetSet.add(item);
            }
        }
        if (targetSet.size != this.size || origSize !== this.size) return false;
        for (const item of iterable) {
            if (!this.has(item)) {
                return false;
            }
        }
        return true;
    }

    // Experimental:
    // Filter and map together
    // return undefined to filter result out, any other return value to
    // put that value in the resulting mapped set
    filterMap(fn, thisArg) {
        const newSet = new this.constructor();
        for (const item of this) {
            let newVal = fn.call(thisArg, item, item, this);
            if (newVal !== undefined) {
                newSet.add(newVal);
            }
        }
        return newSet;
    }

    // Experimental:
    // Make new set using async callback, running .map() callbacks serially
    async mapSeries(fn, thisArg) {
        const newSets = new this.constructor();
        for (const item of this) {
            let newVal = await fn.call(thisArg, item, item, this);
            newSet.add(newVal);
        }
        return newSet;
    }

    // Experimental:
    // Make new set using async callback, running .map() callbacks in parallel
    mapParallel(fn, thisArg) {
        return Promise.all(this.map(fn, thisArg)).then(results => {
            return new this.constructor(results);
        });
    }

}

// you can call this on either an existing Set object or on the Set prototype
SetStd.mix = function(s) {
    mix(s, SetStd.prototype);
}

// should only call this on an instance, not on a prototype (since these are non-standard)
SetEx.mix = function(s) {
    mix(s, SetStd.prototype);
    mix(s, SetEx.prototype);
}

// make the methods available statically by passing the object as the first arg
mixStatic(SetStd, SetStd.prototype);
mixStatic(SetEx, SetEx.prototype);

module.exports = { SetStd, SetEx };
