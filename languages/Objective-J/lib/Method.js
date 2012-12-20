
var Splice = require("./Traversal.js").Splice;

var hasOwnProperty = Object.prototype.hasOwnProperty;

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
module.exports["ClassMethodDeclaration"] =
module.exports["InstanceMethodDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var methodContext = new Context(aContext, false);

        this.selector = "";
        this.isClassMethod = false;

        return methodContext;
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length, 0, ");"));

        return aContext.parentContext;
    }
}

module.exports["ClassMethodSignifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.isClassMethod = true;
        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
    }
}
module.exports["InstanceMethodSignifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
    }
}

module.exports["MethodSignature"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, 0, function()
        {
            var classVariable = aContext.isClassMethod ? aContext.parentContext.metaClassVariable : aContext.parentContext.classVariable;

            return "class_addMethod(" + classVariable + ", \"" + aContext.selector + "\", function(self, _cmd";
        }));
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length, 0, ")"));
    }
}

module.exports["MethodType"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
    }
}

module.exports["MethodParameter"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, 0, ","));
    }
}

module.exports["MethodParameterIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.scope[aNode.innerText()] = true;
    }
}

module.exports["MethodELLIPSIS"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
    }
}


