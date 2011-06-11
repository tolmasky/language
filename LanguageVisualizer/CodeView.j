

@import <AppKit/CPView.j>


@implementation CodeView : CPView
{
}

- (void)highlight:(CPRange)aRange
{
    var text = [self code];

    _DOMElement.innerHTML = !aRange ? text :
    text.substr(0, aRange.location) + "<span id = 'highlighted' style = \"border-radius:5px;-webkit-transition:background 0.2s ease-in;\">" +
    text.substr(aRange.location, aRange.length) + "</span>" + 
    text.substring(CPMaxRange(aRange), text.length);

    if (document.getElementById("highlighted"))
        document.getElementById("highlighted").style.background = "red";
}

- (CPString)code
{
    return _DOMElement.innerText;
}

- (void)awakeFromCib
{
    _DOMElement.style.fontFamily = "Menlo, Monospace";
    _DOMElement.style.fontSize = "20px";
    _DOMElement.style.outline = "none";
    _DOMElement.style.whiteSpace = "pre";
    _DOMElement.style.boxSizing = "border-box";
    _DOMElement.setAttribute("contenteditable", true);
    _DOMElement.innerHTML = "<span style = \"padding:10px;\"></span>";
}

- (void)mouseDown:(CPEvent)anEvent
{
    [[[anEvent window] platformWindow] _propagateCurrentDOMEvent:YES];
}

- (void)mouseUp:(CPEvent)anEvent
{
    [[[anEvent window] platformWindow] _propagateCurrentDOMEvent:YES];
}

- (void)mouseDragged:(CPEvent)anEvent
{
    [[[anEvent window] platformWindow] _propagateCurrentDOMEvent:YES];
}

- (BOOL)acceptsFirstResponder
{
    return YES;
}

- (void)keyDown:(CPEvent)anEvent
{
    [[[anEvent window] platformWindow] _propagateCurrentDOMEvent:YES];
}

- (void)keyUp:(CPEvent)anEvent
{
    [[[anEvent window] platformWindow] _propagateCurrentDOMEvent:YES];
}

@end
