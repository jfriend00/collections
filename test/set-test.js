const { polyfillSet, enhanceSet } = require('../index.js');
const assert = require('assert').strict;

// creates new Set instance composed of items in both set and iterable
// ["intersection", function(iterable) {

// creates new Set instance as union of both set and iterable
// ["union", function(iterable) {

// creates new Set of elements in original that are not present in iterable
// ["difference", function(iterable) {

// set of elements found only in one or the other, but not both
// ["symmetricDifference", function(iterable) {

// determines if this set is a subset of the iterable
// by determining if every item in this set is in the iterable
// ["isSubsetOf", function(iterable) {

// determines if this set is a superset of the iterable
// by determining if every item in the iterable is in this set
// ["isSupersetOf", function(iterable) {

// determines if this set has nothing in common with iterable
// ["isDisjointFrom", function(iterable) {

// As of May 2020, these are not yet on a standards track, but considered useful
// const enhancedSetMethods = [
// add all items in the arguments to the current Set
// ["addMany", function(...elements) {

// remove all items in the arguments from the current Set
// ["deleteMany", function(...elements) {

// add the iterable collection to this Set
// ["addCollection", function(iterable) {

// remove the iterable collection from this Set
// ["deleteCollection", function(iterable) {

// see if this Set and the iterable contain exactly the same elements (no extras on either side)
// ["equals", function(iterable) {

// all test data applied to initial set [1,2,3]
const polyfillData = [
    // [testNum, verb, arg, result]
    [1, "intersection", [1,4,5], [1]],
    [2, "intersection", [1,2,3], [1,2,3]],
    [3, "intersection", [4,5,6], []],
    [4, "union", [1,2,3], [1,2,3]],
    [5, "union", [4,5,6], [1,2,3,4,5,6]],
    [6, "union", [], [1,2,3]],
    [7, "difference", [4,5,6], [1,2,3]],
    [8, "difference", [1,4,5,6], [2,3]],
    [9, "symmetricDifference", [4,5,6], [1,2,3,4,5,6]],     // unique items in both
    [10, "symmetricDifference", [2,3], [1]],                // unique items only in original
    [11, "symmetricDifference", [1,2,3,4,5], [4,5]],        // unique items only in iterable
    [12, "symmetricDifference", [1,2,3], []],               // no unique items
    [13, "isSubsetOf", [1,2,3], true],                      // a === b
    [14, "isSubsetOf", [4,5,6], false],                     // no overlap
    [15, "isSubsetOf", [1,2,3,4,5], true],                  // a smaller than b
    [16, "isSubsetOf", [1,2], false],                       // a larger than b
    [17, "isSupersetOf", [1,2,3], true],                    // a === b
    [18, "isSupersetOf", [4,5,6], false],                   // no overlap
    [19, "isSupersetOf", [1,2], true],                      // a larger than b
    [20, "isSupersetOf", [1,2,3,4], false],                 // a smaller than b
    [21, "isSupersetOf", [], true],                         // b is empty
    [22, "isDisjointFrom", [1,2,3], false],                 // a === b
    [23, "isDisjointFrom", [1,4,5], false],                 // some overlap
    [24, "isDisjointFrom", [4,5,6], true],                  // no overlap
    [25, "isDisjointFrom", [], true],                       // empty iterable
];

const separateArgs = new Set(["addMany", "deleteMany"]);

const enhancedData = [
    // [testNum, verb, arg, result]
    [50, "addMany", [1,4,5], [1,2,3,4,5]],
    [51, "deleteMany", [1,4,5], [2,3]],
    [52, "addCollection", [1,4,5], [1,2,3,4,5]],
    [53, "deleteCollection", [1,4,5], [2,3]],
    [54, "equals", [1,2,3], true],                          // a === b
    [55, "equals", [1,2,3,4], false],                       // b contains something a doesn't
    [56, "equals", [1,2], false],                           // a contains something b doesn't
    [57, "equals", [], false],                              // b empty
]

function runData(data, adderFn, passAsSeparateArgs = new Set()) {
    for (const [testNum, verb, arg, result] of data) {
        const s = new Set([1,2,3]);
        adderFn(s);
        const r = passAsSeparateArgs.has(verb) ? s[verb](...arg) : s[verb](arg);
        if (typeof result === "boolean") {
            assert(r === result, `testNum ${testNum} failed: got ${r}, expecting ${result}`);
        } else {
            assert.deepStrictEqual(Array.from(r), result, `testNum ${testNum} failed: got ${JSON.stringify(Array.from(r))}, expecting ${JSON.stringify(Array.from(result))}`);
        }
    }
}

runData(polyfillData, polyfillSet);
runData(enhancedData, enhanceSet, separateArgs);

console.log("All tests passed.");
