
var compiledGrammar = %{COMPILED_GRAMMAR};

%{PARSER}

if (typeof system !== "undefined")
{
    var parser = new Parser(compiledGrammar);

    exports.parse = function(input) { return parser.parse(input); }
}
else
    module.exports = new Parser(compiledGrammar);
