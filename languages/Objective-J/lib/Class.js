
var Context = require("./Context.js");

// 1. @class
// Class Forward Declarations exist only to support Objective-C code. Simply remove them.

module.exports["ClassForwardDeclarationStatement"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

// 2. # C Preprocessor Directives
// We simply ignore these (for things like #pragma mark). It may be wise to warn about
// them though, since it can point to forgetting to use the C preprocessor.

module.exports["CPreprocessorStatement"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        // Warn/Error.
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}


// 3. Function Globalification
// Since we wrap Objective-J code in an anonymous function, function declarations are
// local to that function. When we first wrote the language, we found this "unacceptable"
// and hacked this by turning it into a "global" set. We may want to deprecate this behavior.

module.exports["FunctionDeclarationKeyword"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        // We may want to either deprecate or warn about this legacy behavior.
        if (!aContext.parentContext)
            splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["FunctionDeclarationName"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        // We may want to either deprecate or warn about this legacy behavior.
        if (!aContext.parentContext)
            splices.push([aNode.range.location + aNode.range.length, 0, " = function " + aNode.innerText()]);
    }
}

module.exports["ClassDeclarationStatement"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new Context(aNode, aContext,
        {
            "scope": { },
            "meta-scope": { },
            "category-declaration": false,
            "class-name": "",
            "super-class-name": "Nil",
            "generated-class-variable": "the_class",
            "generated-meta-class-variable" : "meta_class"
        });
    }
};

module.exports["ClassHeader"] =
{
    exitedNode: function(aNode, aContext, splices)
    {
        var insertion = "";

        if (aContext.get("category-declaration"))
        {
            insertion += "var the_class = objj_getClass(\"";
            insertion += aContext.get("class-name");
            insertion += ");\n\if (!the_class) throw new SyntaxError(\"*** Could not find definition for class \\\"";
            insertion += aContext.get("class-name");
            insertion += "\\\"\"); var meta_class = the_class.isa;";
        }
        else
        {
            insertion += "var the_class = objj_allocateClassPair(";
            insertion += aContext.get("super-class-name");
            insertion += ", \"" + aContext.get("class-name");
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
        aContext.set("super-class-name", aNode.innerText() || "Nil");
    }
}

module.exports["CategoryDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("category-declaration", true);
    }
}

module.exports["CompoundIvarDeclarationComma"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ";"]);
    }
}

module.exports["IvarTypeDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["IvarTypeIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
//        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["Accessors"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var getter = aContext.get("accessor-name");
        var setter = "set" + getter.charAt(0).toUpperCase() + getter.substr(1) + ":";

        aContext.set("accessors", { "getter": getter, "setter": setter });
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, ""]);
    }
}

module.exports["AccessorsReadonly"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var accessors = aContext.get("accessors");

        delete accessors.setter;
    }
}

function trimUnderscore(aString, isSetter)
{
    return aString.charAt(0) === "_" ? aString.substr(1) : aString;
}

module.exports["AccessorsGetterSelector"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var getter = aNode.innerText();
        var accessors = aContext.get("accessors");

        accessors.getter = getter;
    }
}

module.exports["AccessorsSetterSelector"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var setter = aNode.innerText();
        var accessors = aContext.get("accessors");

        accessors.setter = aNode.innerText();
    }
}

module.exports["AccessorsPropertySelector"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var property = aNode.innerText();
        var getter = trimUnderscore(property);
        var accessors = aContext.get("accessors");

        accessors.getter = getter;
        accessors.setter = "set" + getter.charAt(0).toUpperCase() + getter.substr(1) + ":";
    }
}

module.exports["IvarDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, "class_addIvar(the_class, "]);

        return new Context(aNode, aContext, { "accessor-name":"", "accessors":null });
    },

    exitedNode: function(aNode, aContext, splices)
    {
        var accessors = aContext.get("accessors");
        var insertion = "";

        if (accessors)
        {
            insertion += ", {";

            if (accessors.setter)
                insertion += " setter: \"" + accessors.setter + "\",";

            if (accessors.getter)
                insertion += " getter: \"" + accessors.getter + "\"";

            insertion += " })";
        }

        splices.push([aNode.range.location + aNode.range.length, 0, insertion + ")"]);
    }
}

module.exports["IvarIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var ivarName = aNode.innerText();

        aContext.set("accessor-name", trimUnderscore(ivarName));
        aContext.get("scope")[ivarName] = true;

        if (aContext.superClassName === "Nil")
            aContext.get("meta-scope")[ivarName] = true;

        splices.push([aNode.range.location, 0, "\""]);
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, "\""]);
    }
}
