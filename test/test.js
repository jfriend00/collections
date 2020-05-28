const { MapSet, MapArray, SortedArray } = require('../index.js');
const { rand } = require('../utils.js');
const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');

let testData = [
    ["a", "1"],
    ["a", "1"],
    ["a", "2"],
    ["a", "3"],
    ["a", "4"],
    ["b", "1"],
    ["b", "1"],
    ["b", "2"],
    ["b", "3"],
    ["b", "4"],
    ["b", "4"],
];

let ma = new MapArray();
for (let [key, val] of testData) {
    ma.add(key, val);
}
assert(ma.remove("b", "4") === true, 'mapArray.remove("b", "4" is not true)');
assert(ma.remove("b", "1", true) === true, 'mapArray.remove("b", "1", true) is not true');
assert(ma.remove("c", "1") === false, 'mapArray.remove("c", "1") is not false');
assert(ma.remove("b", 0) === false, 'mapArray.remove("b", 0) is not false');
assert(ma.hasVal("b", "2") === true, 'mapArray.hasVal("b", "2") is not true');
assert(ma.hasVal("c", "2") === false, 'mapArray.hasVal("c", "2") is not false');
assert(ma.hasVal("b", "1") === false, 'mapArray.hasVal("b", "1") is not false');
// check resulting structure after above manipulations
assert.deepStrictEqual(ma.get("a"), ["1", "1", "2", "3", "4"], 'a keys not as expected on MapArray');
assert.deepStrictEqual(ma.get("b"), ["2", "3", "4"], 'b keys not as expected on MapArray');

let ms = new MapSet();
for (let [key, val] of testData) {
    ms.add(key, val);
}
assert(ms.remove("b", "4") === true, 'mapSet.remove("b", "4") is not true');
assert(ms.remove("c", "1") === false, 'mapSet.remove("c", "1") is not false');
assert(ms.remove("b", 0) === false, 'mapSet.remove("b", 0) is not false');
assert(ma.hasVal("b", "2") === true, 'mapSet.hasVal("b", "2") is not true');
assert(ma.hasVal("c", "2") === false, 'mapSet.hasVal("c", "2") is not false');
assert(ma.hasVal("b", "1") === false, 'mapSet.hasVal("b", "1") is not false');
// check resulting structure after above manipulations
assert.deepStrictEqual(Array.from(ms.get("a")), ["1", "2", "3", "4"], 'a keys not as expected on MapSet');
assert.deepStrictEqual(Array.from(ms.get("b")), ["1", "2", "3"], 'b keys not as expected on MapSet');

function runArrayAdds(sortedArray, insertData) {
    for (let [insertValue, expectedResult] of insertData) {
        sortedArray.add(insertValue);
        assert.deepStrictEqual(sortedArray.toArray(), expectedResult, `Insert of ${insertValue} resulted in ${JSON.stringify(sortedArray)}`);
    }
    console.log(sortedArray.toArray());
}

// let's try .add() on a non-sorted array
if (false) {
    (function() {
        const errFile = path.join(__dirname, 'insertion-sort-fail.json');

        const arr = new SortedArray();
        const origData = {};
        let prevData = {};

        function err(newVal, msg) {
            // capture the problem case so we can run it again
            origData.newVal = newVal;
            fs.writeFileSync(errFile, JSON.stringify(origData));
            assert.fail(msg);
        }

        const lenArray = 20;
        const low = 0;
        const high = 100;
        const numChecks = 100;

        try {
            prevData = require(errFile);
            for (let item of prevData.array) {
                arr.push(item);
            }
        } catch(e) {
            // no presaved log file to start with so make our own randomized array
            for (let i = 0; i < lenArray; i++) {
                arr.push(rand(0, 100));
            }
        }
        // array is now randomized
        for (let i = 0; i < numChecks; i++) {
            // make copy of our array for the log file (if there's an error)
            origData.array = arr.slice();
            let newVal = prevData.newVal ? prevData.newVal : rand(0, 100);
            let addIndex = arr.add(newVal);
            if (addIndex !== 0) {
                if (arr[addIndex - 1] > newVal) {
                    err(newVal, `Problem with arr[addIndex - 1] < newVal: ${arr[addIndex - 1]}, ${newVal}`)
                }
            }
            if (addIndex + 1 < arr.length) {
                if (arr[addIndex + 1] < newVal) {
                    err(newVal, `Problem with arr[addIndex + 1] > newVal: ${newVal}, ${arr[addIndex + 1]}`);
                }
            }
        }
        console.log('Inserting into unsorted array passed.');
    })();
}

let arr1 = new SortedArray([1,2,4]);
let data1 = [
    [3, [1,2,3,4]],                         // mid value
    [0, [0,1,2,3,4]],                       // first value
    [5, [0,1,2,3,4,5]],                     // last value
    [3, [0,1,2,3,3,4,5]],                   // same value, mid
    [0, [0,0,1,2,3,3,4,5]],                 // same value, first
    [5, [0,0,1,2,3,3,4,5,5]],               // same value, last
    [9, [0,0,1,2,3,3,4,5,5,9]],             // last
    [8, [0,0,1,2,3,3,4,5,5,8,9]],           // next to last
];

runArrayAdds(arr1, data1);

let arr2 = new SortedArray(["a", "b", "d"], {sort: "stringAscending"});
let data2 = [
    ["c", ["a", "b", "c", "d"]],
    ["e", ["a", "b", "c", "d", "e"]],
];

runArrayAdds(arr2, data2);

let arr3 = new SortedArray(["a", "b", "d"], {sort: "stringDescending"});
let data3 = [
    ["c", ["d", "c", "b", "a"]],
    ["e", ["e", "d", "c", "b", "a"]],
];

runArrayAdds(arr3, data3);

function addBunchMany(bigLen, bigMax) {
    let temp = [];
    let bigArr = new SortedArray();
    for (let i = 0; i < bigLen; i++) {
        temp.push(rand(0, bigMax));
    }
    bigArr.addCollection(temp);

    console.log(`finished .addMany() of ${bigLen} items`)

    const numIndividual = bigLen / 5000;

    for (let i = 0; i < numIndividual; i++) {
        if (i && i % 50 === 0) {
            console.log(`inserting individually into large array ${i} of ${numIndividual}`);
        }
        bigArr.add(rand(0, bigMax));
    }

    for (let i = 1; i < bigArr.length; i++) {
        if (bigArr[i] < bigArr[i-1]) {
            throw new Error(`Found at index ${i}, ${bigArr[i]} is not greater than ${bigArr[i-1]}`);
        }
    }
}

function addBunchIndividual(bigLen, bigMax) {
    let bigArr = new SortedArray();
    for (let i = 0; i < bigLen; i++) {
        if (i && i % 1000 === 0) {
            console.log(`processing ${i} of ${bigLen}`);
        }
        bigArr.add(rand(0, bigMax));
    }

    for (let i = 1; i < bigArr.length; i++) {
        if (bigArr[i] < bigArr[i-1]) {
            throw new Error(`Found at index ${i}, ${bigArr[i]} is not greater than ${bigArr[i-1]}`);
        }
    }
}

console.log("Processing large array1 ...")
addBunchMany(500_000, 10_000_000);
console.log("Processing large array2 ...")
addBunchIndividual(5_000, 10_000_000);

console.log("MapArray, MapSet and SortedArray tests passed");
