
var NAME                = 0,
    DOT                 = 1,
    CHARACTER_CLASS     = 2,
    ORDERED_CHOICE      = 3,
    SEQUENCE            = 4,
    STRING_LITERAL      = 5,
    ZERO_OR_MORE        = 6,
    ONE_OR_MORE         = 7,
    OPTIONAL            = 8,
    NEGATIVE_LOOKAHEAD  = 9,
    POSITIVE_LOOKAHEAD  = 10,
    ERROR_NAME          = 11,
    ERROR_CHOICE        = 12;

var factories = [];

factories[NAME] = function(id, parent, state)
{
    return s = function(character)
    {//console.log(s.tabs + "into " + rules[id][1] + " " + rules[id] + " -> " + rules[id][2]);
        return parser(rules[id][2], parent)(character);
    }
}

factories[DOT] = function(id, parent, state)
{
    return function(character)
    {//console.log(i + " [" + character + "] accept any");
        if (character === null)
            return failure;

        return parent;
    }
}

factories[CHARACTER_CLASS] = function(id, parent, state)
{
    var rule = rules[id];

    if (typeof rule[1].valueOf() === "string")
        rule[1] = new RegExp(rule[1], "g");

    return function(character)
    {
        //console.log(i + " [" + character + "]" + " from class: " + rule[1] + " resulting: " + (character !== null && character.match(rule[1])) + " " + (parent === failure));
        if (character !== null && character.match(rule[1]))
            return parent;

        return failure;
    }
}

factories[STRING_LITERAL] = function(id, parent, state)
{
    return function(character)
    {
        var string = rules[id][1];
//console.log(i + " [" + character + "]" + " from string: " + string + "[" + state + "] = " + string.charAt(state));
        if (string.charAt(state) === character)
        {
            if (state === string.length - 1)
                return parent;

            return parser(id, parent, state + 1);
        }

        return failure;
    }
}

Array.prototype.fancyPrint = function(index)
{
    var string = "";

    for (var j=0;j<this.length;++j)
    {
        if (j === index)
            string += "[" + this[j] + "] "
        else
            string += this[j] + " ";
    }

    return string;
}

factories[SEQUENCE] = function(id, parent, state)
{
    return function(character)
    {
        var rule = rules[id],
            index = state + 1;

        if (index < rule.length - 1)
            parent = parser(id, parent, index);

        //console.log("=> " + id + " { " + rule.fancyPrint(index) + "} p = " + parent.id);

        return parser(rule[index], parent)(character);
    }
}

function hasParent(parser, parent)
{
    var parserParent = parser.parent
    return parserParent && (parserParent === parent || hasParent(parserParent, parent));
}

function list(parent, first, rest)
{
    if (!rest)
        return first;

    var items = function(character)
    {
        var r = rest;
        //console.log("-> " + items.id + " " + first.state + " and rest is " + rest.id);
        var firstResult = first(character);
        //console.log("just called " + items.id + " " + firstResult.id + " " + rest.id);
        if (firstResult !== failure && !hasParent(firstResult, parent))
            return firstResult;

//        if (firstResult.parent !== parent)
        //if (firstResult === parent){console.log("parent good");
//            return firstResult;

        if (firstResult === success)
        {
            console.log("CRAZY for " + items.id);
            return firstResult;
        }
    //console.log("???" + rest.id + " " + (rest === r));

        var restResult = rest(character);
//        console.log("-> " + items.id + " " + first.state + " => " + firstResult.id + " vs. " + restResult.id);
        if (firstResult === failure){//console.log("yes");
            return restResult;}

        if (restResult === failure)
            return firstResult;

        return list(parent, firstResult, restResult);
    };
    items.id = "(" + first.id + ") (" + rest.id + ")";
    items.parent = parent;
//    console.log("MAKING CHOICE " + items.id + " p = " + parent.id);
    return items;
}

factories[ORDERED_CHOICE] = function(id, parent, state)
{
    var rule = rules[id],
        count = rule.length,
        parsers = null;

    while (count-- > 1)
        parsers = list(parent, parser(rule[count], parent), parsers);

    return parsers;
}

factories[ZERO_OR_MORE] = function(id, parent, state)
{
    var result = function(character)
    {
        return list(result, parser(rules[id][1], result), parent)(character);
    }

    return result;
}

factories[ONE_OR_MORE] = function(id, parent, state)
{
    var result = function(character)
    {
        if (state === 0)
            return parser(rules[id][1], parser(id, parent, state + 1))(character);

        return list(result, parser(rules[id][1], result), parent)(character);
    }

    return result;
}

factories[OPTIONAL] = function(id, parent, state)
{
    return list(parent, parser(rules[id][1], parent), parent);
}

factories[NEGATIVE_LOOKAHEAD] = function(id, parent, state)
{
    var lookahead = parser(rules[id][1], success);

    var dependency = function(character)
    {
        lookahead = lookahead(character);
        parent = parent(character);

        if (lookahead === failure)
            return parent;

        if (lookahead === success)
            return failure;

        return dependency;
    }

    return dependency;
}

factories[POSITIVE_LOOKAHEAD] = function(id, parent, state)
{
    var lookahead = parser(rules[id][1], success);

    var dependency = function(character)
    {
        lookahead = lookahead(character);
        parent = parent(character);

        if (lookahead === success)
            return parent;

        if (lookahead === failure)
            return failure;

        return dependency;
    }

    return dependency;
}

function success()
{
    //console.log("success");
    return success;
}

success.id = "s";

function failure()
{
    //console.log("failure");
    return failure;
}

function parser(id, parent, state)
{
    var x = factories[rules[id][0]](id, parent, state || 0);
    x.rule = rules[id];
    x.tabs = (parent.tabs || "") + "   ";
    x.rid = id + (parent.rid ? "." + parent.rid : "")
    x.id = x.rid + "@" + (state || 0);
    x.state = state || 0;
    x.parent = parent;
    return x;
}

if (true)
{
var json = JSON.parse(require("fs").readFileSync("/Users/tolmasky/Development/language/ParserSpeed/language2.js/grammar.json").toString()),
    rules = json["table"],
    input = require("fs").readFileSync("/Users/tolmasky/Development/language/on_character.js"/*process.argv[2]*/).toString(),
    lang = parser(json["nameToUID"]["start"], success);//187
}
else
{
var json = JSON.parse(require("fs").readFileSync("/Users/tolmasky/Development/language/ParserSpeed/language2.js/simpler.json").toString()),
    rules = json["table"],
    input = "a",
    lang = parser(json["nameToUID"]["AssignmentExpression"], success);
}
okidoke = false;
for (i = 0; i < input.length; ++i)
{
    console.log("\n[" + i +"] " + lang.id + "\n");
    lang = lang(input.charAt(i));
}
okidoke = true;
console.log("IS SUCCESS " + (lang === success))
//return;
while (lang !== success && lang !== failure)
{
    console.log("\n[" + i +"] " + lang.id + "\n");
    lang = lang(null);
}
if (lang === success)
    console.log("success");
else
    console.log("failure");
