
hasOwnProperty = Object.prototype.hasOwnProperty;

function Context(aNode, aContext, data)
{
    this.node = aNode;
    this.parentContext = aContext;
    this.data = data;
}

Context.prototype.owner = function(aProperty)
{
    if (hasOwnProperty.call(this.data, aProperty))
        return this;

    if (this.parentContext)
        return this.parentContext.owner(aProperty);

    return null;
}

Context.prototype.has = function(aProperty, shouldClimb)
{
    if (hasOwnProperty.call(this.data, aProperty))
        return true;

    if ((shouldClimb !== false) && this.parentContext)
        return this.parentContext.has(aProperty);

    return false;
}

Context.prototype.get = function(aProperty, shouldClimb)
{
    if (hasOwnProperty.call(this.data, aProperty))
        return this.data[aProperty];

    if ((shouldClimb !== false) && this.parentContext)
        return this.parentContext.get(aProperty);
}

Context.prototype.set = function(aProperty, aValue)
{
    if (hasOwnProperty.call(this.data, aProperty))
        this.data[aProperty] = aValue;

    else if (this.parentContext)
        this.parentContext.set(aProperty, aValue);
}

module.exports = Context;
