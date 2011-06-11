
var %{NAMESPACE} = { };

(function(global, exports, module)
{
var compiledGrammar = %{COMPILED_GRAMMAR};

%{PARSER}

exports.Parser = new Parser(compiledGrammar);
})(window, %{NAMESPACE}, { exports: %{NAMESPACE} });
