
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
    return function(character)
    {
        return parser(rules[id][2], parent)(character);
    }
}

factories[DOT] = function(id, parent, state)
{
    return function(character)
    {
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
        console.log("[" + character + "]" + " from class: " + rule[1] + " resulting: " + (character !== null && character.match(rule[1])) + " " + (parent === failure));
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
console.log("[" + character + "]" + " from string: " + string + "[" + state + "] = " + string.charAt(state));
        if (string.charAt(state) === character)
        {
            if (state === string.length - 1)
                return parent;

            return parser(id, parent, state + 1);
        }

        return failure;
    }
}

factories[SEQUENCE] = function(id, parent, state)
{
    return function(character)
    {
        rule = rules[id];

        // If not the last one...
        if (state + 1 < rule.length - 1)
            parent = parser(id, parent, state + 1);

        return parser(rule[state + 1], parent)(character);
    }
}

function list(parent, first, rest)
{
    if (!rest)
        return first;

    items = function(character)
    {
        first = first(character);

        if (first === parent)
            return parent;

        rest = rest(character);

        if (first === failure)
            return rest;

        if (rest === failure)
            return first;

        return items;
    }

    return items;
}

factories[ORDERED_CHOICE] = function(id, parent, state)
{
    return function(character)
    {
        var rule = rules[id],
            count = rule.length,
            parsers = null;

        while (count-- > 1)
            parsers = list(parent, parser(rule[count], parent), parsers);

        return parsers(character);
    }
}

factories[ZERO_OR_MORE] = function(id, parent, state)
{
    var result = function(character)
    {
        return list(parent, parser(rules[id][1], result), parent)(character);
    }

    return result;
}

factories[ONE_OR_MORE] = function(id, parent, state)
{
    var result = function(character)
    {
        if (state === 0)
            return parser(rules[id][1], parser(id, parent, state + 1))(character);

        return list(parent, parser(rules[id][1], result), parent)(character);
    }

    return result;
}

factories[OPTIONAL] = function(id, parent, state)
{
    return function(character)
    {
        return list(parent, parser(rules[id][1], parent), parent)(character);
    }
}

factories[NEGATIVE_LOOKAHEAD] = function(id, parent, state)
{
    var finished = false,
        matched = false,
        condition = rules[id][0] === NEGATIVE_LOOKAHEAD;

    function dependant(parsers)
    {
        var wrapper = function(character)
        {
            if (finished && matched === condition)
                return [];

            parsers = parse(parsers, character);

            if (!finished)
                return wrapper;

            return parsers;
        }

        return wrapper;
    }

    function lookahead(parsers)
    {
        var wrapper = function(character)
        {
            wrapped = wrapped(character);

            finished = wrapped === success || wrapped === failure;
            matched = wrapped === success;

            if (finished)
                return failure;

            return wrapper;
        }

        return wrapper;
    }

    return function(character)
    {
        return list(lookahead(parser(rules[id][1], success))(character), dependant(parent)(character));
    }
}

factories[POSITIVE_LOOKAHEAD] = factories[NEGATIVE_LOOKAHEAD];

function success()
{
    //console.log("success");
    return success;
}

function failure()
{
    //console.log("failure");
    return failure;
}

function parser(id, parent, state)
{
    return factories[rules[id][0]](id, parent, state || 0);
}

var rules = [
                [NAME, "start", 1],
                [SEQUENCE, 9/*, 5, 6, 7*/],
                [STRING_LITERAL, "abc"],
                [STRING_LITERAL, "abcd"],
                [ORDERED_CHOICE, 2, 3],
                [DOT],
                [CHARACTER_CLASS, "[abc]"],
                [ZERO_OR_MORE, 6],
                [STRING_LITERAL, "d"],
                [OPTIONAL, 8]
            ],
    input = "",//require("fs").readFileSync(process.argv[2]).toString(),
    lang = parser(0, success);

for (i = 0; i < input.length; ++i)
    lang = lang(input.charAt(i));

while (lang !== success && lang !== failure)
    lang = lang(null);

if (lang === success)
    console.log("success");
else
    console.log("failure");
