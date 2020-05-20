const assert = require('assert').strict;
const { polyfillSet, enhanceSet, SetEx } = require('../index.js');

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
    [26, "join", ",", "1,2,3"],
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

function runData(data, adderFn, ctor, passAsSeparateArgs = new Set()) {
    for (const [testNum, verb, arg, result] of data) {
        const s = new ctor([1,2,3]);
        if (adderFn) {
            adderFn(s);
        }
        if (typeof s[verb] !== "function") {
            throw new Error(`s.${verb} is not a function`);
        }
        const r = passAsSeparateArgs.has(verb) ? s[verb](...arg) : s[verb](arg);
        if (typeof result === "boolean" || typeof result === "string") {
            assert(r === result, `testNum ${testNum} failed: got ${r}, expecting ${result}`);
        } else {
            assert.deepStrictEqual(Array.from(r), result, `testNum ${testNum} failed: got ${JSON.stringify(Array.from(r))}, expecting ${JSON.stringify(Array.from(result))}`);
        }
    }
}

const callbackData = [
    // [testNum, verb, fn, result, extraArg]
    [100, "map", function(item, item, set) {
        return item * 2;
    }, [2,4,6]],
    [101, "every", function(item, item, set) {
        return item > 0;
    }, true],
    [102, "every", function(item, item, set) {
        return item > 1;
    }, false],
    [103, "some", function(item, item, set) {
        return item === 2;
    }, true],
    [104, "some", function(item, item, set) {
        return item > 5;
    }, false],
    [105, "filter", function(item, item, set) {
        return item <= 2;
    }, [1,2]],
    [106, "filterMap", function(item, item, set) {
        if (item <= 2) {
            return item * item;
        } else {
            return undefined;
        }
    }, [1,4]],
    [107, "reduce", function(accumulator, item, item, set) {
        return accumulator + item;
    }, 16, 10],
    [108, "reduce", function(accumulator, item, item, set) {
        return accumulator + item;
    }, 6, null],
    [109, "find", function(item, item, set) {
        return (item === 2);
    }, 2],
    [110, "find", function(item, item, set) {
        return (item === 5);
    }, undefined],
];

function runCallback(data, adderFn, ctor) {
    for (const [testNum, verb, fn, result, extraArg] of data) {
        const s = new ctor([1,2,3]);
        adderFn(s);
        if (typeof s[verb] !== "function") {
            throw new Error(`s.${verb} is not a function`);
        }
        let r;
        if (extraArg === null) {
            r = s[verb](fn);
        } else if (extraArg !== undefined) {
            r = s[verb](fn, extraArg);
        } else {
            r = s[verb](fn, this)
        }
        if (typeof result === "boolean" || typeof result === "number" || result === undefined) {
            assert(r === result, `testNum ${testNum} failed: got ${r}, expecting ${result}`);
        } else {
            assert.deepStrictEqual(Array.from(r), result, `testNum ${testNum} failed: got ${JSON.stringify(Array.from(r))}, expecting ${JSON.stringify(Array.from(result))}`);
        }
    }
}

runData(polyfillData, polyfillSet, Set);
runData(enhancedData, enhanceSet, Set, separateArgs);

// run callback methods
runCallback(callbackData, enhanceSet, Set);


// now run it where all methods are added to the prototype of a SetEx sub-class
runData(enhancedData, null, SetEx, separateArgs);


// now run it where all methods are added to the prototype and not to the individual object
enhanceSet(Set.prototype);
runData(polyfillData, null, Set);
runData(enhancedData, null, Set, separateArgs);

console.log("Set and SetEx method tests passed.");
