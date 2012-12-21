
var hasOwnProperty = Object.prototype.hasOwnProperty;

// start = (("a" "a") "a") "b") /
//         (("a" "a") "a") !"d" "c")

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
    DOT         = -1;

var FAIL        = 0,
    SUCCESS     = 2,
    INCOMPLETE  = 3;

var context =
{
    rules : {
                0: { UID:0, type:CHOICE, children:[1, "a"] },
                1: { UID:1, type:SEQUENCE, children:[0, "a"] }
            },
    incomplete: { },
    cache: { }
};
/*
var context =
{
    rules : {
                0: { UID:0, type:CHOICE, children:[1, 2] },
                1: { UID:1, type:SEQUENCE, children:[3, "b"] },
                2: { UID:2, type:SEQUENCE, children:[3, 5] },
                3: { UID:3, type:SEQUENCE, children:[4, "a"] },
                4: { UID:4, type:SEQUENCE, children:["a", "a"] },
                5: { UID:5, type:AND, children:[6, -1] },
                6: { UID:6, type:NOT, children:["d"] }
            },
    incomplete: { },
    cache: { }
};*/

var start = fall(null, 0, 0, context);

var source = "aaaa",
    index = 0,
    count = source.length;
print_node(start);
for (; index < count; ++index)
{
    console.log("+++++DOING " + source[index]);
    context = parse(context, index, source[index]);
    //console.log(context);
    print_node(start);
}

function print_node(node, indentation, prints)
{
    indentation = indentation || "";
    prints = prints || { };

    if (prints[node.UID] === 2)
        return;
    else if (prints[node.UID] === 1)
        prints[node.UID] += 1;
    else
        prints[node.UID] = 1;

    var rule = node.rule;

    if (typeof rule === "string")
        console.log(indentation + rule + " [" + node.state + "]");

    else if (rule === -1)
        console.log(indentation + "DOT " + node.UID);

    else if (rule.type === CHOICE)
        console.log(indentation + "CHOICE " + node.UID);

    else if (rule.type === SEQUENCE)
        console.log(indentation + "SEQUENCE " + node.UID);

    else if (rule.type === NOT)
        console.log(indentation + "NOT " + node.UID);

    else if (rule.type === AND)
        console.log(indentation + "AND " + node.UID);

    for (var index = 0, count = node.children.length; index < count; ++index)
        print_node(node.children[index], indentation + "   ", prints);

    prints[node.UID]--;
}

function fall(parent, ruleUID, index, context)
{
    var UID = ruleUID + " " + index,
        rule = context.rules[ruleUID] || ruleUID,
        cache = context.cache,
        node = cache[UID] || { UID:UID, state:INCOMPLETE, rule:rule, parents:{ }, children:[] };

    // Only add this parent if we haven't already accounted for it.
    // This accounts for the user doing something silly like A / A
    if (parent && !hasOwnProperty.call(node.parents, parent.UID))
        node.parents[parent.UID] = parent;

    // If it's cached, we've already worked this one out.
    if (cache[UID])
        return node;

    // Add this to the cache.
    cache[UID] = node;

    // If this is a character, there is nothing we can do during the fall stage.
    // Simply store it in the incomplete hash and return.
    if (typeof rule === "string" || rule === -1)
    {
        // The empty string always trivially succeeds, and consumes no input.
        if (rule === "")
            climb(node, context);
        else
            context.incomplete[UID] = node;

        return node;
    }

    // We always want to fill in the first child.
    node.children[0] = fall(node, node.rule.children[0], index, context);

    // But only the second if this is a CHOICE or and AND.
    if (rule.type === CHOICE || rule.type === AND)
        node.children[1] = fall(node, node.rule.children[1], index, context);

    return node;
}

function climbAllParents(node, context)
{
    var parents = node.parents;

    for (UID in parents)
        if (hasOwnProperty.call(parents, UID))
            climb(parents[UID], context);
}

function climb(node, context)
{
    if (node.state !== INCOMPLETE)
        return;

    var children = node.children,
        rule = node.rule;

    if (rule.type === CHOICE)
    {
        var lhs = children[0];

        // No matter what, if the first one is incomplete, we can't make a decision.
        if (lhs.state === INCOMPLETE)
            return;

        // If not, and this was our ONLY child, or it was successful,
        // then our state is now it's state and we can keep climbing.
        if (children.length === 1 || lhs.state === SUCCESS)
        {
            children.length = 1;
            node.state = lhs.state;

            return climbAllParents(node, context);
        }

        // Now we know for sure that we have 2 children AND the first was a failure,
        // so its all on rhs.
        var rhs = children[1];

        // Same as before, keep waiting.
        if (rhs.state === INCOMPLETE)
            return;

        // From now on, we know we have a result, either success of fail.
        node.state = rhs.state;

        // If we succeeded, do a little accounting to make rhs our only child.
        if (rhs.state === SUCCESS)
        {
            children[0] = rhs;
            children.length = 1;
        }
        else
            children.length = 0;

        return climbAllParents(node, context);
    }

    else if (rule.type === AND)
    {
        var lhs = children[0],
            rhs = children[1];

        // We have to know the result of both to continue.
        if (lhs.state === INCOMPLETE || rhs.state === INCOMPLETE)
            return;

        // If our first child (the "predicate") fails, then we fail.
        // Both must succeed to succeed as a whole.
        node.state = (lhs.state === SUCCESS && rhs.state === SUCCESS) ? SUCCESS : FAIL;

        children[0] = rhs;
        children.length = 1;

        return climbAllParents(node, context);
    }

    else if (rule.type === SEQUENCE)
    {
        // If we have two children, there is no more advancing left to do.
        // We simply have to decide if we succeeded or failed.
        if (children.length === 2)
        {
            node.state = children[1].state;

            return climbAllParents(node, context);
        }

        // If not, then see whether the first one failed...
        if (children[0].state === FAIL)
        {
            node.state = FAIL;

            return climbAllParents(node, context);
        }

        // If it succeeded, then fall down again...
        children[1] = fall(node, node.rule.children[1], index, context);           
    }

    else if (rule.type === NOT)
    {
        var child = children[0];

        if (child.state === INCOMPLETE)
            return;

        node.state = (child.state === FAIL ? SUCCESS : FAIL);

        return climbAllParents(node, context);
    }
}

function parse(context, index, character)
{
    var incomplete = context.incomplete;
    var newContext = { rules:context.rules, incomplete:{ }, cache:{ } };

    for (UID in incomplete)
        if (hasOwnProperty.call(incomplete, UID))
        {
            var node = incomplete[UID];

            node.state = node.rule === -1 || character === node.rule ? SUCCESS : FAIL;
            climbAllParents(node, newContext);
        }

    return newContext;
}

