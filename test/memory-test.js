const { BitArray } = require('../bit-array.js');
const { addCommas } = require('../../str-utils');

let m1 = process.memoryUsage();

// command line argument b, a or u

let type = "Uint32Array";
if (process.argv.length >= 2) {
    let chr = process.argv[2].toLowerCase();
    switch(chr) {
        case "a":
            type = "Array";
            break;
        case "b":
            type = "BitArray";
            break;
        case "u":
            type = "Uint32Array";
            break;
        case "i":
            type = "BigInt";
            break;
        case "bi":
            type = "BigUint64Array";
            break;
        default:
            console.log('Invalid command line argument.  Use a, b, u, i, bi');
            process.exit(1);
    }
}

let len, b, unitsPer, bytesPerUnit;
if (type === "BitArray") {
    len = 10_000_000;
    unitsPer = 31;
    bytesPerUnit = 8;
    b = new BitArray();
    b.length = len;
} else if (type === "Array"){
    len = 10_000_000;
    unitsPer = 1;;
    bytesPerUnit = 8;
    b = new Array(len);
    b.fill(true);
} else if (type === "Uint32Array") {
    len = 10_000_000;
    unitsPer = 31;
    bytesPerUnit = 4;
    b = new Uint32Array(Math.ceil(len/unitsPer));
    b.fill(1);
} else if (type === "BigInt") {
    len = 10_000_000;
    unitsPer = 256;
    bytesPerUnit = 256 / 8;
    b = new Array(Math.ceil(len/unitsPer));
    b.fill(0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFn);    // 256 bits
    //console.log(b[0].toString(2), b[0].toString(2).length);
    //console.log((b[0] & 0xFFFFFFFFFFFFn).toString(2), (b[0] & 0xFFFFFFFFFFFFn).toString(2).length);
} else if (type === "BigUint64Array") {
    len = 10_000_000;
    unitsPer = 64;
    bytesPerUnit = 8;
    b = new Array(Math.ceil(len/unitsPer));
    b.fill(0xFFFFFFFFFFFFFFFFn);    // 64 bits
    //console.log(b[0].toString(2), b[0].toString(2).length);
    //console.log((b[0] & 0xFFFFFFFFFFFFn).toString(2), (b[0] & 0xFFFFFFFFFFFFn).toString(2).length);
}

let m2 = process.memoryUsage();

const heapUsed = m2.heapUsed - m1.heapUsed;
const externalUsed = m2.external - m1.external;

console.log(`Type = ${type}`);
console.log(`Expected memory Usage: ${addCommas(Math.ceil(len / unitsPer) * bytesPerUnit)}`);
 if (heapUsed > 20000) {
    console.log(`Delta memory heapUsed: ${addCommas(heapUsed)}`);
    console.log(`Units per byte (heap): ${addCommas((len / heapUsed).toFixed(2))}`);
} else {
    console.log(`Delta memory external: ${addCommas(externalUsed)}`);
    console.log(`Units per byte (external): ${addCommas((len / externalUsed).toFixed(2))}`);
}
console.log("");
