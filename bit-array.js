const bitsPerUnit = 31;

function verifyBoolean(target) {
    if (!(target === true || target === false)) {
        throw new TypeError('bitArray.indexes(boolean) must be passed a boolean');
    }
}

/* constructor accepts
     new BitArray()
     new BitArray(number) - this bits from this number will be used to initialize the bitArray
     new BitArray(string) - a string of 0's and 1's such as "10000101" which will be used
                            to initialize the BitArray.  The bitArray[0] bit is last in the string
*/

class BitArray {
    constructor(initial) {
        this.data = [];
        this.length = 0;
        if (typeof initial === "undefined") {
            return;
        }
        if (typeof initial === "number") {
            if (initial < 0) {
                throw new TypeError('BitArray constructor does not accept negative numbers');
            }
            initial = initial.toString(2);      // convert to binary string
        }
        if (typeof initial === "string") {
            // establish the length of the bitArray
            this.set(initial.length - 1, false);

            // now initialize all the true values
            let index = 0;
            for (let i = initial.length - 1; i >= 0; i--) {
                let chr = initial.charAt(i);
                if (chr === "1") {
                    this.set(index, true);
                } else if (chr !== "0") {
                    throw new TypeError(`BitArray constructor accepts a string of 1's and 0's - encountered illegal character ${chr}`)
                }
                ++index;
            }
        } else {
            throw new TypeError('BitArray constructor accepts new BitArray(), new BitArray(number) or new BitArray(string)');
        }
    }
    // calculate bit position
    // returns [i, mask]
    getPos(index) {
        let i = Math.floor(index / bitsPerUnit);
        let bit = index % bitsPerUnit;
        let mask = 1 << bit;
        return {i, bit, mask};
    }
    // get bit value from an index, returns boolean
    get(index) {
        if (index > this.length || index < 0) {
            throw new RangeError('bounds error on BitArray');
        }
        const {i, mask} = this.getPos(index);
        return !!(this.data[i] & mask);
    }
    // Set bit value by index
    // The bitArray is automatically grown to fit and any intervening values are
    // initialized to false.  This implementation is not sparse.  Uninitialized values will be
    // false, not undefined.
    // As such, you can pre-grow and pre-initialize an array with bitArray.set(1000, false);
    set(index, val) {
        if (index < 0) {
            throw new RangeError('bounds error on BitArray');
        }
        const {i, mask} = this.getPos(index);
        // auto-grow data to fit
        // see if we need to add onto the data array
        if (i >= this.data.length) {
            // fill new bit positions with zeroes
            for (let q = this.data.length; q < i; q++) {
                this.data.push(0);
            }
        }
        if (val) {
            this.data[i] |= mask;
        } else {
            this.data[i] &= ~mask;
        }
        // update bitArray length
        ++index;
        if (index > this.length) {
            this.length = index;
        }
    }

    // fill bitArray or range of bitArray with true/false
    // returns bitArray to allow chaining
    fill(value, start = 0, end = this.length) {
        if (start < 0 || start > end) {
            throw new RangeError('for bitArray.fill(value, start, end) start must be positive and less than or equal to end');
        }
        for (let i = start; i < end; i++) {
            this.set(i, value);
        }
        return this;
    }

    push(val) {
        this.set(this.length, val);
    }

    pop() {
        const origLength = this.length;
        if (!origLength) {
            return undefined;
        }
        let val = this.get(origLength - 1);
        --this.length;
        // now we have to determine if we should delete the last block from the array
        const { bit, i } = this.getPos(origLength - 1);
        // if we just popped off the lowest bit in the block, then the block is now empty
        // and we can drop it from the array
        if (bit === 0) {
            --this.data.length;
        }
        return val;
    }

    // add bit to the start of the array
    unshift(val) {
        // pre-grow the data array (if necessary by setting new length to be zero)
        // then, put the length back so our shifting is correct
        this.set(this.length, 0);
        --this.length;

        const data = this.data;
        const highBitMask = 1 << (bitsPerUnit - 1);
        const signBitMask = ~(1 << bitsPerUnit);
        let highBit, prevHighBit, newData;
        for (let i = 0; i < data.length; i++) {
            highBit = data[i] & highBitMask;            // isolate high bit
            newData = (data[i] << 1) & signBitMask;     // clear sign bit

            if (i === 0) {
                // if it's the first block, then add our val at the bottom
                if (val) {
                    newData |= 1;
                }
            } else {
                // if not the first block, then add the previous high bit carryover
                // at the bottom of the block
                if (prevHighBit) {
                    newData |= 1;
                }
            }
            prevHighBit = highBit;
            data[i] = newData;
        }
        ++this.length;          // count our new bit
    }

    // remove first bit from the array
    shift() {
        if (!this.length) {
            return undefined;
        }
        const val = this.get(0);
        const highBitMask = 1 << (bitsPerUnit - 1);
        // now we have to move every block down by one bit
        let data = this.data;
        let lowBit;
        for (let i = 0; i < data.length; i++) {
            lowBit = data[i] & 1;           // save lowBit
            data[i] >>>= 1;                 // zero-fill right shift
            // put lowBit into previous block
            if (i !== 0 && lowBit) {
                data[i - 1] |= highBitMask;    // this bit will have been previous zero-filled
            }
        }
        --this.length;
        // get info on last bit so we can see if we still need the last block of the array
        const { i } = this.getPos(this.length - 1);
        if (this.data.length > (i + 1)) {
            this.data.length = i + 1;
        }
        return val;
    }

    // find first index that has target value
    indexOf(target, fromIndex = 0) {
        verifyBoolean(target);
        for (let i = fromIndex; i < this.length; i++) {
            if (this.get(i) === target) {
                return i;
            }
        }
        return -1;
    }

    forEach(callback, thisArg = null) {
        if (typeof callback !== "function") {
            throw new TypeError('First argument to .forEach(fn) must be a callback function');
        }
        for (let [index, val] of this.entries()) {
            callback.call(thisArg, val, index, this);
        }
    }

    // get a string version of the whole bitArray -
    // useful for debug output or sending as JSON
    toString() {
        let output = "";
        for (let val of this) {
            output = (val ? "1" : "0") + output;
        }
        return output;
    }

    // default forward iterator
    // enables use of "for (let val of bitArray) {...}"
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index >= this.length) {
                    return {done: true};
                }
                return {done: false, value: this.get(index++)};
            }
        }
    }
    // a backward iteration of [index, val]
    backwardEntries() {
        return {
            [Symbol.iterator]: () => {
                let index = this.length - 1;
                return {
                    next: () => {
                        if (index < 0) {
                            return {done: true};
                        }
                        return {done: false, value: [index, this.get(index--)]};
                    }
                }
            }
        }
    }
    // iterator for [index, val]
    // enables use of "for (let [index, val] of bitArray) {...}"
    entries() {
        return {
            [Symbol.iterator]: () => {
                let index = 0;
                return {
                    next: () => {
                        if (index >= this.length) {
                            return {done: true};
                        }
                        let obj = {done: false, value: [index, this.get(index)]};
                        ++index;
                        return obj;
                    }
                }
            }
        }
    }
    // iterator for true or false indexes
    // the iterator supplies the indexes of all the desired values
    // the value itself is not returned since, by definition, you asked
    // for all true or all false so you know what the matching value is
    indexes(target) {
        verifyBoolean(target);
        return {
            [Symbol.iterator]: () => {
                let index = 0;
                return {
                    next: () => {
                        let val;
                        while(index < this.length) {
                            val = this.get(index);
                            if (val === target) {
                                return {done: false, value: index++};
                            }
                            ++index;
                        }
                        return {done: true};
                    }
                }
            }
        }
    }
}

module.exports = { BitArray };
