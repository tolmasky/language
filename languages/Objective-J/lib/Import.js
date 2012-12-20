
var Splice = require("./Traversal.js").Splice;

module.exports["ImportStatement"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, "@import".length, "objj_import("));
    }
}

module.exports["StandardFilePath"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, 1, "\""));
    },
    
    exitedNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length - 1, 1, "\", NO)"));
    }
}

module.exports["LocalFilePath"] =
{
    exitedNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location + aNode.range.length, 0, ", YES)"));
    }
}
