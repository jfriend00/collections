const { BitArray } = require('../bit-array.js');
const { ArrayEx } = require('../array.js');
const assert = require('assert').strict;

function makeRandomBitArray(testLen = 2000) {
    // create random assorted of booleans in an array
    let zeroes = (new Array(testLen / 2)).fill(false);
    let ones = (new Array(testLen / 2)).fill(true);
    let r = ArrayEx.shuffle(zeroes.concat(ones));
    let b = new BitArray();
    for (let [index, val] of r.entries()) {
        b.set(index, val);
    }
    return b;
}

const testLen = 1000;
// create random assorted of booleans in an array
let zeroes = (new Array(testLen)).fill(false);
let ones = (new Array(testLen)).fill(true);
let randomArray = ArrayEx.shuffle(zeroes.concat(ones));

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

function testFill() {
    let b = new BitArray();
    const lowFill = 10;
    const highFill = 100;
    b.fill(true, lowFill, highFill);
    for (let i = 0; i < highFill; i++) {
        let val = b.get(i);
        if (i < lowFill) {
            assert(val === false, `Expecting value below fill to be false, found ${val}`);
        } else if (i < highFill) {
            assert(val === true, `Expecting value in fill to be true, found ${val}`);
        }
    }
}

function testShifts() {
    // test .unshift()

    let b = new BitArray();
    ArrayEx.shuffle(randomArray);
    for (let i = randomArray.length - 1; i >= 0; i--) {
        b.unshift(randomArray[i]);
    }
    assert(b.length === randomArray.length, `bitArray.length = ${b.length}, expected ${randomArray.length}`);
    for (let [i, val] of b.entries()) {
        assert(val === randomArray[i], `At index ${i}, got ${val}, expected ${randomArray[i]}`);
    }

    // now test out .shift()

    let i = 0;
    while (b.length) {
        let val = b.shift();
        assert(val === randomArray[i], `At index ${i}, got ${val}, expected ${randomArray[i]}`);
        i++;
    }
}

function testIndexes() {
    let b = makeRandomBitArray();
    let all = new Set();
    for (let index of b.indexes(true)) {
        assert(b.get(index) === true, `Expecting true at index ${index}, got false`);
        all.add(index);
    }
    for (let index of b.indexes(false)) {
        assert(b.get(index) === false, `Expecting false at index ${index}, got true`);
        all.add(index);
    }
    // make sure we got all indexes
    assert(all.size === b.length, `Found ${all.size} indexes, expecting ${b.length}`);
}

function testIndexOf() {
    let b = makeRandomBitArray();
    let all = new Set();
    let i = 0;
    while(true) {
        let index = b.indexOf(true, i);
        if (index < 0) {
            break;
        } else {
            assert(b.get(index) === true, `Expecting true at index ${index}, found false`);
            all.add(index);
            i = index + 1;
        }
    }
    i = 0;
    while(true) {
        let index = b.indexOf(false, i);
        if (index < 0) {
            break;
        } else {
            assert(b.get(index) === false, `Expecting true at index ${index}, found true`);
            all.add(index);
            i = index + 1;
        }
    }
    // make sure we got all indexes
    assert(all.size === b.length, `Found ${all.size} indexes, expecting ${b.length}`);
}

function testForEach() {
    let b = makeRandomBitArray();
    let all = new Set();
    let obj = {};
    b.forEach(function(val, index, array) {
        assert(this === obj, 'Expecting this === obj');
        assert(b.get(index) === val, `Expecting ${b.get(index)} at index ${index}, got ${val}`);
        all.add(index);
    }, obj);
    // make sure we got all indexes
    assert(all.size === b.length, `Found ${all.size} indexes, expecting ${b.length}`);
}

function testToString() {
    let b = new BitArray();
    b.set(0, true);
    b.set(2, true);
    b.set(39, true);
    assert(b.toString() === '1000000000000000000000000000000000000101', `toString() failed to match, got ${b.toString()}`);
}

function testConstructorString() {
    let b = new BitArray('1000000000000000000000000000000000000101');
    [0,2,39].forEach((index) => {
        assert(b.get(index) === true, `Expecting true value at index ${index}, found false`);
    });
    assert(b.toString() === '1000000000000000000000000000000000000101', `toString() failed to match, got ${b.toString()}`);
}

function testConstructorNumber() {
    let b = new BitArray(0b1000000000000000000000000000000000000101);
    [0,2,39].forEach((index) => {
        assert(b.get(index) === true, `Expecting true value at index ${index}, found false`);
    });
    assert(b.toString() === '1000000000000000000000000000000000000101', `toString() failed to match, got ${b.toString()}`);
}

testPushPop();
testFill();
testShifts();
testShifts();
testShifts();
testShifts();
testShifts();
testIndexes();
testIndexOf();
testForEach();
testToString();
testConstructorString();
testConstructorNumber();

console.log('BitArray tests passed');
