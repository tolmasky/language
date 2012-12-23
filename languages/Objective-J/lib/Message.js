
var Context = require("./Context.js");

var RECEIVER_VARIABLE   = 0,
    RECEIVER_SUPER      = 1,
    RECEIVER_SUPER_META = 2;

module.exports["MessageExpression"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        var messageContext = new Context(aNode, aContext,
        {
            "selector": "",
            "receiver": RECEIVER_VARIABLE
        });

        splices.push([aNode.range.location, 1,
        {
            toString:function()
            {
                var receiver = messageContext.get("receiver");

                if (receiver === RECEIVER_VARIABLE)
                    return "objj_msgSend(";

                var result = "objj_msgSendSuper({ receiver:self, super_class:";

                if (receiver === RECEIVER_SUPER)
                    result += "objj_getClass(";
                else
                    result += "objj_getMetaClass(";

                return result + "\"" + aContext.get("class-name") + "\").super_class }";
            }
        }]);

        return messageContext;
    },

    exitedNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length - 1, 1, ")"]);
    }
}

module.exports["SelectorCall"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0,
        {
            toString:function()
            {
                var selector = aContext.get("selector");

                if (selector.length)
                    return ", \"" + selector + "\"";

                return "";
            }
        }]);
    }
}

module.exports["SelectorLabelCall"] =
{
    exitedNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, ", "]);
    }
}

module.exports["SUPER"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("receiver", aContext.get("class-method") ? RECEIVER_SUPER_META : RECEIVER_SUPER);
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

// Selectors

// Always remove whitespace in selectors.
module.exports["SelectorWhitespace"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

// If we care about the selector, accumulate the colon and delete it.
module.exports["SelectorColon"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (!aContext.has("selector-literal", false) && aContext.has("selector"))
        {
            aContext.set("selector", aContext.get("selector") + ":");
            splices.push([aNode.range.location, aNode.range.length, ""]);
        }
    }
}

// If we care about the selector, accumulate the label and delete it.
module.exports["SelectorLabel"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (!aContext.has("selector-literal", false) && aContext.has("selector"))
        {
            aContext.set("selector", aContext.get("selector") + aNode.innerText());
            splices.push([aNode.range.location, aNode.range.length, ""]);
        }
    }
}

// Selector Literals
// Simply remove surrounding @selector_( and add quotes.

module.exports["SelectorLiteral"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new Context(aNode, aContext, { "selector-literal":true });
    }
}

module.exports["SelectorLiteralPrefix"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, "sel_getUid(\""]);
    }
}

module.exports["SelectorLiteralPostfix"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, "\""]);
    }
}

