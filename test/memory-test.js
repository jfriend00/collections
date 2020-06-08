const { BitArray } = require('../bit-array.js');
const { addCommas } = require('../../str-utils');

let m1 = process.memoryUsage();

let b = new BitArray();
b.length = 1_000_000_000;

let m2 = process.memoryUsage();

const bytesPerUnit = 8;         // storage for a Javascript double

console.log(`Expected memory Usage: ${addCommas(Math.ceil(b.length / 31) * bytesPerUnit)}`);
console.log(`Delta memory heapUsed: ${addCommas(m2.heapUsed - m1.heapUsed)}`);
console.log(`Delta memory external: ${addCommas(m2.external - m1.external)}`);
