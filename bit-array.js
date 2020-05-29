const bitsPerUnit = 31;

class BitArray {
    constructor() {
        // bits are stored as 32-bit signed integers which means
        // we can only use 31-bits of data per array slot
        this.data = [];
        this.length = 0;
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
    // forward iterator
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
    // iterator for [index, value]
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
}

module.exports = { BitArray };
