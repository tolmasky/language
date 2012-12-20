#!/usr/bin/env node

var Compiler = require("./Compiler.js");
var FILE = require("fs");



if(process.argv.length < 3)
{
	console.error("Usage: node objjc.js filename");
}
else
{
	var fileName = process.argv[2];
	var source = FILE.readFileSync(fileName, "UTF-8");
	 
	var value = Compiler.compile(source);

	console.log(value);
}
