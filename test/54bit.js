// test out 54 bit operations

const hiDivisor = 0x80000000;
const lowMask = 0x7FFFFFFF;

function and(v1, v2) {
    const low1 = v1 & lowMask;
    const low2 = v2 & lowMask;
    const high1 = v1 / hiDivisor;
    const high2 = v2 / hiDivisor;
    return (hiDivisor * (high1 & high2)) + (low1 & low2);
}

function or(v1, v2) {
    const low1 = v1 & lowMask;
    const low2 = v2 & lowMask;
    const high1 = v1 / hiDivisor;
    const high2 = v2 / hiDivisor;
    return (hiDivisor * (high1 | high2)) + (low1 | low2);
}

function shiftLeft(v1, n) {
    return (2 ** n) * v1;
}

function shiftRight(v1, n) {
    return Math.floor(v1 / (2 ** n));
}

let b1 = 0xFF0FFFF0F0FF0;
let b2 = 0xFFFFFFF0F1FF1;
let result1 = and(b1, b2);
console.log(result1.toString(16));

let b3 = 0xFF03FFFFFFFFF;
let b4 = 0xFFF3FFF1FFFF1;
let result2 = or(b3, b4);
console.log(result2.toString(16));

console.log(b1.toString(16));
let result3 = shiftRight(b1, 4);
console.log(result3.toString(16));
let result4 = shiftLeft(result3, 4);
console.log(result4.toString(16));
