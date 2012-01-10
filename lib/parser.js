
function Parser(/*String | CompiledGrammar*/ aGrammar)
{
    if (typeof aGrammar.valueOf() === "string")
        this.compiledGrammar = new (require("./compiledgrammar"))(aGrammar);
    else
        this.compiledGrammar = aGrammar;

    return this;
}

module.exports = Parser;

Parser.prototype.parse = function(input)
{
    return parse(this.compiledGrammar, input);
}

var NAME                = 0,
    DOT                 = 1,
    CHARACTER_CLASS     = 2,
    ORDERED_CHOICE      = 3,
    SEQUENCE            = 4,
    STRING_LITERAL      = 5,
    ZERO_OR_MORE        = 6,
    ONE_OR_MORE         = 7,
    OPTIONAL            = 8,
    NEGATIVE_LOOK_AHEAD = 9,
    POSITIVE_LOOK_AHEAD = 10,
    ERROR_NAME          = 11,
    ERROR_CHOICE        = 12;

function parse(aCompiledGrammar, input, name)
{
    var node = new SyntaxNode("#document", input, 0, 0),
        table = aCompiledGrammar.table,
        nameToUID = aCompiledGrammar.nameToUID;

    name = name || "start";

    // This is a stupid check.
    if (aCompiledGrammar.nameToUID["EOF"] !== undefined)
        table[0] = [SEQUENCE, nameToUID[name], nameToUID["EOF"]];

    if (!evaluate(new context(input, table), node, table, 0))
    {
        // This is a stupid check.
        if (aCompiledGrammar.nameToUID["EOF"] !== undefined)
            table[0] = [SEQUENCE, nameToUID["%" + name], nameToUID["EOF"]];

        node.children.length = 0;

        evaluate(new context(input, table), node, table, 0);

        node.traverse(
        {
            traverseTextNodes:false,
            enteredNode:function(node)
            {
                if (node.error)
                    console.log(node.message() + "\n");
            }
        });
    }

    return node;
}

exports.parse = parse;

function context(input, table)
{
    this.position = 0;
    this.input = input;
    this.memos = [];
    for (var i=0;i<table.length;++i)
        this.memos[i] = [];
}

function evaluate(context, parent, rules, rule_id)
{
    var rule = rules[rule_id],
        type = rule[0],
        input_length = context.input.length,
        memos = context.memos[rule_id];

    var uid = context.position,
        entry = memos[uid];

    if (entry === false)
        return false;
    else if (entry === true)
        return true;
    else if (entry)
    {
        if (parent)
            parent.children.push(entry.node);
        context.position = entry.position;
        return true;
    }

    switch (type)
    {
        case NAME:
        case ERROR_NAME:
            var node = new SyntaxNode(rule[1], context.input, context.position, 0, rule[3]);
            if (!evaluate(context, node, rules, rule[2]))
            {
                memos[uid] = false;
                return false;
            }
            node.range.length = context.position - node.range.location;
            memos[uid] = { node:node, position:context.position };

            if (parent)
                parent.children.push(node);
            return true;

        case CHARACTER_CLASS:
            var character = context.input.charAt(context.position);

            if (typeof rule[1].valueOf() === "string")
                rule[1] = new RegExp(rule[1], "g");

            if (character.match(rule[1]))
            {
                if (parent)
                    parent.children.push(character);
                ++context.position;
                return true;
            }
            memos[uid] = false;
            return false;

        case SEQUENCE:
            var index = 1,
                count = rule.length;

            for (; index < count; ++index)
                if (!evaluate(context, parent, rules, rule[index]))
                {
                    memos[uid] = false;
                    return false;
                }

            return true;

        case ORDERED_CHOICE:
        case ERROR_CHOICE:
            var index = 1,
                count = rule.length,
                position = context.position;

            for (; index < count; ++index)
            {
                // cache opportunity here.
                var child_count = parent && parent.children.length;

                if (evaluate(context, parent, rules, rule[index]))
                    return true;

                if (parent)
                    parent.children.length = child_count;
                context.position = position;
            }
            memos[uid] = false;
            return false;

        case STRING_LITERAL:
            var string = rule[1],
                string_length = string.length;

            if (string_length + context.position > input_length)
            {
                memos[uid] = false;
                return false;
            }

            var index = 0;

            for (; index < string_length; ++context.position, ++index)
                if (context.input.charCodeAt(context.position) !== string.charCodeAt(index))
                {
                    context.position -= index;
                    memos[uid] = false;
                    return false;
                }

//            memos[uid] = string;
            if (parent)
                parent.children.push(string);

            return true;
        case DOT:
            if (context.position < input_length)
            {
                if (parent)
                    parent.children.push(context.input.charAt(context.position));
                ++context.position;
                return true;
            }
            memos[uid] = false;
            return false;
        case POSITIVE_LOOK_AHEAD:
        case NEGATIVE_LOOK_AHEAD:
            var position = context.position,
                result = evaluate(context, null, rules, rule[1]) === (type === POSITIVE_LOOK_AHEAD);
            context.position = position;
            memos[uid] = result;

            return result;

        case ZERO_OR_MORE:
            var child,
                position = context.position,
                childCount = parent && parent.children.length;

            while (evaluate(context, parent, rules, rule[1]))
            {
                position = context.position,
                childCount = parent && parent.children.length;
            }

            context.position = position;
            if (parent)
                parent.children.length = childCount;

            return true;

        case ONE_OR_MORE:
            var position = context.position,
                childCount = parent && parent.children.length;
            if (!evaluate(context, parent, rules, rule[1]))
            {
                memos[uid] = false;
                context.position = position;
                if (parent)
                    parent.children.length = childCount;
                return false;
            }
            position = context.position,
            childCount = parent && parent.children.length;
            while (evaluate(context, parent, rules, rule[1]))
            {
                position = context.position;
                childCount = parent && parent.children.length;
            }
            context.position = position;
            if (parent)
                parent.children.length = childCount;
            return true;

        case OPTIONAL:
            var position = context.position,
                childCount = parent && parent.children.length;

            if (!evaluate(context, parent, rules, rule[1]))
            {
                context.position = position;

                if (parent)
                    parent.children.length = childCount;
            }

            return true;
    }
}

function SyntaxNode(/*String*/ aName, /*String*/ aSource, /*Number*/ aLocation, /*Number*/ aLength, /*String*/anErrorMessage)
{
    this.name = aName;
    this.source = aSource;
    this.range = { location:aLocation, length:aLength };
    this.children = [];

    if (anErrorMessage)
        this.error = anErrorMessage;
}

SyntaxNode.prototype.message = function()
{
    var source = this.source,
        lineNumber = 1,
        index = 0,
        start = 0,
        length = source.length,
        range = this.range;

    for (; index < range.location; ++index)
        if (source.charAt(index) === '\n')
        {
            ++lineNumber;
            start = index + 1;
        }

    for (; index < length; ++index)
        if (source.charAt(index) === '\n')
            break;

    var line = source.substring(start, index);
        message = line + "\n";

    message += (new Array(this.range.location - start + 1)).join(" ");
    message += (new Array(Math.min(range.length, line.length) + 1)).join("^") + "\n";
    message += "ERROR line " + lineNumber + ": " + this.error;

    return message;
}

SyntaxNode.prototype.toString = function(/*String*/ spaces)
{
    if (!spaces)
        spaces = "";

    var string = spaces + this.name +  " <" + this.innerText() + "> ",
        children = this.children,
        index = 0,
        count = children.length;

    for (; index < count; ++index)
    {
        var child = children[index];

        if (typeof child === "string")
            string += "\n" + spaces + "\t" + child;

        else
            string += "\n" + children[index].toString(spaces + '\t');
    }

    return string;
}

SyntaxNode.prototype.innerText = function()
{
    var range = this.range;

    return this.source.substr(range.location, range.length);
}

SyntaxNode.prototype.traverse = function(walker)
{
    if (!walker.enteredNode || walker.enteredNode(this) !== false)
    {
        var children = this.children,
            index = 0,
            count = children && children.length;

        for (; index < count; ++index)
        {
            var child = children[index];

            if (typeof child !== "string")
                child.traverse(walker);

            else if (walker.traversesTextNodes)
            {
                walker.enteredNode(child);

                if (walker.exitedNode)
                    walker.exitedNode(child);
            }
        }
    }

    if (walker.exitedNode)
        walker.exitedNode(this);
}
