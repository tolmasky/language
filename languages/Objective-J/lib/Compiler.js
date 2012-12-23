
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

var stuff = require("./Class.js");
var Context = stuff.Context;

module.exports.compile = function(source)
{
    var tree = Parser.parse(source),
        entries = handlers["enteredNode"],
        exits = handlers["exitedNode"],
        splices = [],
        context = new Context(null, null, { "global": true, "scope": { } });

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

            if (context.node === aNode)
                context = context.parentContext;
        }
	});

    // "Hand splicing" is much faster than calling splice each time...
    var index = 0;
        count = splices.length,
        characters = source.split("");

    for (; index < count; ++index)
    {
        var splice = splices[index],
            start = splice[0],
            stop = start + splice[1];

        for (; start < stop; ++start)
            characters[start] = "";

        if (stop - 1 < 0)
            characters[0] = splice[2] + characters[0];
        else
            characters[stop - 1] += splice[2];
    }

    var result = characters.join("");

    return result;
}
