(function(global){


CPLog = function(aString)
{
	if(typeof console != "undefined")
		console.log(aString);

};

CPLog.error = function(aString)
{
	if(typeof console != "undefined")
			console.error(aString);
};

CPLog.warn = function(aString)
{
	if(typeof console != "undefined")
		console.warn(aString);
};


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


var OBJECT_COUNT = 0;
var REGISTERED_CLASSES = { };


objj_generateObjectUID = function()
{
    return OBJECT_COUNT++;
};

objj_ivar = function( aName, aType)
{
    this.name = aName;
    this.type = aType;
};


objj_method = function( aName, anImplementation, types)
{
    this.name = aName;
    this.method_imp = anImplementation;
    this.types = types;
};

/* use this to allocate class */ 
objj_class = function(displayName)
{
    this.isa = null;
    this.version = 0;
    this.super_class = null;
    this.sub_classes = [];
    this.name = null; 
    this.info = {};
    this.ivar_list = []; 
    this.ivar_store = function(){}
    this.ivar_dtable = this.ivar_store.prototype;   
    this.method_list = [];
    this.method_store = function(){}
    this.method_dtable = this.method_store.prototype;
    this.allocator = function() { };
    this._UID = -1;
     
};

objj_object = function()
{
    this.isa = null;
    this._UID = -1;
};

objj_getClass = function( aName)
{ 
    var theClass = REGISTERED_CLASSES[aName];
    return theClass ? theClass : null; 
};

/* user this to setup class */ 
objj_allocateClassPair = function(superclass, aName)
{

    var classObject = new objj_class(aName),
    rootClassObject = classObject;


    if(superclass)
    {
    	rootClassObject = superclass;
        while (rootClassObject.superclass)
            rootClassObject = rootClassObject.superclass;

        classObject.allocator.prototype = new superclass.allocator;
        classObject.ivar_dtable = classObject.ivar_store.prototype = new superclass.ivar_store;
        classObject.method_dtable = classObject.method_store.prototype = new superclass.method_store; 

        classObject.super_class = superclass; 
     
    }	
    else
    {
    	classObject.info.rootObject = true; 
    	classObject.allocator.prototype = new objj_object(); 

    }

    classObject.isa = classObject; 
    classObject.name = aName; 
    classObject._UID = objj_generateObjectUID(); 
 
    return classObject;
};


objj_registerClassPair = function(aClass)
{
    global[aClass.name] = aClass;
    REGISTERED_CLASSES[aClass.name] = aClass; 
};


class_createInstance = function( aClass)
{
    if (!aClass)
        throw new Error("*** Attempting to create object with Nil class.");
    
    var object = new aClass.allocator();
    object.isa = aClass;
    object._UID = objj_generateObjectUID();

    objj_msgSend(object, "initialize");

    return object;
};

class_addIvars = function(aClass, ivars)
{
    var count = ivars.length;
        thePrototype = aClass.allocator.prototype;
    for (var index = 0; index < count;  index++)
    {
        var ivar = ivars[index],
            name = ivar.name;
        if (typeof thePrototype[name] === "undefined")
        {
            aClass.ivar_list.push(ivar);
            aClass.ivar_dtable[name] = ivar;
            thePrototype[name] = null;
        }
    }
};


class_addMethods = function( aClass, methods)
{
    var index = 0,
        count = methods.length,
        method_list = aClass.method_list,
        method_dtable = aClass.method_dtable;
    
    
    for (var index = 0; index < count; index++)
    {
        var method = methods[index];
         
        method_list.push(method);
        method_dtable[method.name] = method;
    }
 
};


class_copyMethodList = function( aClass)
{
    return aClass.method_list.slice(0);
};

 

class_getInstanceMethod = function( aClass, aSelector)
{
    if (!aClass || !aSelector)
        return null;
    var method = aClass.method_dtable[aSelector];
    return method ? method : null;
};



objj_msgSend = function( aReceiver, aSelector)
{
    if (aReceiver == null)
        return null;
    
    var isa = aReceiver.isa;
   
    var method = isa.method_dtable[aSelector]; 
   	 
	if(!method){CPLog.error(isa.name + " does not implement selector '" + aSelector + "'"); return;}

    if(method)
    {
    	 
	    var implementation =  method.method_imp ;
	    
		switch(arguments.length)
	    {
	        case 2: return implementation(aReceiver, aSelector);
	        case 3: return implementation(aReceiver, aSelector, arguments[2]);
	        case 4: return implementation(aReceiver, aSelector, arguments[2], arguments[3]);
	    }
	    return implementation.apply(aReceiver, arguments);
	}
};


objj_msgSendSuper = function( aSuper, aSelector)
{
    var super_class = aSuper.super_class;
    arguments[0] = aSuper.receiver;
     
    var method = super_class.method_dtable[aSelector];

    if(!method){CPLog.error(super_class.name + " does not implement selector '" + aSelector + "'"); return;}
    
    if(method)
    {
    	var implementation =  method.method_imp ;
    	return implementation.apply(aSuper.receiver, arguments);
    }
};



class_getMethodImplementation = function( aClass, aSelector)
{
	var method = aClass.method_dtable[aSelector]; 

	if(method)
	{
		var implementation =  method.method_imp;
		return implementation;
	}
	else
	{
		CPLog.error(aClass.name + " does not implement selector '" + aSelector + "'")
	}

	return null; 
}

method_getName = function( aMethod)
{
    return aMethod.name;
};


sel_getUid = function( aName)
{
    return aName;
};


_$ = objj_msgSend; 
_$$ = objj_msgSendSuper; 




})(window);