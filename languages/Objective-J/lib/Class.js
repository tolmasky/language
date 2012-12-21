
module.exports["ClassForwardDeclarationStatement"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["CPreprocessorStatement"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        // Warn/Error.
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

function ClassContext(aContext)
{
    this.parentContext = null;
    this.scope = { };
    this.metaScope = { };
    this.isClassContext = true;
    this.isCategory = false;
    this.className = "";
    this.superClassName = "Nil";
    this.classVariable = "the_class";
    this.metaClassVariable = "meta_class";
}

module.exports["ClassDeclarationStatement"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new ClassContext(aContext);
    },

    exitedNode: function(aNode, aContext, splices)
    {
        return aContext.parentContext;
    }
};

module.exports["ClassHeader"] =
{
    exitedNode: function(aNode, aContext, splices)
    {
        var insertion = "";

        if (aContext.isCategory)
        {
            insertion += "var the_class = objj_getClass(\"";
            insertion += aContext.className;
            insertion += ");\n\if (!the_class) throw new SyntaxError(\"*** Could not find definition for class \\\"";
            insertion += aContext.className;
            insertion += "\\\"\"); var meta_class = the_class.isa;";
        }
        else
        {
            insertion += "var the_class = objj_allocateClassPair(";
            insertion += aContext.superClassName;
            insertion += ", \"" + aContext.className;
            insertion += "\"), meta_class = the_class.isa; ";
            insertion += "objj_registerClassPair(the_class);";
        }

        splices.push([aNode.range.location, aNode.range.length, insertion]);
    }
};

module.exports["ClassName"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.className = aNode.innerText();
    }
}

module.exports["SuperClassName"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.superClassName = aNode.innerText() || "Nil";
    }
}

module.exports["CategoryDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.isCategory = true;
    }
}

module.exports["CompoundIvarDeclarationComma"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ";"]);
    }
}

module.exports["IvarType"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["IvarIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var ivarName = aNode.innerText();

        aContext.scope[ivarName] = true;

        if (aContext.superClassName === "Nil")
            aContext.metaScope[ivarName] = true;

        splices.push([aNode.range.location, aNode.range.length, "class_addIvar(the_class, \"" + ivarName + "\")"]);
    }
}
