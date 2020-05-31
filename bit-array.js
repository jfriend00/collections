const { speciesCreate } = require('./utils.js');
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
     new BitArray(bitArray) - copy all data from a different bitArray
     new BitArray(Array)    - copy all data from a regular array of Booleans
     new BitArray({data: array, length: length}) - data format from bitArray.toArray()
*/

// secret property names used for our internal length and data variables to
// keep people from accidentally messing with them
const _lenName = Symbol('length');
const _dataName = Symbol('data');

class BitArray {
    constructor(initial) {
        // create non-enumerable length and data properties
        Object.defineProperty(this, _lenName, {value: 0, writable: true});
        Object.defineProperty(this, _dataName, {value: [], writable: true})

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
            this.length = initial.length;

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
        } else if (typeof initial === "object" && initial instanceof BitArray) {
            // clone a different BitArray
            if (initial[_dataName]) {
                this[_dataName] = initial[_dataName].slice();
                this[_lenName] = initial.length;
            } else {
                // if other BitArray was somehow loaded separately and thus has different symbols,
                // copy it the slow way bit by bit because we can't get direct access to the data
                this.length = initial.length;
                for (let [index, bit] of initial.entries()) {
                    this.set(index, bit);
                }
            }
        } else if (Array.isArray(initial)) {
            this._insert(0, initial.length, initial);
        } else if (typeof initial === "object" &&
                   Array.isArray(initial.data) &&
                   Number.isInteger(initial.length) &&
                   initial.length >= 0) {
           this[_dataName] = initial.data.slice();
           this.length = initial.length;
        } else {
            throw new TypeError('BitArray constructor accepts new BitArray(), new BitArray(number), newBitArray(array) or new BitArray(string)');
        }
    }

    get length() {
        return this[_lenName];
    }
    set length(len) {
        // update internal length
        this[_lenName] = len;
        const data = this[_dataName];
        // now see if the internal array needs to grow or shrink to fit new length
        let { i } = this.getPos(len - 1);
        let lastBlock = data.length - 1;
        if (i < lastBlock) {
            // shrink the array
            data.length = i + 1;
        } else if (i > lastBlock) {
            // grow the array and fill remaining bits with zero
            let origLength = data.length;
            data.length = i + 1;
            for (let j = origLength; j < data.length; j++) {
                data[j] = 0;
            }
        }
    }
    // calculate bit position
    // returns {i, bit, mask}
    // i is which actual array block the bit is in
    // bit is the numeric bit in that block
    // mask is a mask for that bit
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
        return !!(this[_dataName][i] & mask);
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
        const data = this[_dataName];
        // auto-grow data to fit
        // see if we need to add onto the data array
        if (i >= data.length) {
            // fill new bit positions with zeroes
            for (let q = data.length; q < i; q++) {
                data.push(0);
            }
        }
        if (val) {
            data[i] |= mask;
        } else {
            data[i] &= ~mask;
        }
        // update bitArray length
        ++index;
        if (index > this.length) {
            this[_lenName] = index;
        }
    }

    // fill bitArray or range of bitArray with true/false
    // will grow the array as needed
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
        if (!this.length) {
            return undefined;
        }
        let val = this.get(this.length - 1);
        --this.length;
        return val;
    }

    // add bit to the start of the array
    unshift(val) {
        // pre-grow the data array (if necessary by setting new length to be zero)
        ++this.length;

        const data = this[_dataName];
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
    }

    // remove first bit from the array
    shift() {
        if (!this.length) {
            return undefined;
        }
        const val = this.get(0);
        const highBitMask = 1 << (bitsPerUnit - 1);
        // now we have to move every block down by one bit
        let data = this[_dataName];
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

    // Useful for sending as JSON or storing somehow
    // Note: length has to be stored also because the array of data by
    // itself does not indicate how many 0's are part of the bitmap in the
    // last item of the array.
    //
    // There are 31 bits of the bitArray stored per array entry
    // This is because Javascript's bitwise operators are limited to
    // 31 bits of unsigned work, even though there are 53 bits available
    // in Number.MAX_SAFE_INTEGER.
    //
    // Note: The constructor will accept this object when creating a BitArray.
    toArray() {
        return {data: this[_dataName].slice(), length: this.length};
    }

    toJson() {
        return JSON.stringify(this.toArray());
    }

    /*
        copy a portion of the bitArray to a new bitArray

        begin
            Zero-based index at which to begin extraction.
            A negative index can be used, indicating an offset from the end of the sequence.
                slice(-2) extracts the last two elements in the sequence.
            If begin is undefined, slice begins from the index 0.
            If begin is greater than the index range of the sequence, an empty array is returned.
        end
            Zero-based index before which to end extraction. slice extracts up to but not
                including end. For example, slice(1,4) extracts the second element through
                the fourth element (elements indexed 1, 2, and 3).
            A negative index can be used, indicating an offset from the end of the sequence.
                slice(2,-1) extracts the third element through the second-to-last element in the sequence.
            If end is omitted, slice extracts through the end of the sequence (arr.length).
            If end is greater than the length of the sequence, slice extracts through to
                the end of the sequence (arr.length).
    */
    slice(begin = 0, end = this.length) {
        if (begin < 0) {
            begin = this.length + begin;
        }
        if (end < 0) {
            end = this.length + end;
        }
        if (end > this.length) {
            end = this.length;
        }
        if (end < 0 || begin < 0 || end <= begin) {
            return speciesCreate(this, BitArray);      // return empty bitArray
        }
        // optimization for a full copy
        if (begin === 0 && end === this.length) {
            speciesCreate(this, BitArray, this);       // return full copy
        }
        let b = speciesCreate(this, BitArray);         // create empty bitArray that we will populate
        // set size of new BitArray
        b.set(end - begin - 1, 0);

        for (let j = 0, i = begin; i < end; j++, i++) {
            b.set(j, this.get(i));
        }
        return b;
    }


    // remove bits from the array by copying all the bits after the removed
    // spot down by cnt spaces
    _remove(start, cnt) {
        let src = start + cnt;
        let dest = start;
        const len = this.length;
        while (src < len) {
            let val = this.get(src);
            this.set(dest, val);
            ++src;
            ++dest;
        }
        // shrink the array for the removed bits
        this.length = len - cnt;
        return this;
    }

    // insert bits into the array by moving all the bits after the insertion point up
    _insert(start, cnt, data) {
        if (cnt === 0) return this;
        if (data && !Array.isArray(data)) {
            throw new TypeError(`data passed to _insert() must be a regular array`);
        }
        if (data && data.length < cnt) {
            throw new RangeError(`data passed to _insert() is not at least cnt  in length`);
        }
        if (cnt < 0) {
            throw new RangeError(`cnt for _insert() can't be negative`);
        }
        if (start > this.length) {
            throw new RangeError(`start for _insert() is beyond end of the array`);
        }
        // grow the array to fit the new bits
        this.length += cnt;

        // starting at the end of the array - cnt, copy from there to the end of the array
        // decrementing src and target as we go
        let dest = this.length - 1;
        let src = dest - cnt;
        let newBitLimit = start + cnt;
        let dataIndex = cnt - 1;    // start from the end
        while (src >= start) {
            this.set(dest, this.get(src));
            // clear the value where the inserted bits will be
            if (src < newBitLimit) {
                if (data) {
                    this.set(src, data[dataIndex--]);
                } else {
                    this.set(src, false);
                }
            }
            --src;
            --dest;
        }
        return this;
    }

    // remove bits from the array
    // optionally return the bits in a new bitArray
    splice(start, deleteCount, returnData = false) {
        if (start < 0) {
            start = this.length + start;
        }
        if (start + deleteCount > this.length) {
            deleteCount = this.length - start;
        }
        if (start < 0 || start >= this.length || deleteCount <= 0) {
            if (returnData) {
                // return empty BitArray
                return speciesCreate(this, BitArray);
            } else {
                return;
            }
        }
        let b;
        if (returnData) {
            b = speciesCreate(this, BitArray);
        }
        // copy down bits from above the deleteCount position to start position
        let src = start + deleteCount;
        let dest = start;
        let i = 0;
        while (src < this.length) {
            let val = this.get(src);
            if (b) {
                b.set(i, val);
            }
            this.set(dest, val);
            ++dest;
            ++src;
            ++i;
        }
        this.length -= deleteCount;
        if (b) {
            return b;
        }
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
                        return {done: false, value: [index, this.get(index++)]};
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
