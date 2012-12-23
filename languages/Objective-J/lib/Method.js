
var hasOwnProperty = Object.prototype.hasOwnProperty;
var Context = require("./Context.js");

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
        return new Context(aNode, aContext,
        {
            "scope": { },
            "selector": "",
            "types":[],
            "class-method": false
        });
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, ");"]);
    }
}

module.exports["ClassMethodSignifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("class-method", true);
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
            var variable =  aContext.get("class-method") ?
                            aContext.get("generated-meta-class-variable") :
                            aContext.get("generated-class-variable");

            return "class_addMethod(" + variable + ", \"" +
                    aContext.get("selector") + "\", [" +
                    aContext.get("types").join(", ") + "], function(self, _cmd";
        }}]);
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, ")"]);
    }
}

module.exports["MethodParameterType"] =
module.exports["MethodReturnType"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (aNode.innerText().length === 0)
            aContext.get("types").push("\"id\"");

        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["MethodParameterTypeIdentifier"] =
module.exports["MethodReturnTypeIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("types").push("\"" + aNode.innerText() +"\"");
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
        aContext.get("scope")[aNode.innerText()] = true;
    }
}

module.exports["MethodELLIPSIS"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

function findContextWithIdentifierInScope(aContext, anIdentifier)
{
    var context = aContext,
        metaClassScope = context.get("class-method") || false;

    while (context)
    {
        var scopeName = context.has("class-name") && metaClassScope ? "meta-scope" : "scope";

        if (context.has(scopeName, false))
        {
            var scope = context.get(scopeName, false);

            if (hasOwnProperty.call(scope, anIdentifier))
                return context;
        }

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
            var identifier = aNode.innerText();

            // self is var-ed through the method itself parameters.
            if (identifier === "self")
                return "";

            // Find which context's scope contains this identifier.
            var context = findContextWithIdentifierInScope(aContext, aNode.innerText());

            if (!context || context.has("global", false))
            {
                return "";
                // global scope
                var report = aNode.report(),
                    message = "Line: " + report.lineNumber + "\n" + report.visualization + "\n";

                message += "Warning: " + aNode.innerText() + " is global.";

                console.log(message);
            }

            else if (context.has("class-name", false))
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
        return new Context(aNode, aContext, { "scope": { }  });
    }
}

// Add function parameters and var's to scope.
module.exports["FunctionParameterIdentifier"] =
module.exports["VariableIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("scope")[aNode.innerText()] = true;
    }
}
