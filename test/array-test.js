const { ArrayEx } = require('../array.js');
const assert = require('assert').strict;

let a = new ArrayEx(0,1,2,3,4,5,6,7,8,9);
let len = a.length;
let results = new Map();
for (let i = 0; i < len; i++) {
    results.set(i, (new Array(len)).fill(0));
}

// const numIterations = 100_000_000;
const numIterations = 100_000;
for (let i = 0; i < numIterations; i++) {
    a.shuffle();
    // now record the count of where each value fell in the shuffled array
    for (let j = 0; j < len; j++) {
        let val = a[j];
        let data = results.get(val);
        ++data[j];
    }
}
console.log(`Running ${numIterations} iterations:`);
let avg = numIterations / len;
let maxDeviation = 0;
for (let [key, arr] of results) {
    let data = arr.map(cnt => {
        let percent = ((cnt - avg) / avg) * 100;
        maxDeviation = Math.max(Math.abs(percent), maxDeviation);
        let percentStr = percent.toFixed(3);
        return percent >= 0 ? ' ' + percentStr : percentStr;
    });
    console.log(`${key}: ${data.join(', ')}`);
}
console.log(`maxDeviation = ${maxDeviation.toFixed(3)}%`);


let b = new ArrayEx(0,1,2,3,4,5,6,7,8,9);
b.shuffle();
b.sortNumeric("descending");
assert.deepStrictEqual(b, new ArrayEx(9,8,7,6,5,4,3,2,1,0), `sortNumeric descending produced ${JSON.stringify(b)}`);
console.log('descending numeric sort correct');
b.sortNumeric("ascending");
assert.deepStrictEqual(b, new ArrayEx(0,1,2,3,4,5,6,7,8,9), `sortNumeric ascending produced ${JSON.stringify(b)}`);
console.log('ascending numeric sort correct');


let c = [0,1,2,3,4,5,6,7,8,9];
ArrayEx.mix(c);
c.shuffle();
c.sortNumeric("descending");
assert.deepStrictEqual(c, [9,8,7,6,5,4,3,2,1,0], `sortNumeric descending produced ${JSON.stringify(c)}`);
console.log('.mix() works');

let d = new ArrayEx(0,1,2);
d.append([3,4,5]);
assert.deepStrictEqual(d, new ArrayEx(0,1,2,3,4,5), `.append() produced ${JSON.stringify(d)}`);
console.log('.append(array) works');

let e = new Array(0,1,2);
ArrayEx.append(e, [3,4,5]);
assert.deepStrictEqual(e, new Array(0,1,2,3,4,5), `.append() produced ${JSON.stringify(e)}`);
console.log('.append(array) works using static ArrayEx.append()');

let f = new ArrayEx(0,1,2);
f.append([3,4,5], [6,7,8]);
assert.deepStrictEqual(f, new ArrayEx(0,1,2,3,4,5,6,7,8), `.append(array1, array2) produced ${JSON.stringify(f)}`);
console.log('.append(array1, array2) works');

let g = new ArrayEx(0,1,2,2,1);
let h = g.uniquify();
assert.deepStrictEqual(h, new ArrayEx(0,1,2), `.uniquify(0,1,2,2,1) produced ${JSON.stringify(h)}`);
console.log('.uniquify() without a callback works');

let j = new ArrayEx({i: 1}, {i: 1}, {i: 2}, {i: 3});
let k = j.uniquify((a, b) => {
    return a.i === b.i;
});
let target = new ArrayEx({i: 1}, {i: 2}, {i: 3});
assert.deepStrictEqual(k, target, `.uniquify({i: 1}, {i: 1}, {i: 2}, {i: 3}) produced ${JSON.stringify(k)}`);
console.log('.uniquify() with a callback works');

let m = new ArrayEx(0,1,2);
m.copyInto([2,3], 1);
assert.deepStrictEqual(m, new ArrayEx(0,2,3), `.copyInto() produced ${JSON.stringify(m)}`);
console.log('.copyInto() works');

let n = new ArrayEx(0,1,2);
n.copyInto([2,3,4,5], 1);
assert.deepStrictEqual(n, new ArrayEx(0,2,3,4,5), `.copyInto() with target growth produced ${JSON.stringify(n)}`);
console.log('.copyInto() with target growth works');

let p = new ArrayEx(0,1,2,3,4);
let q = p.chunk(2);
target = new ArrayEx(new ArrayEx(0,1), new ArrayEx(2,3), ArrayEx.of(4));
assert.deepStrictEqual(q, target, `.chunk(2)) produced ${JSON.stringify(q)}`);
console.log('.chunk(2) works');

p = new ArrayEx(0,1,2,3,4,5);
console.log(`ArrayEx.isArrayEx(p): ${ArrayEx.isArrayEx(p)}`);
q = p.chunk(2);
target = new ArrayEx(new ArrayEx(0,1), new ArrayEx(2,3), new ArrayEx(4,5));
assert.deepStrictEqual(q, target, `.chunk(2)) produced ${JSON.stringify(q)}`);
console.log('.chunk(2) works');

p = new ArrayEx(0,1,2,3,4,5);
q = p.chunk(10);
target = new ArrayEx(new ArrayEx(0,1,2,3,4,5));
assert.deepStrictEqual(q, target, `.chunk(10)) produced ${JSON.stringify(q)}`);
console.log('.chunk(10) works');

p = new ArrayEx(0,1,2,3,4,5,-1);
q = p.min();
assert(q === -1, `.min() produced ${JSON.stringify(q)}`);
console.log('.min() works');

p = new ArrayEx(0,1,2,3,4,5);
q = p.max();
assert(q === 5, `.max() produced ${JSON.stringify(q)}`);
console.log('.max() works');

p = new ArrayEx(0,1,2,3,4,5);
q = new ArrayEx();
for (let item of p.backward()) {
    q.push(item);
}
target = new ArrayEx(5,4,3,2,1,0);
assert.deepStrictEqual(q, target, `.backward() produced ${JSON.stringify(q)}`);
console.log('.backward() iterator works');

p = new ArrayEx(0,1,2,3,4,5);
q = new ArrayEx();
for (let item of p.forward()) {
    q.push(item);
}
target = new ArrayEx(0,1,2,3,4,5);
assert.deepStrictEqual(q, target, `.forward() produced ${JSON.stringify(q)}`);
console.log('.forward() iterator works');

p = new ArrayEx(0,1,2,3,4,5);
q = new ArrayEx();
for (let item of p.randoms()) {
    q.push(item);
}
// need a better test for random results here
assert(q.length === p.length, target, `.randoms() produced ${JSON.stringify(q)}`);
console.log('.randoms() iterator works');

q = ArrayEx.range(1,5,2);
target = new ArrayEx(1,3);
assert.deepStrictEqual(q, target, `.range() produced ${JSON.stringify(q)}`);
console.log('.range(1,5,2) worked');

q = ArrayEx.range(5,1,-2);
target = new ArrayEx(5,3);
assert.deepStrictEqual(q, target, `.range() produced ${JSON.stringify(q)}`);
console.log('.range(5,1,2) worked');
