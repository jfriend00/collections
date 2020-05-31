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

function checkExtraSpace(b) {
    /*
    const len = b.length;
    const { i } = b.getPos(len - 1);
    // see if last block is the last block of the array
    if (i !== b.data.length - 1) {
        assert.fail(`Expected last block to be ${i}, but it was ${b.data.length - 1}`)
    }
    */
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
        checkExtraSpace(b);
    }
    for (let [index, val] of b.entries()) {
        assert(val === randomArray[index], `At index ${index}, got ${val}, expected ${randomArray[index]}`);
    }
    checkExtraSpace(b);
    assert(b.length === randomArray.length, `bitArray.length = ${b.length}, expected ${randomArray.length}`);
    let len = b.length;
    for (let i = len - 1; i >= 0; i--) {
        let val = b.pop();
        assert(val === randomArray[i], `At index ${i}, got ${val}, expected ${randomArray[i]}`);
    }
    checkExtraSpace(b);
}

function testFill() {
    let b = new BitArray();
    const lowFill = 10;
    const highFill = 100;
    b.fill(true, lowFill, highFill);
    checkExtraSpace(b);
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
        checkExtraSpace(b);
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
        checkExtraSpace(b);
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

function testBackward() {
    let b = makeRandomBitArray();
    for (let [index, val] of b.backwardEntries()) {
        assert(b.get(index) === val, `Expecting ${b.get(index)} at index ${index}, found ${val}`);
    }
}

function testSlice() {
    let b = new BitArray(0b1110101000000000000000000000000000010101);
    // both indexes positive
    let c = b.slice(0,3);
    assert(c.toString() === '101', `Expecting 101, got ${c.toString()}`);

    // begin index negative
    c = b.slice(-3);
    assert(c.toString() === '111', `Expecting 111, got ${c.toString()}`);

    // both params empty
    c = b.slice();
    assert(c.toString() === '1110101000000000000000000000000000010101', `Expecting 1110101000000000000000000000000000010101, got ${c.toString()}`);

    // end index negative
    c = b.slice(-5, -2);
    assert(c.toString() === '101', `Expecting 101, got ${c.toString()}`);

    c = b.slice(-5, b.length - 2);
    assert(c.toString() === '101', `Expecting 101, got ${c.toString()}`);

    c = b.slice(3, 1);
    assert(c.length === 0, `Expecting empty bitArray, got ${c.length} length bitArray`);
}

function testInsert() {
    let b = new BitArray(0b1110101000000000000000000000000000010101);
    b._insert(1, 2);
    assert(b.toString() === '111010100000000000000000000000000001010001', 'insert failed #1');
    b._insert(0, 20);
    assert(b.toString() === '11101010000000000000000000000000000101000100000000000000000000', 'insert failed #2');
    b = new BitArray(0b1110101000000000000000000000000000010101);
    b._insert(b.length, 3);
    assert(b.toString() === '0001110101000000000000000000000000000010101', 'insert failed #3');
    try {
        b._insert(b.length + 1, 3);
        assert.fail(`Expecting exception that didn't happen on ._insert() for start beyond end`);
    } catch(e) {
        // we are expecting this exception
    }
    try {
        b._insert(-1, 3);
        assert.fail(`Expecting exception that didn't happen on ._insert() for negative start`);
    } catch(e) {
        // we are expecting this exception
    }
    b = new BitArray(0b1110101000000000000000000000000000010101);
    b._insert(0, 4, [true, true, true, false]);
    assert(b.toString() === '11101010000000000000000000000000000101010111', 'insert failed #4');
}

function testToArray() {
    let b = makeRandomBitArray();
    let data = b.toArray();
    let c = new BitArray(data);
    assert(b.toString() === c.toString(), `Test of toArray() and constructor(data) failed.\n${b.toString()}\n${c.toString()}`);
}

function testToJson() {
    let b = makeRandomBitArray();
    let data = b.toJson();
    let obj = JSON.parse(data);
    let c = new BitArray(obj);
    assert(b.toString() === c.toString(), `Test of toJson() and constructor(data) failed.\n${b.toString()}\n${c.toString()}`);
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
testBackward();
testSlice();
testInsert();
testToArray();
testToJson();

console.log('BitArray tests passed');
