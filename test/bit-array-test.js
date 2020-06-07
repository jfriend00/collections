const { BitArray } = require('../bit-array.js');
const { ArrayEx } = require('../array.js');
const assert = require('assert').strict;

const allBitsOnBinary = 0b1111111111111111111111111111111;
const allBitsOnHex = 0x7fffffff;
const allBitsOn = 0x7fffffff;
const allBitsOnStr = "1111111111111111111111111111111";
const tooManyBits = 0x1ffffffff;

const debugOn = process.env["DEBUG_BITARRAY"] === "1";

function DBG(...args) {
    if (debugOn) {
        console.log(...args);
    }
}

// conditional include the performance measuring code
let Bench;
if (debugOn) {
    Bench = require('../../measure').Bench;
}


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

// test passing another bit array to the constructor
function testConstructorBitArray() {
    let b = makeRandomBitArray();
    let c = new BitArray(b);
    assert(b.length === c.length, `testConstructorBitArray() failed, lengths ${b.length} and ${c.length} are not the same`);
    for (let [i, val] of b.entries()) {
        assert(c.get(i) === val, `testConstructorBitArray() failed, value at index ${i} not the same`);
    }
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
    let ok1 = true;
    let ok2 = false;
    try {
        b._insert(b.length + 1, 3);
        ok1 = false;
    } catch(e) {
        // we are expecting this exception
        ok2 = true;
    }
    assert(ok1 && ok2, `Expecting exception that didn't happen on ._insert() for start beyond end`);
    ok2 = false;
    try {
        b._insert(-1, 3);
        ok1 = false;
    } catch(e) {
        // we are expecting this exception
        ok2 = true;
    }
    assert(ok1 && ok2, `Expecting exception that didn't happen on ._insert() for negative start`);
    b = new BitArray(0b1110101000000000000000000000000000010101);
    b._insert(0, 4, [true, true, true, false]);
    assert(b.toString() === '11101010000000000000000000000000000101010111', 'insert failed #4');
}

function testRemove() {
    let b = new BitArray(0b1110101000000000000000000000000000010101);

    // remove first bit
    b._remove(0,1);
    assert(b.toString() === '111010100000000000000000000000000001010', 'remove failed #1');

    // remove last bit
    b._remove(b.length - 1, 1);
    assert(b.toString() === '11010100000000000000000000000000001010', 'remove failed #2');

    // remove too many off the end
    b = new BitArray(0b1110101000000000000000000000000000010101);
    b._remove(b.length - 3, 10);
    assert(b.toString() === '0101000000000000000000000000000010101', 'remove failed #3');

    b = new BitArray({data: [allBitsOn, allBitsOn, allBitsOn, allBitsOn], length: 31*4});

    // remove a block of bits that span across numbers in the middle
    b._remove(31, 62);
    let d = b.toArray();
    assert(d.length === 62, `_remove(): Expecting length of 62, got ${d.length}`);
    assert(d.data.length === 2 && d.data[0] === allBitsOn && d.data[1] === allBitsOn, `_remove(): Expecting allBitsOn in both data blocks`);

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


function testLength() {
    let b = new BitArray({data: [0xFFFFFF, 0xFFFFFF], length: 6});
    let d = b.toArray();
    assert(d.data[0].toString(2) === '111111', `Expected length to be truncated to 6, got ${d.data[0].toString(2)}`);
    assert(d.data.length === 1, `Expected d.data length to be 1, found ${d.data.length}`);

    b = new BitArray({data: [allBitsOnHex, allBitsOnHex, allBitsOnHex, allBitsOnHex], length: 31});
    d = b.toArray();
    assert(d.data[0].toString(2) === allBitsOnStr, `Expected length to be truncated to ${allBitsOnStr.length}, got ${d.data[0].toString(2)}`);
    assert(d.data.length === 1, `Expected d.data length to be 1, found ${d.data.length}`);

    let ok1 = true;
    let ok2 = false;
    try {
        b = new BitArray({data: [tooManyBits, tooManyBits, tooManyBits, tooManyBits], length: 31});
        // not supposed to get here
        ok1 = false
    } catch(e) {
        // expect to get here
        ok2 = true;
    }
    assert(ok1 && ok2, `Expected exception that didn't happen for numbers in the incoming array that are too large`);
}

function testToBooleanArray() {
    let b = makeRandomBitArray();
    let array = b.toBooleanArray();
    assert(b.length === array.length, `Array lengths not the same: expected ${b.length}, found ${array.length}`);
    for (let [index, val] of b.entries()) {
        assert(val === array[index], `Expected ${val}, found ${array[index]} at index ${index}`);
    }
    b = new BitArray(0b1110101000000000000000000000000000010101);
    array = b.toBooleanArray();
    for (let i = 0; i < array.length; i++) {
        assert(b.get(i) === array[i], `Expected ${b.get(i)}, found ${array[i]} at index ${i}`);
    }
}

function testInsertPerformance() {
    if (!debugOn) return;
    let r = makeRandomBitArray(10_000_000);

    let a = new BitArray(r);
    let m1 = new Bench().markBegin();
    a.unshift(true);
    m1.markEnd();

    let c = new BitArray(r);
    let m2 = new Bench().markBegin();
    c._insert(0, 1, [true]);
    m2.markEnd();

    console.log(`unshift: ${m1.formatMs(3)}, _insert: ${m2.formatMs(3)}`);
}

function testRemovePerformance() {
    if (!debugOn) return;
    let r = makeRandomBitArray(10_000_000);

    let a = new BitArray(r);
    let m1 = new Bench().markBegin();
    a.shift();
    m1.markEnd();

    let b = new BitArray(r);
    let m3 = new Bench().markBegin();
    b._remove(0,1);
    m3.markEnd();

    let c = new BitArray(r);
    let m2 = new Bench().markBegin();
    c._insert(0, 1, [true]);
    m2.markEnd();

    console.log(`shift: ${m1.formatMs(3)}, _remove: ${m3.formatMs(3)}, _remove_new ${m2.formatMs(3)}`);
}


function testNewInsert() {
    let table = [
        // [bitArray constructor arg, insertStart, insertCnt, insertData, expectedResult, name]
        [0b10, 0, 1, new BitArray("1"), "101", "insert single bit in lowest position from BitArray"],
        [0b10, 1, 1, new BitArray("1"), "110", "insert single bit in second position from BitArray"],
        [0b1, 0, 1, null, "10", "insert single bit in lowest position"],
        [0b11, 1, 1, null, "101", "insert single bit in second position"],
        [0b11, 1, 2, null, "1001", "insert two bits in second position"],
        [allBitsOnBinary, 1, 1, null, "11111111111111111111111111111101", "insert bit in second position with overflow to next block"],
        [0b11, 1, 62, null, "1000000000000000000000000000000000000000000000000000000000000001", "insert 62 bits in second position"],
        [0b11, 1, 63, null, "10000000000000000000000000000000000000000000000000000000000000001", "insert 63 bits in second position"],
        [0b11, 1, 64, null, "100000000000000000000000000000000000000000000000000000000000000001", "insert 64 bits in second position"],
        [0b11, 1, 64, null, "100000000000000000000000000000000000000000000000000000000000000001", "insert 64 bits in second position"],
    ];

    function makeTests(pattern = "evens", len = 100) {
        const srcArray = new Array(len);
        if (pattern === "evens") {
            for (let i = 0; i < len; i++) {
                srcArray[i] = i % 2;              // make alternating array
            }
        } else if (pattern === "odds") {
            for (let i = 0; i < len; i++) {
                srcArray[i] = (i + 1) % 2;        // make alternating array
            }
        } else if (pattern === "ones") {
            srcArray.fill(1);
        } else if (pattern === "zeroes") {
            srcArray.fill(0);
        }
        // try all possible insertion points
        for (let start = 0; start < len; ++start) {
            // try a range of different insertion lengths
            for (let cnt = 1; cnt < 66; ++cnt) {
                // create expected output array
                const expectedResult = srcArray.slice();
                const adds = new Array(cnt);
                if (pattern === "evens" || pattern === "zeroes") {
                    adds.fill(0);
                } else {
                    adds.fill(1);
                }
                expectedResult.splice(start, 0, ...adds);
                const item = [
                    srcArray.slice().reverse().join(""),
                    start,
                    cnt,
                    adds,
                    expectedResult.reverse().join(""),
                    `At position ${start}, insert ${cnt}`
                ];
                // put this specific test first so we can debug it easier
                if (false && start === 2 && cnt === 30) {
                    table.unshift(item);
                } else {
                    table.push(item);
                }
            }
        }
    }

    makeTests("evens", (31*3) - 1);
    makeTests("odds", 31*3);
    makeTests("ones", (31*3) + 1);
    makeTests("zeroes", 100);

    function runInsertTest([cArg, index, cnt, values, expectedResult, name]) {
        let b = new BitArray(cArg);
        b._insert(index, cnt, values);
        if (typeof expectedResult === "string") {
            let str = b.toString();
            if (str !== expectedResult) {
                console.log(`${name} failed, expecting \n${expectedResult}, got \n${str}`);
                console.log(`index ${index}, cnt ${cnt}`);
                assert.fail();
            }
        }
    }

    for (let item of table) {
        runInsertTest(item);
    }
}

function testNewRemove(specificTestToRun = -1) {
    // [bitArray constructor arg, removeStart, removeCnt, expectedResult, name]
    const table = [
        ["1010101", 0, 1, "101010", "remove first bit"],
        ["1010101", 1, 1, "101011", "remove second bit"],
        ["1010101", 6, 1, "010101", "remove top bit"],
        ["0101010101010101010101010101010", 0, 1, "010101010101010101010101010101", "remove first bit of 31"],
        ["0101010101010101010101010101010", 30, 1, "101010101010101010101010101010", "remove last bit of 31"],
        ["1010101010101010101010101010101010101010", 0, 1, "101010101010101010101010101010101010101", "remove first bit of 40"], // 40 bits long
        ["1010101010101010101010101010101010101010", 1, 1, "101010101010101010101010101010101010100", "remove second bit of 40"], // 40 bits long
    ];

    function makeTests(pattern = "evens", len = 100) {
        const srcArray = new Array(len);
        if (pattern === "evens") {
            for (let i = 0; i < len; i++) {
                srcArray[i] = i % 2;              // make alternating array
            }
        } else if (pattern === "odds") {
            for (let i = 0; i < len; i++) {
                srcArray[i] = (i + 1) % 2;        // make alternating array
            }
        } else if (pattern === "ones") {
            srcArray.fill(1);
        } else if (pattern === "zeroes") {
            srcArray.fill(0);
        }
        // try all possible remove points
        for (let start = 0; start < len; ++start) {
            // try a range of different remove lengths
            for (let cnt = 1; cnt < 66; ++cnt) {
                // create expected output array
                const expectedResult = srcArray.slice();
                expectedResult.splice(start, cnt);
                const item = [
                    srcArray.slice().reverse().join(""),
                    start,
                    cnt,
                    expectedResult.reverse().join(""),
                    `At position ${start}, remove ${cnt}`
                ];
                // put this specific test first so we can debug it easier
                if (false && start === 2 && cnt === 30) {
                    table.unshift(item);
                } else {
                    table.push(item);
                }
            }
        }
    }

    makeTests("evens", (31*3) - 1);
    makeTests("odds", 31*3);
    makeTests("ones", (31*3) + 1);
    makeTests("zeroes", 100);

    function runRemoveTest([cArg, index, cnt, expectedResult, name]) {
        let b = new BitArray(cArg);
        b._remove_new(index, cnt);
        if (typeof expectedResult === "string") {
            let str = b.toString();
            if (str !== expectedResult) {
                console.log(`${name} failed, expecting \n${expectedResult}, got \n${str}`);
                console.log(`index ${index}, cnt ${cnt}`);
                assert.fail();
            }
        }
    }

    if (specificTestToRun >= 0) {
        runRemoveTest(table[specificTestToRun]);
    } else {
        for (let item of table) {
            runRemoveTest(item);
        }
    }
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
testConstructorBitArray();
testBackward();
testSlice();
testInsert();
testRemove();
testToArray();
testToJson();
testLength();
testToBooleanArray();
testNewInsert();
testInsertPerformance();

testNewRemove();
testRemovePerformance();

console.log('BitArray tests passed');
