/*
 * AppController.j
 * LanguageVisualizer
 *
 * Created by You on June 9, 2011.
 * Copyright 2011, Your Company All rights reserved.
 */

@import <AceKit/AceKit.j>


@implementation AppController : CPObject
{
    CPWindow                theWindow; //this "outlet" is connected automatically by the Cib
    IBOutlet AceView        codeView;
    IBOutlet CPOutlineView  outlineView;
    SyntaxNode              rootSyntaxNode;
}

- (void)applicationDidFinishLaunching:(CPNotification)aNotification
{
    // This is called when the application is done loading.
}

- (void)awakeFromCib
{
    // This is called when the cib is done loading.
    // You can implement this method on any object instantiated from a Cib.
    // It's a useful hook for setting up current UI values, and other things.

    // In this case, we want the window from Cib to become our full browser window
    [theWindow setFullPlatformWindow:YES];
}

- (IBAction)parse:(id)aSender
{
    rootSyntaxNode = [[CPTreeNode alloc] initWithSyntaxNode:Parser.Parser.parse([codeView string])];

    [outlineView reloadData];
}

@end

@implementation AppController (CPOutlineViewDataSource)

- (id)outlineView:(CPOutlineView)anOutlineView child:(CPUInteger)anIndex ofItem:(id)anItem
{
    return [[(anItem || rootSyntaxNode) childNodes] objectAtIndex:anIndex];
}

- (BOOL)outlineView:(CPOutlineView)anOutlineView isItemExpandable:(id)anItem
{
    if (!anItem)
        return YES;

    return (typeof anItem.valueOf() !== "string") && [[anItem childNodes] count];
}

- (CPUInteger)outlineView:(CPOutlineView)anOutlineView numberOfChildrenOfItem:(id)anItem
{
    return [[(anItem || rootSyntaxNode) childNodes] count];
}

- (id)outlineView:(CPOutlineView)anOutlineView objectValueForTableColumn:(CPTableColumn)aTableColumn byItem:(id)anItem
{
    var representedObject = [anItem representedObject];

    if (typeof representedObject.valueOf() === "string")
        return representedObject;

    var innerText = representedObject.innerText();

    if (innerText.length > 0)
    {
        innerText = innerText.replace(new RegExp("\n", "g"), " ");

        var actualLength = innerText.replace(new RegExp("\s", "g"), "").length;

        if (actualLength > 25)
            innerText = " (" + innerText.substr(0, 25) + "...)";

        else if (actualLength > 0)
            innerText = " (" + innerText + ")";
    }

    return representedObject.name + innerText;
}

- (void)outlineViewSelectionDidChange:(CPNotification)aNotification
{
    var item = [outlineView itemAtRow:[outlineView selectedRow]];
return;
    if (typeof item.valueOf() === "string")
        [codeView highlight:null];
    else
        [codeView highlight:[item representedObject].range];
}

@end

@implementation CPTreeNode (ParsingAdditions)

- (id)initWithSyntaxNode:(SyntaxNode)aSyntaxNode
{
    self = [self initWithRepresentedObject:aSyntaxNode];

    if (typeof aSyntaxNode.valueOf() === "string")
        return self;

    var children = aSyntaxNode.children,
        index = 0,
        count = children.length,
        mutableChildNodes = [self mutableChildNodes];

    for (; index < count; ++index)
        if (children[index].name !== "_")
            [mutableChildNodes addObject:[[[self class] alloc] initWithSyntaxNode:children[index]]];

    return self;
}

@end
