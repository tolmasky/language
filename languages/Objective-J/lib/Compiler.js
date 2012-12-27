
var Parser = require("./Parser.js");
var HANDLERS = { };

if (!module.exports)
    module.exports = exports;

module.exports.compile = function(source)
{
    var tree = Parser.parse(source),
        splices = [],
        context = new Context(null, null, { "global": true, "scope": { } });

    tree.traverse({
        traversesTextNodes : false,
        enteredNode : function(aNode)
		{
            var handler = HANDLERS[aNode.name] && HANDLERS[aNode.name].enteredNode;

            if (handler)
                context = handler(aNode, context, splices) || context;
		},
        exitedNode : function(aNode)
        {
            var handler = HANDLERS[aNode.name] && HANDLERS[aNode.name].exitedNode;

            if (handler)
                context = handler(aNode, context, splices) || context;

            if (context.node === aNode)
                context = context.parentContext;
        }
	});

    // "Hand splicing" is much faster than calling splice each time...
    var index = 0;
    var count = splices.length;
    var result = "";
    var cursor = 0;

    for (; index < count; ++index)
    {
        var splice = splices[index];
        result += source.substring(cursor, splice[0]) + splice[2];
        cursor = splice[0] + splice[1];
    }

    result += source.substr(cursor);

    return result;
}

var hasOwnProperty = Object.prototype.hasOwnProperty;

function Context(aNode, aContext, data)
{
    this.node = aNode;
    this.parentContext = aContext;
    this.data = data;
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

// Replace, Delete, Prepend, Append

function replace(aString)
{
    return function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, aNode.range.length, aString]);
    }
}

var remove = replace("");

function prepend(aString)
{
    return function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, aString]);
    }
}

function append(aString)
{
    return function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length, 0, aString]);
    }
}

// 1. @class
// Class Forward Declarations exist only to support Objective-C code. Simply remove them.

HANDLERS["ClassForwardDeclarationStatement"] = { enteredNode: remove };

// 2. # C Preprocessor Directives
// We simply ignore these (for things like #pragma mark). It may be wise to warn about
// them though, since it can point to forgetting to use the C preprocessor.

// Warn/Error?
HANDLERS["CPreprocessorStatement"] = { enteredNode: remove };


// 3. Function Globalification
// Since we wrap Objective-J code in an anonymous function, function declarations are
// local to that function. When we first wrote the language, we found this "unacceptable"
// and hacked this by turning it into a "global" set. We may want to deprecate this behavior.

HANDLERS["FunctionDeclarationKeyword"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        // We may want to either deprecate or warn about this legacy behavior.
        if (!aContext.parentContext)
            remove(aNode, aContext, splices);
    }
}

HANDLERS["FunctionDeclarationName"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        // We may want to either deprecate or warn about this legacy behavior.
        if (!aContext.parentContext)
            append(" = function " + aNode.innerText())(aNode, aContext, splices);
    }
}

HANDLERS["ClassDeclarationStatement"] =
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

HANDLERS["ClassHeader"] =
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

        replace(insertion)(aNode, aContext, splices);
    }
};

HANDLERS["ClassEnd"] = { enteredNode: remove };

HANDLERS["ClassName"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("class-name", aNode.innerText());
    }
}

HANDLERS["SuperClassName"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("super-class-name", aNode.innerText() || "Nil");
    }
}

HANDLERS["CategoryDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("category-declaration", true);
    }
}

HANDLERS["CompoundIvarDeclarationComma"] = { enteredNode: replace(";") };

HANDLERS["IvarTypeDeclaration"] = { enteredNode: remove };

HANDLERS["Accessors"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var getter = aContext.get("accessor-name");
        var setter = "set" + getter.charAt(0).toUpperCase() + getter.substr(1) + ":";

        aContext.set("accessors", { "getter": getter, "setter": setter, "copy": false });
        remove(aNode, aContext, splices);
    }
}

HANDLERS["AccessorsReadonly"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        delete aContext.get("accessors").setter;
    }
}

function trimUnderscore(aString, isSetter)
{
    return aString.charAt(0) === "_" ? aString.substr(1) : aString;
}

HANDLERS["AccessorsGetterSelector"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("accessors").getter = aNode.innerText();
    }
}

HANDLERS["AccessorsSetterSelector"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("accessors").setter = aNode.innerText();
    }
}

HANDLERS["AccessorsPropertySelector"] =
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

HANDLERS["AccessorsCopy"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("accessors").copy = true;
    }
}

HANDLERS["CompoundIvarDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new Context(aNode, aContext, { "ivar-type": "" });
    }
}

HANDLERS["IvarDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, "class_addIvar(the_class, "]);

        return new Context(aNode, aContext, { "accessor-name":"", "accessors":null });
    },

    exitedNode: function(aNode, aContext, splices)
    {
        var accessors = aContext.get("accessors");
        var insertion = ", \"" + aContext.get("ivar-type") + "\"";

        if (accessors)
        {
            var include = [];

            if (accessors.setter)
                include.push("setter: \"" + accessors.setter + "\"");

            if (accessors.getter)
                include.push("getter: \"" + accessors.getter + "\"");

            if (accessors.copy)
                include.push("copy: true");

            insertion += ", { " + include.join(", ") + " }";
        }

        append(insertion + ")")(aNode, aContext, splices);
    }
}

HANDLERS["IvarTypeDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("ivar-type", aNode.innerText());
        remove(aNode, aContext, splices);
    }
}

HANDLERS["IvarIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        var ivarName = aNode.innerText();

        aContext.set("accessor-name", trimUnderscore(ivarName));
        aContext.get("scope")[ivarName] = true;

        if (aContext.superClassName === "Nil")
            aContext.get("meta-scope")[ivarName] = true;

        prepend("\"")(aNode, aContext, splices);
    },

    exitedNode: append("\"")
}

// Objective-J Literals

// Just remove the @. (This handles strings and arrays).
HANDLERS["ObjectiveJLiteralMarker"] = { enteredNode: remove };

// Import Statements.

// Replace @import with objj_executeFile(
HANDLERS["ImportDirective"] = { enteredNode: replace("objj_executeFile(") };

// Replace <> with "", NO);
HANDLERS["StandardFilePath"] =
{
    enteredNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 1, "\""]);
    },

    exitedNode : function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length - 1, 1, "\", NO);"]);
    }
}

// Simply append , YES);
HANDLERS["LocalFilePath"] = { exitedNode: append(", YES);") }

HANDLERS["ClassMethodDeclaration"] =
HANDLERS["InstanceMethodDeclaration"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new Context(aNode, aContext,
        {
            "scope": { },
            "selector": "",
            "types":["\"id\"", "\"SEL\""],
            "class-method": false
        });
    },

    exitedNode: append(");")
}

HANDLERS["ClassMethodSignifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("class-method", true);
    },
    exitedNode: remove
}

HANDLERS["InstanceMethodSignifier"] = { enteredNode: remove };

HANDLERS["MethodSignature"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, { toString:function()
        {
            var variable =  aContext.get("class-method") ?
                            aContext.get("generated-meta-class-variable") :
                            aContext.get("generated-class-variable");

            return "class_addMethod(" + variable + ", \"" +
                    aContext.get("selector") + "\", [" +
                    aContext.get("types").join(", ") + "], function(self, _cmd";
        }}]);
    },

    exitedNode: append(")")
}

HANDLERS["MethodParameterType"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (aNode.innerText().length === 0)
            aContext.get("types").push("\"id\"");
    },
    exitedNode: remove
}

HANDLERS["MethodReturnType"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (aNode.innerText().length === 0)
            aContext.get("types").unshift("\"id\"");
    },
    exitedNode: remove
}

HANDLERS["MethodParameterTypeIdentifier"] =
HANDLERS["MethodReturnTypeIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("types").push("\"" + aNode.innerText() +"\"");
    }
}

HANDLERS["MethodParameter"] = { enteredNode: prepend(",") }

HANDLERS["MethodParameterIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("scope")[aNode.innerText()] = true;
    }
}

HANDLERS["KeywordFormalParameterList"] = { enteredNode: prepend(",") };

HANDLERS["FormalParameterListComma"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (aContext.has("types", false))
            aContext.get("types").push("\"id\"");
    }
}

HANDLERS["FormalParameterListELLIPSIS"] = { enteredNode: remove };

function findContextWithIdentifierInScope(aContext, anIdentifier)
{
    var context = aContext,
        metaClassScope = context.get("class-method") || false;

    while (context)
    {
        var scopeName = context.has("class-name") && metaClassScope ? "meta-scope" : "scope";

        if (context.has(scopeName, false))
        {
            var scope = context.get(scopeName, false);

            if (hasOwnProperty.call(scope, anIdentifier))
                return context;
        }

        context = context.parentContext;
    }

    return null;
}

// Add "self." if necessary.
HANDLERS["IdentifierExpression"] =
{
    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location, 0, { toString:function()
        {
            var identifier = aNode.innerText();

            // self is var-ed through the method itself parameters.
            if (identifier === "self")
                return "";

            // Find which context's scope contains this identifier.
            var context = findContextWithIdentifierInScope(aContext, aNode.innerText());

            if (!context || context.has("global", false))
            {
                return "";
                // global scope
                var report = aNode.report(),
                    message = "Line: " + report.lineNumber + "\n" + report.visualization + "\n";

                message += "Warning: " + aNode.innerText() + " is global.";

                console.log(message);
            }

            else if (context.has("class-name", false))
                return "self.";

            return "";
        }}]);
    }
}

// Create a new context with scope.
HANDLERS["FunctionBody"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new Context(aNode, aContext, { "scope": { }  });
    }
}

// Add function parameters and var's to scope.
HANDLERS["FunctionParameterIdentifier"] =
HANDLERS["VariableIdentifier"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.get("scope")[aNode.innerText()] = true;
    }
}

var RECEIVER_VARIABLE   = 0,
    RECEIVER_SUPER      = 1,
    RECEIVER_SUPER_META = 2;

HANDLERS["MessageExpression"] =
{
    enteredNode: function(aNode, aContext, splices)
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

                var result = "objj_msgSendSuper({ receiver:self, super_class:objj_get";

                if (receiver === RECEIVER_SUPER_META)
                    result += "Meta";

                return result + "Class(\"" + messageContext.get("class-name") + "\").super_class }";
            }
        }]);

        return messageContext;
    },

    exitedNode: function(aNode, aContext, splices)
    {
        splices.push([aNode.range.location + aNode.range.length - 1, 1, ")"]);
    }
}

HANDLERS["SelectorCall"] =
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

HANDLERS["SelectorLabelCall"] = { exitedNode: append(", ") }

HANDLERS["SUPER"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        aContext.set("receiver", aContext.get("class-method") ? RECEIVER_SUPER_META : RECEIVER_SUPER);
    },
    exitedNode: remove
}

// Selectors

// Always remove whitespace in selectors.
HANDLERS["SelectorWhitespace"] = { enteredNode: remove }

// If we care about the selector, accumulate the colon and delete it.
HANDLERS["SelectorColon"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (!aContext.has("selector-literal", false) && aContext.has("selector"))
        {
            aContext.set("selector", aContext.get("selector") + ":");
            remove(aNode, aContext, splices);
        }
    }
}

// If we care about the selector, accumulate the label and delete it.
HANDLERS["SelectorLabel"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        if (!aContext.has("selector-literal", false) && aContext.has("selector"))
        {
            aContext.set("selector", aContext.get("selector") + aNode.innerText());
            remove(aNode, aContext, splices);
        }
    }
}

// Selector Literals
// Simply remove surrounding @selector_( and add quotes.

HANDLERS["SelectorLiteral"] =
{
    enteredNode: function(aNode, aContext, splices)
    {
        return new Context(aNode, aContext, { "selector-literal":true });
    }
}

HANDLERS["SelectorLiteralPrefix"] = { enteredNode: replace("sel_getUid(\"") }

HANDLERS["SelectorLiteralPostfix"] = { enteredNode: prepend("\"") }
