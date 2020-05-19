// subclass of a Map where each value is an Array of values
// Rather than .set(key, val), you call .add(key, val) to add this val
// to the array for that key.
// Note because this is derived from Map and doesn't override any Map methods,
//   you can get the Array that is the value and manipulate it directly
// Do not put items in this collection that are not Arrays or
//   add/remove will not work properly if called on that key
class MapArray extends Map {
    add(key, val) {
        let array = this.get(key);
        if (array) {
            array.push(val);
        } else {
            array = [val];
            this.set(key, array);
        }
    }

    // remove a specific value from the array for a specific key (removes the first one)
    // if all is true, then remove all occurrences of that value in the array
    // returns true/false based on whether something was removed or not
    remove(key, val, all = false) {
        const array = this.get(key);
        if (array) {
            let index = 0, found = false;
            while ((index = array.indexOf(val, index)) !== -1) {
                found = true;
                array.splice(index, 1);
                if (!all) {
                    break;
                }
            }
            return found;
        } else {
            return false;
        }
    }

    // tells you if a key has a particular value in its collection
    hasVal(key, val) {
        const array = this.get(key);
        if (array) {
            return array.includes(val);
        } else {
            return false;
        }
    }
}

// subclass of a Map where each value is a Set of values
// Rather than .set(key, val), you call .add(key, val) to add this value
// to the Set for that key
// Note because this is derived from Map and doesn't override any Map methods,
//   you can get the Set that is the value and manipulate it directly
// Do not put items in this collection that are not Sets or
//   add/remove will not work properly if called on that key
class MapSet extends Map {
    add(key, val) {
        let set = this.get(key);
        if (set) {
            set.add(val);
        } else {
            set = new Set([val]);
            this.set(key, set);
        }
    }

    // remove a specific value from the set for a specific key
    // returns true/false based on whether something was removed or not
    remove(key, val) {
        const set = this.get(key);
        if (set) {
            return set.delete(val);
        }
        return false;
    }

    // tells you if a key has a particular value in its collection
    hasVal(key, val) {
        const set = this.get(key);
        if (set) {
            return set.has(val);
        } else {
            return false;
        }
    }
}

// comparison function returns:
//    < 0 then a < b
//      0 then a === b
//    > 0 then a > b
function compareNumbersAscending(a, b) {
    return a - b;
}

function compareNumbersDescending(a, b) {
    return b - a;
}

function compareLocaleAscending(a, b) {
    return a.localeCompare(b);
}

function compareLocaleDescending(a, b) {
    return b.localeCompare(a);
}

function isIterable(obj) {
  // checks for null and undefined
  if (obj == null) {
    return false;
  }
  return typeof obj[Symbol.iterator] === 'function';
}

// constantly sorted array
// can be called as:
//    new SortedArray()
//    new SortedArray(n)
//    new SortedArray(n, options)
//    new SortedArray(iterable)
//    new SortedArray(options)
//    new SortedArray(iterable, options)
class SortedArray extends Array {
    // Be careful here because array methods that create new arrays (like .splice() or many others)
    // will call new SortedArray(n) in an attempt to return an array of our type
    constructor(iterable = [], options = {}) {
        // test for new SortedArray(n)
        const hasNumber = typeof iterable === "number";
        if (hasNumber) {
            super(iterable);
        } else {
            super();
            // handle various other calling conventions
            if (!isIterable(iterable)) {
                options = iterable;
                iterable = [];
            }
        }
        if (typeof options !== "object") {
            throw new TypeError('Expecting iterable or object as first argument to SortedArray() constructor');
        }

        let compareFn;

        // insert constructor data into our array
        if (typeof options.sort === "function") {
            compareFn = options.sort;
        } else if (typeof options.sort === "string") {
            switch(options.sort) {
                case "numbersAscending":
                    compareFn = compareNumbersAscending;
                    break;
                case "numbersDescending":
                    compareFn = compareNumbersDescending;
                    break;
                case "stringAscending":
                    compareFn = compareLocaleAscending;
                    break;
                case "stringDescending":
                    compareFn = compareLocaleDescending;
                    break;
                default:
                    throw new TypeError(`Unexpected options.sort value: ${options.sort}`);
            }
        } else {
            // default sort comparison is ascending numbers
            compareFn = compareNumbersAscending;
        }
        // create compareFn property as non-enumerable and non-changable so poorly written
        // array iteration code doesn't see the compareFn function as an array element
        Object.defineProperty(this, "compareFn", {value: compareFn});

        // now add initial elements (if there are any)
        if (!hasNumber) {
            this.addMany(iterable);
        }
    }

    // add a single item
    // returns the index where it was added
    add(item) {
        // binary search for the insertion point in the already sorted array
        let rangeHigh = this.length;
        let rangeLow = 0;
        let index;
        // in this algorithm, we know the target insertion point is between
        // rangeLow and rangeHigh (including rangeLow, but not including rangeHigh)
        while (rangeLow < rangeHigh) {
            index = Math.floor((rangeLow + rangeHigh) / 2);
            let comp = this.compareFn(item, this[index]);
            if (comp < 0) {
                // item < arrayVal
                rangeHigh = index;
            } else if (comp > 0){
                // item > arrayVal
                rangeLow = index + 1;
            } else {
                // item === arrayVal, insert it right here
                rangeLow = index;
                break;
            }
        }
        // insert this item in the precise location
        this.splice(rangeLow, 0, item);
        return rangeLow;
    }

    // Add multiple items from an iterable
    addMany(iterable) {
        for (let item of iterable) {
            this.push(item);
        }
        this.updateSort();
        return this;
    }

    // get plain array copy of the data
    // you would not typically need this because the object itself behaves as an array
    toArray() {
        return Array.from(this);
    }

    // You can use this to sort the whole array after manually manipulating the array
    // In general, you can just use .add() or .addMany(), and the sort is automatically
    // maintained, but if you do have a reason to manually manipulate the array,
    // you can update the sort with this
    updateSort() {
        this.sort(this.compareFn);
        return this;
    }
}


module.exports = { MapArray, MapSet,  SortedArray };
