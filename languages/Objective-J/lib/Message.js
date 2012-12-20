
var Splice = require("./Traversal.js").Splice;

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

module.exports["MessageExpression"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        var messageContext = new Context(aContext, false);

        messageContext.isSuper = false;
        messageContext.selector = "";

        splices.push(new Splice(aNode.range.location, 1, function()
        {
            if (!messageContext.isSuper)
                return "objj_msgSend(";

            var result = "objj_msgSendSuper({ receiver:self, super_class:";

            if (messageContext.isClassMethod)
                result += "objj_getMetaClass(";
            else
                result += "objj_getClass(";

            return result + "\"" + aContext.className + "\").super_class }";
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
            if (aContext.selector.length)
                return ", \"" + aContext.selector + "\"";

            return "";
        }));
    }
}

module.exports["SelectorLabelCall"] =
{
    exitedNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length, 0, ", "));
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

// Selectors

// Always remove whitespace in selectors.
module.exports["SelectorWhitespace"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
    }
}

// If we care about the selector, accumulate the colon and delete it.
module.exports["SelectorColon"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (hasOwnProperty.call(aContext, "selector"))
        {
            aContext.selector += ":";
            splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
        }
    }
}

// If we care about the selector, accumulate the label and delete it.
module.exports["SelectorLabel"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (hasOwnProperty.call(aContext, "selector"))
        {
            aContext.selector += aNode.innerText();
            splices.push(new Splice(aNode.range.location, aNode.range.length, ""));
        }
    }
}

// Selector Literals
// Simply remove surrounding @selector_( and add quotes.

module.exports["SelectorLiteralPrefix"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, aNode.range.length, "sel_getUid(\""));

        return new Context(aContext, false);
    }
}

module.exports["SelectorLiteralPostfix"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, 0, "\""));

        return aContext.parentContext;
    }
}

