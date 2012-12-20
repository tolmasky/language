
var Splice = require("./Traversal.js").Splice;

function MessageContext(aContext)
{
    this.parentContext = aContext;
    this.isSuper = false;
    this.selector = "";
}

module.exports["MessageExpression"] = 
{
    enteredNode : function(aNode, aContext, splices)
    {
        var messageContext = new MessageContext(aContext);

        splices.push(new Splice(aNode.range.location, 1, function()
        {
            if (!messageContext.isSuper)
                return "objj_msgSend(";
            
            if (true)
                return "objj_msgSendSuper({ receiver:self, super_class:objj_getClass(\"" + "d" + "\").super_class }";

            return "";
        }));
    
        return messageContext;
    },
    
    exitedNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length - 1, 1, ")"));
    
        return aContext.parentContext;
    }
}

module.exports["SelectorCall"] = 
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, 0, function() 
        { 
            if (aContext.selector)
                return ", \"" + aContext.selector + "\"";
    
            return "";
        }));
    }
}

module.exports["SelectorPiece"] = 
{
    enteredNode : function(aNode, aContext, splices)
    {
        aContext.selector += aNode.innerText();
    
        splices.push(new Splice(aNode.range.location, aNode.range.length, ", "));
    }
}

module.exports["UnarySelectorCall"] = 
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, 0, ", \""));
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length, 0, "\""));
    }
}

module.exports["SUPER"] = 
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.isSuper = true;
        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
    }
}

