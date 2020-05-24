const { mix, mixStatic } = require('./utils.js');

class ArrayEx extends Array {
    // run all requests in parallel, resolve to array of results
    mapParallel(fn, thisArg) {
        return Promise.all(this.map(fn, thisArg));
    }

    // run all requests in series, resolve to array of results
    async mapSeries(fn, thisArg) {
        const newArray = new this.constructor();
        for (const item of this) {
            let newVal = await fn.call(thisArg, item, item, this);
            newArray.push(newVal);
        }
        return newArray;
    }

    // run all requests in series, don't keep track of results
    async eachSeries(fn, thisArg) {
        for (const item of this) {
            await fn.call(thisArg, item, item, this);
        }
    }

    // not an async method, combines .filter() and .map() in one call
    // saves an intermediate copy of the array versus chaining .filter().map()
    filterMap(fn, thisArg) {
        const newArray = new this.constructor();
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

    // copy an array into another array, starting as pos
    // overwrites existing content
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
        if (!compareFn) {
            const set = new Set(this);
            const output = new this.constructor();
            for (let item of set) {
                output.push(item);
            }
            return output;
        } else {
            const output = new this.constructor();
            for (let i = 0; i < this.length; i++) {
                const item = this[i];
                let found = false;
                for (let j = 0; j < output.length; j++) {
                    if (compareFn(item, output[j])) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    output.push(item);
                }
            }
            return output;
        }
    }

    // break an array up into chunks
    // the last chunk may have fewer items
    // returns an array of arrays
    chunk(chunkSize) {
        const output = new this.constructor();
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
    // The iterator works on a copy of the array so changes to the array after
    //   getting the iterator do not affect it
    randoms() {
        return {
            [Symbol.iterator]: () => {
                let copy = this.slice();
                return {
                    next: () => {
                        if (copy.length === 0) {
                            return {done: true};
                        } else {
                            let randomIndex = Math.floor(Math.random() * copy.length);
                            let randomValue = copy[randomIndex];
                            // now remove this value from the copy
                            copy.splice(randomIndex, 1);
                            return {value: randomValue, done: false};
                        }
                    }
                }
            }
        }
    }



}

// make static properties that take the array as the first argument
mixStatic(ArrayEx, ArrayEx.prototype);

// add ArrayEx methods to a regularArray object
ArrayEx.mix = function(regularArray) {
    return mix(regularArray, ArrayEx.prototype);
}

// Create an ArrayEx object from any iterable
// Also allows you to create an ArrayEx with a single number in it
//   which you can't do with the constructor
ArrayEx.from = function(iterable) {
    let arr = new ArrayEx();
    for (let item of iterable) {
        arr.push(item);
    }
    return arr;
}

module.exports = { ArrayEx };
