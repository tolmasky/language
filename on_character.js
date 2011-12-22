
var NAME                = 0,
    DOT                 = 1,
    CHARACTER_CLASS     = 2,
    ORDERED_CHOICE      = 3,
    SEQUENCE            = 4,
    STRING_LITERAL      = 5,
    ZERO_OR_MORE        = 6,
    ONE_OR_MORE         = 7,
    OPTIONAL            = 8,
    NEGATIVE_LOOK_AHEAD = 9,
    POSITIVE_LOOK_AHEAD = 10,
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
        if (character !== null)
            return parent;

        return failure;
    }
}

factories[CHARACTER_CLASS] = function(id, parent, state)
{
    var rule = rules[id];

    if (typeof rule[1].valueOf() === "string")
        rule[1] = new RegExp(rule[1], "g");

    return function(character)
    {
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

factories[ORDERED_CHOICE] = function(id, parent, state)
{
    return function(character)
    {
        var rule = rules[id],
            index = 1,
            count = rule.length,
            parsers = [];

        for (; index < count; ++index)
            parsers = parsers.concat(parser(rule[index], parent)(character));

        return parsers;
    }
}

factories[OPTIONAL] = function(id, parent, state)
{
    return function(character)
    {
        return [parser(rules[id][1], parent)(character), parent(character)];
    }
}

factories[ZERO_OR_MORE] = function(id, parent, state)
{
    var result = function(character)
    {
        return [parser(rules[id][1], result)(character), parent(character)];
    }

    return result;
}

factories[ONE_OR_MORE] = function(id, parent, state)
{
    return function(character)
    {
        var next = parser(id, parent, state + 1);

        if (state === 0)
            return parser(rules[id][1], next)(character);

        return [parser(rules[id][1], next)(character), parent(character)];
    }
}

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

function isNotFailure(parser)
{
    return parser !== failure;
}

function parse(parsers, character)
{
    var index = 0,
        count = parsers.length,
        results = [];

    for (; index < count; ++index)
        results = results.concat(parsers[index](character));

    return results.filter(isNotFailure);
}

var rules = [
                [NAME, "start", 1],
                [SEQUENCE, 2, 3, 4, 5, 6, 7],
                [STRING_LITERAL, "abc"],
                [STRING_LITERAL, "def"],
                [ORDERED_CHOICE, 2, 3],
                [DOT],
                [CHARACTER_CLASS, "[abc]"],
                [ONE_OR_MORE, 6]
            ];

var input = "abcdefdeffcaaa",
    parsers = [parser(0, success)];

for (i = 0; i < input.length && parsers.length > 0; ++i)
    parsers = parse(parsers, input.charAt(i));

while (parsers.length > 0 && parsers[0] !== success)
    parsers = parse(parsers, null);

if (parsers.length > 0)
    console.log("success " + parsers.length);
else
    console.log("failure");
