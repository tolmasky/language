
var Parser = require("./parser"),
    path = require("path");

// cli -g file -i file :)
// cli -i file (g = std) :)
// cli -g file (i x) :)
// cli -g file -i -
// cli x

exports.main = function(args)
{
    var options = parseOptions(),
        grammar = options.grammar,
        input = options.input;

    if (!options.grammar && !options.input)
    {
        print("Grammar and input can't both implicitly be stdin.");
        process.exit(1);
    }

    var grammarContents = read(grammar || "-", "utf8"),
        parser = new Parser(grammarContents),
        result = "";

    if (input)
        result = parser.parse(read(input)).toString();

    else
    {
        var json = JSON.stringify(parser.compiledGrammar).toUnicodeEscapedString();

        if (options.table)
            result = json;

        else
        {
            var directory = path.dirname(module.filename);

            if (options.browser)
                result =    read(path.join(directory, "templates", "browser.js")).
                            replace(/%{NAMESPACE}/g, options.browser);
            else
                result = read(path.join(directory, "templates", "node.js"));

            result = result.replace(/%{PARSER}/g, read(path.join(directory, "parser.js")))
            result = result.replace(/%{COMPILED_GRAMMAR}/g, json);
        }
    }

    write(options.output || "-", result);
}

function parseOptions()
{
    return require("./utilities/nomnom").opts(
    {
        grammar:{
                    string: '-g PATH, --grammar=PATH',
                    help:"A Language grammar file"
                },

        input:  {
                    string:"-i, --input=PATH",
                    helo:"An input file to parse"
                },

        output: {
                    string:"-o, --output=PATH",
                    help:"An output file to save the result"
                },

        table:  {
                    string:"-t, --table",
                    help:"Only output the parser table, not the entire generated parser."
                }

    }).parseArgs();
}

function read(filename)
{
    if (filename === "-")
    {
        //stdin
    }

    return require("fs").readFileSync(filename, "utf8");
}

function write(filename, contents)
{
    if (filename === "-")
    {
        //stdout
    }

    return require("fs").writeFileSync(filename, contents);
}

String.prototype.toUnicodeEscapedString = function()
{
    var index = 0,
        count = this.length,
        characters = [];

    for (; index < count; ++index)
    {
        var code = this.charCodeAt(index);

        if (this.charCodeAt(index) <= 255)
        {
            characters.push(this.charAt(index));
            continue;
        }

        var escape = code.toString(16).toUpperCase();

        while (escape.length < 4)
            escape = '0' + escape;

        characters.push("\\u" + escape);
    }

    return characters.join("");
}

exports.main(process.argv);
//3 things: grammar, input, output
// table
// file
// cli
// browser
// full blown
// json?
