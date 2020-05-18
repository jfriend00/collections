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
ma.remove("b", "4");
ma.remove("b", "1", true);
assert.deepEqual(ma.get("a"), ["1", "1", "2", "3", "4"], 'a keys not as expected on MapArray');
assert.deepEqual(ma.get("b"), ["2", "3", "4"], 'b keys not as expected on MapArray');

let ms = new MapSet();
for (let [key, val] of testData) {
    ms.add(key, val);
}
ms.remove("b", "4");
assert.deepEqual(Array.from(ms.get("a")), ["1", "2", "3", "4"], 'a keys not as expected on MapSet');
assert.deepEqual(Array.from(ms.get("b")), ["1", "2", "3"], 'b keys not as expected on MapSet');
console.log("All tests passed")
