
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

factories[NAME] = function(id, next, state)
{
    // No actual work is done here, just pass it down the line.
    return parser(rules[id][2], next);
}

factories[DOT] = function(id, next, state)
{
    // Always succeed except if passed the end of the input.
    return function(character)
    {
        return character === null ? failure : next;
    }
}

factories[CHARACTER_CLASS] = function(id, next, state)
{
    var rule = rules[id];

    if (typeof rule[1].valueOf() === "string")
        rule[1] = new RegExp(rule[1], "g");

    return function(character)
    {
        if (character === null || !rule[1].test(character))
            return failure;

        return next;
    }
}

factories[STRING_LITERAL] = function(id, next, state)
{
    return function(character)
    {
        var string = rules[id][1],
            length = string.length;

        if (character === null)
            return length === 0 ? next : failure;

        if (string.charAt(state) === character)
            return state === length - 1 ? next : parser(id, next, state + 1);

        return failure;
    }
}

factories[SEQUENCE] = function(id, next, state)
{
    var rule = rules[id],
        index = state + 1;

    if (index < rule.length - 1)
        return parser(rule[index], parser(id, next, index));

    return parser(rule[index], next);
}

function capture(parser)
{
    var captured = function(character, uncapture)
    {
        if (uncapture)
            return parser;

        parser = parser(character);
captured.hash = parser.hash;
        return parser === failure ? parser : captured;
    }
captured.hash = parser.hash;
    return captured;
}

function markedChoice(first, rest, next, mark, markCalled)
{
    var f = function(character)
    {
console.log("GOING IN!");
        var firstResult = first(character);
console.log("GOT BACK " + firstResult.hash);
        // if first's next got called...
        if (firstResult === mark)
            return next;

        if (firstResult === markCalled)
            return next(character);
            if (!firstResult.hash)
                console.log(firstResult + "");
if (firstResult.hash && firstResult.hash.substr(0, 4) === "MARK")
    console.log("WTF " + character);
        var restResult = rest(character);

        if (firstResult === failure)
            return restResult;

//        if (restResult === failure)
//            return firstResult;

        return markedChoice(firstResult, restResult, next, mark, markCalled);
    }
    f.firster = first;
    f.mark = mark;
    f.hash = "(" + first.hash + " OR " + rest.hash + ")";
    return f;
}

var counter = 0;

function choice(id, next, rest)
{console.log("IM MARKING " + next.hash);
    function mark(character)
    {
        console.log("called with " + character + " " + next);
        return markCalled;
    }

    function markCalled(character)
    {
        console.log("should never happen");
        return markCalled;
    }
mark.hash = "MARKED(" + counter + ")[" + next.hash + "]";
markCalled.hash = "MARKED_CALLED(" + (counter++) + ")[" + next.hash + "]";
    return markedChoice(parser(id, mark), rest, next, mark, markCalled);
}

factories[ORDERED_CHOICE] = function(id, next, state)
{console.log("brand new!");
    var rule = rules[id],
        index = state + 1;

    if (index < rule.length - 1)
        return choice(rule[index], next, parser(id, next, index));

    return parser(rule[index], next);

    var rule = rules[id],
        count = rule.length,
        parsers = parser(rule[--count], next);

    while (count-- > 1)
        parsers = choice(rule[count], next, parsers);

    return parsers;
}

factories[ZERO_OR_MORE] = function(id, next, state)
{
    return choice(rules[id][1], parser(id, next, state + 1), next);
}

factories[ONE_OR_MORE] = function(id, next, state)
{
    if (state === 0)
        return parser(rules[id][1], parser(id, next, state + 1));

    return choice(rules[id][1], parser(id, next, state + 1), next);
}

factories[OPTIONAL] = function(id, next, state)
{
    return choice(rules[id][1], next, next);
}

function dependency(lookahead, parser, expected, unexpected)
{
    return function(character)
    {
        var lookaheadResult = lookahead(character),
            parserResult = parser(character);

        if (lookahead === expected)
            return parserResult;

        if (lookahead === unexpected)
            return failure;

        return dependency(lookaheadResult, parserResult, expected, unexpected);
    }
} 

factories[NEGATIVE_LOOKAHEAD] = function(id, next, state)
{
    return dependency(parser(rules[id][1], success), next, failure, success);
}

factories[POSITIVE_LOOKAHEAD] = function(id, next, state)
{
    return dependency(parser(rules[id][1], success), next, success, failure);
}

function success()
{
    //console.log("success");
    return success;
}

success.id = "s";
success.nameo = "success";
success.hash = "success";

function failure()
{
    //console.log("failure");
    return failure;
}

failure.id = "f";
failure.nameo = "faliure";
failure.hash = "failure";

var parserCache = { };
okidoke = false;
function description(id)
{
    switch (rules[id][0])
    {
        case NAME:              return "(" + rules[id][1] + ") ";
        case DOT:               return "[DOT] ";
        case CHARACTER_CLASS:   return rules[id][1] + " ";
        case ORDERED_CHOICE:    return "[CHOICE] ";
        case SEQUENCE:          return "[SEQ] ";
        case STRING_LITERAL:    return "\"" + rules[id][1] + "\" ";
/*
    ZERO_OR_MORE        = 6,
    ONE_OR_MORE         = 7,
    OPTIONAL            = 8,
    NEGATIVE_LOOKAHEAD  = 9,
    POSITIVE_LOOKAHEAD  = 10,
    ERROR_NAME          = 11,
    ERROR_CHOICE        = 12;*/
    }
    
    return "";
}

function parser(id, next, state)
{parserCache = { };
    var hash = id + "@" + (state || 0) + " -> " + next.hash;

    if (parserCache.hasOwnProperty(hash))
        return parserCache[hash];

    parserCache[hash] = function(character)
    {
        console.log("entering " + description(id) + hash);
        return factories[rules[id][0]](id, next, state || 0)(character);
    }

    parserCache[hash].hash = hash;

    return parserCache[hash];
}

function read(path)
{
    return require("fs").readFileSync(path).toString();
}

var json = JSON.parse(read(process.argv[2])),
    rules = json["table"],
    input = process.argv[3],//read(process.argv[3]),
    lang = parser(json["nameToUID"]["LeftHandSideExpression"], success);//DecimalLiteral
console.log(rules);
for (i = 0; i < input.length; ++i)
{
    console.log("[" + i + "] = " + input.charAt(i) + " : " + lang.hash);
    lang = lang(input.charAt(i));
    console.log("[" + i + "] = " + input.charAt(i) + " : " + lang.hash);
    parserCache = { };
}
okidoke = true;
console.log("DONE AT INPUT END " + (lang === success) + " " + lang + " " + (lang.firster ? lang.firster.hash + " " + (lang.mark === lang.firster) : ""));

while (lang !== success && lang !== failure)
{
    lang = lang(null);
    parserCache = { };
}

if (lang === success)
    console.log("success");
else
    console.log("failure");
