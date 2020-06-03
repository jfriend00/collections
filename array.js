const { mix, mixStatic, speciesCreate } = require('./utils.js');
const { BitArray } = require('./bit-array.js');
// environment variable that turns debug tracing on
const debugOn = process.env["DEBUG_ARRAYEX"] === "1";

function DBG(...args) {
    if (debugOn) {
        console.log(...args);
    }
}

// conditional include the performance measuring code
let Bench;
if (debugOn) {
    Bench = require('../measure').Bench;
}

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
    /*
    randoms() {
        return {
            [Symbol.iterator]: () => {
                // Make a bitArray the same length as our current array
                // all initialized to false
                let bTotal, bBitArray, bRemainingArray;
                if (debugOn) {
                    bTotal = new Bench().markBegin();
                    bBitArray = new Bench().markBegin();
                    bRemainingArray = new Bench();
                }

                const b = new BitArray();
                b.length = this.length;
                let bitArrayHits = 0;       // number of hits from bitArray
                let totalGuesses = 0;       // number of times we generated a random number (includes misses)
                let remainingCopy;
                let origRemainingCopyLength = 0;
                let origLength = this.length;
                let remaining = this.length;
                const portion = 0.07;         // when to switch over to remainingCopy
                const maxMisses = Math.max(Math.floor(this.length / 200), 10);
                let bucketIterator;

                return {
                    next: () => {
                        if (!remaining || this.length === 0) {
                            if (debugOn) {
                                DBG(`Array Length: ${this.length}, Total bitArray hits: ${bitArrayHits}, Max copy length: ${origRemainingCopyLength}, Total Guesses: ${totalGuesses}`);
                                bTotal.markEnd();
                                bBitArray.markEnd();
                                bRemainingArray.markEnd();
                                let totalMs = bTotal.ms;
                                if (totalMs === 0) {
                                    totalMs = 1;
                                }
                                DBG(`Total time: ${bTotal.formatSec(3)}, rate: ${(this.length / totalMs).toFixed(3)} items/ms, bitArray time: ${bBitArray.formatSec(3)}, remainingArray time: ${bRemainingArray.formatSec(3)}`);
                            }
                            return {done: true};
                        } else {
                            // Performance enhancement idea:
                            // Instead of putting all remaining items in one array, we could bucketize them
                            // into several buckets and use two random numbers, one to choose a bucket and one to
                            // choose an item in the bucket.  Then we remove one from the bucket, we don't have to
                            // move as many items in the array
                            if (!remainingCopy && (remaining / origLength > portion)) {
                                let misses = 0;
                                let index, val;
                                do {
                                    index = Math.floor(Math.random() * this.length);
                                    val = b.get(index);
                                    ++totalGuesses;
                                    ++misses;
                                }  while (val && misses < maxMisses);
                                if (!val) {
                                    ++bitArrayHits;
                                    // mark this index as used
                                    b.set(index, true);
                                    --remaining;
                                    return {value: this[index], done: false};
                                } else {
                                    DBG(`Hit maxMisses(${maxMisses}) with ${remaining} items left`);
                                }
                                // fall through into the code below that works with remainingCopy
                            }

                            // if we get here, we're done trying to find a false value in the bitArray
                            // so we're going to just collect all the remaining false indexes from
                            // the bitArray and put them into an actual array
                            if (!remainingCopy) {
                                if (debugOn) {
                                    bBitArray.markEnd();
                                    bRemainingArray.markBegin();
                                    if (remaining / origLength <= portion) {
                                        DBG(`Hit portion limit(${remaining}) with portion set to ${portion}`);
                                    }
                                }
                                const itemsPerBucket = 1000;
                                // remainingCopy = new BucketList(b.indexes(false), Math.floor(remaining / itemsPerBucket), remaining);
                                remainingCopy = new BucketList(b.indexes(false), 1, remaining);
                                origRemainingCopyLength = remainingCopy.length;
                                if (debugOn) {
                                    if (remaining !== origRemainingCopyLength) {
                                        DBG(`!!!! remaining !== bucket length, ${remaining} !== ${origRemainingCopyLength}`);
                                    }
                                }
                                remaining = origRemainingCopyLength;
                                bucketIterator = remainingCopy.randomItems()[Symbol.iterator]();
                            }
                            --remaining;
                            return bucketIterator.next();
                        }
                    }
                }
            }
        }
    }
    */
    randoms() {
        return {
            [Symbol.iterator]: () => {
                let bTotal;
                if (debugOn) {
                    bTotal = new Bench().markBegin();
                }
                // these next 4 lines are a lot faster than this.slice()
                const copy = new Array(this.length);
                for (let [i, item] of this.entries()) {
                    copy[i] = item;
                }
                let virtualLength = copy.length;
                return {
                    next: () => {
                        if (virtualLength === 0) {
                            if (debugOn) {
                                bTotal.markEnd();
                                let totalMs = bTotal.ms;
                                if (totalMs === 0) {
                                    totalMs = 1;
                                }
                                DBG(`Total time: ${bTotal.formatSec(3)}, rate: ${(copy.length / totalMs).toFixed(3)} items/ms`);
                            }
                            return {done: true};
                        } else {
                            // get a random value,
                            // swap it to the end of the array,
                            // decrement virtualLength
                            const randomIndex = Math.floor(Math.random() * virtualLength);
                            const randomValue = copy[randomIndex];
                            copy[randomIndex] = copy[virtualLength - 1];
                            copy[virtualLength - 1] = randomValue;
                            --virtualLength;
                            return {value: randomValue, done: false};
                        }
                    }
                }
            }
        }
    }

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
