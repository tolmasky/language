
var hasOwnProperty = Object.prototype.hasOwnProperty;

// A?
//  R = A / ""
// A*
//  U = A / ""
//  R = U / R
// A+
//

var CHARACTER   = 0,
    CHOICE      = 1,
    SEQUENCE    = 2,
    NOT         = 3,
    AND         = 4,
    NAME        = 5,
    DOT         = -1;

var FAIL        = 0,
    SUCCESS     = 1,
    INCOMPLETE  = 2;

var EOF         = { };

function Context(aContext, rules)
{
    this.rules = rules;
    this.incomplete = { };
    this.cache = { };
    this.recursive = { };
    this.index = -1;

    if (aContext)
    {
        this.rules = aContext.rules;
        this.index = aContext.index + 1;
    }
}

function SyntaxNode(context, parent, ruleUID)
{
    var UID = ruleUID + " " + context.index;
    var node = context.cache[UID] || this;

    if (node === this)
    {
        node.UID = UID;
        node.state = INCOMPLETE;
        node.rule = context.rules[ruleUID] || ruleUID;
        node.children = [];
        node.parents = { };
    }

    // Only add this parent if we haven't already accounted for it.
    // This accounts for the user doing something silly like A / A
    if (parent && !hasOwnProperty.call(node.parents, parent.UID))
        node.parents[parent.UID] = parent;

    if (node === this)
        descend(context, node);

    return node;
}

SyntaxNode.prototype.toString = function(indentation)
{
    indentation = indentation || "";

    var rule = this.rule;
    var meta = " (" + this.UID + ")[" + this.state + "] ";
    var type = ["", "CHOICE", "SEQUENCE", "NOT", "AND", "NAME"][rule.type] || (rule === -1 ? "DOT" : rule);
    var string = indentation + type + meta + (this.name || "") + "\n";

    for (var index = 0, count = this.children.length; index < count; ++index)
        string += this.children[index].toString(indentation + "   ");

    return string;
}

function descend(context, node)
{
    var UID = node.UID;
    var rule = node.rule;

    // If this is a character, there is nothing we can do during the fall stage.
    // Simply store it in the incomplete hash and return.
    if (typeof rule === "string" || rule === DOT)
    {
        // The empty string always trivially succeeds, and consumes no input.
        if (rule === "")
            climb(node, context);
        else
            context.incomplete[UID] = node;

        return;
    }

    if (rule.type === NAME)
        node.name = rule.name;

    var recursive = context.recursive;

    // Before handling our children, make sure we register ourselves so we don't get handled again.
    recursive[rule.UID] = true;

    if (rule.type === SEQUENCE)
        node.children[0] = new SyntaxNode(context, node, rule.children[0]);
    else
        node.children = rule.children.map(function (ruleUID) { return new SyntaxNode(context, node, ruleUID); });

    // Now unregister ourselves.
    delete recursive[rule.UID];
}

function setState(aContext, aNode, aState)
{
    aNode.state = aState;

    if (aState === FAIL)
        aNode.children.length = 0;

//    console.log(["FAILED", "SUCCEEDED", "INCOMPLETE"][aNode.state] + aNode.UID + " " + aNode.children.length);

    var parents = aNode.parents;

    for (UID in parents)
        if (hasOwnProperty.call(parents, UID))
            climb(parents[UID], aContext);
}

function climb(node, context)
{
    if (node.state !== INCOMPLETE)
        return;

    var children = node.children,
        rule = node.rule;

    if (rule.type === CHOICE)
    {
        var index = 0,
            count = children.length;

        for (; index < count; ++index)
        {
            var child = children[index];

            // Can't know yet.
            if (child.state === INCOMPLETE)
                return;

            if (child.state === SUCCESS)
            {
                children[0] = child;
                children.length = 1;

                return setState(context, node, SUCCESS);
            }

            // By this point, there can only be FAILUREs behind us...
            if (index == count - 1) // && child.state === FAILURE
                return setState(context, node, FAIL);
        }

        return;
    }

    else if (rule.type === AND)
    {/*
        if (children.some(function (child) { return child.state === INCOMPLETE; }))
            return;

        node.state =    children.every(function (child) { return child.state === SUCCESS; }) ?
                        SUCCESS : FAIL;

        if (node.state === SUCCESS)
        {
            children[0] = children[children.length - 1];
            children.length = 1;
        }
        else
            children.length = 0;

        return climbAllParents(node, context);
*/
        var lhs = children[0],
            rhs = children[1];

        // We have to know the result of both to continue.
        if (lhs.state === INCOMPLETE || rhs.state === INCOMPLETE)
            return;

        // If our first child (the "predicate") fails, then we fail.
        // Both must succeed to succeed as a whole.
        var state = (lhs.state === SUCCESS && rhs.state === SUCCESS) ? SUCCESS : FAIL;

        children[0] = rhs;
        children.length = 1;

        return setState(context, node, state);
    }

    else if (rule.type === SEQUENCE)
    {
        var count = children.length,
            last = children[count - 1];

        // Can't know yet.
        if (last.state === INCOMPLETE)
            return;

        if (last.state === FAIL)
            return setState(context, node, FAIL);

        if (count === rule.children.length)
            return setState(context, node, SUCCESS);

        children[count] = new SyntaxNode(context, node, rule.children[count]);

        return;
    }

    else if (rule.type === NOT)
    {
        var child = children[0];

        if (child.state === INCOMPLETE)
            return;

        return setState(context, node, child.state === FAIL ? SUCCESS : FAIL);
    }

    else if (rule.type === NAME)
    {
        var child = children[0];

        if (child.state === INCOMPLETE)
            return;

        return setState(context, node, child.state);
    }
}

function parse(context, character)
{
    var incomplete = context.incomplete;
    var newContext = new Context(context);
    var UID;

    for (UID in incomplete)
        if (hasOwnProperty.call(incomplete, UID))
        {
            var node = incomplete[UID];
            var state = (node.rule === DOT || character === node.rule) ? SUCCESS : FAIL;

            setState(newContext, node, state);
        }

    return newContext;
}

/*
// ADOPTION
// gotta get up and try and try and try
//carry onnnn the sound may your touch the ground
// r = (bc / b) d
// r = (bc d / b d)
// r = (;_set) - (choice(bc) d)
//   =         - (choice(b) d)
// algo:
// (not? pred?)
// climb to seq take remaining, append.
// r = choice hold(bc) -> seq _next_
//            hold(b) -> seq _next_
// a (c / d) b
// a ((c) b / (d) b)
/*
//left recursion through --> wehn done, re-adopt and move.
*/

var test = require("./ptests.js")[3];
var source = test.source;
var rules = test.rules;

var time = new Date();
var context = new Context(null, rules);
var start = new SyntaxNode(context, null, 0);

console.log("PREPARSE [" + -1 + "] = \"\"\n");
console.log(start.toString());

var index = 0,
    count = source.length;

for (; index < count; ++index)
{
    console.log("\nPARSING [" + index + "] = \"" + source[index] + "\"\n");
    context = parse(context, source[index]);
    console.log(start.toString());
}

console.log("\nPARSING [" + (index + 1) + "] = EOF\n");
context = parse(context, EOF);
console.log(new Date() - time);
