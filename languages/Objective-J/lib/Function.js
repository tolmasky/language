
var Splice = require("./Traversal.js").Splice;

function Context(aContext, shouldCreateScope)
{
    this.parentContext = aContext;
    this.scope = shouldCreateScope ? aContext.scope : { };

    if (aContext)
    {
        var transfer = ["className", "isClassMethod"],
            index = transfer.length;

        while (index--)
            this[transfer[index]] = aContext[transfer[index]];
    }
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

function isIvar(aContext, anIdentifier)
{
    var context = aContext;

    while (context && hasOwnProperty.call(context, "scope"))
    {
        if (context.isClassContext)
            return hasOwnProperty.call(context.isMeta ? context.metaScope : context.scope, anIdentifier);

        if (hasOwnProperty.call(context.scope, anIdentifier))
            return false;

        context = context.parentContext;
    }

    return false;
}

module.exports["IdentifierExpression"] = 
{
    exitedNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, 0, function()
        {
            if (isIvar(aContext, aNode.innerText()))
                return "self.";

            return "";
        }));
    }
}

module.exports["FunctionBody"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new Context(aContext, true);
    },
    
    exitedNode: function(aNode, aContext, splices)
    {
        return aContext.parentContext;
    }
}

module.exports["FunctionParameterIdentifier"] =
module.exports["VariableIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.scope[aNode.innerText()] = true;
    }
}
