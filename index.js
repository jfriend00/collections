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


// constantly sorted array
class SortedArray extends Array {
    constructor(data = [], options = {}) {
        super();
        // allow new SortedArray(options)
        if (!Array.isArray(data)) {
            options = data;
            data = [];
        }
        // insert constructor data into our array
        this.push(...data);
        if (typeof options.sort === "function") {
            this.compareFn = options.sort;
        } else if (typeof options.sort === "string") {
            switch(options.sort) {
                case "numbersAscending":
                    this.compareFn = compareNumbersAscending;
                    break;
                case "numbersDescending":
                    this.compareFn = compareNumbersDescending;
                    break;
                case "stringAscending":
                    this.compareFn = compareLocaleAscending;
                    break;
                case "stringDescending":
                    this.compareFn = compareLocaleDescending;
                    break;
                default:
                    throw new TypeError(`Unexpected options.sort value: ${options.sort}`);
            }
        } else {
            // default sort comparison is ascending numbers
            this.compareFn = compareNumbersAscending;
        }

        this.sort(this.compareFn);
    }
    add(item) {
        // insertion sort
        let rangeHigh = this.length;
        let rangeLow = 0;
        let index;
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
        // insert this item
        this.splice(rangeLow, 0, item);
        return rangeLow;
    }
    addMany(iterable) {
        for (let item of iterable) {
            this.push(item);
        }
        this.sort(this.compareFn);
    }
    toArray() {
        return Array.from(this);
    }
}


module.exports = { MapArray, MapSet,  SortedArray };
