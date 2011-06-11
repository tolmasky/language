
if (typeof exports === "undefined")
    exports = window;

function SyntaxNode(/*String*/ aName, /*String*/ aSource, /*Number*/ aLocation, /*Number*/ aLength, /*String*/anErrorMessage)
{
    this.name = aName;
    this.source = aSource;
    this.range = { location:aLocation, length:aLength };
    this.children = [];

    if (anErrorMessage)
        this.error = anErrorMessage;
}

exports.SyntaxNode = SyntaxNode;

SyntaxNode.prototype.toString = function(/*String*/ spaces)
{
    if (!spaces)
        spaces = "";

    var string = spaces + this.name +  " <" + this.innerText() + "> ",
        children = this.children,
        index = 0,
        count = children.length;

    for (; index < count; ++index)
    {
        var child = children[index];

        if (typeof child === "string")
            string += "\n" + spaces + "\t" + child;

        else
            string += "\n" + children[index].toString(spaces + '\t');
    }

    return string;
}

SyntaxNode.prototype.innerText = function()
{
    var range = this.range;

    return this.source.substr(range.location, range.length);
}

SyntaxNode.prototype.traverse = function(walker)
{
    if (walker.enteredNode)
        walker.enteredNode(this);

    var children = this.children,
        index = 0,
        count = children && children.length;

    for (; index < count; ++index)
    {
        var child = children[index];

        if (typeof child !== "string")
            child.traverse(walker);

        else if (walker.traversesTextNodes)
        {
            walker.enteredNode(child);
            walker.enteredNode(child);
        }
    }

    if (walker.exitedNode)
        walker.exitedNode(this);
}
