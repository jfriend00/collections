const { BitArray } = require('../bit-array.js');
const { ArrayEx } = require('../array.js');
const assert = require('assert').strict;

const testLen = 1000;
// create random assorted of booleans in an array
let zeroes = (new Array(testLen)).fill(false);
let ones = (new Array(testLen)).fill(true);
let randomArray = ArrayEx.shuffle(zeroes.concat(ones));
console.log(`Using randomized boolean array, len = ${randomArray.length}`);

let b = new BitArray();
for (let [index, val] of randomArray.entries()) {
    b.set(index, val);
}

assert(b.length === testLen * 2, `Expected bitArray.length to be ${testLen * 2}, found ${b.length}`);

// test default iterator
let index = 0;
for (let val of b) {
    assert(val === randomArray[index], `bitArray[${index}] expected to be ${randomArray[index]}, found ${val}`);
    ++index;
}

// test .entries() iterator
for (let [index, val] of b.entries()) {
    assert(val === randomArray[index], `bitArray[${index}] expected to be ${randomArray[index]}, found ${val}`);
}

function testPushPop() {
    let b = new BitArray();
    ArrayEx.shuffle(randomArray);
    for (let val of randomArray) {
        b.push(val);
    }
    for (let [index, val] of b.entries()) {
        assert(val === randomArray[index], `At index ${index}, got ${val}, expected ${randomArray[index]}`);
    }
    assert(b.length === randomArray.length, `bitArray.length = ${b.length}, expected ${randomArray.length}`);
    let len = b.length;
    for (let i = len - 1; i >= 0; i--) {
        let val = b.pop();
        assert(val === randomArray[i], `At index ${i}, got ${val}, expected ${randomArray[i]}`);
    }
}

testPushPop();

console.log('BitArray tests passed');
