
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
        input = options.input,
        output = options.output;

    if ((!grammar || !grammar.length) && (input !== undefined && !input.length))
    {
        console.error("The grammar and input can not both come from stdin.");
        process.exit(1);
    }

    read(grammar, function(err, data)
    {
        if (err)
        {
            console.error("The Grammar file '" + grammar + "' could not be read.");
            process.exit(1);
        }

        var parser = new Parser(data);

        // If we have an input file...
        if (input !== undefined)
        {
            read(input, function(err, data)
            {
                if (err)
                {
                    console.error("The input file '" + input + "' could not be read.");
                    process.exit(1);
                }

                var result = parser.parse(data).toString();

                write(output, result);
            });
        }
        else
        {
            var compiledGrammarAsJSON = JSON.stringify(parser.compiledGrammar).toUnicodeEscapedString();

            if (options.table)
                write(output, compiledGrammarAsJSON);

            else
            {
                var directory = path.dirname(module.filename);

                if (options.browser)
                    result =    read(path.join(directory, "templates", "browser.js")).
                                replace(/%{NAMESPACE}/g, options.browser);
                else
                    result = read(path.join(directory, "templates", "node.js"));

                result = result.replace(/%{PARSER}/g, read(path.join(directory, "parser.js")));
                result = result.replace(/%{COMPILED_GRAMMAR}/g, compiledGrammarAsJSON);

                write(output, result);
            }
        }
    });
}

function parseOptions()
{
    return require("./utilities/nomnom").opts(
    {
        grammar:{
                    string: '-g PATH, --grammar=PATH',
                    help:"A Language grammar file. Omit value for input via stdin, use Ctrl-D to exit input mode."
                },

        input:  {
                    string:"-i, --input=PATH",
                    help:"An input file to parse. Omit value for input via stdin, use Ctrl-D to exit input mode."
                },

        output: {
                    string:"-o, --output=PATH",
                    help:"An output file to save the result. If omitted stdout is used."
                },

        table:  {
                    string:"-t, --table",
                    help:"Only output the parser table, not the entire generated parser."
                }

    }).parseArgs();
}

function read(filename, callback)
{
    if (!filename || !filename.length)
    {
        var stdin = process.stdin,
            lines = "";

        stdin.resume();

        stdin.on("data", function(chunk)
        {
            lines += chunk.toString();
        }).on("end", function()
        {
            callback(false, lines);
        }).on("error", function()
        {
            console.error("There was an error while taking input data from stdin.");
            process.exit(1);
        });

        return;
    }

    if (callback)
        return require("fs").readFile(filename, "utf8", callback);

    return require("fs").readFileSync(filename, "utf8");
}

function write(filename, contents)
{
    if (!filename || !filename.length)
        return console.log("%s", contents);

    require("fs").writeFile(filename, contents, function(err)
    {
        if (err)
        {
            console.error("There was an error writing to file '" + filename + "'.");
            process.exit(1);
        }
    });
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
