Calculator
===========

This is a simple example of how to build both a Calculator parser and evaluator, which should hopefully set you on the right track for more complex grammars. To build this example, run the following command from the Calculator example directory (the one containing this file):

    $ node path/to/language/lib/cli.js -g Calculator.language > Calculator.js

After the grammar has been successfully compiled, try out the evaluator script:

    $ node evaluator.js 1+1
    2
    $ node evaluator.js "(5+8)/9"
    1.4444444444444444
    $ node evaluator.js 8*9-9
    63
