
var Parser = require("./Parser.js");

var handlers = { "enteredNode" : { }, "exitedNode": { } };
var splices = [];

function register(external)
{
    for (key in external)
    {
        var traversal = external[key];

        if (!traversal)
            continue;

        if (traversal.enteredNode)
            handlers["enteredNode"][key] = traversal.enteredNode;

        if (traversal.exitedNode)
            handlers["exitedNode"][key] = traversal.exitedNode;
    }
}

function Context(aContext)
{
    this.parentContext = aContext;
    this.scope = { };
}

register(require("./Class.js"));
register(require("./Method.js"));
register(require("./Literal.js"));
register(require("./Message.js"));
register(require("./Import.js"));
register(require("./Function.js"));

module.exports.compile = function(source)
{
    var tree = Parser.parse(source),
        entries = handlers["enteredNode"],
        exits = handlers["exitedNode"],
        splices = [],
        context = new Context(null);

    tree.traverse({
        traversesTextNodes : false,
        enteredNode : function(aNode)
		{
            var handler = entries[aNode.name];

            if (handler)
                context = handler(aNode, context, splices) || context;
		},
        exitedNode : function(aNode)
        {
            var handler = exits[aNode.name];

            if (handler)
                context = handler(aNode, context, splices) || context;
        }
	});

    var index = splices.length,
        characters = source.split("");

    while (index--)
    {
        var splice = splices[index];

        characters.splice(splice.location, splice.length, splice.insertion);
    }

	return characters.join("");
}

/*
    var index = splices.length,
        buffer = [],
        remaining = source;

    while (index--)
    {
        var splice = splices[index],
            rhs = remaining.substr(splice.location + splice.length);

        remaining = remaining.substr(0, splice.location);

        buffer.unshift(splice.insertion, rhs);
    }

    buffer.unshift(remaining);

	return buffer.join("");
*/