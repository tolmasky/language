/*
 * Objective-J.js
 * Objective-J
 *
 * Created by Francisco Tolmasky.
 * Copyright 2008-2010, 280 North, Inc.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 */




var ObjectiveJ = { };

(function (global, exports)
{
if (!this.JSON) {
    JSON = {};
}
(function () {
    function f(n) {
        return n < 10 ? '0' + n : n;
    }
    if (typeof Date.prototype.toJSON !== 'function') {
        Date.prototype.toJSON = function (key) {
            return this.getUTCFullYear() + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate()) + 'T' +
                 f(this.getUTCHours()) + ':' +
                 f(this.getUTCMinutes()) + ':' +
                 f(this.getUTCSeconds()) + 'Z';
        };
        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }
    var cx = new RegExp('[\\u0000\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]', "g");
    var escapable = new RegExp('[\\\\\\"\\x00-\\x1f\\x7f-\\x9f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]', "g");
    var gap,
        indent,
        meta = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;
    function quote(string) {
        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }
    function str(key, holder) {
        var i,
            k,
            v,
            length,
            mind = gap,
            partial,
            value = holder[key];
        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }
        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }
        switch (typeof value) {
        case 'string':
            return quote(value);
        case 'number':
            return isFinite(value) ? String(value) : 'null';
        case 'boolean':
        case 'null':
            return String(value);
        case 'object':
            if (!value) {
                return 'null';
            }
            gap += indent;
            partial = [];
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }
                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }
            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {
                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }
            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }
    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {
            var i;
            gap = '';
            indent = '';
            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }
            } else if (typeof space === 'string') {
                indent = space;
            }
            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }
            return str('', {'': value});
        };
    }
    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {
            var j;
            function walk(holder, key) {
                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            if (/^[\],:{}\s]*$/.
test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                j = eval('(' + text + ')');
                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }
            throw new SyntaxError('JSON.parse');
        };
    }
}());
var formatRegex = new RegExp("([^%]+|%(?:\\d+\\$)?[\\+\\-\\ \\#0]*[0-9\\*]*(.[0-9\\*]+)?[hlL]?[cbBdieEfgGosuxXpn%@])", "g");
var tagRegex = new RegExp("(%)(?:(\\d+)\\$)?([\\+\\-\\ \\#0]*)([0-9\\*]*)((?:.[0-9\\*]+)?)([hlL]?)([cbBdieEfgGosuxXpn%@])");
exports.sprintf = function(format)
{
    var format = arguments[0],
        tokens = format.match(formatRegex),
        index = 0,
        result = "",
        arg = 1;
    for (var i = 0; i < tokens.length; i++)
    {
        var t = tokens[i];
        if (format.substring(index, index + t.length) != t)
        {
            return result;
        }
        index += t.length;
        if (t.charAt(0) !== "%")
            result += t;
        else if (t === "%%")
            result += "%";
        else
        {
            var subtokens = t.match(tagRegex);
            if (subtokens.length != 8 || subtokens[0] != t)
            {
                return result;
            }
            var percentSign = subtokens[1],
                argIndex = subtokens[2],
                flags = subtokens[3],
                widthString = subtokens[4],
                precisionString = subtokens[5],
                length = subtokens[6],
                specifier = subtokens[7];
            if (argIndex === undefined || argIndex === null || argIndex === "")
                argIndex = arg++;
            else
                argIndex = Number(argIndex);
            var width = null;
            if (widthString == "*")
                width = arguments[argIndex];
            else if (widthString != "")
                width = Number(widthString);
            var precision = null;
            if (precisionString == ".*")
                precision = arguments[argIndex];
            else if (precisionString != "")
                precision = Number(precisionString.substring(1));
            var leftJustify = (flags.indexOf("-") >= 0);
            var padZeros = (flags.indexOf("0") >= 0);
            var subresult = "";
            if (RegExp("[bBdiufeExXo]").test(specifier))
            {
                var num = Number(arguments[argIndex]);
                var sign = "";
                if (num < 0)
                {
                    sign = "-";
                }
                else
                {
                    if (flags.indexOf("+") >= 0)
                        sign = "+";
                    else if (flags.indexOf(" ") >= 0)
                        sign = " ";
                }
                if (specifier == "d" || specifier == "i" || specifier == "u")
                {
                    var number = String(Math.abs(Math.floor(num)));
                    subresult = justify(sign, "", number, "", width, leftJustify, padZeros)
                }
                if (specifier == "f")
                {
                    var number = String((precision != null) ? Math.abs(num).toFixed(precision) : Math.abs(num));
                    var suffix = (flags.indexOf("#") >= 0 && number.indexOf(".") < 0) ? "." : "";
                    subresult = justify(sign, "", number, suffix, width, leftJustify, padZeros);
                }
                if (specifier == "e" || specifier == "E")
                {
                    var number = String(Math.abs(num).toExponential(precision != null ? precision : 21));
                    var suffix = (flags.indexOf("#") >= 0 && number.indexOf(".") < 0) ? "." : "";
                    subresult = justify(sign, "", number, suffix, width, leftJustify, padZeros);
                }
                if (specifier == "x" || specifier == "X")
                {
                    var number = String(Math.abs(num).toString(16));
                    var prefix = (flags.indexOf("#") >= 0 && num != 0) ? "0x" : "";
                    subresult = justify(sign, prefix, number, "", width, leftJustify, padZeros);
                }
                if (specifier == "b" || specifier == "B")
                {
                    var number = String(Math.abs(num).toString(2));
                    var prefix = (flags.indexOf("#") >= 0 && num != 0) ? "0b" : "";
                    subresult = justify(sign, prefix, number, "", width, leftJustify, padZeros);
                }
                if (specifier == "o")
                {
                    var number = String(Math.abs(num).toString(8));
                    var prefix = (flags.indexOf("#") >= 0 && num != 0) ? "0" : "";
                    subresult = justify(sign, prefix, number, "", width, leftJustify, padZeros);
                }
                if (RegExp("[A-Z]").test(specifier))
                    subresult = subresult.toUpperCase();
                else
                    subresult = subresult.toLowerCase();
            }
            else
            {
                var subresult = "";
                if (specifier == "%")
                    subresult = "%";
                else if (specifier == "c")
                    subresult = String(arguments[argIndex]).charAt(0);
                else if (specifier == "s" || specifier == "@")
                    subresult = String(arguments[argIndex]);
                else if (specifier == "p" || specifier == "n")
                {
                    subresult = "";
                }
                subresult = justify("", "", subresult, "", width, leftJustify, false);
            }
            result += subresult;
        }
    }
    return result;
}
function justify(sign, prefix, string, suffix, width, leftJustify, padZeros)
{
    var length = (sign.length + prefix.length + string.length + suffix.length);
    if (leftJustify)
    {
        return sign + prefix + string + suffix + pad(width - length, " ");
    }
    else
    {
        if (padZeros)
            return sign + prefix + pad(width - length, "0") + string + suffix;
        else
            return pad(width - length, " ") + sign + prefix + string + suffix;
    }
}
function pad(n, ch)
{
    return Array(MAX(0,n)+1).join(ch);
}
CPLogDisable = false;
var CPLogDefaultTitle = "Cappuccino";
var CPLogLevels = ["fatal", "error", "warn", "info", "debug", "trace"];
var CPLogDefaultLevel = CPLogLevels[3];
var _CPLogLevelsInverted = {};
for (var i = 0; i < CPLogLevels.length; i++)
    _CPLogLevelsInverted[CPLogLevels[i]] = i;
var _CPLogRegistrations = {};
CPLogRegister = function(aProvider, aMaxLevel, aFormatter)
{
    CPLogRegisterRange(aProvider, CPLogLevels[0], aMaxLevel || CPLogLevels[CPLogLevels.length-1], aFormatter);
}
CPLogRegisterRange = function(aProvider, aMinLevel, aMaxLevel, aFormatter)
{
    var min = _CPLogLevelsInverted[aMinLevel];
    var max = _CPLogLevelsInverted[aMaxLevel];
    if (min !== undefined && max !== undefined && min <= max)
        for (var i = min; i <= max; i++)
            CPLogRegisterSingle(aProvider, CPLogLevels[i], aFormatter);
}
CPLogRegisterSingle = function(aProvider, aLevel, aFormatter)
{
    if (!_CPLogRegistrations[aLevel])
        _CPLogRegistrations[aLevel] = [];
    for (var i = 0; i < _CPLogRegistrations[aLevel].length; i++)
        if (_CPLogRegistrations[aLevel][i][0] === aProvider)
        {
            _CPLogRegistrations[aLevel][i][1] = aFormatter;
            return;
        }
    _CPLogRegistrations[aLevel].push([aProvider, aFormatter]);
}
CPLogUnregister = function(aProvider) {
    for (var aLevel in _CPLogRegistrations)
        for (var i = 0; i < _CPLogRegistrations[aLevel].length; i++)
            if (_CPLogRegistrations[aLevel][i][0] === aProvider)
                _CPLogRegistrations[aLevel].splice(i--, 1);
}
function _CPLogDispatch(parameters, aLevel, aTitle)
{
    if (aTitle == undefined)
        aTitle = CPLogDefaultTitle;
    if (aLevel == undefined)
        aLevel = CPLogDefaultLevel;
    var message = (typeof parameters[0] == "string" && parameters.length > 1) ? exports.sprintf.apply(null, parameters) : String(parameters[0]);
    if (_CPLogRegistrations[aLevel])
        for (var i = 0; i < _CPLogRegistrations[aLevel].length; i++)
        {
            var logger = _CPLogRegistrations[aLevel][i];
            logger[0](message, aLevel, aTitle, logger[1]);
        }
}
CPLog = function() { _CPLogDispatch(arguments); }
for (var i = 0; i < CPLogLevels.length; i++)
    CPLog[CPLogLevels[i]] = (function(level) { return function() { _CPLogDispatch(arguments, level); }; })(CPLogLevels[i]);
var _CPFormatLogMessage = function(aString, aLevel, aTitle)
{
    var now = new Date();
    aLevel = ( aLevel == null ? '' : ' [' + CPLogColorize(aLevel, aLevel) + ']' );
    if (typeof exports.sprintf == "function")
        return exports.sprintf("%4d-%02d-%02d %02d:%02d:%02d.%03d %s%s: %s",
            now.getFullYear(), now.getMonth() + 1, now.getDate(),
            now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds(),
            aTitle, aLevel, aString);
    else
        return now + " " + aTitle + aLevel + ": " + aString;
}
CPLogConsole = function(aString, aLevel, aTitle, aFormatter)
{
    if (typeof console != "undefined")
    {
        var message = (aFormatter || _CPFormatLogMessage)(aString, aLevel, aTitle);
        var logger = {
            "fatal": "error",
            "error": "error",
            "warn": "warn",
            "info": "info",
            "debug": "debug",
            "trace": "debug"
        }[aLevel];
        if (logger && console[logger])
            console[logger](message);
        else if (console.log)
            console.log(message);
    }
}
CPLogColorize = function(aString, aLevel)
{
    return aString;
}
CPLogAlert = function(aString, aLevel, aTitle, aFormatter)
{
    if (typeof alert != "undefined" && !CPLogDisable)
    {
        var message = (aFormatter || _CPFormatLogMessage)(aString, aLevel, aTitle);
        CPLogDisable = !confirm(message + "\n\n(Click cancel to stop log alerts)");
    }
}
var CPLogWindow = null;
CPLogPopup = function(aString, aLevel, aTitle, aFormatter)
{
    try {
        if (CPLogDisable || window.open == undefined)
            return;
        if (!CPLogWindow || !CPLogWindow.document)
        {
            CPLogWindow = window.open("", "_blank", "width=600,height=400,status=no,resizable=yes,scrollbars=yes");
            if (!CPLogWindow) {
                CPLogDisable = !confirm(aString + "\n\n(Disable pop-up blocking for CPLog window; Click cancel to stop log alerts)");
                return;
            }
            _CPLogInitPopup(CPLogWindow);
        }
        var logDiv = CPLogWindow.document.createElement("div");
        logDiv.setAttribute("class", aLevel || "fatal");
        var message = (aFormatter || _CPFormatLogMessage)(aString, aFormatter ? aLevel : null, aTitle);
        logDiv.appendChild(CPLogWindow.document.createTextNode(message));
        CPLogWindow.log.appendChild(logDiv);
        if (CPLogWindow.focusEnabled.checked)
            CPLogWindow.focus();
        if (CPLogWindow.blockEnabled.checked)
            CPLogWindow.blockEnabled.checked = CPLogWindow.confirm(message+"\nContinue blocking?");
        if (CPLogWindow.scrollEnabled.checked)
            CPLogWindow.scrollToBottom();
    } catch(e) {
    }
}
var CPLogPopupStyle ='<style type="text/css" media="screen"> body{font:10px Monaco,Courier,"Courier New",monospace,mono;padding-top:15px;} div > .fatal,div > .error,div > .warn,div > .info,div > .debug,div > .trace{display:none;overflow:hidden;white-space:pre;padding:0px 5px 0px 5px;margin-top:2px;-moz-border-radius:5px;-webkit-border-radius:5px;} div[wrap="yes"] > div{white-space:normal;} .fatal{background-color:#ffb2b3;} .error{background-color:#ffe2b2;} .warn{background-color:#fdffb2;} .info{background-color:#e4ffb2;} .debug{background-color:#a0e5a0;} .trace{background-color:#99b9ff;} .enfatal .fatal,.enerror .error,.enwarn .warn,.eninfo .info,.endebug .debug,.entrace .trace{display:block;} div#header{background-color:rgba(240,240,240,0.82);position:fixed;top:0px;left:0px;width:100%;border-bottom:1px solid rgba(0,0,0,0.33);text-align:center;} ul#enablers{display:inline-block;margin:1px 15px 0 15px;padding:2px 0 2px 0;} ul#enablers li{display:inline;padding:0px 5px 0px 5px;margin-left:4px;-moz-border-radius:5px;-webkit-border-radius:5px;} [enabled="no"]{opacity:0.25;} ul#options{display:inline-block;margin:0 15px 0px 15px;padding:0 0px;} ul#options li{margin:0 0 0 0;padding:0 0 0 0;display:inline;} </style>';
function _CPLogInitPopup(logWindow)
{
    var doc = logWindow.document;
    doc.writeln("<html><head><title></title>"+CPLogPopupStyle+"</head><body></body></html>");
    doc.title = CPLogDefaultTitle + " Run Log";
    var head = doc.getElementsByTagName("head")[0];
    var body = doc.getElementsByTagName("body")[0];
    var base = window.location.protocol + "//" + window.location.host + window.location.pathname;
    base = base.substring(0,base.lastIndexOf("/")+1);
    var div = doc.createElement("div");
    div.setAttribute("id", "header");
    body.appendChild(div);
    var ul = doc.createElement("ul");
    ul.setAttribute("id", "enablers");
    div.appendChild(ul);
    for (var i = 0; i < CPLogLevels.length; i++) {
        var li = doc.createElement("li");
        li.setAttribute("id", "en"+CPLogLevels[i]);
        li.setAttribute("class", CPLogLevels[i]);
        li.setAttribute("onclick", "toggle(this);");
        li.setAttribute("enabled", "yes");
        li.appendChild(doc.createTextNode(CPLogLevels[i]));
        ul.appendChild(li);
    }
    var ul = doc.createElement("ul");
    ul.setAttribute("id", "options");
    div.appendChild(ul);
    var options = {"focus":["Focus",false], "block":["Block",false], "wrap":["Wrap",false], "scroll":["Scroll",true], "close":["Close",true]};
    for (o in options) {
        var li = doc.createElement("li");
        ul.appendChild(li);
        logWindow[o+"Enabled"] = doc.createElement("input");
        logWindow[o+"Enabled"].setAttribute("id", o);
        logWindow[o+"Enabled"].setAttribute("type", "checkbox");
        if (options[o][1])
            logWindow[o+"Enabled"].setAttribute("checked", "checked");
        li.appendChild(logWindow[o+"Enabled"]);
        var label = doc.createElement("label");
        label.setAttribute("for", o);
        label.appendChild(doc.createTextNode(options[o][0]));
        li.appendChild(label);
    }
    logWindow.log = doc.createElement("div");
    logWindow.log.setAttribute("class", "enerror endebug enwarn eninfo enfatal entrace");
    body.appendChild(logWindow.log);
    logWindow.toggle = function(elem) {
        var enabled = (elem.getAttribute("enabled") == "yes") ? "no" : "yes";
        elem.setAttribute("enabled", enabled);
        if (enabled == "yes")
            logWindow.log.className += " " + elem.id
        else
            logWindow.log.className = logWindow.log.className.replace(new RegExp("[\\s]*"+elem.id, "g"), "");
    }
    logWindow.scrollToBottom = function() {
        logWindow.scrollTo(0, body.offsetHeight);
    }
    logWindow.wrapEnabled.addEventListener("click", function() {
        logWindow.log.setAttribute("wrap", logWindow.wrapEnabled.checked ? "yes" : "no");
    }, false);
    logWindow.addEventListener("keydown", function(e) {
        var e = e || logWindow.event;
        if (e.keyCode == 75 && (e.ctrlKey || e.metaKey)) {
            while (logWindow.log.firstChild) {
                logWindow.log.removeChild(logWindow.log.firstChild);
            }
            e.preventDefault();
        }
    }, "false");
    window.addEventListener("unload", function() {
        if (logWindow && logWindow.closeEnabled && logWindow.closeEnabled.checked) {
            CPLogDisable = true;
            logWindow.close();
        }
    }, false);
    logWindow.addEventListener("unload", function() {
        if (!CPLogDisable) {
            CPLogDisable = !confirm("Click cancel to stop logging");
        }
    }, false);
}
CPLogDefault = (typeof window === "object" && window.console) ? CPLogConsole : CPLogPopup;
var undefined;
if (typeof window !== "undefined")
{
    window.setNativeTimeout = window.setTimeout;
    window.clearNativeTimeout = window.clearTimeout;
    window.setNativeInterval = window.setInterval;
    window.clearNativeInterval = window.clearInterval;
}
NO = false;
YES = true;
nil = null;
Nil = null;
NULL = null;
ABS = Math.abs;
ASIN = Math.asin;
ACOS = Math.acos;
ATAN = Math.atan;
ATAN2 = Math.atan2;
SIN = Math.sin;
COS = Math.cos;
TAN = Math.tan;
EXP = Math.exp;
POW = Math.pow;
CEIL = Math.ceil;
FLOOR = Math.floor;
ROUND = Math.round;
MIN = Math.min;
MAX = Math.max;
RAND = Math.random;
SQRT = Math.sqrt;
E = Math.E;
LN2 = Math.LN2;
LN10 = Math.LN10;
LOG2E = Math.LOG2E;
LOG10E = Math.LOG10E;
PI = Math.PI;
PI2 = Math.PI * 2.0;
PI_2 = Math.PI / 2.0;
SQRT1_2 = Math.SQRT1_2;
SQRT2 = Math.SQRT2;
function EventDispatcher( anOwner)
{
    this._eventListenersForEventNames = { };
    this._owner = anOwner;
}
EventDispatcher.prototype.addEventListener = function( anEventName, anEventListener)
{
    var eventListenersForEventNames = this._eventListenersForEventNames;
    if (!hasOwnProperty.call(eventListenersForEventNames, anEventName))
    {
        var eventListenersForEventName = [];
        eventListenersForEventNames[anEventName] = eventListenersForEventName;
    }
    else
        var eventListenersForEventName = eventListenersForEventNames[anEventName];
    var index = eventListenersForEventName.length;
    while (index--)
        if (eventListenersForEventName[index] === anEventListener)
            return;
    eventListenersForEventName.push(anEventListener);
}
EventDispatcher.prototype.removeEventListener = function( anEventName, anEventListener)
{
    var eventListenersForEventNames = this._eventListenersForEventNames;
    if (!hasOwnProperty.call(eventListenersForEventNames, anEventName))
        return;
    var eventListenersForEventName = eventListenersForEventNames[anEventName],
        index = eventListenersForEventName.length;
    while (index--)
        if (eventListenersForEventName[index] === anEventListener)
            return eventListenersForEventName.splice(index, 1);
}
EventDispatcher.prototype.dispatchEvent = function( anEvent)
{
    var type = anEvent.type,
        eventListenersForEventNames = this._eventListenersForEventNames;
    if (hasOwnProperty.call(eventListenersForEventNames, type))
    {
        var eventListenersForEventName = this._eventListenersForEventNames[type],
            index = 0,
            count = eventListenersForEventName.length;
        for (; index < count; ++index)
            eventListenersForEventName[index](anEvent);
    }
    var manual = (this._owner || this)["on" + type];
    if (manual)
        manual(anEvent);
}
var asynchronousTimeoutCount = 0,
    asynchronousTimeoutId = null,
    asynchronousFunctionQueue = [];
function Asynchronous( aFunction)
{
    var currentAsynchronousTimeoutCount = asynchronousTimeoutCount;
    if (asynchronousTimeoutId === null)
    {
        window.setNativeTimeout(function()
        {
            var queue = asynchronousFunctionQueue,
                index = 0,
                count = asynchronousFunctionQueue.length;
            ++asynchronousTimeoutCount;
            asynchronousTimeoutId = null;
            asynchronousFunctionQueue = [];
            for (; index < count; ++index)
                queue[index]();
        }, 0);
    }
    return function()
    {
        var args = arguments;
        if (asynchronousTimeoutCount > currentAsynchronousTimeoutCount)
            aFunction.apply(this, args);
        else
            asynchronousFunctionQueue.push(function() { aFunction.apply(this, args) });
    };
}
var NativeRequest = null;
if (window.ActiveXObject !== undefined)
{
    var MSXML_XMLHTTP_OBJECTS = ["Msxml2.XMLHTTP.3.0", "Msxml2.XMLHTTP.6.0"],
        index = MSXML_XMLHTTP_OBJECTS.length;
    while (index--)
    {
        try
        {
            var MSXML_XMLHTTP = MSXML_XMLHTTP_OBJECTS[index];
            new ActiveXObject(MSXML_XMLHTTP);
            NativeRequest = function()
            {
                return new ActiveXObject(MSXML_XMLHTTP);
            }
            break;
        }
        catch (anException)
        {
        }
    }
}
if (!NativeRequest)
    NativeRequest = window.XMLHttpRequest;
CFHTTPRequest = function()
{
    this._isOpen = false;
    this._requestHeaders = {};
    this._mimeType = null;
    this._eventDispatcher = new EventDispatcher(this);
    this._nativeRequest = new NativeRequest();
    var self = this;
    this._stateChangeHandler = function()
    {
        determineAndDispatchHTTPRequestEvents(self);
    }
    this._nativeRequest.onreadystatechange = this._stateChangeHandler;
    if (CFHTTPRequest.AuthenticationDelegate !== nil)
        this._eventDispatcher.addEventListener("HTTP403", function(){CFHTTPRequest.AuthenticationDelegate(self)});
}
CFHTTPRequest.UninitializedState = 0;
CFHTTPRequest.LoadingState = 1;
CFHTTPRequest.LoadedState = 2;
CFHTTPRequest.InteractiveState = 3;
CFHTTPRequest.CompleteState = 4;
CFHTTPRequest.AuthenticationDelegate = nil;
CFHTTPRequest.prototype.status = function()
{
    try
    {
        return this._nativeRequest.status || 0;
    }
    catch (anException)
    {
        return 0;
    }
}
CFHTTPRequest.prototype.statusText = function()
{
    try
    {
        return this._nativeRequest.statusText || "";
    }
    catch (anException)
    {
        return "";
    }
}
CFHTTPRequest.prototype.readyState = function()
{
    return this._nativeRequest.readyState;
}
CFHTTPRequest.prototype.success = function()
{
    var status = this.status();
    if (status >= 200 && status < 300)
        return YES;
    return status === 0 && this.responseText() && this.responseText().length;
}
CFHTTPRequest.prototype.responseXML = function()
{
    var responseXML = this._nativeRequest.responseXML;
    if (responseXML && (NativeRequest === window.XMLHttpRequest))
        return responseXML;
    return parseXML(this.responseText());
}
CFHTTPRequest.prototype.responsePropertyList = function()
{
    var responseText = this.responseText();
    if (CFPropertyList.sniffedFormatOfString(responseText) === CFPropertyList.FormatXML_v1_0)
        return CFPropertyList.propertyListFromXML(this.responseXML());
    return CFPropertyList.propertyListFromString(responseText);
}
CFHTTPRequest.prototype.responseText = function()
{
    return this._nativeRequest.responseText;
}
CFHTTPRequest.prototype.setRequestHeader = function( aHeader, aValue)
{
    this._requestHeaders[aHeader] = aValue;
}
CFHTTPRequest.prototype.getResponseHeader = function( aHeader)
{
    return this._nativeRequest.getResponseHeader(aHeader);
}
CFHTTPRequest.prototype.getAllResponseHeaders = function()
{
    return this._nativeRequest.getAllResponseHeaders();
}
CFHTTPRequest.prototype.overrideMimeType = function( aMimeType)
{
    this._mimeType = aMimeType;
}
CFHTTPRequest.prototype.open = function( aMethod, aURL, isAsynchronous, aUser, aPassword)
{
    this._isOpen = true;
    this._URL = aURL;
    this._async = isAsynchronous;
    this._method = aMethod;
    this._user = aUser;
    this._password = aPassword;
    return this._nativeRequest.open(aMethod, aURL, isAsynchronous, aUser, aPassword);
}
CFHTTPRequest.prototype.send = function( aBody)
{
    if (!this._isOpen)
    {
        delete this._nativeRequest.onreadystatechange;
        this._nativeRequest.open(this._method, this._URL, this._async, this._user, this._password);
        this._nativeRequest.onreadystatechange = this._stateChangeHandler;
    }
    for (var i in this._requestHeaders)
    {
        if (this._requestHeaders.hasOwnProperty(i))
            this._nativeRequest.setRequestHeader(i, this._requestHeaders[i]);
    }
    if (this._mimeType && "overrideMimeType" in this._nativeRequest)
        this._nativeRequest.overrideMimeType(this._mimeType);
    this._isOpen = false;
    try
    {
        return this._nativeRequest.send(aBody);
    }
    catch (anException)
    {
        this._eventDispatcher.dispatchEvent({ type:"failure", request:this });
    }
}
CFHTTPRequest.prototype.abort = function()
{
    this._isOpen = false;
    return this._nativeRequest.abort();
}
CFHTTPRequest.prototype.addEventListener = function( anEventName, anEventListener)
{
    this._eventDispatcher.addEventListener(anEventName, anEventListener);
}
CFHTTPRequest.prototype.removeEventListener = function( anEventName, anEventListener)
{
    this._eventDispatcher.removeEventListener(anEventName, anEventListener);
}
function determineAndDispatchHTTPRequestEvents( aRequest)
{
    var eventDispatcher = aRequest._eventDispatcher;
    eventDispatcher.dispatchEvent({ type:"readystatechange", request:aRequest});
    var nativeRequest = aRequest._nativeRequest,
        readyStates = ["uninitialized", "loading", "loaded", "interactive", "complete"];
    if (readyStates[aRequest.readyState()] === "complete")
    {
        var status = "HTTP" + aRequest.status();
        eventDispatcher.dispatchEvent({ type:status, request:aRequest });
        var result = aRequest.success() ? "success" : "failure";
        eventDispatcher.dispatchEvent({ type:result, request:aRequest });
        eventDispatcher.dispatchEvent({ type:readyStates[aRequest.readyState()], request:aRequest});
    }
    else
        eventDispatcher.dispatchEvent({ type:readyStates[aRequest.readyState()], request:aRequest});
}
function FileRequest( aURL, onsuccess, onfailure)
{
    var request = new CFHTTPRequest();
    if (aURL.pathExtension() === "plist")
        request.overrideMimeType("text/xml");
    if (exports.asyncLoader)
    {
        request.onsuccess = Asynchronous(onsuccess);
        request.onfailure = Asynchronous(onfailure);
    }
    else
    {
        request.onsuccess = onsuccess;
        request.onfailure = onfailure;
    }
    request.open("GET", aURL.absoluteString(), exports.asyncLoader);
    request.send("");
}
exports.asyncLoader = YES;
exports.Asynchronous = Asynchronous;
exports.determineAndDispatchHTTPRequestEvents = determineAndDispatchHTTPRequestEvents;
var OBJECT_COUNT = 0;
objj_generateObjectUID = function()
{
    return OBJECT_COUNT++;
}
CFPropertyList = function()
{
    this._UID = objj_generateObjectUID();
}
CFPropertyList.DTDRE = /^\s*(?:<\?\s*xml\s+version\s*=\s*\"1.0\"[^>]*\?>\s*)?(?:<\!DOCTYPE[^>]*>\s*)?/i
CFPropertyList.XMLRE = /^\s*(?:<\?\s*xml\s+version\s*=\s*\"1.0\"[^>]*\?>\s*)?(?:<\!DOCTYPE[^>]*>\s*)?<\s*plist[^>]*\>/i;
CFPropertyList.FormatXMLDTD = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">";
CFPropertyList.Format280NorthMagicNumber = "280NPLIST";
CFPropertyList.FormatOpenStep = 1,
CFPropertyList.FormatXML_v1_0 = 100,
CFPropertyList.FormatBinary_v1_0 = 200,
CFPropertyList.Format280North_v1_0 = -1000;
CFPropertyList.sniffedFormatOfString = function( aString)
{
    if (aString.match(CFPropertyList.XMLRE))
        return CFPropertyList.FormatXML_v1_0;
    if (aString.substr(0, CFPropertyList.Format280NorthMagicNumber.length) === CFPropertyList.Format280NorthMagicNumber)
       return CFPropertyList.Format280North_v1_0;
    return NULL;
}
CFPropertyList.dataFromPropertyList = function( aPropertyList, aFormat)
{
    var data = new CFMutableData();
    data.setRawString(CFPropertyList.stringFromPropertyList(aPropertyList, aFormat));
    return data;
}
CFPropertyList.stringFromPropertyList = function( aPropertyList, aFormat)
{
    if (!aFormat)
        aFormat = CFPropertyList.Format280North_v1_0;
    var serializers = CFPropertyListSerializers[aFormat];
    return serializers["start"]() +
            serializePropertyList(aPropertyList, serializers) +
            serializers["finish"]();
}
function serializePropertyList( aPropertyList, serializers)
{
    var type = typeof aPropertyList,
        valueOf = aPropertyList.valueOf(),
        typeValueOf = typeof valueOf;
    if (type !== typeValueOf)
    {
        type = typeValueOf;
        aPropertyList = valueOf;
    }
    if (aPropertyList === YES || aPropertyList === NO)
        type = "boolean";
    else if (type === "number")
    {
        if (FLOOR(aPropertyList) === aPropertyList && ("" + aPropertyList).indexOf('e') == -1)
            type = "integer";
        else
            type = "real";
    }
    else if (type !== "string")
    {
        if (aPropertyList.slice)
            type = "array";
        else
            type = "dictionary";
    }
    return serializers[type](aPropertyList, serializers);
}
var CFPropertyListSerializers = { };
CFPropertyListSerializers[CFPropertyList.FormatXML_v1_0] =
{
    "start": function()
                    {
                        return CFPropertyList.FormatXMLDTD + "<plist version = \"1.0\">";
                    },
    "finish": function()
                    {
                        return "</plist>";
                    },
    "string": function( aString)
                    {
                        return "<string>" + encodeHTMLComponent(aString) + "</string>";;
                    },
    "boolean" : function( aBoolean)
                    {
                        return aBoolean ? "<true/>" : "<false/>";
                    },
    "integer": function( anInteger)
                    {
                        return "<integer>" + anInteger + "</integer>";
                    },
    "real": function( aFloat)
                    {
                        return "<real>" + aFloat + "</real>";
                    },
    "array": function( anArray, serializers)
                    {
                        var index = 0,
                            count = anArray.length,
                            string = "<array>";
                        for (; index < count; ++index)
                            string += serializePropertyList(anArray[index], serializers);
                        return string + "</array>";
                    },
    "dictionary": function( aDictionary, serializers)
                    {
                        var keys = aDictionary._keys,
                            index = 0,
                            count = keys.length,
                            string = "<dict>";
                        for (; index < count; ++index)
                        {
                            var key = keys[index];
                            string += "<key>" + key + "</key>";
                            string += serializePropertyList(aDictionary.valueForKey(key), serializers);
                        }
                        return string + "</dict>";
                    }
}
var ARRAY_MARKER = "A",
    DICTIONARY_MARKER = "D",
    FLOAT_MARKER = "f",
    INTEGER_MARKER = "d",
    STRING_MARKER = "S",
    TRUE_MARKER = "T",
    FALSE_MARKER = "F",
    KEY_MARKER = "K",
    END_MARKER = "E";
CFPropertyListSerializers[CFPropertyList.Format280North_v1_0] =
{
    "start": function()
                    {
                        return CFPropertyList.Format280NorthMagicNumber + ";1.0;";
                    },
    "finish": function()
                    {
                        return "";
                    },
    "string" : function( aString)
                    {
                        return STRING_MARKER + ';' + aString.length + ';' + aString;
                    },
    "boolean" : function( aBoolean)
                    {
                        return (aBoolean ? TRUE_MARKER : FALSE_MARKER) + ';';
                    },
    "integer": function( anInteger)
                    {
                        var string = "" + anInteger;
                        return INTEGER_MARKER + ';' + string.length + ';' + string;
                    },
    "real": function( aFloat)
                    {
                        var string = "" + aFloat;
                        return FLOAT_MARKER + ';' + string.length + ';' + string;
                    },
    "array": function( anArray, serializers)
                    {
                        var index = 0,
                            count = anArray.length,
                            string = ARRAY_MARKER + ';';
                        for (; index < count; ++index)
                            string += serializePropertyList(anArray[index], serializers);
                        return string + END_MARKER + ';';
                    },
    "dictionary": function( aDictionary, serializers)
                    {
                        var keys = aDictionary._keys,
                            index = 0,
                            count = keys.length,
                            string = DICTIONARY_MARKER +';';
                        for (; index < count; ++index)
                        {
                            var key = keys[index];
                            string += KEY_MARKER + ';' + key.length + ';' + key;
                            string += serializePropertyList(aDictionary.valueForKey(key), serializers);
                        }
                        return string + END_MARKER + ';';
                    }
}
var XML_XML = "xml",
    XML_DOCUMENT = "#document",
    PLIST_PLIST = "plist",
    PLIST_KEY = "key",
    PLIST_DICTIONARY = "dict",
    PLIST_ARRAY = "array",
    PLIST_STRING = "string",
    PLIST_BOOLEAN_TRUE = "true",
    PLIST_BOOLEAN_FALSE = "false",
    PLIST_NUMBER_REAL = "real",
    PLIST_NUMBER_INTEGER = "integer",
    PLIST_DATA = "data";
var textContent = function(nodes)
{
    var text = "",
        index = 0,
        count = nodes.length;
    for (; index < count; ++index)
    {
        var node = nodes[index];
        if (node.nodeType === 3 || node.nodeType === 4)
            text += node.nodeValue;
        else if (node.nodeType !== 8)
            text += textContent(node.childNodes);
    }
    return text;
}
var _plist_traverseNextNode = function(anXMLNode, stayWithin, stack)
{
    var node = anXMLNode;
    node = (node.firstChild); if (node !== NULL && ((node.nodeType) === 8 || (node.nodeType) === 3)) while ((node = (node.nextSibling)) && ((node.nodeType) === 8 || (node.nodeType) === 3)) ;;
    if (node)
        return node;
    if ((String(anXMLNode.nodeName)) === PLIST_ARRAY || (String(anXMLNode.nodeName)) === PLIST_DICTIONARY)
        stack.pop();
    else
    {
        if (node === stayWithin)
            return NULL;
        node = anXMLNode;
        while ((node = (node.nextSibling)) && ((node.nodeType) === 8 || (node.nodeType) === 3)) ;;
        if (node)
            return node;
    }
    node = anXMLNode;
    while (node)
    {
        var next = node;
        while ((next = (next.nextSibling)) && ((next.nodeType) === 8 || (next.nodeType) === 3)) ;;
        if (next)
            return next;
        var node = (node.parentNode);
        if (stayWithin && node === stayWithin)
            return NULL;
        stack.pop();
    }
    return NULL;
}
CFPropertyList.propertyListFromData = function( aData, aFormat)
{
    return CFPropertyList.propertyListFromString(aData.rawString(), aFormat);
}
CFPropertyList.propertyListFromString = function( aString, aFormat)
{
    if (!aFormat)
        aFormat = CFPropertyList.sniffedFormatOfString(aString);
    if (aFormat === CFPropertyList.FormatXML_v1_0)
        return CFPropertyList.propertyListFromXML(aString);
    if (aFormat === CFPropertyList.Format280North_v1_0)
        return propertyListFrom280NorthString(aString);
    return NULL;
}
var ARRAY_MARKER = "A",
    DICTIONARY_MARKER = "D",
    FLOAT_MARKER = "f",
    INTEGER_MARKER = "d",
    STRING_MARKER = "S",
    TRUE_MARKER = "T",
    FALSE_MARKER = "F",
    KEY_MARKER = "K",
    END_MARKER = "E";
function propertyListFrom280NorthString( aString)
{
    var stream = new MarkedStream(aString),
        marker = NULL,
        key = "",
        object = NULL,
        plistObject = NULL,
        containers = [],
        currentContainer = NULL;
    while (marker = stream.getMarker())
    {
        if (marker === END_MARKER)
        {
            containers.pop();
            continue;
        }
        var count = containers.length;
        if (count)
            currentContainer = containers[count - 1];
        if (marker === KEY_MARKER)
        {
            key = stream.getString();
            marker = stream.getMarker();
        }
        switch (marker)
        {
            case ARRAY_MARKER: object = []
                                    containers.push(object);
                                    break;
            case DICTIONARY_MARKER: object = new CFMutableDictionary();
                                    containers.push(object);
                                    break;
            case FLOAT_MARKER: object = parseFloat(stream.getString());
                                    break;
            case INTEGER_MARKER: object = parseInt(stream.getString(), 10);
                                    break;
            case STRING_MARKER: object = stream.getString();
                                    break;
            case TRUE_MARKER: object = YES;
                                    break;
            case FALSE_MARKER: object = NO;
                                    break;
            default: throw new Error("*** " + marker + " marker not recognized in Plist.");
        }
        if (!plistObject)
            plistObject = object;
        else if (currentContainer)
            if (currentContainer.slice)
                currentContainer.push(object);
            else
                currentContainer.setValueForKey(key, object);
    }
    return plistObject;
}
function encodeHTMLComponent( aString)
{
    return aString.replace(/&/g,'&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function decodeHTMLComponent( aString)
{
    return aString.replace(/&quot;/g, '"').replace(/&apos;/g, '\'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
}
function parseXML( aString)
{
    if (window.DOMParser)
        return (new window.DOMParser().parseFromString(aString, "text/xml").documentElement);
    else if (window.ActiveXObject)
    {
        XMLNode = new ActiveXObject("Microsoft.XMLDOM");
        var matches = aString.match(CFPropertyList.DTDRE);
        if (matches)
            aString = aString.substr(matches[0].length);
        XMLNode.loadXML(aString);
        return XMLNode
    }
    return NULL;
}
CFPropertyList.propertyListFromXML = function( aStringOrXMLNode)
{
    var XMLNode = aStringOrXMLNode;
    if (aStringOrXMLNode.valueOf && typeof aStringOrXMLNode.valueOf() === "string")
        XMLNode = parseXML(aStringOrXMLNode);
    while (((String(XMLNode.nodeName)) === XML_DOCUMENT) || ((String(XMLNode.nodeName)) === XML_XML))
        XMLNode = (XMLNode.firstChild); if (XMLNode !== NULL && ((XMLNode.nodeType) === 8 || (XMLNode.nodeType) === 3)) while ((XMLNode = (XMLNode.nextSibling)) && ((XMLNode.nodeType) === 8 || (XMLNode.nodeType) === 3)) ;;
    if (((XMLNode.nodeType) === 10))
        while ((XMLNode = (XMLNode.nextSibling)) && ((XMLNode.nodeType) === 8 || (XMLNode.nodeType) === 3)) ;;
    if (!((String(XMLNode.nodeName)) === PLIST_PLIST))
        return NULL;
    var key = "",
        object = NULL,
        plistObject = NULL,
        plistNode = XMLNode,
        containers = [],
        currentContainer = NULL;
    while (XMLNode = _plist_traverseNextNode(XMLNode, plistNode, containers))
    {
        var count = containers.length;
        if (count)
            currentContainer = containers[count - 1];
        if ((String(XMLNode.nodeName)) === PLIST_KEY)
        {
            key = (XMLNode.textContent || (XMLNode.textContent !== "" && textContent([XMLNode])));
            while ((XMLNode = (XMLNode.nextSibling)) && ((XMLNode.nodeType) === 8 || (XMLNode.nodeType) === 3)) ;;
        }
        switch (String((String(XMLNode.nodeName))))
        {
            case PLIST_ARRAY: object = []
                                        containers.push(object);
                                        break;
            case PLIST_DICTIONARY: object = new CFMutableDictionary();
                                        containers.push(object);
                                        break;
            case PLIST_NUMBER_REAL: object = parseFloat((XMLNode.textContent || (XMLNode.textContent !== "" && textContent([XMLNode]))));
                                        break;
            case PLIST_NUMBER_INTEGER: object = parseInt((XMLNode.textContent || (XMLNode.textContent !== "" && textContent([XMLNode]))), 10);
                                        break;
            case PLIST_STRING: if ((XMLNode.getAttribute("type") === "base64"))
                                            object = (XMLNode.firstChild) ? CFData.decodeBase64ToString((XMLNode.textContent || (XMLNode.textContent !== "" && textContent([XMLNode])))) : "";
                                        else
                                            object = decodeHTMLComponent((XMLNode.firstChild) ? (XMLNode.textContent || (XMLNode.textContent !== "" && textContent([XMLNode]))) : "");
                                        break;
            case PLIST_BOOLEAN_TRUE: object = YES;
                                        break;
            case PLIST_BOOLEAN_FALSE: object = NO;
                                        break;
            case PLIST_DATA: object = new CFMutableData();
                                        object.bytes = (XMLNode.firstChild) ? CFData.decodeBase64ToArray((XMLNode.textContent || (XMLNode.textContent !== "" && textContent([XMLNode]))), YES) : [];
                                        break;
            default: throw new Error("*** " + (String(XMLNode.nodeName)) + " tag not recognized in Plist.");
        }
        if (!plistObject)
            plistObject = object;
        else if (currentContainer)
            if (currentContainer.slice)
                currentContainer.push(object);
            else
                currentContainer.setValueForKey(key, object);
    }
    return plistObject;
}
kCFPropertyListOpenStepFormat = CFPropertyList.FormatOpenStep;
kCFPropertyListXMLFormat_v1_0 = CFPropertyList.FormatXML_v1_0;
kCFPropertyListBinaryFormat_v1_0 = CFPropertyList.FormatBinary_v1_0;
kCFPropertyList280NorthFormat_v1_0 = CFPropertyList.Format280North_v1_0;
CFPropertyListCreate = function()
{
    return new CFPropertyList();
}
CFPropertyListCreateFromXMLData = function( data)
{
    return CFPropertyList.propertyListFromData(data, CFPropertyList.FormatXML_v1_0);
}
CFPropertyListCreateXMLData = function( aPropertyList)
{
    return CFPropertyList.dataFromPropertyList(aPropertyList, CFPropertyList.FormatXML_v1_0);
}
CFPropertyListCreateFrom280NorthData = function( data)
{
    return CFPropertyList.propertyListFromData(data, CFPropertyList.Format280North_v1_0);
}
CFPropertyListCreate280NorthData = function( aPropertyList)
{
    return CFPropertyList.dataFromPropertyList(aPropertyList, CFPropertyList.Format280North_v1_0);
}
CPPropertyListCreateFromData = function( data, aFormat)
{
    return CFPropertyList.propertyListFromData(data, aFormat);
}
CPPropertyListCreateData = function( aPropertyList, aFormat)
{
    return CFPropertyList.dataFromPropertyList(aPropertyList, aFormat);
}
CFDictionary = function( aDictionary)
{
    this._keys = [];
    this._count = 0;
    this._buckets = { };
    this._UID = objj_generateObjectUID();
}
var indexOf = Array.prototype.indexOf,
    hasOwnProperty = Object.prototype.hasOwnProperty;
CFDictionary.prototype.copy = function()
{
    return this;
}
CFDictionary.prototype.mutableCopy = function()
{
    var newDictionary = new CFMutableDictionary(),
        keys = this._keys,
        count = this._count;
    newDictionary._keys = keys.slice();
    newDictionary._count = count;
    var index = 0,
        buckets = this._buckets,
        newBuckets = newDictionary._buckets;
    for (; index < count; ++index)
    {
        var key = keys[index];
        newBuckets[key] = buckets[key];
    }
    return newDictionary;
}
CFDictionary.prototype.containsKey = function( aKey)
{
    return hasOwnProperty.apply(this._buckets, [aKey]);
}
CFDictionary.prototype.containsKey.displayName = "CFDictionary.prototype.containsKey";
CFDictionary.prototype.containsValue = function( anObject)
{
    var keys = this._keys,
        buckets = this._buckets,
        index = 0,
        count = keys.length;
    for (; index < count; ++index)
        if (buckets[keys[index]] === anObject)
            return YES;
    return NO;
}
CFDictionary.prototype.containsValue.displayName = "CFDictionary.prototype.containsValue";
CFDictionary.prototype.count = function()
{
    return this._count;
}
CFDictionary.prototype.count.displayName = "CFDictionary.prototype.count";
CFDictionary.prototype.countOfKey = function( aKey)
{
    return this.containsKey(aKey) ? 1 : 0;
}
CFDictionary.prototype.countOfKey.displayName = "CFDictionary.prototype.countOfKey";
CFDictionary.prototype.countOfValue = function( anObject)
{
    var keys = this._keys,
        buckets = this._buckets,
        index = 0,
        count = keys.length,
        countOfValue = 0;
    for (; index < count; ++index)
        if (buckets[keys[index]] === anObject)
            ++countOfValue;
    return countOfValue;
}
CFDictionary.prototype.countOfValue.displayName = "CFDictionary.prototype.countOfValue";
CFDictionary.prototype.keys = function()
{
    return this._keys.slice();
}
CFDictionary.prototype.keys.displayName = "CFDictionary.prototype.keys";
CFDictionary.prototype.valueForKey = function( aKey)
{
    var buckets = this._buckets;
    if (!hasOwnProperty.apply(buckets, [aKey]))
        return nil;
    return buckets[aKey];
}
CFDictionary.prototype.valueForKey.displayName = "CFDictionary.prototype.valueForKey";
CFDictionary.prototype.toString = function()
{
    var string = "{\n",
        keys = this._keys,
        index = 0,
        count = this._count;
    for (; index < count; ++index)
    {
        var key = keys[index];
        string += "\t" + key + " = \"" + String(this.valueForKey(key)).split('\n').join("\n\t") + "\"\n";
    }
    return string + "}";
}
CFDictionary.prototype.toString.displayName = "CFDictionary.prototype.toString";
CFMutableDictionary = function( aDictionary)
{
    CFDictionary.apply(this, []);
}
CFMutableDictionary.prototype = new CFDictionary();
CFMutableDictionary.prototype.copy = function()
{
    return this.mutableCopy();
}
CFMutableDictionary.prototype.addValueForKey = function( aKey, aValue)
{
    if (this.containsKey(aKey))
        return;
    ++this._count;
    this._keys.push(aKey);
    this._buckets[aKey] = aValue;
}
CFMutableDictionary.prototype.addValueForKey.displayName = "CFMutableDictionary.prototype.addValueForKey";
CFMutableDictionary.prototype.removeValueForKey = function( aKey)
{
    var indexOfKey = -1;
    if (indexOf)
        indexOfKey = indexOf.call(this._keys, aKey);
    else
    {
        var keys = this._keys,
            index = 0,
            count = keys.length;
        for (; index < count; ++index)
            if (keys[index] === aKey)
            {
                indexOfKey = index;
                break;
            }
    }
    if (indexOfKey === -1)
        return;
    --this._count;
    this._keys.splice(indexOfKey, 1);
    delete this._buckets[aKey];
}
CFMutableDictionary.prototype.removeValueForKey.displayName = "CFMutableDictionary.prototype.removeValueForKey";
CFMutableDictionary.prototype.removeAllValues = function()
{
    this._count = 0;
    this._keys = [];
    this._buckets = { };
}
CFMutableDictionary.prototype.removeAllValues.displayName = "CFMutableDictionary.prototype.removeAllValues";
CFMutableDictionary.prototype.replaceValueForKey = function( aKey, aValue)
{
    if (!this.containsKey(aKey))
        return;
    this._buckets[aKey] = aValue;
}
CFMutableDictionary.prototype.replaceValueForKey.displayName = "CFMutableDictionary.prototype.replaceValueForKey";
CFMutableDictionary.prototype.setValueForKey = function( aKey, aValue)
{
    if (aValue === nil || aValue === undefined)
        this.removeValueForKey(aKey);
    else if (this.containsKey(aKey))
        this.replaceValueForKey(aKey, aValue);
    else
        this.addValueForKey(aKey, aValue);
}
CFMutableDictionary.prototype.setValueForKey.displayName = "CFMutableDictionary.prototype.setValueForKey";
CFData = function()
{
    this._rawString = NULL;
    this._propertyList = NULL;
    this._propertyListFormat = NULL;
    this._JSONObject = NULL;
    this._bytes = NULL;
    this._base64 = NULL;
}
CFData.prototype.propertyList = function()
{
    if (!this._propertyList)
        this._propertyList = CFPropertyList.propertyListFromString(this.rawString());
    return this._propertyList;
}
CFData.prototype.JSONObject = function()
{
    if (!this._JSONObject)
    {
        try
        {
            this._JSONObject = JSON.parse(this.rawString());
        }
        catch (anException)
        {
        }
    }
    return this._JSONObject;
}
CFData.prototype.rawString = function()
{
    if (this._rawString === NULL)
    {
        if (this._propertyList)
            this._rawString = CFPropertyList.stringFromPropertyList(this._propertyList, this._propertyListFormat);
        else if (this._JSONObject)
            this._rawString = JSON.stringify(this._JSONObject);
        else
            throw new Error("Can't convert data to string.");
    }
    return this._rawString;
}
CFData.prototype.bytes = function()
{
    return this._bytes;
}
CFData.prototype.base64 = function()
{
    return this._base64;
}
CFMutableData = function()
{
    CFData.call(this);
}
CFMutableData.prototype = new CFData();
function clearMutableData( aData)
{
    this._rawString = NULL;
    this._propertyList = NULL;
    this._propertyListFormat = NULL;
    this._JSONObject = NULL;
    this._bytes = NULL;
    this._base64 = NULL;
}
CFMutableData.prototype.setPropertyList = function( aPropertyList, aFormat)
{
    clearMutableData(this);
    this._propertyList = aPropertyList;
    this._propertyListFormat = aFormat;
}
CFMutableData.prototype.setJSONObject = function( anObject)
{
    clearMutableData(this);
    this._JSONObject = anObject
}
CFMutableData.prototype.setRawString = function( aString)
{
    clearMutableData(this);
    this._rawString = aString;
}
CFMutableData.prototype.setBytes = function( bytes)
{
    clearMutableData(this);
    this._bytes = bytes;
}
CFMutableData.prototype.setBase64String = function( aBase64String)
{
    clearMutableData(this);
    this._base64 = aBase64String;
}
var base64_map_to = [
        "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
        "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
        "0","1","2","3","4","5","6","7","8","9","+","/","="],
    base64_map_from = [];
for (var i = 0; i < base64_map_to.length; i++)
    base64_map_from[base64_map_to[i].charCodeAt(0)] = i;
CFData.decodeBase64ToArray = function(input, strip)
{
    if (strip)
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    var pad = (input[input.length-1] == "=" ? 1 : 0) + (input[input.length-2] == "=" ? 1 : 0),
        length = input.length,
        output = [];
    var i = 0;
    while (i < length)
    {
        var bits = (base64_map_from[input.charCodeAt(i++)] << 18) |
                    (base64_map_from[input.charCodeAt(i++)] << 12) |
                    (base64_map_from[input.charCodeAt(i++)] << 6) |
                    (base64_map_from[input.charCodeAt(i++)]);
        output.push((bits & 0xFF0000) >> 16);
        output.push((bits & 0xFF00) >> 8);
        output.push(bits & 0xFF);
    }
    if (pad > 0)
        return output.slice(0, -1 * pad);
    return output;
}
CFData.encodeBase64Array = function(input)
{
    var pad = (3 - (input.length % 3)) % 3,
        length = input.length + pad,
        output = [];
    if (pad > 0) input.push(0);
    if (pad > 1) input.push(0);
    var i = 0;
    while (i < length)
    {
        var bits = (input[i++] << 16) |
                    (input[i++] << 8) |
                    (input[i++]);
        output.push(base64_map_to[(bits & 0xFC0000) >> 18]);
        output.push(base64_map_to[(bits & 0x3F000) >> 12]);
        output.push(base64_map_to[(bits & 0xFC0) >> 6]);
        output.push(base64_map_to[bits & 0x3F]);
    }
    if (pad > 0)
    {
        output[output.length-1] = "=";
        input.pop();
    }
    if (pad > 1)
    {
        output[output.length-2] = "=";
        input.pop();
    }
    return output.join("");
}
CFData.decodeBase64ToString = function(input, strip)
{
    return CFData.bytesToString(CFData.decodeBase64ToArray(input, strip));
}
CFData.decodeBase64ToUtf16String = function(input, strip)
{
    return CFData.bytesToUtf16String(CFData.decodeBase64ToArray(input, strip));
}
CFData.bytesToString = function(bytes)
{
    return String.fromCharCode.apply(NULL, bytes);
}
CFData.encodeBase64String = function(input)
{
    var temp = [];
    for (var i = 0; i < input.length; i++)
        temp.push(input.charCodeAt(i));
    return CFData.encodeBase64Array(temp);
}
CFData.bytesToUtf16String = function(bytes)
{
    var temp = [];
    for (var i = 0; i < bytes.length; i+=2)
        temp.push(bytes[i+1] << 8 | bytes[i]);
    return String.fromCharCode.apply(NULL, temp);
}
CFData.encodeBase64Utf16String = function(input)
{
    var temp = [];
    for (var i = 0; i < input.length; i++)
    {
        var c = input.charCodeAt(i);
        temp.push(input.charCodeAt(i) & 0xFF);
        temp.push((input.charCodeAt(i) & 0xFF00) >> 8);
    }
    return CFData.encodeBase64Array(temp);
}
var CFURLsForCachedUIDs,
    CFURLPartsForURLStrings,
    CFURLCachingEnableCount = 0;
function enableCFURLCaching()
{
    if (++CFURLCachingEnableCount !== 1)
        return;
    CFURLsForCachedUIDs = { };
    CFURLPartsForURLStrings = { };
}
function disableCFURLCaching()
{
    CFURLCachingEnableCount = MAX(CFURLCachingEnableCount - 1, 0);
    if (CFURLCachingEnableCount !== 0)
        return;
    delete CFURLsForCachedUIDs;
    delete CFURLPartsForURLStrings;
}
var URL_RE = new RegExp(
    "^" +
    "(?:" +
        "([^:/?#]+):" +
    ")?" +
    "(?:" +
        "(//)" +
        "(" +
            "(?:" +
                "(" +
                    "([^:@]*)" +
                    ":?" +
                    "([^:@]*)" +
                ")?" +
                "@" +
            ")?" +
            "([^:/?#]*)" +
            "(?::(\\d*))?" +
        ")" +
    ")?" +
    "([^?#]*)" +
    "(?:\\?([^#]*))?" +
    "(?:#(.*))?"
);
var URI_KEYS =
[
    "url",
    "scheme",
    "authorityRoot",
    "authority",
        "userInfo",
            "user",
            "password",
        "domain",
        "portNumber",
    "path",
    "queryString",
    "fragment"
];
function CFURLGetParts( aURL)
{
    if (aURL._parts)
        return aURL._parts;
    var URLString = aURL.string(),
        isMHTMLURL = URLString.match(/^mhtml:/);
    if (isMHTMLURL)
        URLString = URLString.substr("mhtml:".length);
    if (CFURLCachingEnableCount > 0 && hasOwnProperty.call(CFURLPartsForURLStrings, URLString))
    {
        aURL._parts = CFURLPartsForURLStrings[URLString];
        return aURL._parts;
    }
    aURL._parts = { };
    var parts = aURL._parts,
        results = URL_RE.exec(URLString),
        index = results.length;
    while (index--)
        parts[URI_KEYS[index]] = results[index] || NULL;
    parts.portNumber = parseInt(parts.portNumber, 10);
    if (isNaN(parts.portNumber))
        parts.portNumber = -1;
    parts.pathComponents = [];
    if (parts.path)
    {
        var split = parts.path.split("/"),
            pathComponents = parts.pathComponents,
            index = 0,
            count = split.length;
        for (; index < count; ++index)
        {
            var component = split[index];
            if (component)
                pathComponents.push(component);
            else if (index === 0)
                pathComponents.push("/");
        }
        parts.pathComponents = pathComponents;
    }
    if (isMHTMLURL)
    {
        parts.url = "mhtml:" + parts.url;
        parts.scheme = "mhtml:" + parts.scheme;
    }
    if (CFURLCachingEnableCount > 0)
        CFURLPartsForURLStrings[URLString] = parts;
    return parts;
}
CFURL = function( aURL, aBaseURL)
{
    aURL = aURL || "";
    if (aURL instanceof CFURL)
    {
        if (!aBaseURL)
            return aURL;
        var existingBaseURL = aURL.baseURL();
        if (existingBaseURL)
            aBaseURL = new CFURL(existingBaseURL.absoluteURL(), aBaseURL);
        aURL = aURL.string();
    }
    if (CFURLCachingEnableCount > 0)
    {
        var cacheUID = aURL + " " + (aBaseURL && aBaseURL.UID() || "");
        if (hasOwnProperty.call(CFURLsForCachedUIDs, cacheUID))
            return CFURLsForCachedUIDs[cacheUID];
        CFURLsForCachedUIDs[cacheUID] = this;
    }
    if (aURL.match(/^data:/))
    {
        var parts = { },
            index = URI_KEYS.length;
        while (index--)
            parts[URI_KEYS[index]] = "";
        parts.url = aURL;
        parts.scheme = "data";
        parts.pathComponents = [];
        this._parts = parts;
        this._standardizedURL = this;
        this._absoluteURL = this;
    }
    this._UID = objj_generateObjectUID();
    this._string = aURL;
    this._baseURL = aBaseURL;
}
CFURL.displayName = "CFURL";
CFURL.prototype.UID = function()
{
    return this._UID;
}
CFURL.prototype.UID.displayName = "CFURL.prototype.UID";
var URLMap = { };
CFURL.prototype.mappedURL = function()
{
    return URLMap[this.absoluteString()] || this;
}
CFURL.prototype.mappedURL.displayName = "CFURL.prototype.mappedURL";
CFURL.setMappedURLForURL = function( fromURL, toURL)
{
    URLMap[fromURL.absoluteString()] = toURL;
}
CFURL.setMappedURLForURL.displayName = "CFURL.setMappedURLForURL";
CFURL.prototype.schemeAndAuthority = function()
{
    var string = "",
        scheme = this.scheme();
    if (scheme)
        string += scheme + ":";
    var authority = this.authority();
    if (authority)
        string += "//" + authority;
    return string;
}
CFURL.prototype.schemeAndAuthority.displayName = "CFURL.prototype.schemeAndAuthority";
CFURL.prototype.absoluteString = function()
{
    if (this._absoluteString === undefined)
        this._absoluteString = this.absoluteURL().string();
    return this._absoluteString;
}
CFURL.prototype.absoluteString.displayName = "CFURL.prototype.absoluteString";
CFURL.prototype.toString = function()
{
    return this.absoluteString();
}
CFURL.prototype.toString.displayName = "CFURL.prototype.toString";
function resolveURL(aURL)
{
    aURL = aURL.standardizedURL();
    var baseURL = aURL.baseURL();
    if (!baseURL)
        return aURL;
    var parts = ((aURL)._parts || CFURLGetParts(aURL)),
        resolvedParts,
        absoluteBaseURL = baseURL.absoluteURL(),
        baseParts = ((absoluteBaseURL)._parts || CFURLGetParts(absoluteBaseURL));
    if (parts.scheme || parts.authority)
        resolvedParts = parts;
    else
    {
        resolvedParts = { };
        resolvedParts.scheme = baseParts.scheme;
        resolvedParts.authority = baseParts.authority;
        resolvedParts.userInfo = baseParts.userInfo;
        resolvedParts.user = baseParts.user;
        resolvedParts.password = baseParts.password;
        resolvedParts.domain = baseParts.domain;
        resolvedParts.portNumber = baseParts.portNumber;
        resolvedParts.queryString = parts.queryString;
        resolvedParts.fragment = parts.fragment;
        var pathComponents = parts.pathComponents
        if (pathComponents.length && pathComponents[0] === "/")
        {
            resolvedParts.path = parts.path;
            resolvedParts.pathComponents = pathComponents;
        }
        else
        {
            var basePathComponents = baseParts.pathComponents,
                resolvedPathComponents = basePathComponents.concat(pathComponents);
            if (!baseURL.hasDirectoryPath() && basePathComponents.length)
                resolvedPathComponents.splice(basePathComponents.length - 1, 1);
            if (pathComponents.length && (pathComponents[0] === ".." || pathComponents[0] === "."))
                standardizePathComponents(resolvedPathComponents, YES);
            resolvedParts.pathComponents = resolvedPathComponents;
            resolvedParts.path = pathFromPathComponents(resolvedPathComponents, pathComponents.length <= 0 || aURL.hasDirectoryPath());
        }
    }
    var resolvedString = URLStringFromParts(resolvedParts),
        resolvedURL = new CFURL(resolvedString);
    resolvedURL._parts = resolvedParts;
    resolvedURL._standardizedURL = resolvedURL;
    resolvedURL._standardizedString = resolvedString;
    resolvedURL._absoluteURL = resolvedURL;
    resolvedURL._absoluteString = resolvedString;
    return resolvedURL;
}
function pathFromPathComponents( pathComponents, isDirectoryPath)
{
    var path = pathComponents.join("/");
    if (path.length && path.charAt(0) === "/")
        path = path.substr(1);
    if (isDirectoryPath)
        path += "/";
    return path;
}
function standardizePathComponents( pathComponents, inPlace)
{
    var index = 0,
        resultIndex = 0,
        count = pathComponents.length,
        result = inPlace ? pathComponents : [],
        startsWithPeriod = NO;
    for (; index < count; ++index)
    {
        var component = pathComponents[index];
        if (component === "")
             continue;
        if (component === ".")
        {
            startsWithPeriod = resultIndex === 0;
            continue;
        }
        if (component !== ".." || resultIndex === 0 || result[resultIndex - 1] === "..")
        {
            result[resultIndex] = component;
            resultIndex++;
            continue;
        }
        if (resultIndex > 0 && result[resultIndex - 1] !== "/")
            --resultIndex;
    }
    if (startsWithPeriod && resultIndex === 0)
        result[resultIndex++] = ".";
    result.length = resultIndex;
    return result;
}
function URLStringFromParts( parts)
{
    var string = "",
        scheme = parts.scheme;
    if (scheme)
        string += scheme + ":";
    var authority = parts.authority;
    if (authority)
        string += "//" + authority;
    string += parts.path;
    var queryString = parts.queryString;
    if (queryString)
        string += "?" + queryString;
    var fragment = parts.fragment;
    if (fragment)
        string += "#" + fragment;
    return string;
}
CFURL.prototype.absoluteURL = function()
{
    if (this._absoluteURL === undefined)
        this._absoluteURL = resolveURL(this);
    return this._absoluteURL;
}
CFURL.prototype.absoluteURL.displayName = "CFURL.prototype.absoluteURL";
CFURL.prototype.standardizedURL = function()
{
    if (this._standardizedURL === undefined)
    {
        var parts = ((this)._parts || CFURLGetParts(this)),
            pathComponents = parts.pathComponents,
            standardizedPathComponents = standardizePathComponents(pathComponents, NO);
        var standardizedPath = pathFromPathComponents(standardizedPathComponents, this.hasDirectoryPath());
        if (parts.path === standardizedPath)
            this._standardizedURL = this;
        else
        {
            var standardizedParts = CFURLPartsCreateCopy(parts);
            standardizedParts.pathComponents = standardizedPathComponents;
            standardizedParts.path = standardizedPath;
            var standardizedURL = new CFURL(URLStringFromParts(standardizedParts), this.baseURL());
            standardizedURL._parts = standardizedParts;
            standardizedURL._standardizedURL = standardizedURL;
            this._standardizedURL = standardizedURL;
        }
    }
    return this._standardizedURL;
}
CFURL.prototype.standardizedURL.displayName = "CFURL.prototype.standardizedURL";
function CFURLPartsCreateCopy(parts)
{
    var copiedParts = { },
        count = URI_KEYS.length;
    while (count--)
    {
        var partName = URI_KEYS[count];
        copiedParts[partName] = parts[partName];
    }
    return copiedParts;
}
CFURL.prototype.string = function()
{
    return this._string;
}
CFURL.prototype.string.displayName = "CFURL.prototype.string";
CFURL.prototype.authority = function()
{
    var authority = ((this)._parts || CFURLGetParts(this)).authority;
    if (authority)
        return authority;
    var baseURL = this.baseURL();
    return baseURL && baseURL.authority() || "";
}
CFURL.prototype.authority.displayName = "CFURL.prototype.authority";
CFURL.prototype.hasDirectoryPath = function()
{
    var hasDirectoryPath = this._hasDirectoryPath;
    if (hasDirectoryPath === undefined)
    {
        var path = this.path();
        if (!path)
            return NO;
        if (path.charAt(path.length - 1) === "/")
            return YES;
        var lastPathComponent = this.lastPathComponent();
        hasDirectoryPath = lastPathComponent === "." || lastPathComponent === "..";
        this._hasDirectoryPath = hasDirectoryPath;
    }
    return hasDirectoryPath;
}
CFURL.prototype.hasDirectoryPath.displayName = "CFURL.prototype.hasDirectoryPath";
CFURL.prototype.hostName = function()
{
    return this.authority();
}
CFURL.prototype.hostName.displayName = "CFURL.prototype.hostName";
CFURL.prototype.fragment = function()
{
    return ((this)._parts || CFURLGetParts(this)).fragment;
}
CFURL.prototype.fragment.displayName = "CFURL.prototype.fragment";
CFURL.prototype.lastPathComponent = function()
{
    if (this._lastPathComponent === undefined)
    {
        var pathComponents = this.pathComponents(),
            pathComponentCount = pathComponents.length;
        if (!pathComponentCount)
            this._lastPathComponent = "";
        else
            this._lastPathComponent = pathComponents[pathComponentCount - 1];
    }
    return this._lastPathComponent;
}
CFURL.prototype.lastPathComponent.displayName = "CFURL.prototype.lastPathComponent";
CFURL.prototype.path = function()
{
    return ((this)._parts || CFURLGetParts(this)).path;
}
CFURL.prototype.path.displayName = "CFURL.prototype.path";
CFURL.prototype.pathComponents = function()
{
    return ((this)._parts || CFURLGetParts(this)).pathComponents;
}
CFURL.prototype.pathComponents.displayName = "CFURL.prototype.pathComponents";
CFURL.prototype.pathExtension = function()
{
    var lastPathComponent = this.lastPathComponent();
    if (!lastPathComponent)
        return NULL;
    lastPathComponent = lastPathComponent.replace(/^\.*/, '');
    var index = lastPathComponent.lastIndexOf(".");
    return index <= 0 ? "" : lastPathComponent.substring(index + 1);
}
CFURL.prototype.pathExtension.displayName = "CFURL.prototype.pathExtension";
CFURL.prototype.queryString = function()
{
    return ((this)._parts || CFURLGetParts(this)).queryString;
}
CFURL.prototype.queryString.displayName = "CFURL.prototype.queryString";
CFURL.prototype.scheme = function()
{
    var scheme = this._scheme;
    if (scheme === undefined)
    {
        scheme = ((this)._parts || CFURLGetParts(this)).scheme;
        if (!scheme)
        {
            var baseURL = this.baseURL();
            scheme = baseURL && baseURL.scheme();
        }
        this._scheme = scheme;
    }
    return scheme;
}
CFURL.prototype.scheme.displayName = "CFURL.prototype.scheme";
CFURL.prototype.user = function()
{
    return ((this)._parts || CFURLGetParts(this)).user;
}
CFURL.prototype.user.displayName = "CFURL.prototype.user";
CFURL.prototype.password = function()
{
    return ((this)._parts || CFURLGetParts(this)).password;
}
CFURL.prototype.password.displayName = "CFURL.prototype.password";
CFURL.prototype.portNumber = function()
{
    return ((this)._parts || CFURLGetParts(this)).portNumber;
}
CFURL.prototype.portNumber.displayName = "CFURL.prototype.portNumber";
CFURL.prototype.domain = function()
{
    return ((this)._parts || CFURLGetParts(this)).domain;
}
CFURL.prototype.domain.displayName = "CFURL.prototype.domain";
CFURL.prototype.baseURL = function()
{
    return this._baseURL;
}
CFURL.prototype.baseURL.displayName = "CFURL.prototype.baseURL";
CFURL.prototype.asDirectoryPathURL = function()
{
    if (this.hasDirectoryPath())
        return this;
    var lastPathComponent = this.lastPathComponent();
    if (lastPathComponent !== "/")
        lastPathComponent = "./" + lastPathComponent;
    return new CFURL(lastPathComponent + "/", this);
}
CFURL.prototype.asDirectoryPathURL.displayName = "CFURL.prototype.asDirectoryPathURL";
function CFURLGetResourcePropertiesForKeys( aURL)
{
    if (!aURL._resourcePropertiesForKeys)
        aURL._resourcePropertiesForKeys = new CFMutableDictionary();
    return aURL._resourcePropertiesForKeys;
}
CFURL.prototype.resourcePropertyForKey = function( aKey)
{
    return CFURLGetResourcePropertiesForKeys(this).valueForKey(aKey);
}
CFURL.prototype.resourcePropertyForKey.displayName = "CFURL.prototype.resourcePropertyForKey";
CFURL.prototype.setResourcePropertyForKey = function( aKey, aValue)
{
    CFURLGetResourcePropertiesForKeys(this).setValueForKey(aKey, aValue);
}
CFURL.prototype.setResourcePropertyForKey.displayName = "CFURL.prototype.setResourcePropertyForKey";
CFURL.prototype.staticResourceData = function()
{
    var data = new CFMutableData();
    data.setRawString(StaticResource.resourceAtURL(this).contents());
    return data;
}
CFURL.prototype.staticResourceData.displayName = "CFURL.prototype.staticResourceData";
function MarkedStream( aString)
{
    this._string = aString;
    var index = aString.indexOf(";");
    this._magicNumber = aString.substr(0, index);
    this._location = aString.indexOf(";", ++index);
    this._version = aString.substring(index, this._location++);
}
MarkedStream.prototype.magicNumber = function()
{
    return this._magicNumber;
}
MarkedStream.prototype.magicNumber.displayName = "MarkedStream.prototype.magicNumber";
MarkedStream.prototype.version = function()
{
    return this._version;
}
MarkedStream.prototype.version.displayName = "MarkedStream.prototype.version";
MarkedStream.prototype.getMarker = function()
{
    var string = this._string,
        location = this._location;
    if (location >= string.length)
        return null;
    var next = string.indexOf(';', location);
    if (next < 0)
        return null;
    var marker = string.substring(location, next);
    if (marker === 'e')
        return null;
    this._location = next + 1;
    return marker;
}
MarkedStream.prototype.getMarker.displayName = "MarkedStream.prototype.getMarker";
MarkedStream.prototype.getString = function()
{
    var string = this._string,
        location = this._location;
    if (location >= string.length)
        return null;
    var next = string.indexOf(';', location);
    if (next < 0)
        return null;
    var size = parseInt(string.substring(location, next), 10),
        text = string.substr(next + 1, size);
    this._location = next + 1 + size;
    return text;
}
MarkedStream.prototype.getString.displayName = "MarkedStream.prototype.getString";
var CFBundleUnloaded = 0,
    CFBundleLoading = 1 << 0,
    CFBundleLoadingInfoPlist = 1 << 1,
    CFBundleLoadingExecutable = 1 << 2,
    CFBundleLoadingSpritedImages = 1 << 3,
    CFBundleLoaded = 1 << 4;
var CFBundlesForURLStrings = { },
    CFBundlesForClasses = { },
    CFCacheBuster = new Date().getTime(),
    CFTotalBytesLoaded = 0,
    CPApplicationSizeInBytes = 0;
CFBundle = function( aURL)
{
    aURL = makeAbsoluteURL(aURL).asDirectoryPathURL();
    var URLString = aURL.absoluteString(),
        existingBundle = CFBundlesForURLStrings[URLString];
    if (existingBundle)
        return existingBundle;
    CFBundlesForURLStrings[URLString] = this;
    this._bundleURL = aURL;
    this._resourcesDirectoryURL = new CFURL("Resources/", aURL);
    this._staticResource = NULL;
    this._isValid = NO;
    this._loadStatus = CFBundleUnloaded;
    this._loadRequests = [];
    this._infoDictionary = new CFDictionary();
    this._eventDispatcher = new EventDispatcher(this);
}
CFBundle.displayName = "CFBundle";
CFBundle.environments = function()
{
    return ["Browser","ObjJ"];
}
CFBundle.environments.displayName = "CFBundle.environments";
CFBundle.bundleContainingURL = function( aURL)
{
    aURL = new CFURL(".", makeAbsoluteURL(aURL));
    var previousURLString,
        URLString = aURL.absoluteString();
    while (!previousURLString || previousURLString !== URLString)
    {
        var bundle = CFBundlesForURLStrings[URLString];
        if (bundle && bundle._isValid)
            return bundle;
        aURL = new CFURL("..", aURL);
        previousURLString = URLString;
        URLString = aURL.absoluteString();
    }
    return NULL;
}
CFBundle.bundleContainingURL.displayName = "CFBundle.bundleContainingURL";
CFBundle.mainBundle = function()
{
    return new CFBundle(mainBundleURL);
}
CFBundle.mainBundle.displayName = "CFBundle.mainBundle";
function addClassToBundle(aClass, aBundle)
{
    if (aBundle)
        CFBundlesForClasses[aClass.name] = aBundle;
}
CFBundle.bundleForClass = function( aClass)
{
    return CFBundlesForClasses[aClass.name] || CFBundle.mainBundle();
}
CFBundle.bundleForClass.displayName = "CFBundle.bundleForClass";
CFBundle.prototype.bundleURL = function()
{
    return this._bundleURL;
}
CFBundle.prototype.bundleURL.displayName = "CFBundle.prototype.bundleURL";
CFBundle.prototype.resourcesDirectoryURL = function()
{
    return this._resourcesDirectoryURL;
}
CFBundle.prototype.resourcesDirectoryURL.displayName = "CFBundle.prototype.resourcesDirectoryURL";
CFBundle.prototype.resourceURL = function( aResourceName, aType, aSubDirectory)
 {
    if (aType)
        aResourceName = aResourceName + "." + aType;
    if (aSubDirectory)
        aResourceName = aSubDirectory + "/" + aResourceName;
    var resourceURL = (new CFURL(aResourceName, this.resourcesDirectoryURL())).mappedURL();
    return resourceURL.absoluteURL();
}
CFBundle.prototype.resourceURL.displayName = "CFBundle.prototype.resourceURL";
CFBundle.prototype.mostEligibleEnvironmentURL = function()
{
    if (this._mostEligibleEnvironmentURL === undefined)
        this._mostEligibleEnvironmentURL = new CFURL(this.mostEligibleEnvironment() + ".environment/", this.bundleURL());
    return this._mostEligibleEnvironmentURL;
}
CFBundle.prototype.mostEligibleEnvironmentURL.displayName = "CFBundle.prototype.mostEligibleEnvironmentURL";
CFBundle.prototype.executableURL = function()
{
    if (this._executableURL === undefined)
    {
        var executableSubPath = this.valueForInfoDictionaryKey("CPBundleExecutable");
        if (!executableSubPath)
            this._executableURL = NULL;
        else
            this._executableURL = new CFURL(executableSubPath, this.mostEligibleEnvironmentURL());
    }
    return this._executableURL;
}
CFBundle.prototype.executableURL.displayName = "CFBundle.prototype.executableURL";
CFBundle.prototype.infoDictionary = function()
{
    return this._infoDictionary;
}
CFBundle.prototype.infoDictionary.displayName = "CFBundle.prototype.infoDictionary";
CFBundle.prototype.valueForInfoDictionaryKey = function( aKey)
{
    return this._infoDictionary.valueForKey(aKey);
}
CFBundle.prototype.valueForInfoDictionaryKey.displayName = "CFBundle.prototype.valueForInfoDictionaryKey";
CFBundle.prototype.hasSpritedImages = function()
{
    var environments = this._infoDictionary.valueForKey("CPBundleEnvironmentsWithImageSprites") || [],
        index = environments.length,
        mostEligibleEnvironment = this.mostEligibleEnvironment();
    while (index--)
        if (environments[index] === mostEligibleEnvironment)
            return YES;
    return NO;
}
CFBundle.prototype.hasSpritedImages.displayName = "CFBundle.prototype.hasSpritedImages";
CFBundle.prototype.environments = function()
{
    return this._infoDictionary.valueForKey("CPBundleEnvironments") || ["ObjJ"];
}
CFBundle.prototype.environments.displayName = "CFBundle.prototype.environments";
CFBundle.prototype.mostEligibleEnvironment = function( environments)
{
    environments = environments || this.environments();
    var objj_environments = CFBundle.environments(),
        index = 0,
        count = objj_environments.length,
        innerCount = environments.length;
    for(; index < count; ++index)
    {
        var innerIndex = 0,
            environment = objj_environments[index];
        for (; innerIndex < innerCount; ++innerIndex)
            if(environment === environments[innerIndex])
                return environment;
    }
    return NULL;
}
CFBundle.prototype.mostEligibleEnvironment.displayName = "CFBundle.prototype.mostEligibleEnvironment";
CFBundle.prototype.isLoading = function()
{
    return this._loadStatus & CFBundleLoading;
}
CFBundle.prototype.isLoading.displayName = "CFBundle.prototype.isLoading";
CFBundle.prototype.isLoaded = function()
{
    return this._loadStatus & CFBundleLoaded;
}
CFBundle.prototype.isLoaded.displayName = "CFBundle.prototype.isLoaded";
CFBundle.prototype.load = function( shouldExecute)
{
    if (this._loadStatus !== CFBundleUnloaded)
        return;
    this._loadStatus = CFBundleLoading | CFBundleLoadingInfoPlist;
    var self = this,
        bundleURL = this.bundleURL(),
        parentURL = new CFURL("..", bundleURL);
    if (parentURL.absoluteString() === bundleURL.absoluteString())
        parentURL = parentURL.schemeAndAuthority();
    StaticResource.resolveResourceAtURL(parentURL, YES, function(aStaticResource)
    {
        var resourceName = bundleURL.absoluteURL().lastPathComponent();
        self._staticResource = aStaticResource._children[resourceName] ||
                                new StaticResource(bundleURL, aStaticResource, YES, NO);
        function onsuccess( anEvent)
        {
            self._loadStatus &= ~CFBundleLoadingInfoPlist;
            var infoDictionary = anEvent.request.responsePropertyList();
            self._isValid = !!infoDictionary || CFBundle.mainBundle() === self;
            if (infoDictionary)
                self._infoDictionary = infoDictionary;
            if (!self._infoDictionary)
            {
                finishBundleLoadingWithError(self, new Error("Could not load bundle at \"" + path + "\""));
                return;
            }
            if (self === CFBundle.mainBundle() && self.valueForInfoDictionaryKey("CPApplicationSize"))
                CPApplicationSizeInBytes = self.valueForInfoDictionaryKey("CPApplicationSize").valueForKey("executable") || 0;
            loadExecutableAndResources(self, shouldExecute);
        }
        function onfailure()
        {
            self._isValid = CFBundle.mainBundle() === self;
            self._loadStatus = CFBundleUnloaded;
            finishBundleLoadingWithError(self, new Error("Could not load bundle at \"" + self.bundleURL() + "\""));
        }
        new FileRequest(new CFURL("Info.plist", self.bundleURL()), onsuccess, onfailure);
    });
}
CFBundle.prototype.load.displayName = "CFBundle.prototype.load";
function finishBundleLoadingWithError( aBundle, anError)
{
    resolveStaticResource(aBundle._staticResource);
    aBundle._eventDispatcher.dispatchEvent(
    {
        type:"error",
        error:anError,
        bundle:aBundle
    });
}
function loadExecutableAndResources( aBundle, shouldExecute)
{
    if (!aBundle.mostEligibleEnvironment())
        return failure();
    loadExecutableForBundle(aBundle, success, failure);
    loadSpritedImagesForBundle(aBundle, success, failure);
    if (aBundle._loadStatus === CFBundleLoading)
        return success();
    function failure( anError)
    {
        var loadRequests = aBundle._loadRequests,
            count = loadRequests.length;
        while (count--)
            loadRequests[count].abort();
        this._loadRequests = [];
        aBundle._loadStatus = CFBundleUnloaded;
        finishBundleLoadingWithError(aBundle, anError || new Error("Could not recognize executable code format in Bundle " + aBundle));
    }
    function success()
    {
        if ((typeof CPApp === "undefined" || !CPApp || !CPApp._finishedLaunching) &&
             typeof OBJJ_PROGRESS_CALLBACK === "function" && CPApplicationSizeInBytes)
        {
            OBJJ_PROGRESS_CALLBACK(MAX(MIN(1.0, CFTotalBytesLoaded / CPApplicationSizeInBytes), 0.0), CPApplicationSizeInBytes, aBundle.bundlePath())
        }
        if (aBundle._loadStatus === CFBundleLoading)
            aBundle._loadStatus = CFBundleLoaded;
        else
            return;
        resolveStaticResource(aBundle._staticResource);
        function complete()
        {
            aBundle._eventDispatcher.dispatchEvent(
            {
                type:"load",
                bundle:aBundle
            });
        }
        if (shouldExecute)
            executeBundle(aBundle, complete);
        else
            complete();
    }
}
function loadExecutableForBundle( aBundle, success, failure)
{
    var executableURL = aBundle.executableURL();
    if (!executableURL)
        return;
    aBundle._loadStatus |= CFBundleLoadingExecutable;
    new FileRequest(executableURL, function( anEvent)
    {
        try
        {
            CFTotalBytesLoaded += anEvent.request.responseText().length;
            decompileStaticFile(aBundle, anEvent.request.responseText(), executableURL);
            aBundle._loadStatus &= ~CFBundleLoadingExecutable;
            success();
        }
        catch(anException)
        {
            failure(anException);
        }
    }, failure);
}
function spritedImagesTestURLStringForBundle( aBundle)
{
    return "mhtml:" + new CFURL("MHTMLTest.txt", aBundle.mostEligibleEnvironmentURL());
}
function spritedImagesURLForBundle( aBundle)
{
    if (CFBundleSupportedSpriteType === CFBundleDataURLSpriteType)
        return new CFURL("dataURLs.txt", aBundle.mostEligibleEnvironmentURL());
    if (CFBundleSupportedSpriteType === CFBundleMHTMLSpriteType ||
        CFBundleSupportedSpriteType === CFBundleMHTMLUncachedSpriteType)
        return new CFURL("MHTMLPaths.txt", aBundle.mostEligibleEnvironmentURL());
    return NULL;
}
function loadSpritedImagesForBundle( aBundle, success, failure)
{
    if (!aBundle.hasSpritedImages())
        return;
    aBundle._loadStatus |= CFBundleLoadingSpritedImages;
    if (!CFBundleHasTestedSpriteSupport())
        return CFBundleTestSpriteSupport(spritedImagesTestURLStringForBundle(aBundle), function()
        {
            loadSpritedImagesForBundle(aBundle, success, failure);
        });
    var spritedImagesURL = spritedImagesURLForBundle(aBundle);
    if (!spritedImagesURL)
    {
        aBundle._loadStatus &= ~CFBundleLoadingSpritedImages;
        return success();
    }
    new FileRequest(spritedImagesURL, function( anEvent)
    {
        try
        {
            CFTotalBytesLoaded += anEvent.request.responseText().length;
            decompileStaticFile(aBundle, anEvent.request.responseText(), spritedImagesURL);
            aBundle._loadStatus &= ~CFBundleLoadingSpritedImages;
        }
        catch(anException)
        {
            failure(anException);
        }
        success();
    }, failure);
}
var CFBundleSpriteSupportListeners = [],
    CFBundleSupportedSpriteType = -1,
    CFBundleNoSpriteType = 0,
    CFBundleDataURLSpriteType = 1,
    CFBundleMHTMLSpriteType = 2,
    CFBundleMHTMLUncachedSpriteType = 3;
function CFBundleHasTestedSpriteSupport()
{
    return CFBundleSupportedSpriteType !== -1;
}
function CFBundleTestSpriteSupport( MHTMLPath, aCallback)
{
    if (CFBundleHasTestedSpriteSupport())
        return;
    CFBundleSpriteSupportListeners.push(aCallback);
    if (CFBundleSpriteSupportListeners.length > 1)
        return;
    CFBundleSpriteSupportListeners.push(function()
    {
        var size = 0,
            sizeDictionary = CFBundle.mainBundle().valueForInfoDictionaryKey("CPApplicationSize");
        if (!sizeDictionary)
            return;
        switch (CFBundleSupportedSpriteType)
        {
            case CFBundleDataURLSpriteType:
                size = sizeDictionary.valueForKey("data");
                break;
            case CFBundleMHTMLSpriteType:
            case CFBundleMHTMLUncachedSpriteType:
                size = sizeDictionary.valueForKey("mhtml");
                break;
        }
        CPApplicationSizeInBytes += size;
    })
    CFBundleTestSpriteTypes([
        CFBundleDataURLSpriteType,
        "data:image/gif;base64,R0lGODlhAQABAIAAAMc9BQAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
        CFBundleMHTMLSpriteType,
        MHTMLPath+"!test",
        CFBundleMHTMLUncachedSpriteType,
        MHTMLPath+"?"+CFCacheBuster+"!test"
    ]);
}
function CFBundleNotifySpriteSupportListeners()
{
    var count = CFBundleSpriteSupportListeners.length;
    while (count--)
        CFBundleSpriteSupportListeners[count]();
}
function CFBundleTestSpriteTypes( spriteTypes)
{
    if (!("Image" in global) || spriteTypes.length < 2)
    {
        CFBundleSupportedSpriteType = CFBundleNoSpriteType;
        CFBundleNotifySpriteSupportListeners();
        return;
    }
    var image = new Image();
    image.onload = function()
    {
        if (image.width === 1 && image.height === 1)
        {
            CFBundleSupportedSpriteType = spriteTypes[0];
            CFBundleNotifySpriteSupportListeners();
        }
        else
            image.onerror();
    }
    image.onerror = function()
    {
        CFBundleTestSpriteTypes(spriteTypes.slice(2));
    }
    image.src = spriteTypes[1];
}
function executeBundle( aBundle, aCallback)
{
    var staticResources = [aBundle._staticResource];
    function executeStaticResources(index)
    {
        for (; index < staticResources.length; ++index)
        {
            var staticResource = staticResources[index];
            if (staticResource.isNotFound())
                continue;
            if (staticResource.isFile())
            {
                var executable = new FileExecutable(staticResource.URL());
                if (executable.hasLoadedFileDependencies())
                    executable.execute();
                else
                {
                    executable.loadFileDependencies(function()
                    {
                        executeStaticResources(index);
                    });
                    return;
                }
            }
            else
            {
                if (staticResource.URL().absoluteString() === aBundle.resourcesDirectoryURL().absoluteString())
                    continue;
                var children = staticResource.children();
                for (var name in children)
                    if (hasOwnProperty.call(children, name))
                        staticResources.push(children[name]);
            }
        }
        aCallback();
    }
    executeStaticResources(0);
}
var STATIC_MAGIC_NUMBER = "@STATIC",
    MARKER_PATH = "p",
    MARKER_URI = "u",
    MARKER_CODE = "c",
    MARKER_TEXT = "t",
    MARKER_IMPORT_STD = 'I',
    MARKER_IMPORT_LOCAL = 'i';
function decompileStaticFile( aBundle, aString, aPath)
{
    var stream = new MarkedStream(aString);
    if (stream.magicNumber() !== STATIC_MAGIC_NUMBER)
        throw new Error("Could not read static file: " + aPath);
    if (stream.version() !== "1.0")
        throw new Error("Could not read static file: " + aPath);
    var marker,
        bundleURL = aBundle.bundleURL(),
        file = NULL;
    while (marker = stream.getMarker())
    {
        var text = stream.getString();
        if (marker === MARKER_PATH)
        {
            var fileURL = new CFURL(text, bundleURL),
                parent = StaticResource.resourceAtURL(new CFURL(".", fileURL), YES);
            file = new StaticResource(fileURL, parent, NO, YES);
        }
        else if (marker === MARKER_URI)
        {
            var URL = new CFURL(text, bundleURL),
                mappedURLString = stream.getString();
            if (mappedURLString.indexOf("mhtml:") === 0)
            {
                mappedURLString = "mhtml:" + new CFURL(mappedURLString.substr("mhtml:".length), bundleURL);
                if (CFBundleSupportedSpriteType === CFBundleMHTMLUncachedSpriteType)
                {
                    var exclamationIndex = mappedURLString.indexOf("!"),
                        firstPart = mappedURLString.substring(0, exclamationIndex),
                        lastPart = mappedURLString.substring(exclamationIndex);
                    mappedURLString = firstPart + "?" + CFCacheBuster + lastPart;
                }
            }
            CFURL.setMappedURLForURL(URL, new CFURL(mappedURLString));
            var parent = StaticResource.resourceAtURL(new CFURL(".", URL), YES);
            new StaticResource(URL, parent, NO, YES);
        }
        else if (marker === MARKER_TEXT)
            file.write(text);
    }
}
CFBundle.prototype.addEventListener = function( anEventName, anEventListener)
{
    this._eventDispatcher.addEventListener(anEventName, anEventListener);
}
CFBundle.prototype.addEventListener.displayName = "CFBundle.prototype.addEventListener";
CFBundle.prototype.removeEventListener = function( anEventName, anEventListener)
{
    this._eventDispatcher.removeEventListener(anEventName, anEventListener);
}
CFBundle.prototype.removeEventListener.displayName = "CFBundle.prototype.removeEventListener";
CFBundle.prototype.onerror = function( anEvent)
{
    throw anEvent.error;
}
CFBundle.prototype.onerror.displayName = "CFBundle.prototype.onerror";
CFBundle.prototype.bundlePath = function()
{
    return this._bundleURL.absoluteURL().path();
}
CFBundle.prototype.path = function()
{
    CPLog.warn("CFBundle.prototype.path is deprecated, use CFBundle.prototype.bundlePath instead.");
    return this.bundlePath.apply(this, arguments);
}
CFBundle.prototype.pathForResource = function(aResource)
{
    return this.resourceURL(aResource).absoluteString();
}
var rootResources = { };
function StaticResource( aURL, aParent, isDirectory, isResolved)
{
    this._parent = aParent;
    this._eventDispatcher = new EventDispatcher(this);
    var name = aURL.absoluteURL().lastPathComponent() || aURL.schemeAndAuthority();
    this._name = name;
    this._URL = aURL;
    this._isResolved = !!isResolved;
    if (isDirectory)
        this._URL = this._URL.asDirectoryPathURL();
    if (!aParent)
        rootResources[name] = this;
    this._isDirectory = !!isDirectory;
    this._isNotFound = NO;
    if (aParent)
        aParent._children[name] = this;
    if (isDirectory)
        this._children = { };
    else
        this._contents = "";
}
StaticResource.rootResources = function()
{
    return rootResources;
}
exports.StaticResource = StaticResource;
function resolveStaticResource( aResource)
{
    aResource._isResolved = YES;
    aResource._eventDispatcher.dispatchEvent(
    {
        type:"resolve",
        staticResource:aResource
    });
}
StaticResource.prototype.resolve = function()
{
    if (this.isDirectory())
    {
        var bundle = new CFBundle(this.URL());
        bundle.onerror = function() { };
        bundle.load(NO);
    }
    else
    {
        var self = this;
        function onsuccess( anEvent)
        {
            self._contents = anEvent.request.responseText();
            resolveStaticResource(self);
        }
        function onfailure()
        {
            self._isNotFound = YES;
            resolveStaticResource(self);
        }
        new FileRequest(this.URL(), onsuccess, onfailure);
    }
}
StaticResource.prototype.name = function()
{
    return this._name;
}
StaticResource.prototype.URL = function()
{
    return this._URL;
}
StaticResource.prototype.contents = function()
{
    return this._contents;
}
StaticResource.prototype.children = function()
{
    return this._children;
}
StaticResource.prototype.parent = function()
{
    return this._parent;
}
StaticResource.prototype.isResolved = function()
{
    return this._isResolved;
}
StaticResource.prototype.write = function( aString)
{
    this._contents += aString;
}
function rootResourceForAbsoluteURL( anAbsoluteURL)
{
    var schemeAndAuthority = anAbsoluteURL.schemeAndAuthority(),
        resource = rootResources[schemeAndAuthority];
    if (!resource)
        resource = new StaticResource(new CFURL(schemeAndAuthority), NULL, YES, YES);
    return resource;
}
StaticResource.resourceAtURL = function( aURL, resolveAsDirectoriesIfNecessary)
{
    aURL = makeAbsoluteURL(aURL).absoluteURL();
    var resource = rootResourceForAbsoluteURL(aURL),
        components = aURL.pathComponents(),
        index = 0,
        count = components.length;
    for (; index < count; ++index)
    {
        var name = components[index];
        if (hasOwnProperty.call(resource._children, name))
            resource = resource._children[name];
        else if (resolveAsDirectoriesIfNecessary)
        {
            if (name !== "/")
                name = "./" + name;
            resource = new StaticResource(new CFURL(name, resource.URL()), resource, YES, YES);
        }
        else
            throw new Error("Static Resource at " + aURL + " is not resolved (\"" + name + "\")");
    }
    return resource;
}
StaticResource.prototype.resourceAtURL = function( aURL, resolveAsDirectoriesIfNecessary)
{
    return StaticResource.resourceAtURL(new CFURL(aURL, this.URL()), resolveAsDirectoriesIfNecessary);
}
StaticResource.resolveResourceAtURL = function( aURL, isDirectory, aCallback)
{
    aURL = makeAbsoluteURL(aURL).absoluteURL();
    resolveResourceComponents(rootResourceForAbsoluteURL(aURL), isDirectory, aURL.pathComponents(), 0, aCallback);
}
StaticResource.prototype.resolveResourceAtURL = function( aURL, isDirectory, aCallback)
{
    StaticResource.resolveResourceAtURL(new CFURL(aURL, this.URL()).absoluteURL(), isDirectory, aCallback);
}
function resolveResourceComponents( aResource, isDirectory, components, index, aCallback)
{
    var count = components.length;
    for (; index < count; ++index)
    {
        var name = components[index],
            child = hasOwnProperty.call(aResource._children, name) && aResource._children[name];
        if (!child)
        {
            child = new StaticResource(new CFURL(name, aResource.URL()), aResource, index + 1 < count || isDirectory , NO);
            child.resolve();
        }
        if (!child.isResolved())
            return child.addEventListener("resolve", function()
            {
                resolveResourceComponents(aResource, isDirectory, components, index, aCallback);
            });
        if (child.isNotFound())
            return aCallback(null, new Error("File not found: " + components.join("/")));
        if ((index + 1 < count) && child.isFile())
            return aCallback(null, new Error("File is not a directory: " + components.join("/")));
        aResource = child;
    }
    aCallback(aResource);
}
function resolveResourceAtURLSearchingIncludeURLs( aURL, anIndex, aCallback)
{
    var includeURLs = StaticResource.includeURLs(),
        searchURL = new CFURL(aURL, includeURLs[anIndex]).absoluteURL();
    StaticResource.resolveResourceAtURL(searchURL, NO, function( aStaticResource)
    {
        if (!aStaticResource)
        {
            if (anIndex + 1 < includeURLs.length)
                resolveResourceAtURLSearchingIncludeURLs(aURL, anIndex + 1, aCallback);
            else
                aCallback(NULL);
            return;
        }
        aCallback(aStaticResource);
    });
}
StaticResource.resolveResourceAtURLSearchingIncludeURLs = function( aURL, aCallback)
{
    resolveResourceAtURLSearchingIncludeURLs(aURL, 0, aCallback);
}
StaticResource.prototype.addEventListener = function( anEventName, anEventListener)
{
    this._eventDispatcher.addEventListener(anEventName, anEventListener);
}
StaticResource.prototype.removeEventListener = function( anEventName, anEventListener)
{
    this._eventDispatcher.removeEventListener(anEventName, anEventListener);
}
StaticResource.prototype.isNotFound = function()
{
    return this._isNotFound;
}
StaticResource.prototype.isFile = function()
{
    return !this._isDirectory;
}
StaticResource.prototype.isDirectory = function()
{
    return this._isDirectory;
}
StaticResource.prototype.toString = function( includeNotFounds)
{
    if (this.isNotFound())
        return "<file not found: " + this.name() + ">";
    var string = this.name();
    if (this.isDirectory())
    {
        var children = this._children;
        for (var name in children)
            if (children.hasOwnProperty(name))
            {
                var child = children[name];
                if (includeNotFounds || !child.isNotFound())
                    string += "\n\t" + children[name].toString(includeNotFounds).split('\n').join("\n\t");
            }
    }
    return string;
}
var includeURLs = NULL;
StaticResource.includeURLs = function()
{
    if (includeURLs)
        return includeURLs;
    var includeURLs = [];
    if (!global.OBJJ_INCLUDE_PATHS && !global.OBJJ_INCLUDE_URLS)
        includeURLs = ["Frameworks", "Frameworks/Debug"];
    else
        includeURLs = (global.OBJJ_INCLUDE_PATHS || []).concat(global.OBJJ_INCLUDE_URLS || []);
    var count = includeURLs.length;
    while (count--)
        includeURLs[count] = new CFURL(includeURLs[count]).asDirectoryPathURL();
    return includeURLs;
}
var TOKEN_ACCESSORS = "accessors",
    TOKEN_CLASS = "class",
    TOKEN_END = "end",
    TOKEN_FUNCTION = "function",
    TOKEN_IMPLEMENTATION = "implementation",
    TOKEN_IMPORT = "import",
    TOKEN_EACH = "each",
    TOKEN_OUTLET = "outlet",
    TOKEN_ACTION = "action",
    TOKEN_NEW = "new",
    TOKEN_SELECTOR = "selector",
    TOKEN_SUPER = "super",
    TOKEN_VAR = "var",
    TOKEN_IN = "in",
    TOKEN_PRAGMA = "pragma",
    TOKEN_MARK = "mark",
    TOKEN_EQUAL = '=',
    TOKEN_PLUS = '+',
    TOKEN_MINUS = '-',
    TOKEN_COLON = ':',
    TOKEN_COMMA = ',',
    TOKEN_PERIOD = '.',
    TOKEN_ASTERISK = '*',
    TOKEN_SEMICOLON = ';',
    TOKEN_LESS_THAN = '<',
    TOKEN_OPEN_BRACE = '{',
    TOKEN_CLOSE_BRACE = '}',
    TOKEN_GREATER_THAN = '>',
    TOKEN_OPEN_BRACKET = '[',
    TOKEN_DOUBLE_QUOTE = '"',
    TOKEN_PREPROCESSOR = '@',
    TOKEN_HASH = '#',
    TOKEN_CLOSE_BRACKET = ']',
    TOKEN_QUESTION_MARK = '?',
    TOKEN_OPEN_PARENTHESIS = '(',
    TOKEN_CLOSE_PARENTHESIS = ')',
    TOKEN_WHITESPACE = /^(?:(?:\s+$)|(?:\/(?:\/|\*)))/,
    TOKEN_NUMBER = /^[+-]?\d+(([.]\d+)*([eE][+-]?\d+))?$/,
    TOKEN_IDENTIFIER = /^[a-zA-Z_$](\w|$)*$/;
function Lexer( aString)
{
    this._index = -1;
    this._tokens = (aString + '\n').match(/\/\/.*(\r|\n)?|\/\*(?:.|\n|\r)*?\*\/|\w+\b|[+-]?\d+(([.]\d+)*([eE][+-]?\d+))?|"[^"\\]*(\\[\s\S][^"\\]*)*"|'[^'\\]*(\\[\s\S][^'\\]*)*'|\s+|./g);
    this._context = [];
    return this;
}
Lexer.prototype.push = function()
{
    this._context.push(this._index);
}
Lexer.prototype.pop = function()
{
    this._index = this._context.pop();
}
Lexer.prototype.peek = function(shouldSkipWhitespace)
{
    if (shouldSkipWhitespace)
    {
        this.push();
        var token = this.skip_whitespace();
        this.pop();
        return token;
    }
    return this._tokens[this._index + 1];
}
Lexer.prototype.next = function()
{
    return this._tokens[++this._index];
}
Lexer.prototype.previous = function()
{
    return this._tokens[--this._index];
}
Lexer.prototype.last = function()
{
    if (this._index < 0)
        return NULL;
    return this._tokens[this._index - 1];
}
Lexer.prototype.skip_whitespace = function(shouldMoveBackwards)
{
    var token;
    if (shouldMoveBackwards)
        while ((token = this.previous()) && TOKEN_WHITESPACE.test(token)) ;
    else
        while ((token = this.next()) && TOKEN_WHITESPACE.test(token)) ;
    return token;
}
exports.Lexer = Lexer;
function StringBuffer()
{
    this.atoms = [];
}
StringBuffer.prototype.toString = function()
{
    return this.atoms.join("");
}
exports.preprocess = function( aString, aURL, flags)
{
    return new Preprocessor(aString, aURL, flags).executable();
}
exports.eval = function( aString)
{
    return eval(exports.preprocess(aString).code());
}
var Preprocessor = function( aString, aURL, flags)
{
    this._URL = new CFURL(aURL);
    aString = aString.replace(/^#[^\n]+\n/, "\n");
    this._currentSelector = "";
    this._currentClass = "";
    this._currentSuperClass = "";
    this._currentSuperMetaClass = "";
    this._buffer = new StringBuffer();
    this._preprocessed = NULL;
    this._dependencies = [];
    this._tokens = new Lexer(aString);
    this._flags = flags;
    this._classMethod = false;
    this._executable = NULL;
    this._classLookupTable = {};
    this._classVars = {};
    var classObject = new objj_class();
    for (var i in classObject)
        this._classVars[i] = 1;
    this.preprocess(this._tokens, this._buffer);
}
Preprocessor.prototype.setClassInfo = function(className, superClassName, ivars)
{
    this._classLookupTable[className] = { superClassName:superClassName, ivars:ivars };
}
Preprocessor.prototype.getClassInfo = function(className)
{
    return this._classLookupTable[className];
}
Preprocessor.prototype.allIvarNamesForClassName = function(className)
{
    var names = {},
        classInfo = this.getClassInfo(className);
    while (classInfo)
    {
        for (var i in classInfo.ivars)
            names[i] = 1;
        classInfo = this.getClassInfo(classInfo.superClassName);
    }
    return names;
}
exports.Preprocessor = Preprocessor;
Preprocessor.Flags = { };
Preprocessor.Flags.IncludeDebugSymbols = 1 << 0;
Preprocessor.Flags.IncludeTypeSignatures = 1 << 1;
Preprocessor.prototype.executable = function()
{
    if (!this._executable)
        this._executable = new Executable(this._buffer.toString(), this._dependencies, this._URL);
    return this._executable;
}
Preprocessor.prototype.accessors = function(tokens)
{
    var token = tokens.skip_whitespace(),
        attributes = {};
    if (token != TOKEN_OPEN_PARENTHESIS)
    {
        tokens.previous();
        return attributes;
    }
    while ((token = tokens.skip_whitespace()) != TOKEN_CLOSE_PARENTHESIS)
    {
        var name = token,
            value = true;
        if (!/^\w+$/.test(name))
            throw new SyntaxError(this.error_message("*** @accessors attribute name not valid."));
        if ((token = tokens.skip_whitespace()) == TOKEN_EQUAL)
        {
            value = tokens.skip_whitespace();
            if (!/^\w+$/.test(value))
                throw new SyntaxError(this.error_message("*** @accessors attribute value not valid."));
            if (name == "setter")
            {
                if ((token = tokens.next()) != TOKEN_COLON)
                    throw new SyntaxError(this.error_message("*** @accessors setter attribute requires argument with \":\" at end of selector name."));
                value += ":";
            }
            token = tokens.skip_whitespace();
        }
        attributes[name] = value;
        if (token == TOKEN_CLOSE_PARENTHESIS)
            break;
        if (token != TOKEN_COMMA)
            throw new SyntaxError(this.error_message("*** Expected ',' or ')' in @accessors attribute list."));
    }
    return attributes;
}
Preprocessor.prototype.brackets = function( tokens, aStringBuffer)
{
    var tuples = [];
    while (this.preprocess(tokens, NULL, NULL, NULL, tuples[tuples.length] = [])) ;
    if (tuples[0].length === 1)
    {
        aStringBuffer.atoms[aStringBuffer.atoms.length] = '[';
        aStringBuffer.atoms[aStringBuffer.atoms.length] = tuples[0][0];
        aStringBuffer.atoms[aStringBuffer.atoms.length] = ']';
    }
    else
    {
        var selector = new StringBuffer();
        if (tuples[0][0].atoms[0] == TOKEN_SUPER)
        {
            aStringBuffer.atoms[aStringBuffer.atoms.length] = "objj_msgSendSuper(";
            aStringBuffer.atoms[aStringBuffer.atoms.length] = "{ receiver:self, super_class:" + (this._classMethod ? this._currentSuperMetaClass : this._currentSuperClass ) + " }";
        }
        else
        {
            aStringBuffer.atoms[aStringBuffer.atoms.length] = "objj_msgSend(";
            aStringBuffer.atoms[aStringBuffer.atoms.length] = tuples[0][0];
        }
        selector.atoms[selector.atoms.length] = tuples[0][1];
        var index = 1,
            count = tuples.length,
            marg_list = new StringBuffer();
        for(; index < count; ++index)
        {
            var pair = tuples[index];
            selector.atoms[selector.atoms.length] = pair[1];
            marg_list.atoms[marg_list.atoms.length] = ", " + pair[0];
        }
        aStringBuffer.atoms[aStringBuffer.atoms.length] = ", \"";
        aStringBuffer.atoms[aStringBuffer.atoms.length] = selector;
        aStringBuffer.atoms[aStringBuffer.atoms.length] = '\"';
        aStringBuffer.atoms[aStringBuffer.atoms.length] = marg_list;
        aStringBuffer.atoms[aStringBuffer.atoms.length] = ')';
    }
}
Preprocessor.prototype.directive = function(tokens, aStringBuffer, allowedDirectivesFlags)
{
    var buffer = aStringBuffer ? aStringBuffer : new StringBuffer(),
        token = tokens.next();
    if (token.charAt(0) == TOKEN_DOUBLE_QUOTE)
        buffer.atoms[buffer.atoms.length] = token;
    else if (token === TOKEN_CLASS)
    {
        tokens.skip_whitespace();
        return;
    }
    else if (token === TOKEN_IMPLEMENTATION)
        this.implementation(tokens, buffer);
    else if (token === TOKEN_IMPORT)
        this._import(tokens);
    else if (token === TOKEN_SELECTOR)
        this.selector(tokens, buffer);
    if (!aStringBuffer)
        return buffer;
}
Preprocessor.prototype.hash = function(tokens, aStringBuffer)
{
    var buffer = aStringBuffer ? aStringBuffer : new StringBuffer(),
        token = tokens.next();
    if (token === TOKEN_PRAGMA)
    {
        token = tokens.skip_whitespace();
        if (token === TOKEN_MARK)
        {
            while ((token = tokens.next()).indexOf("\n") < 0);
        }
    }
    else
        throw new SyntaxError(this.error_message("*** Expected \"pragma\" to follow # but instead saw \"" + token + "\"."));
}
Preprocessor.prototype.implementation = function(tokens, aStringBuffer)
{
    var buffer = aStringBuffer,
        token = "",
        category = NO,
        class_name = tokens.skip_whitespace(),
        superclass_name = "Nil",
        instance_methods = new StringBuffer(),
        class_methods = new StringBuffer();
    if (!(/^\w/).test(class_name))
        throw new Error(this.error_message("*** Expected class name, found \"" + class_name + "\"."));
    this._currentSuperClass = "objj_getClass(\"" + class_name + "\").super_class";
    this._currentSuperMetaClass = "objj_getMetaClass(\"" + class_name + "\").super_class";
    this._currentClass = class_name;
    this._currentSelector = "";
    if ((token = tokens.skip_whitespace()) == TOKEN_OPEN_PARENTHESIS)
    {
        token = tokens.skip_whitespace();
        if (token == TOKEN_CLOSE_PARENTHESIS)
            throw new SyntaxError(this.error_message("*** Can't Have Empty Category Name for class \"" + class_name + "\"."));
        if (tokens.skip_whitespace() != TOKEN_CLOSE_PARENTHESIS)
            throw new SyntaxError(this.error_message("*** Improper Category Definition for class \"" + class_name + "\"."));
        buffer.atoms[buffer.atoms.length] = "{\nvar the_class = objj_getClass(\"" + class_name + "\")\n";
        buffer.atoms[buffer.atoms.length] = "if(!the_class) throw new SyntaxError(\"*** Could not find definition for class \\\"" + class_name + "\\\"\");\n";
        buffer.atoms[buffer.atoms.length] = "var meta_class = the_class.isa;";
    }
    else
    {
        if(token == TOKEN_COLON)
        {
            token = tokens.skip_whitespace();
            if (!TOKEN_IDENTIFIER.test(token))
                throw new SyntaxError(this.error_message("*** Expected class name, found \"" + token + "\"."));
            superclass_name = token;
            token = tokens.skip_whitespace();
        }
        buffer.atoms[buffer.atoms.length] = "{var the_class = objj_allocateClassPair(" + superclass_name + ", \"" + class_name + "\"),\nmeta_class = the_class.isa;";
        if (token == TOKEN_OPEN_BRACE)
        {
            var ivar_names = {},
                ivar_count = 0,
                declaration = [],
                attributes,
                accessors = {},
                types = [];
            while((token = tokens.skip_whitespace()) && token != TOKEN_CLOSE_BRACE)
            {
                if (token === TOKEN_PREPROCESSOR)
                {
                    token = tokens.next();
                    if (token === TOKEN_ACCESSORS)
                        attributes = this.accessors(tokens);
                    else if (token !== TOKEN_OUTLET)
                        throw new SyntaxError(this.error_message("*** Unexpected '@' token in ivar declaration ('@"+token+"')."));
                    else
                        types.push("@" + token);
                }
                else if (token == TOKEN_SEMICOLON)
                {
                    if (ivar_count++ === 0)
                        buffer.atoms[buffer.atoms.length] = "class_addIvars(the_class, [";
                    else
                        buffer.atoms[buffer.atoms.length] = ", ";
                    var name = declaration[declaration.length - 1];
                    if (this._flags & Preprocessor.Flags.IncludeTypeSignatures)
                        buffer.atoms[buffer.atoms.length] = "new objj_ivar(\"" + name + "\", \"" + types.slice(0, types.length - 1). join(" ") + "\")";
                    else
                        buffer.atoms[buffer.atoms.length] = "new objj_ivar(\"" + name + "\")";
                    ivar_names[name] = 1;
                    declaration = [];
                    types = [];
                    if (attributes)
                    {
                        accessors[name] = attributes;
                        attributes = NULL;
                    }
                }
                else
                {
                    declaration.push(token);
                    types.push(token);
                }
            }
            if (declaration.length)
                throw new SyntaxError(this.error_message("*** Expected ';' in ivar declaration, found '}'."));
            if (ivar_count)
                buffer.atoms[buffer.atoms.length] = "]);\n";
            if (!token)
                throw new SyntaxError(this.error_message("*** Expected '}'"));
            this.setClassInfo(class_name, superclass_name === "Nil" ? null : superclass_name, ivar_names);
            var ivar_names = this.allIvarNamesForClassName(class_name);
            for (ivar_name in accessors)
            {
                var accessor = accessors[ivar_name],
                    property = accessor["property"] || ivar_name;
                var getterName = accessor["getter"] || property,
                    getterCode = "(id)" + getterName + "\n{\nreturn " + ivar_name + ";\n}";
                if (instance_methods.atoms.length !== 0)
                    instance_methods.atoms[instance_methods.atoms.length] = ",\n";
                instance_methods.atoms[instance_methods.atoms.length] = this.method(new Lexer(getterCode), ivar_names);
                if (accessor["readonly"])
                    continue;
                var setterName = accessor["setter"];
                if (!setterName)
                {
                    var start = property.charAt(0) == '_' ? 1 : 0;
                    setterName = (start ? "_" : "") + "set" + property.substr(start, 1).toUpperCase() + property.substring(start + 1) + ":";
                }
                var setterCode = "(void)" + setterName + "(id)newValue\n{\n";
                if (accessor["copy"])
                    setterCode += "if (" + ivar_name + " !== newValue)\n" + ivar_name + " = [newValue copy];\n}";
                else
                    setterCode += ivar_name + " = newValue;\n}";
                if (instance_methods.atoms.length !== 0)
                    instance_methods.atoms[instance_methods.atoms.length] = ",\n";
                instance_methods.atoms[instance_methods.atoms.length] = this.method(new Lexer(setterCode), ivar_names);
            }
        }
        else
            tokens.previous();
        buffer.atoms[buffer.atoms.length] = "objj_registerClassPair(the_class);\n";
    }
    if (!ivar_names)
        var ivar_names = this.allIvarNamesForClassName(class_name);
    while ((token = tokens.skip_whitespace()))
    {
        if (token == TOKEN_PLUS)
        {
            this._classMethod = true;
            if (class_methods.atoms.length !== 0)
                class_methods.atoms[class_methods.atoms.length] = ", ";
            class_methods.atoms[class_methods.atoms.length] = this.method(tokens, this._classVars);
        }
        else if (token == TOKEN_MINUS)
        {
            this._classMethod = false;
            if (instance_methods.atoms.length !== 0)
                instance_methods.atoms[instance_methods.atoms.length] = ", ";
            instance_methods.atoms[instance_methods.atoms.length] = this.method(tokens, ivar_names);
        }
        else if (token == TOKEN_HASH)
        {
            this.hash(tokens, buffer);
        }
        else if (token == TOKEN_PREPROCESSOR)
        {
            if ((token = tokens.next()) == TOKEN_END)
                break;
            else
                throw new SyntaxError(this.error_message("*** Expected \"@end\", found \"@" + token + "\"."));
        }
    }
    if (instance_methods.atoms.length !== 0)
    {
        buffer.atoms[buffer.atoms.length] = "class_addMethods(the_class, [";
        buffer.atoms[buffer.atoms.length] = instance_methods;
        buffer.atoms[buffer.atoms.length] = "]);\n";
    }
    if (class_methods.atoms.length !== 0)
    {
        buffer.atoms[buffer.atoms.length] = "class_addMethods(meta_class, [";
        buffer.atoms[buffer.atoms.length] = class_methods;
        buffer.atoms[buffer.atoms.length] = "]);\n";
    }
    buffer.atoms[buffer.atoms.length] = '}';
    this._currentClass = "";
}
Preprocessor.prototype._import = function(tokens)
{
    var URLString = "",
        token = tokens.skip_whitespace(),
        isQuoted = (token !== TOKEN_LESS_THAN);
    if (token === TOKEN_LESS_THAN)
    {
        while ((token = tokens.next()) && token !== TOKEN_GREATER_THAN)
            URLString += token;
        if (!token)
            throw new SyntaxError(this.error_message("*** Unterminated import statement."));
    }
    else if (token.charAt(0) === TOKEN_DOUBLE_QUOTE)
        URLString = token.substr(1, token.length - 2);
    else
        throw new SyntaxError(this.error_message("*** Expecting '<' or '\"', found \"" + token + "\"."));
    this._buffer.atoms[this._buffer.atoms.length] = "objj_executeFile(\"";
    this._buffer.atoms[this._buffer.atoms.length] = URLString;
    this._buffer.atoms[this._buffer.atoms.length] = isQuoted ? "\", YES);" : "\", NO);";
    this._dependencies.push(new FileDependency(new CFURL(URLString), isQuoted));
}
Preprocessor.prototype.method = function( tokens, ivar_names)
{
    var buffer = new StringBuffer(),
        token,
        selector = "",
        parameters = [],
        types = [null];
    ivar_names = ivar_names || {};
    while ((token = tokens.skip_whitespace()) && token !== TOKEN_OPEN_BRACE && token !== TOKEN_SEMICOLON)
    {
        if (token == TOKEN_COLON)
        {
            var type = "";
            selector += token;
            token = tokens.skip_whitespace();
            if (token == TOKEN_OPEN_PARENTHESIS)
            {
                while ((token = tokens.skip_whitespace()) && token != TOKEN_CLOSE_PARENTHESIS)
                    type += token;
                token = tokens.skip_whitespace();
            }
            types[parameters.length + 1] = type || null;
            parameters[parameters.length] = token;
            if (token in ivar_names)
                CPLog.warn(this.error_message("*** Warning: Method ( "+selector+" ) uses a parameter name that is already in use ( "+token+" )"));
        }
        else if (token == TOKEN_OPEN_PARENTHESIS)
        {
            var type = "";
            while ((token = tokens.skip_whitespace()) && token != TOKEN_CLOSE_PARENTHESIS)
                type += token;
            types[0] = type || null;
        }
        else if (token == TOKEN_COMMA)
        {
            if ((token = tokens.skip_whitespace()) != TOKEN_PERIOD || tokens.next() != TOKEN_PERIOD || tokens.next() != TOKEN_PERIOD)
                throw new SyntaxError(this.error_message("*** Argument list expected after ','."));
        }
        else
            selector += token;
    }
    if (token === TOKEN_SEMICOLON)
    {
        token = tokens.skip_whitespace();
        if (token !== TOKEN_OPEN_BRACE)
        {
            throw new SyntaxError(this.error_message("Invalid semi-colon in method declaration. "+
            "Semi-colons are allowed only to terminate the method signature, before the open brace."));
        }
    }
    var index = 0,
        count = parameters.length;
    buffer.atoms[buffer.atoms.length] = "new objj_method(sel_getUid(\"";
    buffer.atoms[buffer.atoms.length] = selector;
    buffer.atoms[buffer.atoms.length] = "\"), function";
    this._currentSelector = selector;
    if (this._flags & Preprocessor.Flags.IncludeDebugSymbols)
        buffer.atoms[buffer.atoms.length] = " $" + this._currentClass + "__" + selector.replace(/:/g, "_");
    buffer.atoms[buffer.atoms.length] = "(self, _cmd";
    for (; index < count; ++index)
    {
        buffer.atoms[buffer.atoms.length] = ", ";
        buffer.atoms[buffer.atoms.length] = parameters[index];
    }
    buffer.atoms[buffer.atoms.length] = ")\n{ with(self)\n{";
    buffer.atoms[buffer.atoms.length] = this.preprocess(tokens, NULL, TOKEN_CLOSE_BRACE, TOKEN_OPEN_BRACE);
    buffer.atoms[buffer.atoms.length] = "}\n}";
    if (this._flags & Preprocessor.Flags.IncludeDebugSymbols)
        buffer.atoms[buffer.atoms.length] = ","+JSON.stringify(types);
    buffer.atoms[buffer.atoms.length] = ")";
    this._currentSelector = "";
    return buffer;
}
Preprocessor.prototype.preprocess = function(tokens, aStringBuffer, terminator, instigator, tuple)
{
    var buffer = aStringBuffer ? aStringBuffer : new StringBuffer(),
        count = 0,
        token = "";
    if (tuple)
    {
        tuple[0] = buffer;
        var bracket = false,
            closures = [0, 0, 0];
    }
    while ((token = tokens.next()) && ((token !== terminator) || count))
    {
        if (tuple)
        {
            if (token === TOKEN_QUESTION_MARK)
                ++closures[2];
            else if (token === TOKEN_OPEN_BRACE)
                ++closures[0];
            else if (token === TOKEN_CLOSE_BRACE)
                --closures[0];
            else if (token === TOKEN_OPEN_PARENTHESIS)
                ++closures[1];
            else if (token === TOKEN_CLOSE_PARENTHESIS)
                --closures[1];
            else if ((token === TOKEN_COLON && closures[2]-- === 0 ||
                    (bracket = (token === TOKEN_CLOSE_BRACKET))) &&
                    closures[0] === 0 && closures[1] === 0)
            {
                tokens.push();
                var label = bracket ? tokens.skip_whitespace(true) : tokens.previous(),
                    isEmptyLabel = TOKEN_WHITESPACE.test(label);
                if (isEmptyLabel || TOKEN_IDENTIFIER.test(label) && TOKEN_WHITESPACE.test(tokens.previous()))
                {
                    tokens.push();
                    var last = tokens.skip_whitespace(true),
                        operatorCheck = true,
                        isDoubleOperator = false;
                    if (last === '+' || last === '-'){
                        if (tokens.previous() !== last)
                            operatorCheck = false;
                        else
                        {
                            last = tokens.skip_whitespace(true);
                            isDoubleOperator = true;
                        }}
                    tokens.pop();
                    tokens.pop();
                    if (operatorCheck && (
                        (!isDoubleOperator && (last === TOKEN_CLOSE_BRACE)) ||
                        last === TOKEN_CLOSE_PARENTHESIS || last === TOKEN_CLOSE_BRACKET ||
                        last === TOKEN_PERIOD || TOKEN_NUMBER.test(last) ||
                        last.charAt(last.length - 1) === '\"' || last.charAt(last.length - 1) === '\'' ||
                        TOKEN_IDENTIFIER.test(last) && !/^(new|return|case|var)$/.test(last)))
                    {
                        if (isEmptyLabel)
                            tuple[1] = ':';
                        else
                        {
                            tuple[1] = label;
                            if (!bracket)
                                tuple[1] += ':';
                            var count = buffer.atoms.length;
                            while (buffer.atoms[count--] !== label) ;
                            buffer.atoms.length = count;
                        }
                        return !bracket;
                    }
                    if (bracket)
                        return NO;
                }
                tokens.pop();
                if (bracket)
                    return NO;
            }
            closures[2] = MAX(closures[2], 0);
        }
        if (instigator)
        {
            if (token === instigator)
                ++count;
            else if (token === terminator)
                --count;
        }
        if (token === TOKEN_FUNCTION)
        {
            var accumulator = "";
            while ((token = tokens.next()) && token !== TOKEN_OPEN_PARENTHESIS && !(/^\w/).test(token))
                accumulator += token;
            if (token === TOKEN_OPEN_PARENTHESIS)
            {
                if (instigator === TOKEN_OPEN_PARENTHESIS)
                    ++count;
                buffer.atoms[buffer.atoms.length] = "function" + accumulator + '(';
                if (tuple)
                    ++closures[1];
            }
            else
            {
                buffer.atoms[buffer.atoms.length] = token + "= function";
            }
        }
        else if (token == TOKEN_PREPROCESSOR)
            this.directive(tokens, buffer);
        else if (token == TOKEN_HASH)
            this.hash(tokens, buffer);
        else if (token == TOKEN_OPEN_BRACKET)
            this.brackets(tokens, buffer);
        else
            buffer.atoms[buffer.atoms.length] = token;
    }
    if (tuple)
        throw new SyntaxError(this.error_message("*** Expected ']' - Unterminated message send or array."));
    if (!aStringBuffer)
        return buffer;
}
Preprocessor.prototype.selector = function(tokens, aStringBuffer)
{
    var buffer = aStringBuffer ? aStringBuffer : new StringBuffer();
    buffer.atoms[buffer.atoms.length] = "sel_getUid(\"";
    if (tokens.skip_whitespace() != TOKEN_OPEN_PARENTHESIS)
        throw new SyntaxError(this.error_message("*** Expected '('"));
    var selector = tokens.skip_whitespace();
    if (selector == TOKEN_CLOSE_PARENTHESIS)
        throw new SyntaxError(this.error_message("*** Unexpected ')', can't have empty @selector()"));
    aStringBuffer.atoms[aStringBuffer.atoms.length] = selector;
    var token,
        starting = true;
    while ((token = tokens.next()) && token != TOKEN_CLOSE_PARENTHESIS)
    {
        if (starting && /^\d+$/.test(token) || !(/^(\w|$|\:)/.test(token)))
        {
            if (!(/\S/).test(token))
                if (tokens.skip_whitespace() == TOKEN_CLOSE_PARENTHESIS)
                    break;
                else
                    throw new SyntaxError(this.error_message("*** Unexpected whitespace in @selector()."));
            else
                throw new SyntaxError(this.error_message("*** Illegal character '" + token + "' in @selector()."));
        }
        buffer.atoms[buffer.atoms.length] = token;
        starting = (token == TOKEN_COLON);
    }
    buffer.atoms[buffer.atoms.length] = "\")";
    if (!aStringBuffer)
        return buffer;
}
Preprocessor.prototype.error_message = function(errorMessage)
{
    return errorMessage + " <Context File: "+ this._URL +
                                (this._currentClass ? " Class: "+this._currentClass : "") +
                                (this._currentSelector ? " Method: "+this._currentSelector : "") +">";
}
function FileDependency( aURL, isLocal)
{
    this._URL = aURL;
    this._isLocal = isLocal;
}
exports.FileDependency = FileDependency;
FileDependency.prototype.URL = function()
{
    return this._URL;
}
FileDependency.prototype.isLocal = function()
{
    return this._isLocal;
}
FileDependency.prototype.toMarkedString = function()
{
    var URLString = this.URL().absoluteString();
    return (this.isLocal() ? MARKER_IMPORT_LOCAL : MARKER_IMPORT_STD) + ";" +
            URLString.length + ";" + URLString;
}
FileDependency.prototype.toString = function()
{
    return (this.isLocal() ? "LOCAL: " : "STD: ") + this.URL();
}
var ExecutableUnloadedFileDependencies = 0,
    ExecutableLoadingFileDependencies = 1,
    ExecutableLoadedFileDependencies = 2,
    AnonymousExecutableCount = 0;
function Executable( aCode, fileDependencies, aURL, aFunction)
{
    if (arguments.length === 0)
        return this;
    this._code = aCode;
    this._function = aFunction || NULL;
    this._URL = makeAbsoluteURL(aURL || new CFURL("(Anonymous" + (AnonymousExecutableCount++) + ")"));
    this._fileDependencies = fileDependencies;
    if (fileDependencies.length)
    {
        this._fileDependencyStatus = ExecutableUnloadedFileDependencies;
        this._fileDependencyCallbacks = [];
    }
    else
        this._fileDependencyStatus = ExecutableLoadedFileDependencies;
    if (this._function)
        return;
    this.setCode(aCode);
}
exports.Executable = Executable;
Executable.prototype.path = function()
{
    return this.URL().path();
}
Executable.prototype.URL = function()
{
    return this._URL;
}
Executable.prototype.URL.displayName = "Executable.prototype.URL";
Executable.prototype.functionParameters = function()
{
    var functionParameters = ["global", "objj_executeFile", "objj_importFile"];
    return functionParameters;
}
Executable.prototype.functionParameters.displayName = "Executable.prototype.functionParameters";
Executable.prototype.functionArguments = function()
{
    var functionArguments = [global, this.fileExecuter(), this.fileImporter()];
    return functionArguments;
}
Executable.prototype.functionArguments.displayName = "Executable.prototype.functionArguments";
Executable.prototype.execute = function()
{
    var oldContextBundle = CONTEXT_BUNDLE;
    CONTEXT_BUNDLE = CFBundle.bundleContainingURL(this.URL());
    var result = this._function.apply(global, this.functionArguments());
    CONTEXT_BUNDLE = oldContextBundle;
    return result;
}
Executable.prototype.execute.displayName = "Executable.prototype.execute";
Executable.prototype.code = function()
{
    return this._code;
}
Executable.prototype.code.displayName = "Executable.prototype.code";
Executable.prototype.setCode = function(code)
{
    this._code = code;
    var parameters = this.functionParameters().join(",");
        var absoluteString = this.URL().absoluteString();
        code += "/**/\n//@ sourceURL=" + absoluteString;
        this._function = new Function(parameters, code);
    this._function.displayName = absoluteString;
}
Executable.prototype.setCode.displayName = "Executable.prototype.setCode";
Executable.prototype.fileDependencies = function()
{
    return this._fileDependencies;
}
Executable.prototype.fileDependencies.displayName = "Executable.prototype.fileDependencies";
Executable.prototype.hasLoadedFileDependencies = function()
{
    return this._fileDependencyStatus === ExecutableLoadedFileDependencies;
}
Executable.prototype.hasLoadedFileDependencies.displayName = "Executable.prototype.hasLoadedFileDependencies";
var fileDependencyLoadCount = 0,
    fileDependencyExecutables = [],
    fileDependencyMarkers = { };
Executable.prototype.loadFileDependencies = function(aCallback)
{
    var status = this._fileDependencyStatus;
    if (aCallback)
    {
        if (status === ExecutableLoadedFileDependencies)
            return aCallback();
        this._fileDependencyCallbacks.push(aCallback);
    }
    if (status === ExecutableUnloadedFileDependencies)
    {
        if (fileDependencyLoadCount)
            throw "Can't load";
        loadFileDependenciesForExecutable(this);
    }
}
Executable.prototype.loadFileDependencies.displayName = "Executable.prototype.loadFileDependencies";
function loadFileDependenciesForExecutable( anExecutable)
{
    fileDependencyExecutables.push(anExecutable);
    anExecutable._fileDependencyStatus = ExecutableLoadingFileDependencies;
    var fileDependencies = anExecutable.fileDependencies(),
        index = 0,
        count = fileDependencies.length,
        referenceURL = anExecutable.referenceURL(),
        referenceURLString = referenceURL.absoluteString(),
        fileExecutableSearcher = anExecutable.fileExecutableSearcher();
    fileDependencyLoadCount += count;
    for (; index < count; ++index)
    {
        var fileDependency = fileDependencies[index],
            isQuoted = fileDependency.isLocal(),
            URL = fileDependency.URL(),
            marker = (isQuoted && (referenceURLString + " ") || "") + URL;
        if (fileDependencyMarkers[marker])
        {
            if (--fileDependencyLoadCount === 0)
                fileExecutableDependencyLoadFinished();
            continue;
        }
        fileDependencyMarkers[marker] = YES;
        fileExecutableSearcher(URL, isQuoted, fileExecutableSearchFinished);
    }
}
function fileExecutableSearchFinished( aFileExecutable)
{
    --fileDependencyLoadCount;
    if (aFileExecutable._fileDependencyStatus === ExecutableUnloadedFileDependencies)
        loadFileDependenciesForExecutable(aFileExecutable);
    else if (fileDependencyLoadCount === 0)
        fileExecutableDependencyLoadFinished();
}
function fileExecutableDependencyLoadFinished()
{
    var executables = fileDependencyExecutables,
        index = 0,
        count = executables.length;
    fileDependencyExecutables = [];
    for (; index < count; ++index)
        executables[index]._fileDependencyStatus = ExecutableLoadedFileDependencies;
    for (index = 0; index < count; ++index)
    {
        var executable = executables[index],
            callbacks = executable._fileDependencyCallbacks,
            callbackIndex = 0,
            callbackCount = callbacks.length;
        for (; callbackIndex < callbackCount; ++callbackIndex)
            callbacks[callbackIndex]();
        executable._fileDependencyCallbacks = [];
    }
}
Executable.prototype.referenceURL = function()
{
    if (this._referenceURL === undefined)
        this._referenceURL = new CFURL(".", this.URL());
    return this._referenceURL;
}
Executable.prototype.referenceURL.displayName = "Executable.prototype.referenceURL";
Executable.prototype.fileImporter = function()
{
    return Executable.fileImporterForURL(this.referenceURL());
}
Executable.prototype.fileImporter.displayName = "Executable.prototype.fileImporter";
Executable.prototype.fileExecuter = function()
{
    return Executable.fileExecuterForURL(this.referenceURL());
}
Executable.prototype.fileExecuter.displayName = "Executable.prototype.fileExecuter";
Executable.prototype.fileExecutableSearcher = function()
{
    return Executable.fileExecutableSearcherForURL(this.referenceURL());
}
Executable.prototype.fileExecutableSearcher.displayName = "Executable.prototype.fileExecutableSearcher";
var cachedFileExecuters = { };
Executable.fileExecuterForURL = function( aURL)
{
    var referenceURL = makeAbsoluteURL(aURL),
        referenceURLString = referenceURL.absoluteString(),
        cachedFileExecuter = cachedFileExecuters[referenceURLString];
    if (!cachedFileExecuter)
    {
        cachedFileExecuter = function( aURL, isQuoted, shouldForce)
        {
            Executable.fileExecutableSearcherForURL(referenceURL)(aURL, isQuoted,
            function( aFileExecutable)
            {
                if (!aFileExecutable.hasLoadedFileDependencies())
                    throw "No executable loaded for file at URL " + aURL;
                aFileExecutable.execute(shouldForce);
            });
        }
        cachedFileExecuters[referenceURLString] = cachedFileExecuter;
    }
    return cachedFileExecuter;
}
Executable.fileExecuterForURL.displayName = "Executable.fileExecuterForURL";
var cachedFileImporters = { };
Executable.fileImporterForURL = function( aURL)
{
    var referenceURL = makeAbsoluteURL(aURL),
        referenceURLString = referenceURL.absoluteString(),
        cachedFileImporter = cachedFileImporters[referenceURLString];
    if (!cachedFileImporter)
    {
        cachedFileImporter = function( aURL, isQuoted, aCallback)
        {
            enableCFURLCaching();
            Executable.fileExecutableSearcherForURL(referenceURL)(aURL, isQuoted,
            function( aFileExecutable)
            {
                aFileExecutable.loadFileDependencies(function()
                {
                    aFileExecutable.execute();
                    disableCFURLCaching();
                    if (aCallback)
                        aCallback();
                });
            });
        }
        cachedFileImporters[referenceURLString] = cachedFileImporter;
    }
    return cachedFileImporter;
}
Executable.fileImporterForURL.displayName = "Executable.fileImporterForURL";
var cachedFileExecutableSearchers = { },
    cachedFileExecutableSearchResults = { };
Executable.fileExecutableSearcherForURL = function( referenceURL)
{
    var referenceURLString = referenceURL.absoluteString(),
        cachedFileExecutableSearcher = cachedFileExecutableSearchers[referenceURLString],
        cachedSearchResults = { };
    if (!cachedFileExecutableSearcher)
    {
        cachedFileExecutableSearcher = function( aURL, isQuoted, success)
        {
            var cacheUID = (isQuoted && referenceURL || "") + aURL,
                cachedResult = cachedFileExecutableSearchResults[cacheUID];
            if (cachedResult)
                return completed(cachedResult);
            var isAbsoluteURL = (aURL instanceof CFURL) && aURL.scheme();
            if (isQuoted || isAbsoluteURL)
            {
                if (!isAbsoluteURL)
                    aURL = new CFURL(aURL, referenceURL);
                StaticResource.resolveResourceAtURL(aURL, NO, completed);
            }
            else
                StaticResource.resolveResourceAtURLSearchingIncludeURLs(aURL, completed);
            function completed( aStaticResource)
            {
                if (!aStaticResource)
                    throw new Error("Could not load file at " + aURL);
                cachedFileExecutableSearchResults[cacheUID] = aStaticResource;
                success(new FileExecutable(aStaticResource.URL()));
            }
        };
        cachedFileExecutableSearchers[referenceURLString] = cachedFileExecutableSearcher;
    }
    return cachedFileExecutableSearcher;
}
Executable.fileExecutableSearcherForURL.displayName = "Executable.fileExecutableSearcherForURL";
var FileExecutablesForURLStrings = { };
function FileExecutable( aURL)
{
    aURL = makeAbsoluteURL(aURL);
    var URLString = aURL.absoluteString(),
        existingFileExecutable = FileExecutablesForURLStrings[URLString];
    if (existingFileExecutable)
        return existingFileExecutable;
    FileExecutablesForURLStrings[URLString] = this;
    var fileContents = StaticResource.resourceAtURL(aURL).contents(),
        executable = NULL,
        extension = aURL.pathExtension();
    if (fileContents.match(/^@STATIC;/))
        executable = decompile(fileContents, aURL);
    else if (extension === "j" || !extension)
        executable = exports.preprocess(fileContents, aURL, Preprocessor.Flags.IncludeDebugSymbols);
    else
        executable = new Executable(fileContents, [], aURL);
    Executable.apply(this, [executable.code(), executable.fileDependencies(), aURL, executable._function]);
    this._hasExecuted = NO;
}
exports.FileExecutable = FileExecutable;
FileExecutable.prototype = new Executable();
FileExecutable.prototype.execute = function( shouldForce)
{
    if (this._hasExecuted && !shouldForce)
        return;
    this._hasExecuted = YES;
    Executable.prototype.execute.call(this);
}
FileExecutable.prototype.execute.displayName = "FileExecutable.prototype.execute";
FileExecutable.prototype.hasExecuted = function()
{
    return this._hasExecuted;
}
FileExecutable.prototype.hasExecuted.displayName = "FileExecutable.prototype.hasExecuted";
function decompile( aString, aURL)
{
    var stream = new MarkedStream(aString);
    var marker = NULL,
        code = "",
        dependencies = [];
    while (marker = stream.getMarker())
    {
        var text = stream.getString();
        if (marker === MARKER_TEXT)
            code += text;
        else if (marker === MARKER_IMPORT_STD)
            dependencies.push(new FileDependency(new CFURL(text), NO));
        else if (marker === MARKER_IMPORT_LOCAL)
            dependencies.push(new FileDependency(new CFURL(text), YES));
    }
    var fn = FileExecutable._lookupCachedFunction(aURL)
    if (fn)
        return new Executable(code, dependencies, aURL, fn);
    return new Executable(code, dependencies, aURL);
}
var FunctionCache = { };
FileExecutable._cacheFunction = function( aURL, fn)
{
    aURL = typeof aURL === "string" ? aURL : aURL.absoluteString();
    FunctionCache[aURL] = fn;
}
FileExecutable._lookupCachedFunction = function( aURL)
{
    aURL = typeof aURL === "string" ? aURL : aURL.absoluteString();
    return FunctionCache[aURL];
}
var CLS_CLASS = 0x1,
    CLS_META = 0x2,
    CLS_INITIALIZED = 0x4,
    CLS_INITIALIZING = 0x8;
objj_ivar = function( aName, aType)
{
    this.name = aName;
    this.type = aType;
}
objj_ivar.displayName = "objj_ivar";
objj_method = function( aName, anImplementation, types)
{
    this.name = aName;
    this.method_imp = anImplementation;
    this.types = types;
}
objj_method.displayName = "objj_method";
objj_class = function(displayName)
{
    this.isa = NULL;
    this.version = 0;
    this.super_class = NULL;
    this.sub_classes = [];
    this.name = NULL;
    this.info = 0;
    this.ivar_list = [];
    this.ivar_store = function() { };
    this.ivar_dtable = this.ivar_store.prototype;
    this.method_list = [];
    this.method_store = function() { };
    this.method_dtable = this.method_store.prototype;
    eval("this.allocator = function " + (displayName || "OBJJ_OBJECT").replace(/\W/g, "_") + "() { }");
    this._UID = -1;
}
objj_class.displayName = "objj_class";
objj_object = function()
{
    this.isa = NULL;
    this._UID = -1;
}
objj_object.displayName = "objj_object";
class_getName = function( aClass)
{
    if (aClass == Nil)
        return "";
    return aClass.name;
}
class_getName.displayName = "class_getName";
class_isMetaClass = function( aClass)
{
    if (!aClass)
        return NO;
    return ((aClass.info & (CLS_META)));
}
class_isMetaClass.displayName = "class_isMetaClass";
class_getSuperclass = function( aClass)
{
    if (aClass == Nil)
        return Nil;
    return aClass.super_class;
}
class_getSuperclass.displayName = "class_getSuperclass"
class_setSuperclass = function( aClass, aSuperClass)
{
    aClass.super_class = aSuperClass;
    aClass.isa.super_class = aSuperClass.isa;
}
class_setSuperclass.displayName = "class_setSuperclass";
class_addIvar = function( aClass, aName, aType)
{
    var thePrototype = aClass.allocator.prototype;
    if (typeof thePrototype[aName] != "undefined")
        return NO;
    var ivar = new objj_ivar(aName, aType);
    aClass.ivar_list.push(ivar);
    aClass.ivar_dtable[aName] = ivar;
    thePrototype[aName] = NULL;
    return YES;
}
class_addIvar.displayName = "class_addIvar";
class_addIvars = function( aClass, ivars)
{
    var index = 0,
        count = ivars.length,
        thePrototype = aClass.allocator.prototype;
    for (; index < count; ++index)
    {
        var ivar = ivars[index],
            name = ivar.name;
        if (typeof thePrototype[name] === "undefined")
        {
            aClass.ivar_list.push(ivar);
            aClass.ivar_dtable[name] = ivar;
            thePrototype[name] = NULL;
        }
    }
}
class_addIvars.displayName = "class_addIvars";
class_copyIvarList = function( aClass)
{
    return aClass.ivar_list.slice(0);
}
class_copyIvarList.displayName = "class_copyIvarList";
class_addMethod = function( aClass, aName, anImplementation, types)
{
    var method = new objj_method(aName, anImplementation, types);
    aClass.method_list.push(method);
    aClass.method_dtable[aName] = method;
    method.method_imp.displayName = (((aClass.info & (CLS_META))) ? '+' : '-') + " [" + class_getName(aClass) + ' ' + method_getName(method) + ']';
    if (!((aClass.info & (CLS_META))) && (((aClass.info & (CLS_META))) ? aClass : aClass.isa).isa === (((aClass.info & (CLS_META))) ? aClass : aClass.isa))
        class_addMethod((((aClass.info & (CLS_META))) ? aClass : aClass.isa), aName, anImplementation, types);
    return YES;
}
class_addMethod.displayName = "class_addMethod";
class_addMethods = function( aClass, methods)
{
    var index = 0,
        count = methods.length,
        method_list = aClass.method_list,
        method_dtable = aClass.method_dtable;
    for (; index < count; ++index)
    {
        var method = methods[index];
        method_list.push(method);
        method_dtable[method.name] = method;
        method.method_imp.displayName = (((aClass.info & (CLS_META))) ? '+' : '-') + " [" + class_getName(aClass) + ' ' + method_getName(method) + ']';
    }
    if (!((aClass.info & (CLS_META))) && (((aClass.info & (CLS_META))) ? aClass : aClass.isa).isa === (((aClass.info & (CLS_META))) ? aClass : aClass.isa))
        class_addMethods((((aClass.info & (CLS_META))) ? aClass : aClass.isa), methods);
}
class_addMethods.displayName = "class_addMethods";
class_getInstanceMethod = function( aClass, aSelector)
{
    if (!aClass || !aSelector)
        return NULL;
    var method = aClass.method_dtable[aSelector];
    return method ? method : NULL;
}
class_getInstanceMethod.displayName = "class_getInstanceMethod";
class_getInstanceVariable = function( aClass, aName)
{
    if (!aClass || !aName)
        return NULL;
    var variable = aClass.ivar_dtable[aName];
    return variable;
}
class_getInstanceVariable.displayName = "class_getInstanceVariable";
class_getClassMethod = function( aClass, aSelector)
{
    if (!aClass || !aSelector)
        return NULL;
    var method = (((aClass.info & (CLS_META))) ? aClass : aClass.isa).method_dtable[aSelector];
    return method ? method : NULL;
}
class_getClassMethod.displayName = "class_getClassMethod";
class_respondsToSelector = function( aClass, aSelector)
{
    return class_getClassMethod(aClass, aSelector) != NULL;
}
class_respondsToSelector.displayName = "class_respondsToSelector";
class_copyMethodList = function( aClass)
{
    return aClass.method_list.slice(0);
}
class_copyMethodList.displayName = "class_copyMethodList";
class_getVersion = function( aClass)
{
    return aClass.version;
}
class_getVersion.displayName = "class_getVersion";
class_setVersion = function( aClass, aVersion)
{
    aClass.version = parseInt(aVersion, 10);
}
class_setVersion.displayName = "class_setVersion";
class_replaceMethod = function( aClass, aSelector, aMethodImplementation)
{
    if (!aClass || !aSelector)
        return NULL;
    var method = aClass.method_dtable[aSelector],
        method_imp = NULL;
    if (method)
        method_imp = method.method_imp;
    method.method_imp = aMethodImplementation;
    return method_imp;
}
class_replaceMethod.displayName = "class_replaceMethod";
var _class_initialize = function( aClass)
{
    var meta = (((aClass.info & (CLS_META))) ? aClass : aClass.isa);
    if ((aClass.info & (CLS_META)))
        aClass = objj_getClass(aClass.name);
    if (aClass.super_class && !((((aClass.super_class.info & (CLS_META))) ? aClass.super_class : aClass.super_class.isa).info & (CLS_INITIALIZED)))
        _class_initialize(aClass.super_class);
    if (!(meta.info & (CLS_INITIALIZED)) && !(meta.info & (CLS_INITIALIZING)))
    {
        meta.info = (meta.info | (CLS_INITIALIZING)) & ~(0);
        objj_msgSend(aClass, "initialize");
        meta.info = (meta.info | (CLS_INITIALIZED)) & ~(CLS_INITIALIZING);
    }
}
var _objj_forward = function(self, _cmd)
{
    var isa = self.isa,
        implementation = isa.method_dtable[SEL_forwardingTargetForSelector_];
    if (implementation)
    {
        var target = implementation.method_imp.call(this, self, SEL_forwardingTargetForSelector_, _cmd);
        if (target && target !== self)
        {
            arguments[0] = target;
            return objj_msgSend.apply(this, arguments);
        }
    }
    implementation = isa.method_dtable[SEL_methodSignatureForSelector_];
    if (implementation)
    {
        var forwardInvocationImplementation = isa.method_dtable[SEL_forwardInvocation_];
        if (forwardInvocationImplementation)
        {
            var signature = implementation.method_imp.call(this, self, SEL_methodSignatureForSelector_, _cmd);
            if (signature)
            {
                var invocationClass = objj_lookUpClass("CPInvocation");
                if (invocationClass)
                {
                    var invocation = objj_msgSend(invocationClass, SEL_invocationWithMethodSignature_, signature),
                        index = 0,
                        count = arguments.length;
                    for (; index < count; ++index)
                        objj_msgSend(invocation, SEL_setArgument_atIndex_, arguments[index], index);
                    forwardInvocationImplementation.method_imp.call(this, self, SEL_forwardInvocation_, invocation);
                    return objj_msgSend(invocation, SEL_returnValue);
                }
            }
        }
    }
    implementation = isa.method_dtable[SEL_doesNotRecognizeSelector_];
    if (implementation)
        return implementation.method_imp.call(this, self, SEL_doesNotRecognizeSelector_, _cmd);
    throw class_getName(isa) + " does not implement doesNotRecognizeSelector:. Did you forget a superclass for " + class_getName(isa) + "?";
};
class_getMethodImplementation = function( aClass, aSelector)
{
    if (!((((aClass.info & (CLS_META))) ? aClass : aClass.isa).info & (CLS_INITIALIZED))) _class_initialize(aClass); var method = aClass.method_dtable[aSelector]; var implementation = method ? method.method_imp : _objj_forward;;
    return implementation;
}
class_getMethodImplementation.displayName = "class_getMethodImplementation";
var REGISTERED_CLASSES = { };
objj_allocateClassPair = function( superclass, aName)
{
    var classObject = new objj_class(aName),
        metaClassObject = new objj_class(aName),
        rootClassObject = classObject;
    if (superclass)
    {
        rootClassObject = superclass;
        while (rootClassObject.superclass)
            rootClassObject = rootClassObject.superclass;
        classObject.allocator.prototype = new superclass.allocator;
        classObject.ivar_dtable = classObject.ivar_store.prototype = new superclass.ivar_store;
        classObject.method_dtable = classObject.method_store.prototype = new superclass.method_store;
        metaClassObject.method_dtable = metaClassObject.method_store.prototype = new superclass.isa.method_store;
        classObject.super_class = superclass;
        metaClassObject.super_class = superclass.isa;
    }
    else
        classObject.allocator.prototype = new objj_object();
    classObject.isa = metaClassObject;
    classObject.name = aName;
    classObject.info = CLS_CLASS;
    classObject._UID = objj_generateObjectUID();
    metaClassObject.isa = rootClassObject.isa;
    metaClassObject.name = aName;
    metaClassObject.info = CLS_META;
    metaClassObject._UID = objj_generateObjectUID();
    return classObject;
}
objj_allocateClassPair.displayName = "objj_allocateClassPair";
var CONTEXT_BUNDLE = nil;
objj_registerClassPair = function( aClass)
{
    global[aClass.name] = aClass;
    REGISTERED_CLASSES[aClass.name] = aClass;
    addClassToBundle(aClass, CONTEXT_BUNDLE);
}
objj_registerClassPair.displayName = "objj_registerClassPair";
class_createInstance = function( aClass)
{
    if (!aClass)
        throw new Error("*** Attempting to create object with Nil class.");
    var object = new aClass.allocator();
    object.isa = aClass;
    object._UID = objj_generateObjectUID();
    return object;
}
class_createInstance.displayName = "class_createInstance";
var prototype_bug = function() { }
prototype_bug.prototype.member = false;
with (new prototype_bug())
    member = true;
if (new prototype_bug().member)
{
var fast_class_createInstance = class_createInstance;
class_createInstance = function( aClass)
{
    var object = fast_class_createInstance(aClass);
    if (object)
    {
        var theClass = object.isa,
            actualClass = theClass;
        while (theClass)
        {
            var ivars = theClass.ivar_list,
                count = ivars.length;
            while (count--)
                object[ivars[count].name] = NULL;
            theClass = theClass.super_class;
        }
        object.isa = actualClass;
    }
    return object;
}
}
object_getClassName = function( anObject)
{
    if (!anObject)
        return "";
    var theClass = anObject.isa;
    return theClass ? class_getName(theClass) : "";
}
object_getClassName.displayName = "object_getClassName";
objj_lookUpClass = function( aName)
{
    var theClass = REGISTERED_CLASSES[aName];
    return theClass ? theClass : Nil;
}
objj_lookUpClass.displayName = "objj_lookUpClass";
objj_getClass = function( aName)
{
    var theClass = REGISTERED_CLASSES[aName];
    if (!theClass)
    {
    }
    return theClass ? theClass : Nil;
}
objj_getClass.displayName = "objj_getClass";
objj_getMetaClass = function( aName)
{
    var theClass = objj_getClass(aName);
    return (((theClass.info & (CLS_META))) ? theClass : theClass.isa);
}
objj_getMetaClass.displayName = "objj_getMetaClass";
ivar_getName = function(anIvar)
{
    return anIvar.name;
}
ivar_getName.displayName = "ivar_getName";
ivar_getTypeEncoding = function(anIvar)
{
    return anIvar.type;
}
ivar_getTypeEncoding.displayName = "ivar_getTypeEncoding";
objj_msgSend = function( aReceiver, aSelector)
{
    if (aReceiver == nil)
        return nil;
    var isa = aReceiver.isa;
    if (!((((isa.info & (CLS_META))) ? isa : isa.isa).info & (CLS_INITIALIZED))) _class_initialize(isa); var method = isa.method_dtable[aSelector]; var implementation = method ? method.method_imp : _objj_forward;;
    switch(arguments.length)
    {
        case 2: return implementation(aReceiver, aSelector);
        case 3: return implementation(aReceiver, aSelector, arguments[2]);
        case 4: return implementation(aReceiver, aSelector, arguments[2], arguments[3]);
    }
    return implementation.apply(aReceiver, arguments);
}
objj_msgSend.displayName = "objj_msgSend";
objj_msgSendSuper = function( aSuper, aSelector)
{
    var super_class = aSuper.super_class;
    arguments[0] = aSuper.receiver;
    if (!((((super_class.info & (CLS_META))) ? super_class : super_class.isa).info & (CLS_INITIALIZED))) _class_initialize(super_class); var method = super_class.method_dtable[aSelector]; var implementation = method ? method.method_imp : _objj_forward;;
    return implementation.apply(aSuper.receiver, arguments);
}
objj_msgSendSuper.displayName = "objj_msgSendSuper";
method_getName = function( aMethod)
{
    return aMethod.name;
}
method_getName.displayName = "method_getName";
method_getImplementation = function( aMethod)
{
    return aMethod.method_imp;
}
method_getImplementation.displayName = "method_getImplementation";
method_setImplementation = function( aMethod, anImplementation)
{
    var oldImplementation = aMethod.method_imp;
    aMethod.method_imp = anImplementation;
    return oldImplementation;
}
method_setImplementation.displayName = "method_setImplementation";
method_exchangeImplementations = function( lhs, rhs)
{
    var lhs_imp = method_getImplementation(lhs),
        rhs_imp = method_getImplementation(rhs);
    method_setImplementation(lhs, rhs_imp);
    method_setImplementation(rhs, lhs_imp);
}
method_exchangeImplementations.displayName = "method_exchangeImplementations";
sel_getName = function(aSelector)
{
    return aSelector ? aSelector : "<null selector>";
}
sel_getName.displayName = "sel_getName";
sel_getUid = function( aName)
{
    return aName;
}
sel_getUid.displayName = "sel_getUid";
sel_isEqual = function( lhs, rhs)
{
    return lhs === rhs;
}
sel_isEqual.displayName = "sel_isEqual";
sel_registerName = function( aName)
{
    return aName;
}
sel_registerName.displayName = "sel_registerName";
objj_class.prototype.toString = objj_object.prototype.toString = function()
{
    var isa = this.isa;
    if (class_getInstanceMethod(isa, SEL_description))
        return objj_msgSend(this, SEL_description);
    if (class_isMetaClass(isa))
        return this.name;
    return "[" + isa.name + " Object](-description not implemented)";
}
var SEL_description = sel_getUid("description"),
    SEL_forwardingTargetForSelector_ = sel_getUid("forwardingTargetForSelector:"),
    SEL_methodSignatureForSelector_ = sel_getUid("methodSignatureForSelector:"),
    SEL_forwardInvocation_ = sel_getUid("forwardInvocation:"),
    SEL_doesNotRecognizeSelector_ = sel_getUid("doesNotRecognizeSelector:"),
    SEL_invocationWithMethodSignature_ = sel_getUid("invocationWithMethodSignature:"),
    SEL_setTarget_ = sel_getUid("setTarget:"),
    SEL_setSelector_ = sel_getUid("setSelector:"),
    SEL_setArgument_atIndex_ = sel_getUid("setArgument:atIndex:"),
    SEL_returnValue = sel_getUid("returnValue");
objj_eval = function( aString)
{
    var url = exports.pageURL;
    var asyncLoaderSaved = exports.asyncLoader;
    exports.asyncLoader = NO;
    var executable = exports.preprocess(aString, url, 0);
    if (!executable.hasLoadedFileDependencies())
        executable.loadFileDependencies();
    global._objj_eval_scope = {};
    global._objj_eval_scope.objj_executeFile = Executable.fileExecuterForURL(url);
    global._objj_eval_scope.objj_importFile = Executable.fileImporterForURL(url);
    var code = "with(_objj_eval_scope){" + executable._code + "\n//*/\n}";
    var result;
        result = eval(code);
    exports.asyncLoader = asyncLoaderSaved;
    return result;
}
exports.objj_eval = objj_eval;
CPLogRegister(CPLogDefault);
function objj_debug_object_format(aReceiver)
{
    return (aReceiver && aReceiver.isa) ? exports.sprintf("<%s %#08x>", (((aReceiver.info & (CLS_META))) ? aReceiver : aReceiver.isa).name, aReceiver._UID) : String(aReceiver);
}
function objj_debug_message_format(aReceiver, aSelector)
{
    return exports.sprintf("[%s %s]", objj_debug_object_format(aReceiver), aSelector);
}
var objj_msgSend_original = objj_msgSend,
    objj_msgSendSuper_original = objj_msgSendSuper;
objj_msgSend_reset = function()
{
    objj_msgSend = objj_msgSend_original;
    objj_msgSendSuper = objj_msgSendSuper_original;
}
objj_msgSend_decorate = function()
{
    var index = 0,
        count = arguments.length;
    for (; index < count; ++index)
    {
        objj_msgSend = arguments[index](objj_msgSend);
        objj_msgSendSuper = arguments[index](objj_msgSendSuper);
    }
}
objj_msgSend_set_decorators = function()
{
    objj_msgSend_reset();
    objj_msgSend_decorate.apply(NULL, arguments);
}
var objj_backtrace = [];
objj_backtrace_print = function( aStream)
{
    var index = 0,
        count = objj_backtrace.length;
    for (; index < count; ++index)
    {
        var frame = objj_backtrace[index];
        aStream(objj_debug_message_format(frame.receiver, frame.selector));
    }
}
objj_backtrace_decorator = function(msgSend)
{
    return function(aReceiverOrSuper, aSelector)
    {
        var aReceiver = aReceiverOrSuper && (aReceiverOrSuper.receiver || aReceiverOrSuper);
        objj_backtrace.push({ receiver: aReceiver, selector : aSelector });
        try
        {
            return msgSend.apply(NULL, arguments);
        }
        catch (anException)
        {
            if (objj_backtrace.length)
            {
                CPLog.warn("Exception " + anException + " in " + objj_debug_message_format(aReceiver, aSelector));
                objj_backtrace_print(CPLog.warn);
                objj_backtrace = [];
            }
            throw anException;
        }
        finally
        {
            objj_backtrace.pop();
        }
    }
}
objj_supress_exceptions_decorator = function(msgSend)
{
    return function(aReceiverOrSuper, aSelector)
    {
        var aReceiver = aReceiverOrSuper && (aReceiverOrSuper.receiver || aReceiverOrSuper);
        try
        {
            return msgSend.apply(NULL, arguments);
        }
        catch (anException)
        {
            CPLog.warn("Exception " + anException + " in " + objj_debug_message_format(aReceiver, aSelector));
        }
    }
}
var objj_typechecks_reported = {},
    objj_typecheck_prints_backtrace = NO;
objj_typecheck_decorator = function(msgSend)
{
    return function(aReceiverOrSuper, aSelector)
    {
        var aReceiver = aReceiverOrSuper && (aReceiverOrSuper.receiver || aReceiverOrSuper);
        if (!aReceiver)
            return msgSend.apply(NULL, arguments);
        var types = aReceiver.isa.method_dtable[aSelector].types;
        for (var i = 2; i < arguments.length; i++)
        {
            try
            {
                objj_debug_typecheck(types[i-1], arguments[i]);
            }
            catch (e)
            {
                var key = [(((aReceiver.info & (CLS_META))) ? aReceiver : aReceiver.isa).name, aSelector, i, e].join(";");
                if (!objj_typechecks_reported[key]) {
                    objj_typechecks_reported[key] = YES;
                    CPLog.warn("Type check failed on argument " + (i-2) + " of " + objj_debug_message_format(aReceiver, aSelector) + ": " + e);
                    if (objj_typecheck_prints_backtrace)
                        objj_backtrace_print(CPLog.warn);
                }
            }
        }
        var result = msgSend.apply(NULL, arguments);
        try
        {
            objj_debug_typecheck(types[0], result);
        }
        catch (e)
        {
            var key = [(((aReceiver.info & (CLS_META))) ? aReceiver : aReceiver.isa).name, aSelector, "ret", e].join(";");
            if (!objj_typechecks_reported[key]) {
                objj_typechecks_reported[key] = YES;
                CPLog.warn("Type check failed on return val of " + objj_debug_message_format(aReceiver, aSelector) + ": " + e);
                if (objj_typecheck_prints_backtrace)
                    objj_backtrace_print(CPLog.warn);
            }
        }
        return result;
    }
}
objj_debug_typecheck = function(expectedType, object)
{
    var objjClass;
    if (!expectedType)
    {
        return;
    }
    else if (expectedType === "id")
    {
        if (object !== undefined)
            return;
    }
    else if (expectedType === "void")
    {
        if (object === undefined)
            return;
    }
    else if (objjClass = objj_getClass(expectedType))
    {
        if (object === nil)
        {
            return;
        }
        else if (object !== undefined && object.isa)
        {
            var theClass = object.isa;
            for (; theClass; theClass = theClass.super_class)
                if (theClass === objjClass)
                    return;
        }
    }
    else
    {
        return;
    }
    var actualType;
    if (object === NULL)
        actualType = "null";
    else if (object === undefined)
        actualType = "void";
    else if (object.isa)
        actualType = (((object.info & (CLS_META))) ? object : object.isa).name;
    else
        actualType = typeof object;
    throw ("expected=" + expectedType + ", actual=" + actualType);
}
enableCFURLCaching();
var pageURL = new CFURL(window.location.href),
    DOMBaseElements = document.getElementsByTagName("base"),
    DOMBaseElementsCount = DOMBaseElements.length;
if (DOMBaseElementsCount > 0)
{
    var DOMBaseElement = DOMBaseElements[DOMBaseElementsCount - 1],
        DOMBaseElementHref = DOMBaseElement && DOMBaseElement.getAttribute("href");
    if (DOMBaseElementHref)
        pageURL = new CFURL(DOMBaseElementHref, pageURL);
}
var mainFileURL = new CFURL(window.OBJJ_MAIN_FILE || "main.j"),
    mainBundleURL = new CFURL(".", new CFURL(mainFileURL, pageURL)).absoluteURL(),
    assumedResolvedURL = new CFURL("..", mainBundleURL).absoluteURL();
if (mainBundleURL === assumedResolvedURL)
    assumedResolvedURL = new CFURL(assumedResolvedURL.schemeAndAuthority());
StaticResource.resourceAtURL(assumedResolvedURL, YES);
exports.pageURL = pageURL;
exports.bootstrap = function()
{
    resolveMainBundleURL();
}
function resolveMainBundleURL()
{
    StaticResource.resolveResourceAtURL(mainBundleURL, YES, function( aResource)
    {
        var includeURLs = StaticResource.includeURLs(),
            index = 0,
            count = includeURLs.length;
        for (; index < count; ++index)
            aResource.resourceAtURL(includeURLs[index], YES);
        Executable.fileImporterForURL(mainBundleURL)(mainFileURL.lastPathComponent(), YES, function()
        {
            disableCFURLCaching();
            afterDocumentLoad(function()
            {
                var hashString = window.location.hash.substring(1),
                    args = [];
                if (hashString.length)
                {
                    args = hashString.split("/");
                    for (var i = 0, count = args.length; i < count; i++)
                        args[i] = decodeURIComponent(args[i]);
                }
                var namedArgsArray = window.location.search.substring(1).split("&"),
                    namedArgs = new CFMutableDictionary();
                for (var i = 0, count = namedArgsArray.length; i < count; i++)
                {
                    var thisArg = namedArgsArray[i].split("=");
                    if (!thisArg[0])
                        continue;
                    if (thisArg[1] == null)
                        thisArg[1] = true;
                    namedArgs.setValueForKey(decodeURIComponent(thisArg[0]), decodeURIComponent(thisArg[1]));
                }
                main(args, namedArgs);
            });
        });
    });
}
var documentLoaded = NO;
function afterDocumentLoad( aFunction)
{
    if (documentLoaded)
        return aFunction();
    if (window.addEventListener)
        window.addEventListener("load", aFunction, NO);
    else if (window.attachEvent)
        window.attachEvent("onload", aFunction);
}
afterDocumentLoad(function()
{
    documentLoaded = YES;
});
if (typeof OBJJ_AUTO_BOOTSTRAP === "undefined" || OBJJ_AUTO_BOOTSTRAP)
    exports.bootstrap();
function makeAbsoluteURL( aURL)
{
    if (aURL instanceof CFURL && aURL.scheme())
        return aURL;
    return new CFURL(aURL, mainBundleURL);
}
objj_importFile = Executable.fileImporterForURL(mainBundleURL);
objj_executeFile = Executable.fileExecuterForURL(mainBundleURL);
objj_import = function()
{
    CPLog.warn("objj_import is deprecated, use objj_importFile instead");
    objj_importFile.apply(this, arguments);
}
})(window, ObjectiveJ);
