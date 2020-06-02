const { mix, mixStatic, speciesCreate } = require('./utils.js');
const { BitArray } = require('./bit-array.js');


class ArrayEx extends Array {
    // run all requests in parallel, resolve to array of results
    mapParallel(fn, thisArg) {
        return Promise.all(this.map(fn, thisArg));
    }

    // run all requests in series, resolve to array of results
    async mapSeries(fn, thisArg) {
        const newArray = speciesCreate(this, ArrayEx);
        for (const item of this) {
            let newVal = await fn.call(thisArg, item, item, this);
            newArray.push(newVal);
        }
        return newArray;
    }

    // run all requests in series, don't keep track of results
    // returns promise with undefined resolved value, will reject if any call in the loop rejects
    async eachSeries(fn, thisArg) {
        for (const item of this) {
            await fn.call(thisArg, item, item, this);
        }
    }

    // not an async method, combines .filter() and .map() in one call
    // saves an intermediate copy of the array versus chaining .filter().map()
    filterMap(fn, thisArg) {
        const newArray = speciesCreate(this, ArrayEx);
        for (const item of this) {
            let newVal = fn.call(thisArg, item, item, this);
            if (newVal !== undefined) {
                newArray.push(newVal);
            }
        }
        return newArray;
    }

    // randomly order the array using Fisher-Yates Shuffle
    // this mutates the array in place
    shuffle() {
        let index = this.length, randomIndex, temp;
        while (index > 1) {
            randomIndex = Math.floor(Math.random() * index);
            --index;
            temp = this[index];
            this[index] = this[randomIndex];
            this[randomIndex] = temp;
        }
        return this;
    }

    // sort numerically in place
    // order is ascending or descending
    sortNumeric(order = "ascending") {
        const sortFn = order === "ascending" ? (a, b) => a - b : (a, b) => b - a;
        return this.sort(sortFn);
    }

    // append the contents of one or more arrays onto this one
    append(...arrays) {
        // remember insertion point
        let i = this.length;

        // calc new length so we can grow the array once
        let totalLength = this.length;
        for (let array of arrays) {
            totalLength += array.length;
        }
        this.length = totalLength;

        for (let array of arrays) {
            const numAdds = array.length;
            let j = 0;
            // grow the array all at once
            while (j < numAdds) {
                this[i++] = array[j++];
            }
        }
        return this;
    }

    // copy an array into another array, starting at pos
    // overwrites existing content, will cause target array to grow if needed
    copyInto(array, pos = 0) {
        const newLen = pos + array.length;
        if (newLen > this.length) {
            // grow our array, if necessary
            this.length = newLen;
        }
        let j = 0;
        let i = pos;
        while (j < array.length) {
            this[i++] = array[j++];
        }
    }

    // return a new array that has any duplicates removed
    // if no compareFn callback is passed, then
    //    duplicates are determined with ===
    // If a compareFn callback is passed, then it is
    // passed two values compareFn(a,b) and it must return true if
    // values are the same, false if not
    uniquify(compareFn) {
        const output = speciesCreate(this, ArrayEx);
        // if no compareFn, then use a Set as a more efficient shortuct
        if (typeof compareFn !== "function") {
            const set = new Set(this);
            for (let item of set) {
                output.push(item);
            }
        } else {
            // with a compareFn, we have to do brute force searching
            for (let item of this) {
                let found = false;
                for (let testItem of output) {
                    if (compareFn(item, testItem)) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    output.push(item);
                }
            }
        }
        return output;
    }

    // break an array up into chunks
    // the last chunk may have fewer items
    // returns an array of arrays
    chunk(chunkSize) {
        if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
            throw new TypeError('chunkSize must be a positive integer');
        }
        const output = speciesCreate(this, ArrayEx);
        const numChunks = Math.ceil(this.length / chunkSize);
        let index = 0;
        for (let i = 0; i < numChunks; i++) {
            output.push(this.slice(index, index + chunkSize));
            index += chunkSize;
        }
        return output;
    }

    // get max value in the array
    max() {
        if (!this.length) {
            throw new Error(`Can't call .max() on an empty array`);
        }
        let maxVal = this[0];
        for (let i = 1; i < this.length; i++) {
            if (this[i] > maxVal) {
                maxVal = this[i];
            }
        }
        return maxVal;
    }

    // get min value in the array
    min() {
        if (!this.length) {
            throw new Error(`Can't call .min() on an empty array`);
        }
        let minVal = this[0];
        for (let i = 1; i < this.length; i++) {
            if (this[i] < minVal) {
                minVal = this[i];
            }
        }
        return minVal;
    }

    // iterate backwards
    backward() {
        return {
            [Symbol.iterator]: () => {
                let i = this.length - 1;
                return {
                    next: () => {
                        if (i < 0) {
                            return {done: true};
                        } else {
                            return {value: this[i--], done: false};
                        }
                    }
                }
            }
        }
    }

    // iterate forward
    forward() {
        return this;    // core object already has appropriate forward
                        // [Symbol.iterator] property, so we can use it
    }

    // get an iterator that iterates the whole array in random order
    // If you modify the array while using this iterator, you will get
    // indeterminate results
    randoms() {
        return {
            [Symbol.iterator]: () => {
                // Make a bitArray the same length as our current array
                // all initialized to false
                const b = new BitArray();
                b.length = this.length;
                let randCntr = 0;
                let numCntr = 0;
                let remainingCopy;
                let remaining = this.length;

                return {
                    next: () => {
                        if (this.length === 0 || !remaining || (remainingCopy && remainingCopy.length === 0)) {
                            return {done: true};
                        } else {
                            if (!remainingCopy) {
                                const maxMisses = Math.max(Math.floor(this.length / 100), 10);
                                let misses = 0;
                                let index, val;
                                do {
                                    index = Math.floor(Math.random() * this.length);
                                    val = b.get(index);
                                    ++misses;
                                    ++randCntr;
                                }  while (val && misses < maxMisses);
                                if (!val) {
                                    ++numCntr;
                                    // mark this index as used
                                    b.set(index, true);
                                    --remaining;
                                    return {value: this[index], done: false};
                                } else {
                                    console.log(`Array Length ${this.length}, Total nums ${numCntr}, totalRandoms ${randCntr}, remaining hits = ${b.count(false)}`);
                                    // the idea here is that we will now make a smaller copy of
                                    // just the remaining indexes that haven't been used yet
                                    remainingCopy = Array.from(b.indexes(false));
                                }
                            }

                            // remainingCopy must be valid here
                            // get a random index into remainingCopy
                            let rindex = Math.floor(Math.random() * remainingCopy.length);
                            // get the main array index that corresponds to that remainingCopy index
                            let index = remainingCopy[rindex];
                            --remaining;
                            remainingCopy.splice(rindex, 1);        // remove index from remainingCopy
                            return {value: this[index], done: false};
                        }
                    }
                }
            }
        }
    }
    /*
    // this implementation is ridiculously slow for large arrays
    randoms() {
        return {
            [Symbol.iterator]: () => {
                const copy = this.slice();
                return {
                    next: () => {
                        if (copy.length === 0) {
                            return {done: true};
                        } else {
                            const randomIndex = Math.floor(Math.random() * copy.length);
                            const randomValue = copy[randomIndex];
                            // now remove this value from the copy
                            copy.splice(randomIndex, 1);
                            return {value: randomValue, done: false};
                        }
                    }
                }
            }
        }
    }
    */

    // create a map with array value as the map key and array index as the map value
    // so you can quickly look up a bunch of values in the array, but still get back
    // an array index (presumably for future array manipulation)
    // As soon as you modify the array in any way, this map is invalid
    // Once you have both the array and this map, you can efficiently look up a value
    // by either index or by value.
    createMapByIndex() {
        let map = new Map();
        for (const [index, item] of this.entries()) {
            map.set(item, index);
        }
        return map;
    }


}

// make static properties that take the array as the first argument
mixStatic(ArrayEx, ArrayEx.prototype);

// add ArrayEx methods to a regularArray object
ArrayEx.mix = function(regularArray) {
    return mix(regularArray, ArrayEx.prototype);
}

// create an ArrayEx object and fill it with a range
// of values from start (inclusive) to end (exclusive) incrementing by step
ArrayEx.range = function(start, end, step = 1) {
    const array = new ArrayEx();
    let val = start;
    if (step > 0) {
        if (start > end) {
            throw new Error('When step > 0, then you must have end > start');
        }
        while (val < end) {
            array.push(val);
            val += step;
        }
    } else if (step < 0) {
        if (start < end) {
            throw new Error('When step < 0, then you must have end < start');
        }
        while (val > end) {
            array.push(val);
            val += step;
        }
    } else {
        throw new Error('step cannot be zero')
    }
    return array;
}

// Create an ArrayEx object from a list of arguments
// Also allows you to create an ArrayEx with a single number in it
//   which you can't do with the constructor
ArrayEx.of = function(...items) {
    let arr = new ArrayEx();
    for (let item of items) {
        arr.push(item);
    }
    return arr;
}

// Note, this is only needed if you are passing an iterable that is
// not a sub-class of an array.  If it is a sub-class of an array, then
// you can just use Array.from() and it will create that sub-class for you
ArrayEx.from = function(iterable) {
    let arr = new ArrayEx();
    for (let item of iterable) {
        arr.push(item);
    }
    return arr;
}

ArrayEx.isArrayEx = function(obj) {
    return obj instanceof ArrayEx;
}

module.exports = { ArrayEx };
