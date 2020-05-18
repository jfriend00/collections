const { MapSet, MapArray} = require('../index.js');
const assert = require('assert').strict;

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
assert.deepEqual(ma.get("a"), ["1", "1", "2", "3", "4"], 'a keys not as expected on MapArray');
assert.deepEqual(ma.get("b"), ["2", "3", "4"], 'b keys not as expected on MapArray');

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
assert.deepEqual(Array.from(ms.get("a")), ["1", "2", "3", "4"], 'a keys not as expected on MapSet');
assert.deepEqual(Array.from(ms.get("b")), ["1", "2", "3"], 'b keys not as expected on MapSet');
console.log("All tests passed")
