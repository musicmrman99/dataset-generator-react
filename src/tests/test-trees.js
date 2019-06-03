import { Trees, Selectors, TraversalConflictPriority, isSpecialNode } from '../helpers/trees';

// --------------------------------------------------
// Test Suite for Trees
// --------------------------------------------------

// Sorry these don't have stated/verified outputs - just guess (and think what
// they should do and what you want them to do).
const TestTrees = Object.freeze({
    ENABLED: true,

    // Test Reduce
    reduce() {
        console.log("Test: Trees.reduce()");
        Trees.reduce(
            [
                {a: {b: {_: false, v: "foo"}, c: 1}, d: 4}, // Normal
                {a: {b: {_: false, v: "bar"}, c: 2}, d: {c: 5}}, // Conflicting
                {a: {b: {_: true, v: "baz"}, c: 3}, d: 6} // 'b' is a leaf node
            ], // Trees
            (accum, mtn) => {console.log(mtn); return accum;}, // Reducer - logger
            null, // Into
            {
                isLeaf: (node) => node._ == true,
                conflictPriority: TraversalConflictPriority.NON_LEAF
            } // Traverse Options
        );
        return null;
    },

    // Test Translate - Map
    map() {
        console.log("Test: Trees.translate() - Map");
        return Trees.translate(
            [
                {a: {b: 1, c: 1}, d: 2}, // Integer leaf nodes
                {
                    a: {
                        b: {_: true, name: "foo"},
                        c: {_: true, name: "bar"}
                    },
                    d: {_: true, name: "baz"}
                } // Object leaf nodes
            ], // Trees
            null, // Filtering function
            (mtn) => {
                const nodes = mtn.values;
                if (nodes[0] >= 1 && nodes[0] <= 6) {
                    const size = nodes[0].toString();
                    return "<h"+size+">"+nodes[1].name+"</h"+size+">";
                } else {
                    return "<p>"+nodes[1].name+"</p>";
                }
            }, // Mapping function
            null, // Into
            {
                isLeaf: (node) => node._ !== undefined,
                conflictPriority: TraversalConflictPriority.NEITHER // Error
            } // Traverse Options
        );
    },

    // Test Translate - Filter
    filter() {
        console.log("Test: Trees.translate() - Filter");
        return Trees.translate(
            [
                {a: {b: 1, c: 1}, d: 2}, // Integer leaf nodes
                {
                    a: {
                        b: {_: true, name: "foo"},
                        c: {_: true, name: "bar"}
                    }
                } // Object leaf nodes
            ], // Trees
            (mtn) => {
                return !mtn.values.some(isSpecialNode);
            }, // Filtering function
            null, // Mapping function
            null, // Into
            {
                isLeaf: (node) => node._ !== undefined,
                conflictPriority: TraversalConflictPriority.LEAF // Prefer leaf
            } // Traverse Options
        );
    },

    // Test Translate - Merge
    merge() {
        console.log("Test: Trees.translate() - Merge");
        return Trees.translate(
            [
                {a: {b: {_: false, v: "foo"}, c: 1}, d: 4}, // Normal
                {a: {b: {_: false, v: "bar"}, c: 2}, d: {c: 5}}, // Conflicting
                {a: {b: {_: true, v: "baz"}, c: 3}, d: 6} // 'b' is a leaf node
            ], // Trees
            null, // Filtering function
            Selectors.first, // Mapping function (merge method)
            null, // Into
            {
                isLeaf: (node) => node._ == true,
                conflictPriority: TraversalConflictPriority.NON_LEAF
            } // Traverse Options
        );
    },

    // Test Flatten
    flatten() {
        console.log("Test: Trees.flatten()");
        return Trees.flatten(
            {a: {b: {_: true, v: "foo"}, c: 1}, d: 4}, // 'b' is a leaf node
            null, // Into
            {
                isLeaf: (node) => node._ !== undefined
            } // Traverse Options
        );
    },

    // NOTE: the different methods of flattening multiple trees each have their
    // advantages/disadvantages:
    // - Composing with Trees.translate() is more efficient than composing with
    //   Array.reduce(). This is because flattening every tree into an object
    //   individually, as is done when using Array.reduce(), requires traversing
    //   every tree individually. This takes longer than traversing all trees
    //   simultaneously, which Trees.translate() is designed to do.
    // - Using Array.reduce() gives less control over how the trees are merged.
    //   For example, if conflicts arise, some nodes are missing from some
    //   trees, or even just that different trees hold different values, the
    //   Array.reduce() method will always take the value of the last tree given
    //   for each key. On the other hand, Trees.translate() accepts a mapping
    //   function that provides more control over the STN chosen for each MTN.
    // - Using the Trees.translate() method requires giving the traversal
    //   options twice, which doesn't look good.
    //
    // Overall, the Trees.translate() method is preferred:
    // - The performance difference is negligible
    // - It is specifically designed for merging trees
    // - Miss it out if you don't need it, use a one-liner if it's small, or use
    //   a constant.

    // Test Flatten - Compose with Array.reduce() to flatten multiple trees
    flatten_multiple_ArrayReduce() {
        console.log("Test: Trees.flatten() - with Array.reduce()");
        return [
            {comp: {in: "inc"}}, // The only way of merging into an Object
            {a: {b: {_: false, v: "foo"}, c: 1}, d: 4}, // Normal
            {a: {b: {_: false, v: "bar"}, c: 2}, d: {c: 5}}, // Conflicting
            {a: {b: {_: true, v: "baz"}, c: 3}, d: 6} // 'b' is a leaf node
        ].reduce((accum, tree) => {
            Trees.flatten(
                tree, // Tree
                accum, // Into
                {
                    isLeaf: (node) => node._ !== undefined
                } // Traverse Options
            );
            return accum;
        }, {comp: {out: "ex"}});
    },

    // Test Flatten - Compos with Trees.translate() to flatten multiple trees
    flatten_multiple_TreesTranslate() {
        console.log("Test: Trees.flatten() - with Trees.translate()");
        return Trees.flatten(
            Trees.translate(
                [
                    {a: {b: {_: false, v: "foo"}, c: 1}, d: 4},
                    {a: {b: {_: false, v: "bar"}, c: 2}, d: {c: 5}},
                    {a: {b: {_: true, v: "baz"}, c: 3}, d: 6}
                ], // Translate: Trees
                null, // Translate: Filtering function
                Selectors.last, // Translate: Mapping function (merge method)
                {comp: {in: "inc"}}, // Translate: Into (included in flatten)
                {
                    isLeaf: (node) => node._ == true,
                    conflictPriority: TraversalConflictPriority.LEAF
                } // Translate: Traverse Options
            ),
            {comp: {out: "ex"}}, // Flatten: Into (nested parts are preserved)
            {
                isLeaf: (node) => node._ == true
            } // Flatten: Traverse Options
        );
    }
});

// If tests are enabled, run them all
if (TestTrees.ENABLED) {
    for (const test of Object.values(TestTrees).filter(
        (test) => typeof test === "function"
    )) {
        const t0 = performance.now();
        const val = test();
        const t1 = performance.now();
        console.log(val);
        console.log("Took "+((t1-t0)/1000)+" seconds.");
    }
}
