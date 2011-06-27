
var parser = require("./Calculator.js"),
    tree = parser.parse(process.argv[2]);

tree.traverse(
{
    // We don't care about the individual digits in a number, etc.
    traversesTextNodes:false, 
    exitedNode:function(aNode)
    {
        // What we're doing here is starting at the bottom of the tree
        // and evaluating upwards, creating a "value" property on the 
        // nodes to store our intermediate (and final) results as we do.
        var value = 0,
            children = aNode.children;

        // Base case (leaf node): simply make our atom integers.
        if (aNode.name === "integer")
            value = parseInt(aNode.innerText(), 10);

        // This handles the "trivial" case where either we have 
        // a root/primary node, OR we are simply wrapping another 
        // expression.
        else if (children.length === 1)
            value = children[0].value;

        else if (aNode.name === "parenthetical")
            value = children[1].value;

        // + and -
        else if (aNode.name === "additive")
            if (children[1] === "+")
                value = children[0].value + children[2].value;
            else
                value = children[0].value - children[2].value;

        // * and /
        else if (aNode.name === "multiplicative")
            if (children[1] === "*")
                value = children[0].value * children[2].value;
            else
                value = children[0].value / children[2].value;

        aNode.value = value;
    }
});

console.log(tree.value);
