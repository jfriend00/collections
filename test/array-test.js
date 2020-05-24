const { ArrayEx } = require('../array.js');
const assert = require('assert').strict;

let a = new ArrayEx(0,1,2,3,4,5,6,7,8,9);
let len = a.length;
let results = new Map();
for (let i = 0; i < len; i++) {
    results.set(i, (new Array(len)).fill(0));
}

// const numIterations = 100_000_000;
const numIterations = 100_000;
for (let i = 0; i < numIterations; i++) {
    a.shuffle();
    // now record the count of where each value fell in the shuffled array
    for (let j = 0; j < len; j++) {
        let val = a[j];
        let data = results.get(val);
        ++data[j];
    }
}
console.log(`Running ${numIterations} iterations:`);
let avg = numIterations / len;
let maxDeviation = 0;
for (let [key, arr] of results) {
    let data = arr.map(cnt => {
        let percent = ((cnt - avg) / avg) * 100;
        maxDeviation = Math.max(Math.abs(percent), maxDeviation);
        let percentStr = percent.toFixed(3);
        return percent >= 0 ? ' ' + percentStr : percentStr;
    });
    console.log(`${key}: ${data.join(', ')}`);
}
console.log(`maxDeviation = ${maxDeviation.toFixed(3)}%`);


let b = new ArrayEx(0,1,2,3,4,5,6,7,8,9);
b.sortNumeric("descending");
assert.deepStrictEqual(b, new ArrayEx(9,8,7,6,5,4,3,2,1,0), `sortNumeric descending produced ${JSON.stringify(b)}`);
console.log('descending numeric sort correct');
b.sortNumeric("ascending");
assert.deepStrictEqual(b, new ArrayEx(0,1,2,3,4,5,6,7,8,9), `sortNumeric ascending produced ${JSON.stringify(b)}`);
console.log('ascending numeric sort correct');


let c = [0,1,2,3,4,5,6,7,8,9];
ArrayEx.enhance(c);
c.sortNumeric("descending");
assert.deepStrictEqual(c, [9,8,7,6,5,4,3,2,1,0], `sortNumeric descending produced ${JSON.stringify(c)}`);
console.log('enhanceArray() works');

let d = new ArrayEx(0,1,2);
d.append([3,4,5]);
assert.deepStrictEqual(d, new ArrayEx(0,1,2,3,4,5), `.append() produced ${JSON.stringify(d)}`);
console.log('.append() works');

let e = new Array(0,1,2);
ArrayEx.append(e, [3,4,5]);
assert.deepStrictEqual(e, new Array(0,1,2,3,4,5), `.append() produced ${JSON.stringify(e)}`);
console.log('.append() works');
