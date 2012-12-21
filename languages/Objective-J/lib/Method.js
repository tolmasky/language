
var hasOwnProperty = Object.prototype.hasOwnProperty;

function Context(aContext, shouldCreateScope)
{
    this.parentContext = aContext;
    this.scope = shouldCreateScope ? { } : aContext.scope;

    if (aContext)
    {
        var transfer = ["className", "isClassMethod"],
            index = transfer.length;

        while (index--)
            this[transfer[index]] = aContext[transfer[index]];
    }
}

// Objective-J Literals

// Just remove the @. (This handles strings and arrays).
module.exports["ObjectiveJLiteralMarker"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, "@".length, ""]);
    }
}

// Import Statements.

// Replace @import with objj_import(
module.exports["ImportStatement"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, "@import".length, "objj_import("]);
    }
}

// Replace <> with "", NO);
module.exports["StandardFilePath"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 1, "\""]);
    },

    exitedNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length - 1, 1, "\", NO);"]);
    }
}

// Simply append , YES);
module.exports["LocalFilePath"] =
{
    exitedNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, ", YES);"]);
    }
}

module.exports["ClassMethodDeclaration"] =
module.exports["InstanceMethodDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var methodContext = new Context(aContext, true);

        methodContext.selector = "";
        methodContext.isClassMethod = false;

        return methodContext;
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, ");"]);

        return aContext.parentContext;
    }
}

module.exports["ClassMethodSignifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.isClassMethod = true;
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}
module.exports["InstanceMethodSignifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["MethodSignature"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, { toString:function()
        {
            var classVariable = aContext.isClassMethod ? aContext.parentContext.metaClassVariable : aContext.parentContext.classVariable;

            return "class_addMethod(" + classVariable + ", \"" + aContext.selector + "\", function(self, _cmd";
        }}]);
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, ")"]);
    }
}

module.exports["MethodType"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["MethodParameter"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, ","]);
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
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

function contextOwningIdentifier(aContext, anIdentifier)
{
    var context = aContext,
        scope = "scope";

    while (context)
    {
        if (context.isMeta)
            scope = "metaScope";

        if (hasOwnProperty.call(context, scope) &&
            hasOwnProperty.call(context[scope], anIdentifier))
            return context;

        context = context.parentContext;
    }

    return null;
}

// Add "self." if necessary.
module.exports["IdentifierExpression"] =
{
    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, { toString:function()
        {
            var context = contextOwningIdentifier(aContext, aNode.innerText());

            if (!context)
            {
                // global scope
/*
                    var report = aNode.report(),
                        message = report.visualization + "\n";

                    message += "WARNING line " + report.lineNumber + ": " + aNode.innerText() + " is global.";

                    return message;
*/
            }
            else if (context.isClassContext)
                return "self.";

            return "";
        }}]);
    }
}

// Create a new context with scope.
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

// Add function parameters and var's to scope.
module.exports["FunctionParameterIdentifier"] =
module.exports["VariableIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.scope[aNode.innerText()] = true;
    }
}

