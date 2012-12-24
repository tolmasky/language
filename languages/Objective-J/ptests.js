
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
        source: "bcccd",
        rules:  [
                    { UID:0, type:SEQUENCE, children:[2, 1] },
                    { UID:1, type:SEQUENCE, children:["c", "d"] },
                    { UID:2, type:CHOICE, children:[3, "b"] },
                    { UID:3, type:SEQUENCE, children:["b", 4] },
                    { UID:4, type:SEQUENCE, children:["c", "c"] }
                ],
    },

    // r = a (b / c)
    {
        source: "ab",
        rules:  [
                    { UID:0, type:SEQUENCE, children:["a", 1] },
                    { UID:1, type:CHOICE, children:["b", "c"] }
                ]
    },

    // r = a (b ( (c / d) / e ) )
    {
        source: "abe",
        rules:  [
                    { UID:0, type:SEQUENCE, children:["a", 1] },
                    { UID:1, type:SEQUENCE, children:["b", 2] },
                    { UID:2, type:CHOICE, children:[3, "e"] },
                    { UID:3, type:CHOICE, children:["b", "c"] }
                ],
    },
    
    
    {
        source: "bcd",
        rules:  [
                    { UID:0, type:SEQUENCE, children:[1 ,"d"] },
                    { UID:1, type:CHOICE, children:[2, "b"] },
                    { UID:2, type:SEQUENCE, children:["b", "c"] }
                ]
    },

    // Left Recursion [DOESNT WORK]
    // A = A a / a
    {
        source: "aaa",
        rules:  [
                    { UID:0, type:CHOICE, children:[1, "a"] },
                    { UID:1, type:SEQUENCE, children:[0, "a"] }
                ]
    },

    // Right Recursion
    // A = a (A / "")
    {
        source: "aaa",
        rules:  [
                    { UID:0, type:SEQUENCE, children:["a", 1] },
                    { UID:1, type:CHOICE, children:[0, ""] }
                ]
    },

    // ??
    {
        source: "aaa",
        rules:  [
                    { UID:0, type:NAME, children:[1], name:"start" },
                    { UID:1, type:CHOICE, children:[2, "a"] },
                    { UID:2, type:SEQUENCE, children:[1, "a"] }
                ]
    },

    // start = (("a" "a") "a") "b") /
    //         (("a" "a") "a") !"d" "c")
    {
        source: "aaac",
        rules:  [
                    { UID:0, type:CHOICE, children:[1, 2] },
                    { UID:1, type:SEQUENCE, children:[3, "b"] },
                    { UID:2, type:SEQUENCE, children:[3, 5] },
                    { UID:3, type:SEQUENCE, children:[4, "a"] },
                    { UID:4, type:SEQUENCE, children:["a", "a"] },
                    { UID:5, type:AND, children:[6, -1] },
                    { UID:6, type:NOT, children:["d"] }
                ]
    }
];