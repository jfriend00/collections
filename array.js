class ArrayEx extends Array {
    mapParallel(fn, thisArg) {
        return Promise.all(this.map(fn, thisArg));
    }
    async mapSeries(fn, thisArg) {
        const newArray = new this.constructor();
        for (const item of this) {
            let newVal = await fn.call(thisArg, item, item, this);
            newArray.push(newVal);
        }
        return newArray;
    }
    async eachSeries(fn, thisArg) {
        for (const item of this) {
            await fn.call(thisArg, item, item, this);
        }
    }
    // not an async method, combines .filter() and .map() in one call
    // saves an intermediate copy of the array
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
}

module.exports = { ArrayEx };
