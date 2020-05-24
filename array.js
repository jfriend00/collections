const { enhance, enhanceStatic } = require('./utils.js');

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
    // saves an intermediate copy of the arrayif you chain .filter().map()
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

    // append the contents of another array onto this one
    append(array) {
        const numAdds = array.length;
        let i = this.length;
        let j = 0;
        // grow the array all at once
        this.length = i + numAdds;
        while (j < numAdds) {
            this[i] = array[j];
            i++;
            j++;
        }
        return this;
    }
}

// make static properties that take the array as the first argument
enhanceStatic(ArrayEx.prototype, ArrayEx);

// add ArrayEx methods to a regularArray object
ArrayEx.enhance = function (regularArray) {
    return enhance(ArrayEx.prototype, regularArray);
}

module.exports = { ArrayEx};
