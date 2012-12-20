
var Splice = require("./Traversal.js").Splice;

module.exports["ObjectiveJLiteralMarker"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push(new Splice(aNode.range.location, "@".length, ""));
    }
}
