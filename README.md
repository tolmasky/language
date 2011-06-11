Language.js
===========

Language.js is an experimental new parser based on PEG (Parsing Expression Grammar), with the special addition of the "naughty OR" operator to handle errors in a unique new way. It makes use of memoization to achieve linear time parsing speed, and support for automatic cut placement is coming to maintain mostly constant space as well (www.ialab.cs.tsukuba.ac.jp/~mizusima/publications/paste513-mizushima.pdf).

Features
--------

You can read about general PEG features on the wikipedia page here: http://en.wikipedia.org/wiki/Parsing_expression_grammar

The most unique addition Language.js makes to PEG is how it handles errors. **No parse ever fails** in Language.js, instead SyntaxErrorNodes are placed into the resultant tree. This makes it trivial to do things like write syntax highlighters that have live error reporting. This also means that Language.js is very competent at handling multiple errors (as opposed to aborting on the first one that is reached).

A new operator designed specifically to handle errors trivially and declaritively is added on top of the normal PEG operators. The naughty OR operator (%) behaves just like the choice operator (/), but only gets used if the parse first completely fails. Because of this, **performance is guaranteed to never be affected**, regardless of how many error rules you add to the grammar. Thus, you are allowed to offer alternative "incorrect but valid" grammars to provide increasingly useful errors to your users. More importantly, users can easily submit patches to deal with the problems they encounter. For example, the following simplified snippet from the JavaScript grammar:

    Identifier =
        !(ReservedWord !IdentifierPart) IdentifierName %
        ReservedWordIdentifier

    ReservedWordIdentifier <Identifier can't be a reserved word>=
        ReservedWord !IdentifierPart

generates the following error message with no additional code for "new = 5":

    new = 5;
    ^^^
    ERROR line 0: Identifier can't be a reserved word.
