const { speciesCreate } = require('./utils.js');
const { UArray } = require('./uarray.js');

const bitsPerUnit = 31;
const allBitsOn = 0b1111111111111111111111111111111;
// const highUsableBit = 1 << (bitsPerUnit - 1);
const highBitMask = 1 << (bitsPerUnit - 1);         // used for isolating high bit
const signBitMask = ~(1 << bitsPerUnit);            // used for clearing sign bit after <<

function verifyBoolean(target) {
    if (typeof target !== "boolean") {
        throw new TypeError('argument must be a boolean');
    }
}

function isBitArrayLike(obj) {
    return obj && (obj instanceof BitArray || (
        typeof obj === "object" &&
        typeof obj.length === "number" &&
        typeof obj.indexes === "function"));
}

/* constructor accepts
     new BitArray()
     new BitArray(number) - the bits from this number will be used to initialize the bitArray.
                            max value is 31 bits or 2,147,483,647
     new BitArray(string) - a string of 0's and 1's such as "10000101" which will be used
                            to initialize the BitArray.  The bitArray[0] bit is last in the string
                            (the way that binary numbers are displayed)
     new BitArray(bitArray) - copy all data from a different bitArray
     new BitArray(Array)    - copy all data from a regular array of Booleans
     new BitArray({data: array, length: length}) - data format from bitArray.toArray()
*/

// semi-secret property names used for our internal length and data variables to
// keep people from accidentally messing with them
const kLenName = Symbol('length');
const kDataName = Symbol('data');

class BitArray {
    constructor(initial) {
        // create non-enumerable length and data properties
        Object.defineProperty(this, kLenName, {value: 0, writable: true});
        Object.defineProperty(this, kDataName, {value: new UArray(), writable: true});

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
            this[kDataName].ensureLength(initial.length);
            for (let i = initial.length - 1; i >= 0; i--) {
                let chr = initial.charAt(i);
                if (chr === "1") {
                    this.set(index, true);
                } else if (chr !== "0") {
                    throw new TypeError(`BitArray constructor accepts a string of 1's and 0's - encountered illegal character ${chr}`)
                }
                ++index;
            }
        } else if (Array.isArray(initial)) {
            // array of booleans
            this._insert(0, initial.length, initial);
        } else if (isBitArrayLike(initial)) {
            // At this point, it appears to be a bitArray-like object and has the minimum number of
            //   properties to clone it
            // If we have access to the internal data (via our semi-private properties), then
            //   use those as a shortcut for cloning
            if (initial[kDataName]) {
                this[kDataName] = new UArray(initial[kDataName]);
                this[kLenName] = initial.length;
            } else {
                // if other BitArray was somehow loaded separately and thus has different symbols,
                // copy it the slow way bit by bit because we can't get direct access to the data
                this.length = initial.length;
                // since all bits are initialized to false in the new bitArray,
                // we only need to "set" the true ones (saving time on calculations)
                for (let i of initial.indexes(true)) {
                    this.set(i, true);
                }
            }
        } else if (typeof initial === "object" &&
                   Array.isArray(initial.data) &&
                   Number.isInteger(initial.length) &&
                   initial.length >= 0) {
           // check the incoming data to make sure that none of the values exceed 31 bits
           // because that could cause unexpected results and we're only using 31 bits
           for (let [index, val] of initial.data.entries()) {
               if (val > allBitsOn) {
                   throw new RangeError(`Incoming array of data contains a value ${val} that exceeds ${bitsPerUnit} bits in position ${index}`);
               }
           }
           // make sure UArray is big enough, then copy data over
           const data = this[kDataName].ensureLength(initial.data.length);
           for (let i = 0; i < initial.data.length; i++) {
               data[i] = initial.data[i];
           }

           this.length = initial.length;
        } else {
            throw new TypeError('Invalid arguments to constructor');
        }
    }

    // The length property may be set or retrieved.  This represents the number of bits in the
    // BitArray.  If you set it, it will shrink or grow the underlying storage to fit.  New bits
    // added to the array by setting the length to a longer value will be initialized to false.
    // This is a logical length value that is separate from the underlying storage, but setting
    // this logical length value may cause the underlying storage to be expanded or contracted
    get length() {
        return this[kLenName];
    }

    set length(len) {
        // update internal length
        this[kLenName] = len;
        if (len === 0) {
            this[kDataName].ensureLength(0);
            return;
        }

        let { i, mask, bit } = this.getPos(len - 1);
        const data = this[kDataName].ensureLength(i);

        /*

        // now see if the internal array needs to grow or shrink to fit new length
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
        */
        // in this last block, clear any bits above our last bit
        data[i] &= ((mask * 2) - 1);
    }

    // trim any extra storage out of the Uint32Array
    // If it needs to change size, it will have to reallocate and copy the underlying Uint32Array
    trim() {
        const data = this[kDataName];
        let neededLength = Math.ceil(this.length / bitsPerUnit);
        data.length = neededLength;
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
        return !!(this[kDataName].data[i] & mask);
    }

    // Set bit value by index
    // The bitArray is automatically grown to fit and any intervening values are
    // initialized to false.  This implementation is not sparse.  Uninitialized values will be
    // false, not undefined.
    set(index, val) {
        if (index < 0) {
            throw new RangeError('bounds error on BitArray');
        }
        const {i, mask} = this.getPos(index);
        const data = this[kDataName].ensureLength(i);
        if (val) {
            data[i] |= mask;
        } else {
            data[i] &= ~mask;
        }
        // update bitArray length
        ++index;
        if (index > this.length) {
            this[kLenName] = index;
        }
    }
    // fill bitArray or range of bitArray with true/false
    // will grow the array as needed
    // returns bitArray to allow chaining
    // Fills from start to end (not inclusive of the end index)
    // end defaults to the end of the bitArray
    // Note, bits in a bitArray are already initialized to false, so if you just increase
    // the length of the bitArray, those new bits will already be initialized to false
    fill(value, start = 0, end = this.length) {
        if (start < 0 || start > end) {
            throw new RangeError('for bitArray.fill(value, start, end) start must be positive and less than or equal to end');
        }
        if (end > this.length) {
            this.length = end;
        }
        const data = this[kDataName].data;
        let {i:startBlock, bit: startBit, mask: startMask} = this.getPos(start);
        let {i:endBlock, bit: endBit, mask: endMask} = this.getPos(end);

        // if start and end block are the same, just do it bit by bit
        if (startBlock === endBlock) {
            for (let i = start; i < end; i++) {
                this.set(i, value);
            }
        } else {
            // fill the rest of startBlock
            if (value) {
                // turn on bits at startBit and higher
                // where startMask is  000001000
                // make a mask like    111111000
                // so we can OR it in and turn on all the bits at or above startBit
                let mask = allBitsOn - ((2 ** startBit) - 1);
                data[startBlock] |= mask;
            } else {
                // turn off bits at startBit and higher
                // where startMask is  000001000
                // make a mask like    000000111
                // so we can AND it and turn off all the bits at or above startBit
                let mask = startMask - 1
                data[startBlock] &= mask;
            }
            ++startBlock;
            // intervening blocks (if any) get filled to all one bit value
            let fillValue = value ? allBitsOn : 0;
            while (startBlock < endBlock) {
                data[startBlock++] = fillValue;
            }
            if (value) {
                // turn on bits lower than endBit
                // so if endMask is 00001000
                // make a mask for  00000111
                // so we can OR those bits on
                let mask = endMask - 1;
                data[startBlock] |= mask;
            } else {
                // turn off bits lower than endBit
                // so if endMask is 00001000
                // make a mask for  11111000
                // so we can AND it to clear the low bits
                let mask = allBitsOn - (endMask - 1);
                data[endBlock] &= mask;
            }
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
        this._insert(0, 1, [val]);
    }

    // remove first bit from the array
    shift() {
        if (!this.length) {
            return undefined;
        }
        const val = this.get(0);
        this._remove(0, 1);
        return val;
    }

    // find first index that has target value, optionally starting at an index
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
    // Note: The bitArray constructor will accept this object when creating a BitArray.
    toArray() {
        const array = new Array(Math.ceil(this.length / bitsPerUnit));

        const data = this[kDataName].data;
        for (let i = 0, len = array.length; i < len; i++) {
            array[i] = data[i];
        }
        return {data: array, length: this.length};
    }

    // return an array of booleans that contains identical values to the bitArray
    toBooleanArray() {
        let results = new Array(this.length);
        for (let [index, val] of this.entries()) {
            results[index] = val;
        }
        return results;
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
            return speciesCreate(this, BitArray, this);       // return full copy
        }
        let b = speciesCreate(this, BitArray);         // create empty bitArray that we will populate
        // set size of new BitArray
        b.length = end - begin;

        // this could be sped up a bunch
        for (let j = 0, i = begin; i < end; j++, i++) {
            b.set(j, this.get(i));
        }
        return b;
    }

    // get a count of true or false bits
    count(target) {
        let cntr = 0;
        for (let val of this) {
            if (val === target) ++cntr;
        }
        return cntr;
    }

    _remove(start, cnt) {
        const len = this.length;
        // if start is past the end of cnt is zero, nothing to do
        if (start >= len || cnt === 0) {
            return this;
        }
        if (cnt < 0) {
            throw new TypeError('cnt passed to _remove() must not be negative');
        }
        if (start < 0) {
            throw new RangeError(`start passed to _remove() must not be negative`);
        }
        // if the block they are trying to remove extends past the end,
        // then there we can just truncate the bitArray, no copying is necessary
        if (start + cnt > len) {
            this.length = start;
            return this;
        }

        // For a remove, we start at the initial point of the deletion and
        // copy bits down into the deleted space until we get to the end
        // of the data

        // step 1, move start up to a block boundary so we are copying into
        // a full block
        let bitsLeftInBlock = bitsPerUnit - (start % bitsPerUnit);
        let srcIndex = start + cnt;
        let destIndex = start;
        for (let i = 0; i < bitsLeftInBlock; i++) {
            // if we hit the end of the bitArray, then we're done
            if (srcIndex + i > len) {
                this.length -= cnt;
                return this;
            }
            let srcBit = this.get(srcIndex + i);
            this.set(destIndex + i, srcBit);
            ++start;
        }
        // special case check here for we exactly ended after that block boundary
        // and thus have nothing more to do
        if (start + cnt > len) {
            this.length -= cnt;
            return this;
        }

        // the removal location is now perfectly aligned with a block boundary
        // so we are always filling whole dest blocks
        // and there are more existing bits to copy down
        let {i: destBlock, bit: destBit} = this.getPos(start);
        let {i: srcBlock, bit: srcBit, mask: srcMask} = this.getPos(start + cnt);
        const {i: lastBlock} = this.getPos(len);

        const data = this[kDataName].data;

        // lowBits are the bits in the first block that shouldn't get shifted
        const lowBitMask = srcMask - 1;                             // bits below the mask bit
        const lowBitClearMask = ~lowBitMask & signBitMask;          // how to clear lowBits

        /*  Steps in the loop:
            1) Get high bits from srcBlock into val
            2) Shift them down to start of block
            3) ++srcBlock
            4) If srcBlock still less than lastBlock,
            5) Get low bits from srcBlock into temp
            6) Shift lowbits to end of block
            7) Merge lowbits from temp into val
            8) Assign val into destBlock
        */

        // Note: we do not have to worry about clearing previously used
        // bits at the end because setting .length to a smaller number
        // will do that for us in the last block and any other unused
        // blocks are removed from the array

        // while still more srcBlocks to copy from, loop
        let val, lowBits;
        while (srcBlock <= lastBlock) {
            // Step 1 - get high bits from srcBlock
            val = data[srcBlock] & lowBitClearMask;

            // Step 2 - shift high bits down to start of block
            val >>>= srcBit;

            // Step 3 - increment srcBlock
            ++srcBlock;

            // Step 4 - Verify still more blocks to go
            if (srcBlock <= lastBlock) {
                // Step 5 - Get low bits from srcBlock
                lowBits = data[srcBlock] & lowBitMask;

                // Step 6 - Shift lowbits to end of block
                lowBits = (lowBits << (bitsPerUnit - srcBit)) & signBitMask;

                // Step 7 - Merge lowbits into val
                val |= lowBits;
            }
            // Step 8 - Assign val into destBlock
            data[destBlock] = val;
            ++destBlock;
        }
        // update length to reflect the bits we removed
        this.length -= cnt;
        return this;
    }

    // insert bits into the array by moving all the bits after the insertion point up
    // accepts an array of booleans as the data argument
    // insertData can be null, an Array of Booleans or another BitArray
    // insertIndex is the index in insertData to start inserting from - this allows you
    // to insert a portion of one BitArray into another
    _insert(start, cnt, insertData = null, insertIndex = 0) {
        if (cnt === 0) return this;
        if (start < 0) {
            throw new RangeError(`start passed to _insert() must not be negative`);
        }
        if (insertIndex < 0) {
            throw new RangeError(`insertIndex passed to _insert() must not be negative`);
        }
        let isInsertBitArray = false;
        if (insertData) {
            isInsertBitArray = isBitArrayLike(insertData);
            if (!Array.isArray(insertData) && !isInsertBitArray) {
                throw new TypeError(`data passed to _insert() must be a regular array or a BitArray`);
            }
            if (insertData.length - insertIndex < cnt) {
                throw new RangeError(`data passed to _insert() is not at least cnt + insertIndex in length`);
            }
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
        let deltaIndex = Math.floor(cnt / bitsPerUnit);
        let deltaBits = cnt % bitsPerUnit;

        const {i: startBlock, bit, mask} = this.getPos(start);
        const data = this[kDataName].data;

        // lowBits are the bits in the first block that shouldn't get shifted
        const lowBitMask = mask - 1;                                // bits below the mask bit
        const lowBitClearMask = ~lowBitMask & signBitMask;          // how to clear lowBits

        // lostBits are the bits that will get shift out
        const clearShift = bitsPerUnit - deltaBits;
        const lostBitMask = (allBitsOn >>> clearShift) << clearShift;      // ugly, but effective
        const lostBitClearMask = ~lostBitMask & signBitMask;

        let lowBits, val, lostBits;

        // We will copy the later bits that have to be moved first so we don't clobber
        // things as we move stuff, starting at the end of the original data and copying it up
        // to it's new end location

        let destBlock = Math.floor(this.length / bitsPerUnit);
        let srcBlock = destBlock - deltaIndex;  // block to copy from

        while (srcBlock >= startBlock) {
            val = data[srcBlock];                   // what we're starting with
            data[srcBlock] = 0;                     // clear the src block so the inserted space is zeroed
            lostBits = val & lostBitMask;           // bits we will lose when shifting
            if (srcBlock === startBlock) {
                // special case on first block because we have to mask out bits we aren't moving
                // and clear bits that should be left vacant
                lowBits = val & lowBitMask;

                // mask out any lost bits that are below the insertion point
                // because those will be preserved in the current block, not lost
                lostBits = lostBits & lowBitClearMask;

                // clear all low bits out so we don't shift any of them into our vacated bit positions
                val = val & lowBitClearMask;

                // shift the upper bits
                val = (val << deltaBits) & signBitMask;

                // put the modified bits back into the appropriate blocks
                data[destBlock] = val;
                data[srcBlock] |= lowBits;
            } else {
                val = (val << deltaBits) & signBitMask;
                data[destBlock] = val;
            }
            if (lostBits) {
                // put the lostBits back into the higher block we shifted already
                // by the way all this works, lostBits will be zero when destBlock is the last block
                // so we won't ever go off the end
                data[destBlock + 1] |= (lostBits >>> (bitsPerUnit - deltaBits));
            }
            --srcBlock;
            --destBlock;
        }

        // now insert the new data
        if (insertData) {
            let newVal;
            for (let i = 0; i < cnt; i++) {
                if (isInsertBitArray) {
                    // there is a performance improvement opportunity to do bulk copying
                    // between bitArrays if they are byte aligned
                    newVal = insertData.get(i + insertIndex);
                } else {
                    // must be regular array
                    newVal = insertData[i + insertIndex];
                }
                if (newVal) {
                    // only need to set an inserted Value if it's truthy
                    // as inserted bits are already initialized to false
                    this.set(start + i, newVal);
                }
            }
        }
        return this;
    }

    // remove bits from the array
    // optionally return the bits in a new bitArray
    splice(start, deleteCount, returnData = false) {
        let deletedBits;
        if (returnData) {
            deletedBits = this.slice(start, start + deleteCount);
        }
        this._remove(start, deleteCount);
        if (returnData) {
            return deletedBits;
        }
    }

    // default forward iterator
    // enables use of "for (let val of bitArray) {...}"
    // iterates the true/false values
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
    // for (let val of bitArray.indexes(true)) will iterate the indexes
    // of all the true values
    // for (let val of bitArray.indexes(false)) will iterate the indexes
    // of all the false values
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

    _op(src, callback) {
        if (!(src instanceof BitArray)) {
            throw new Error('Must pass a BitArray object and it must be from the same class installation');
        }
        const data1 = this[kDataName].data;
        const data2 = src[kDataName].data;
        let maxLen;
        let minLen;
        let longerData;
        if (data1.length >= data2.length) {
            maxLen = data1.length;
            minLen = data2.length;
            longerData = data1;
        } else {
            maxLen = data2.length;
            minLen = data1.length;
            longerData = data2;
        }
        const newData = new Array(maxLen);
        for (let i = 0; i < minLen; i++) {
            newData[i] = callback(data1[i], data2[i]);
        }
        // one of the arrays is not long enough for more comparison
        for (let i = minLen; i < maxLen; i++) {
            if (i < data1.length) {
                newData[i] = callback(data1[i], 0);
            } else {
                newData[i] = callback(0, data2[i]);
            }
        }
        return speciesCreate(this, BitArray, {length: Math.max(this.length, src.length), data: newData});
    }

    // do a logical or between two bitArrays
    // returns a new bitArray
    // If the two bitArrays are not the same length, then the result will
    // be as long as the longest of the two and any missing bits in the
    // shorter one will be assumed to be zero
    or(src) {
        return this._op(src, function(data1, data2) {
            return data1 | data2;
        });
    }

    and(src) {
        return this._op(src, function(data1, data2) {
            return data1 & data2;
        });
    }

    xor(src) {
        return this._op(src, function(data1, data2) {
            return data1 ^ data2;
        });
    }
}

module.exports = { BitArray };
