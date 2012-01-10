
/*
funcion parser(character, next)
{
    do_();
    return next(character);
}

function parser(character, next)
{
    do_();

    return next_marker;

    return call_next_marker;
}

function cachedCall(parser, character)
{
    var next = parser(character);

    if (next === next_marker)
        return parser.next;

    if (next === call_next_marker)
        return cachedCall(parser.next, character);

    return next;
}
*/

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

factories[NAME] = function(self, id, next, state)
{
    // No actual work is done here, just pass it down the line.
    return create(rules[id][2], next, self);
}

factories[DOT] = function(self, id, next, state)
{
    // Always succeed except if passed the end of the input.
    return function(character)
    {
        return character === null ? failure : next;
    }
}

factories[CHARACTER_CLASS] = function(self, id, next, state)
{
    var rule = rules[id];

    if (typeof rule[1].valueOf() === "string")
        rule[1] = new RegExp(rule[1]);

    return function(character)
    {
        if (character === null || !rule[1].test(character))
            return failure;

        return next;
    }
}

factories[STRING_LITERAL] = function(self, id, next, state)
{
    return function (character)
    {
        var string = rules[id][1],
            length = string.length;

        if (character === null)
            return length === 0 ? next : failure;

        if (string.charAt(state) === character)
            return state === length - 1 ? next : create(id, next, self, state + 1);

        return failure;
    }
}
//id next parent
factories[SEQUENCE] = function(self, id, next, state)
{
    var rule = rules[id],
        index = state + 1;

    if (index < rule.length - 1)
        return create(rule[index], create(id, next, self, index), self);

    return create(rule[index], next, self);
}

function inTree(parser, parent)
{
    if (!parser)
        return false;

    if (parser === parent)
        return true;

    return inTree(parser.parent, parent);
}

function choice(first, rest, parent)
{console.log("creating with " + first.hash);
    var parser = function(character)
    {
        var firstResult = first(character);
//console.log(firstResult.hash + " " + first.hash + " " + (firstResult !== failure && !inTree(firstResult, first)));
        // can't do inTree(firstResult, first) becuase first changes as we advnace and keep creating new choice(s).
        if (firstResult !== failure && !inTree(firstResult, parent)){console.log("oh boy " + firstResult.hash);
            return firstResult;}
// CN console.log("all he way in");
        var restResult = rest(character);
// CN console.log("all he way in 2");

//if (first.id && (description(first.id).indexOf("NumericLiteral") !== -1))
console.log("twe " + (restResult === failure));
        if (firstResult === failure)
            return restResult;

        if (restResult === failure)
            return firstResult;

        return choice(firstResult, restResult, parent);
    }
//console.log(parser+"");
    parser.hash = "(" + first.hash + " OR " + rest.hash + ")";
    parser.parent = parent;

    return parser;
}

factories[ORDERED_CHOICE] = function(self, id, next, state)
{
    var rule = rules[id],
        index = state + 1;

    if (index < rule.length - 1)
    {
        var f,r;
        var c = choice(f = create(rule[index], next, self), r = create(id, next, self, index), self);
        f.parent = c;
        r.parent = c;
        return c;
    }

    return create(rule[index], next, self);
}

factories[ZERO_OR_MORE] = function(self, id, next, state)
{
    return choice(create(rules[id][1], create(id, next, self, state + 1), self), next, self);
}

factories[ONE_OR_MORE] = function(self, id, next, state)
{
    if (state === 0)
        return create(rules[id][1], create(id, next, self, state + 1), self);

    return choice(create(rules[id][1], create(id, next, self, state + 1), self), next, self);
}

factories[OPTIONAL] = function(self, id, next, state)
{
    console.log("THE OPTIONAL IS " + rules[rules[id][1]]);
    return choice(create(rules[id][1], next, self), next, self);
}

function dependency(lookahead, parser, parent, expected, unexpected)
{
    function result(character)
    {
        var lookaheadResult = lookahead(character),
            parserResult = parser(character);

        if (lookaheadResult === expected)
            return parserResult;

        if (lookaheadResult === unexpected)
            return failure;

        return dependency(lookaheadResult, parserResult, result, expected, unexpected);
    }

    result.hash = "x";
    result.parent = parent;

    return result;
}

factories[NEGATIVE_LOOKAHEAD] = function(self, id, next, state)
{
    return dependency(create(rules[id][1], success, self), next, self, failure, success);
}

factories[POSITIVE_LOOKAHEAD] = function(self, id, next, state)
{
    return dependency(create(rules[id][1], success, self), next, self, success, failure);
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

failure.id = "failure";
failure.nameo = "faliure";
failure.hash = "failure";

var parserCache = { };
okidoke = false;
function description(id)
{
    switch (rules[id][0])
    {
        case NAME:                  return "(" + rules[id][1] + ") ";
        case DOT:                   return "[DOT] ";
        case CHARACTER_CLASS:       return rules[id][1] + " ";
        case ORDERED_CHOICE:        return "[CHOICE] ";
        case SEQUENCE:              return "[SEQ] ";
        case STRING_LITERAL:        return "\"" + rules[id][1] + "\" ";
        case ZERO_OR_MORE:          return "[*] ";
        case ONE_OR_MORE:           return "[+] ";
        case OPTIONAL:              return "[?] ";
        case NEGATIVE_LOOKAHEAD:    return "[NEG] ";
        case POSITIVE_LOOKAHEAD:    return "[POS] ";
/*    ERROR_NAME          = 11,
    ERROR_CHOICE        = 12;*/
    }

    return "";
}

function p2s(parser)
{
    var spaces = "";

    while (parser)
    {
        spaces += " ";
        parser = parser.parent;
    }

    return spaces;
}

function create(id, next, parent, state)
{
    function parser(character)
    {
        console.log(p2s(parser) + "entering " + description(id) + " " + parser.hash);
        return factories[rules[id][0]](parser, id, next, state || 0)(character);
    }

    parser.id = id;
    parser.hash = id + "@" + (state || 0) + " -> " + next.hash;
    parser.parent = parent;

    return parser;
/*
    parserCache = { };

    if (parserCache.hasOwnProperty(hash))
        return parserCache[hash];

    parserCache[hash] = function(character)
    {
        console.log("entering " + description(id) + hash);
        return factories[rules[id][0]](id, next, state || 0)(character);
    }

    parserCache[hash].hash = hash;

    return parserCache[hash];
*/
}

function read(path)
{
    return require("fs").readFileSync(path).toString();
}

var json = JSON.parse(read(process.argv[2])),
    rules = json["table"],
    input = read(process.argv[3]), //.4e+10
    lang = create(json["nameToUID"]["start"], success);//DecimalLiteral
console.log(input);
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
