const kInitialLength = 100;

// this is a wrapper around a Uint32Array that lets you resize it (by reallocating and copying)
// constructor can be:
//   new UArray(len)
//   new UArray(len, options)
//   new UArray(otherUArray)
//   new UArray(otherUArray, options)
class UArray {
    constructor(length = 0, opts = {}) {
        if (length instanceof UArray) {
            // make copy of other UArray's data
            this.data = length.data.slice();
        } else {
            if (length === 0) {
                length = kInitialLength;
            }
            this.data = new Uint32Array(length);
        }
        let options = Object.assign({ditherAmount: 1000}, opts);
        this.ditherAmount = options.ditherAmount;
    }
    get length() {
        return this.data.length;
    }
    // resize, perserving existing data by copying to the newly allocated structure
    set length(newLength) {
        const data = this.data;
        if (newLength !== data.length) {
            const newData = new Uint32Array(newLength);
            const smallerLen = Math.min(newLength, data.length);
            for (let i = 0; i < smallerLen; i++) {
                newData[i] = data[i];
            }
            // make sure any extra is zeroed
            for (let i = smallerLen; i < newData.length; i++) {
                newData[i] = 0;
            }
            this.data = newData;
            return newData;
        } else {
            return data;
        }
    }
    // ensure we have at least this much length in the array
    // will grow the array in chunks, only when nessary
    ensureLength(len) {
        let delta = len - this.length;
        if (delta > 0) {
            // array is not big enough, grow it by ditherAmount
            this.length = len + this.ditherAmount;
        }
        return this.data;
    }
}

module.exports = { UArray };
