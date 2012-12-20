
var Splice = require("./Traversal.js").Splice;

function MethodContext(aContext)
{
    this.parentContext = aContext;
    this.name = "";
    this.isClassMethod = false;
    this.scope = { };
}

module.exports["ClassMethodDeclaration"] = 
module.exports["InstanceMethodDeclaration"] = 
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new MethodContext(aContext);
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

            return "class_addMethod(" + classVariable + ", \"" + aContext.name + "\", function(self, _cmd";
        }));
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length, 0, ")"));
    }
}

module.exports["SelectorDeclaration"] = 
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.name += aNode.innerText();

        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
    }
}
module.exports["UnarySelectorDeclaration"] =  
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.name = aNode.innerText();

        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
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
