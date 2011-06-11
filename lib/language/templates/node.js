
var compiledGrammar = %{COMPILED_GRAMMAR};

%{PARSER}

module.exports = new Parser(compiledGrammar);
