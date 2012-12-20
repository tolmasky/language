
module.exports.Node = function(entry, exit)
{
    this.enteredNode = entry;
    this.exitedNode = exit;
}

module.exports.Splice = function(aLocation, aLength, anInsertion)
{
    this.location = aLocation;
    this.length = aLength;

    if (typeof anInsertion === "function")
        this.insertion = { toString: function() { return anInsertion(); } };
    else
        this.insertion = anInsertion;
}
