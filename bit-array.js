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
}

module.exports = { BitArray };
