
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

function getLanguageParser()
{
    var path = require("path"),
        location = path.join(path.dirname(module.filename), "Language.json"),
        compiledGrammar = JSON.parse(require("fs").readFileSync(location, "utf8")),
        parser = new (require("./parser"))(compiledGrammar);

    getLanguageParser = function()
    {
        return parser;
    };

    return getLanguageParser();
}

function CompiledGrammar(/*String*/ aGrammar)
{
    this.table = [];
    this.nameToUID = { };

    var tree = getLanguageParser().parse(aGrammar);

    compileOpcodeTableFromRules(this.table, this.nameToUID, buildRulesFromSyntaxTree(tree));

    return this;
}

module.exports = CompiledGrammar;

function compileOpcodeTableFromRules(/*Array*/ table, /*Object*/ nameToUID, /*Object*/ rules)
{
    table[0] = [0, "source", 1];
    table.length = 1;

    var nextUID = 1,
        hashToUID = { },
        visitedRules = { };

    function process(rule)
    {
        var hash = rule.hash;

        // Detect cycles and bail.
        if (visitedRules[hash] || !(visitedRules[hash] = true))
            return false;

        var UID = (hashToUID[hash] || (hashToUID[hash] = nextUID++)),
            opcodes = [rule.type];

        // Place this rule in the table.
        table[UID] = opcodes;

        // Remove this rule (so we can later check if there were any dangling rules...)
        // delete rules[hash];

        if (rule.type === STRING_LITERAL)
            opcodes.push(rule.string);

        else if (rule.type === CHARACTER_CLASS)
            opcodes.push(rule.characters || rule.range);

        else
        {
            if (rule.type === NAME || rule.type === ERROR_NAME)
            {
                nameToUID[rule.hash] = UID;
                opcodes.push(rule.hash);
            }

            var children = rule.children;

            if (!children)
                return true;

            var index = 0,
                count = children.length;

            for (; index < count; ++index)
            {
                hash = children[index];
                UID = (hashToUID[hash] || (hashToUID[hash] = nextUID++));

                opcodes.push(UID);
            }

            if (rule.type === ERROR_NAME)
                opcodes.push(rule.error);
        }

        return true;
    }

    traverseRulesAnchoredAtName(rules, "start", process);
    traverseRulesAnchoredAtName(rules, "%start", process);

    var hasOwnProperty = Object.prototype.hasOwnProperty,
        remainingRules = { };

    for (var hash in rules)
    {
        // Fluke: thanks JavaScript!
        if (!hasOwnProperty.call(rules, hash))
            continue;

        // This rule was visited normally.
        if (hasOwnProperty.call(visitedRules, hash))
            continue;

        // Never bother reporting error rules, just report their non-error equivalents.
        if (hash.charAt(0) === "%")
            continue;

        // This rule was visited in the error state.
        if (hasOwnProperty.call(visitedRules, "%" + hash))
            continue;

        var rule = rules[hash];

        // Only report top level rules.
        if (rule.type !== NAME && rule.type !== ERROR_NAME)
            continue;

        remainingRules[hash] = true;
        console.warn("WARNING: Rule \"" + hash + "\" is not reachable from the start rule.");
    }
}

function traverseRulesAnchoredAtName(/*Object*/ rules, /*String*/ aName, /*Function*/ process)
{
    var index = 0,
        stack = [aName];

    while (index < stack.length)
    {
        var hash = stack[index++],
            rule = rules[hash];

        if (!rule)
            throw "Rule \"" + hash +  "\" is not defined.";

        if (process(rule) === false)
            continue;

        var children = rule.children;

        if (children)
            stack = stack.concat(children);
    }
}

function buildRulesFromSyntaxTree(/*SyntaxNode*/ aNode)
{
    var rules = { },
        walker = { traversesTextNodes:false };

    walker.exitedNode = function(aNode)
    {
        var builder = RULE_BUILDERS[aNode.name];

        if (builder)
            aNode.hash = builder(aNode, rules);
    }

    aNode.traverse(walker);

    walker.exitedNode = function(aNode)
    {
        var name = aNode.name,
            builder = RULE_BUILDERS["%" + name] || RULE_BUILDERS[name];

        if (builder)
            aNode.hash = builder(aNode, rules);
    }

    aNode.traverse(walker);

    return rules;
}

var RULE_BUILDERS = { };

RULE_BUILDERS["AssignmentExpression"] = function(aNode, rules)
{
    var children = aNode.children,
        hash = children[0].hash,
        child = children[children.length - 1].hash;

    rules[hash] = { type:NAME, hash:hash, children:[child] };

    return hash;
}

RULE_BUILDERS["%ErrorAssignmentExpression"] = function(aNode, rules)
{
    var children = aNode.children,
        hash = children[0].hash,
        index = 1,
        count = children.length,
        child = children[count - 1].hash,
        rule = { type:ERROR_NAME, hash:hash, children:[child] };

    for (; index < count; ++index)
    {
        child = children[index];

        if (child.name !== "ErrorMessage")
            continue;

        var string = child.innerText();

        rule.error = string.substr(1, string.length - 2);

        break;
    }

    rules[hash] = rule;

    return hash;
}

RULE_BUILDERS["DotExpression"] = function(aNode, rules)
{
    if (!rules["."])
        rules["."] = { type:DOT, hash:"." };

    return ".";
}

RULE_BUILDERS["StringLiteral"] = function(aNode, rules)
{
    var hash = aNode.innerText();

    if (!rules[hash])
        rules[hash] = { type:STRING_LITERAL, hash:hash, string:eval(hash) };

    return hash;
}

RULE_BUILDERS["CharacterClass"] = function(aNode, rules)
{
    var range = aNode.innerText(),//new RegExp(aNode.innerText(), "g"),
        hash = range + "";

    if (!rules[hash])
        rules[hash] = { type:CHARACTER_CLASS, hash:hash, range:range };

    return hash;
}

var EXPRESSION_TO_TYPE =
{
    "OrderedChoiceExpression":ORDERED_CHOICE,
    "SequenceExpression":SEQUENCE,
    "ErrorChoiceExpression":ERROR_CHOICE
}

RULE_BUILDERS["ErrorChoiceExpression"] = function(aNode, rules)
{
    return getChildHashes(aNode)[0];
}

RULE_BUILDERS["OrderedChoiceExpression"] =
RULE_BUILDERS["SequenceExpression"] =
RULE_BUILDERS["%ErrorChoiceExpression"] = function(aNode, rules)
{
    var hashes = getChildHashes(aNode);

    if (hashes.length === 1)
        return hashes[0];

    var type = EXPRESSION_TO_TYPE[aNode.name],
        hash = type + ".[" + hashes.join(",") + "]";

    if (!rules[hash])
        rules[hash] = { type:type, hash:hash, children:hashes };

    return hash;
}

RULE_BUILDERS["Identifier"] = function(aNode, rules)
{
    return aNode.innerText();
}

RULE_BUILDERS["%Identifier"] = function(aNode, rules)
{
    return "%" + aNode.innerText();
}

SUFFIX_TO_TYPE =
{
    "+":ONE_OR_MORE,
    "*":ZERO_OR_MORE,
    "?":OPTIONAL
}

RULE_BUILDERS["SuffixedExpression"] = function(aNode, rules)
{
    var children = aNode.children,
        hashForChild = children[0].hash;

    if (children.length === 1)
        return hashForChild;

    var suffix = children[children.length - 1],
        type = SUFFIX_TO_TYPE[suffix],
        hash = type + ".[" + hashForChild + "]";

    if (!rules[hash])
        rules[hash] = { type:type, hash:hash, children:[hashForChild] };

    return hash;
}

PREFIX_TO_TYPE =
{
    "&":POSITIVE_LOOK_AHEAD,
    "!":NEGATIVE_LOOK_AHEAD
}

RULE_BUILDERS["PrefixedExpression"] = function(aNode, rules)
{
    var children = aNode.children,
        hashForChild = children[children.length - 1].hash;

    if (children.length === 1)
        return hashForChild;

    var prefix = children[0],
        type = PREFIX_TO_TYPE[prefix],
        hash = type + ".[" + hashForChild + "]";

    if (!rules[hash])
        rules[hash] = { type:type, hash:hash, children:[hashForChild] };

    return hash;
}

RULE_BUILDERS["PrimaryExpression"] =
RULE_BUILDERS["ParentheticalExpression"] = function(aNode, rules)
{
    return getChildHashes(aNode, rules)[0];
}

function getChildHashes(aNode)
{
    var children = aNode.children,
        index = 0,
        count = children.length,
        rules = [];

    for (; index < count; ++index)
    {
        var child = children[index],
            hash = child.hash;

        if (hash)
            rules.push(hash);
    }

    return rules;
}
