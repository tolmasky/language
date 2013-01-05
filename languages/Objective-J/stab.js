
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

var EOF         = { toString: function() { return "EOF"; } };

function TRACE(x)
{
    console.log(x);
}

function Context(aContext, rules)
{
    this.rules = rules;
    this.incomplete = { };
    this.cache = { };
    this.index = -1;
    this.forest = { };

    SyntaxNodeMake(this, null, 0);
}

Context.prototype.clear = function()
{
    this.cache = { };
    this.incomplete = { };
    this.index++;
}

Context.prototype.printForest = function()
{
    var forest = this.forest,
        index = 0;

    for (var UID in forest)
        if (hasOwnProperty.call(forest, UID))
        {
            TRACE("TREE " + index++);
            TRACE(forest[UID].toString(""));
        }
}

function SyntaxNode(aContext, aParent, aUID, aRule, aState, children)
{
    this.context = aContext;
    this.UID = aUID;
    this.rule = aRule;
    this.state = aState === undefined ? INCOMPLETE : aState;
    this.parents = { };
    this.children = children ? children.slice() : [];

    if (aParent)
        this.parents[aParent.UID] = aParent;

    else
        aContext.forest[aUID] = this;
}

function SyntaxNodeCopy(aNode, aParent, aUIDAddition)
{
    TRACE("COPYING " + aNode.UID);
    var copy = new SyntaxNode(aNode.context, aParent, aNode.UID + aUIDAddition, aNode.rule, aNode.state, aNode.children);

    if (aParent)
    {
        var children = aParent.children;
        var index = children.lastIndexOf(aNode);
        TRACE("looking for " + aNode.UID + " in " + aParent.UID + " at " + index);
        children[index] = copy;
        TRACE("found it!");
        TRACE(aParent + "");
    }

    return copy;
}

function SyntaxNodeMake(aContext, aParent, aRuleUID)
{
    var UID = aRuleUID + " " + aContext.index;
    var node = aContext.cache[UID];

    TRACE("MAKING " + UID);
    if (node)
        node.parents[aParent.UID] = aParent;

    else
        node = new SyntaxNode(aContext, aParent, UID, aContext.rules[aRuleUID] || aRuleUID);

    if (aParent)
        aParent.children.push(node);

    if (!aContext.cache[UID])
    {
        aContext.cache[UID] = node;
        descend(aContext, node);
    }

    return node;
}

SyntaxNode.prototype.toSingleString = function()
{
    var rule = this.rule;
    var meta = " (" + this.UID + ")[" + this.state + "] ";
    var type = ["", "CHOICE", "SEQUENCE", "NOT", "AND", "NAME"][rule.type] || (rule === -1 ? "DOT" : rule);
    var string = type + meta + (this.name || "");

    return string;
}

SyntaxNode.prototype.toString = function(indentation)
{
    indentation = indentation || "";

    var string =  indentation + this.toSingleString();

    for (var index = 0, count = this.children.length; index < count; ++index)
        string += "\n" + this.children[index].toString(indentation + "   ");

    return string;
}

function descend(context, node)
{
    var UID = node.UID;
    var rule = node.rule;

    // The empty string always trivially succeeds, and consumes no input.
    if (rule === "")
        return setState(context, node, SUCCESS);

    // If this is a leaf node (character or dot), there is nothing we can
    // do during the descend stage. Simply store it in the incomplete hash
    // and return.
    if (typeof rule === "string" || rule === DOT)
    {
        context.incomplete[UID] = node;
        return;
    }

    if (rule.type === NAME)
    {
        node.name = rule.name;
        return;
    }

    if (rule.type === SEQUENCE)
        return SyntaxNodeMake(context, node, rule.children[0]);

    TRACE("NEED TO SPLIT");

    var parentPaths = parentPathsForNode(node);
    var bounded = [];
    var children = node.rule.children;
    var count = children.length;

    while (count--)
    {
        var ruleUID = children[count];
        TRACE("RULE: " + ruleUID + "\n");

        parentPaths.forEach(function(aParentPath)
        {
            var parent = null;

            TRACE("PATH: [" + aParentPath.map(function(e) { return e.UID; }).join(",") + "]");
            aParentPath.forEach(function(aNode)
            {
                if (!parent)
                    delete context.forest[aNode.UID];

                parent = SyntaxNodeCopy(aNode, parent, " from (" + node.UID + ")@[" + count + "]");
            });

            TRACE("-For " + parent.UID + "  count: " + bounded.length);
            // WHAT?
            parent.bounded = bounded;
            bounded = bounded.concat(parent);

            SyntaxNodeMake(context, parent, ruleUID);
        });
    }
}

function parentPathsForNode(aNode)
{
    var parents = aNode.parents,
        parentPaths = [];

    for (var UID in parents)
        if (hasOwnProperty.call(parents, UID))
        {
            var parent = parents[UID],
                grandparentPaths = parentPathsForNode(parent);

            grandparentPaths.forEach(function(aGrandparentPath)
            {
                parentPaths.push(aGrandparentPath.concat(aNode));
            });
        }

    if (parentPaths.length === 0)
        parentPaths.push([aNode]);

    return parentPaths;
}

function setState(aContext, aNode, aState)
{
    TRACE("conclusing: " + aNode.UID + " " + (hasOwnProperty.call(aNode.rule, "UID") ? aNode.rule.UID : aNode.rule) + " " + aNode.bounded);
    aNode.state = aState;

    if (aState === FAIL)
    {
        aNode.children.length = 0;

        if (aContext.forest[aNode.UID])
            delete aContext.forest[aNode.UID];
    }
    else if (aState === SUCCESS && aNode.bounded)
    {
        TRACE("in here " + aNode.bounded.length);
        aNode.bounded.forEach(function(aNode)
        {
            TRACE("NO NEED TO BOTHER WITH: " + aNode.UID);
            setState(aContext, aNode, FAIL);
        });
    }

//    TRACE(["FAILED", "SUCCEEDED", "INCOMPLETE"][aNode.state] + aNode.UID + " " + aNode.children.length);

    var parents = aNode.parents;

    for (var UID in parents)
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

        SyntaxNodeMake(context, node, rule.children[count]);

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

    context.clear();

    for (var UID in incomplete)
        if (hasOwnProperty.call(incomplete, UID))
        {
            var node = incomplete[UID];
            var state = (node.rule === DOT || character === node.rule) ? SUCCESS : FAIL;

            setState(context, node, state);
        }
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

var test = require("./ptests.js")[1];
var source = test.source;
var rules = test.rules;

var time = new Date();
var context = new Context(null, rules);

TRACE("PARSING [" + -1 + "] = \"\"\n");
context.printForest();

var index = 0,
    count = source.length + 1;

for (; index < count; ++index)
{
    TRACE(  "\nPARSING [" + index + "] = \"" +
            (source.charAt(index) || EOF) +
            "\" -----------------\n");
    parse(context, source.charAt(index) || EOF);
    context.printForest();
}

console.log(new Date() - time);
