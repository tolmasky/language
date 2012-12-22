
var CHARACTER   = 0,
    CHOICE      = 1,
    SEQUENCE    = 2,
    NOT         = 3,
    AND         = 4,
    NAME        = 5,
    DOT         = -1;

module.exports =  [
    // r = (bcc / b) cd
    {
        source: "bcd",
        rules:  {
                    0: { UID:0, type:SEQUENCE, children:[2, 1] },
                    1: { UID:1, type:SEQUENCE, children:["c", "d"] },
                    2: { UID:2, type:CHOICE, children:[3, "b"] },
                    3: { UID:3, type:SEQUENCE, children:["b", 4] },
                    4: { UID:4, type:SEQUENCE, children:["c", "c"] }
                },
    },
    
    {
        source: "bcd",
        rules:  {
                    0: { UID:0, type:SEQUENCE, children:[1 ,"d"] },
                    1: { UID:1, type:CHOICE, children:[2, "b"] },
                    2: { UID:2, type:SEQUENCE, children:["b", "c"] }
                }
    },

    // Left Recursion [DOESNT WORK]
    // A = A a / a
    {
        source: "aaa",
        rules:  {
                    0: { UID:0, type:CHOICE, children:[1, "a"] },
                    1: { UID:1, type:SEQUENCE, children:[0, "a"] }
                }
    },

    // Right Recursion
    // A = a (A / "")
    {
        source: "aaa",
        rules:  {
                    0: { UID:0, type:SEQUENCE, children:["a", 1] },
                    1: { UID:1, type:CHOICE, children:[0, ""] }
                }
    },

    // ??
    {
        source: "aaa",
        rules:  {
                    0: { UID:0, type:NAME, children:[1], name:"start" },
                    1: { UID:1, type:CHOICE, children:[2, "a"] },
                    2: { UID:2, type:SEQUENCE, children:[1, "a"] }
                }
    },

    // start = (("a" "a") "a") "b") /
    //         (("a" "a") "a") !"d" "c")
    {
        source: "aaac",
        rules:  {
                    0: { UID:0, type:CHOICE, children:[1, 2] },
                    1: { UID:1, type:SEQUENCE, children:[3, "b"] },
                    2: { UID:2, type:SEQUENCE, children:[3, 5] },
                    3: { UID:3, type:SEQUENCE, children:[4, "a"] },
                    4: { UID:4, type:SEQUENCE, children:["a", "a"] },
                    5: { UID:5, type:AND, children:[6, -1] },
                    6: { UID:6, type:NOT, children:["d"] }
                }
    }
];