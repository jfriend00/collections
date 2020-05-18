const { MapSet, MapArray} = require('../index.js');

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
console.log(ma);
ma.remove("b", "4");
ma.remove("b", "1", true);
console.log(ma);

let ms = new MapSet();
for (let [key, val] of testData) {
    ms.add(key, val);
}
console.log(ms);
ms.remove("b", "4");
console.log(ms);
