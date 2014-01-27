$B = {};
$B.global = Function("return this")();
$B.util = {
    namespace: function(name, parent) {
        if (!name) {
            return $B.global;
        }
        name = String(name);
        var i, ni,
                nis = name.split("."),
                ns = parent || $B.global;
        for (i = 0; i < nis.length; i = i + 1) {
            ni = nis[i];
            ns[ni] = ns[ni] || {};
            ns = ns[nis[i]];
        }
        return ns;
    },
    loadScript: function(url, callback) {
        var node = document.createElement('script');
        node.onload = node.onreadystatechange = function() {
            var rs = node.readyState;
            if ('undefined' === typeof rs || 'loaded' === rs || 'complete' === rs) {
                try {
                    callback && callback(J);
                } finally {
                    node.onload = node.onreadystatechange = null;
                    node = null;
                }
            }
        };
        node.async = true;
        node.charset = 'utf-8';
        node.src = url;
        (document.head || document.documentElement).appendChild(node);
    },
    dh: {
        isUndefined: function(o) {
            return typeof (o) === "undefined";
        },
        isNull: function(o) {
            return o === null;
        },
        isNumber: function(o) {
            return (o === 0 || o) && o.constructor === Number;
        },
        isBoolean: function(o) {
            return (o === false || o) && (o.constructor === Boolean);
        },
        isString: function(o) {
            return (o === "" || o) && (o.constructor === String);
        },
        isObject: function(o) {
            return o && (o.constructor === Object || Object.prototype.toString.call(o) === "[object Object]");
        },
        isArray: function(o) {
            return o && (o.constructor === Array || Object.prototype.toString.call(o) === "[object Array]");
        },
        isArguments: function(o) {
            return o && o.callee && isNumber(o.length) ? true : false;
        },
        isFunction: function(o) {
            return o && (o.constructor === Function);
        },
        typeof: function(o) {
            if (utility.dh.isUndefined(o)) {
                return "undefined";
            } else if (utility.dh.isNull(o)) {
                return "null";
            } else if (utility.dh.isNumber(o)) {
                return "number";
            } else if (utility.dh.isBoolean(o)) {
                return "boolean";
            } else if (utility.dh.isString(o)) {
                return "string";
            } else if (utility.dh.isObject(o)) {
                return "object";
            } else if (utility.dh.isArray(o)) {
                return "array";
            } else if (utility.dh.isArguments(o)) {
                return "arguments";
            } else if (utility.dh.isFunction(o)) {
                return "function";
            } else {
                return "other";
            }
        }
    }
};
$B.modules = {
    config: {
        showerror: true
    },
    allModules: {},
    waitRuningFuncs: [],
    allModuleInstance: {},
    allModuleFiles: {},
    _initjs: function() {
        var doc = $B.global.document;
        var scripts = doc.getElementsByTagName('script');
        for (var i = scripts.length - 1; i >= 0; --i) {
            var src = scripts[i].src;
            var qmark = src.lastIndexOf('?');
            var l = qmark == -1 ? src.length : qmark;
            if (src.substr(l - 7, 7) == 'base.js') {
                var modules = scripts[i].getAttribute("data-module");
                if (modules) {
                    modules = modules.split(',');
                    if (modules && modules.length) {
                        $B.modules.loadjs(modules);
                    }
                }
                return;
            }
        }
    },
    loadjs: function(jsfiles) {
        if(!$B.util.dh.isArray(jsfiles)){
            jsfiles=[jsfiles];
        }
        for (var i = 0; i < jsfiles.length; i++) {
            if (jsfiles[i]) {
                $B.modules.allModuleFiles[jsfiles[i]] = true;
                $B.util.loadScript(jsfiles[i]);
            }
        }
    },
    _checkmoduleandinit: function(modulename) {
        if ($B.modules.allModuleInstance[modulename]) {
            return true;
        }
        else if (!$B.modules.allModules[modulename]) {
            return false;
        } else {
            var depends = $B.modules.allModules[modulename].meta.depends;
            var allloaded = true;
            if (depends) {
                for (var m = 0; m < depends.length; m++) {
                    if (depends[m]) {
                        if (!$B.modules._checkmoduleandinit(depends[m])) {
                            allloaded = false;
                            break;
                        }
                    }
                }
            }
            if (allloaded) {
                $B.modules._initmodule(modulename);
                return true;
            } else {
                return false;
            }
        }
    },
    _execfunc: function(func) {
        func.call();
    },
    _checkfuncandrun: function(depends, func, id) {
        var allready = true;
        for (var i = 0; i < depends.length; i++) {
            if (!$B.modules._checkmoduleandinit(depends[i])) {
                allready = false;
            }
        }
        if (allready) {
            $B.modules._execfunc(func);
            $B.modules.waitRuningFuncs[id] = null;
        }
    },
    _checkwaitingfuncs: function() {
        var allwaitings = $B.modules.waitRuningFuncs;
        for (var i = 0; i < allwaitings.length; i++) {
            if (allwaitings[i]) {
                $B.modules._checkfuncandrun(allwaitings[i].depends, allwaitings[i].funcs, i);
            }
        }
    },
    _initmodule: function(modulename) {
        try {
            if ($B.modules.allModuleInstance[modulename]) {
                return;
            }
            var moduledef = $B.modules.allModules[modulename];
            var moduleobj = $B.util.namespace(modulename);
            moduledef.define.call(moduledef.thisgloabal ? $B.global : moduleobj, moduledef);
            $B.modules.allModuleInstance[modulename] = moduleobj;
        } catch (e) {
            if ($B.modules.config.showerror) {
                throw e;
            } else {//trigger error event
            }
        }
    },
    declare: function() {
        var moduledef = {};
        var len = arguments.length;
        if (len == 3) {
            moduledef.meta = {};
            moduledef.meta.modulename = arguments[0];
            moduledef.meta.depends = arguments[1];
            moduledef.define = arguments[2];
        } else if (len == 1) {
            moduledef = arguments[0];
        } else if (len == 2) {
            moduledef.meta = {};
            moduledef.meta.modulename = arguments[0];
            moduledef.meta.depends = [];
            moduledef.define = arguments[2];
        } else {
            throw new Error("--");
        }
        $B.modules._autoLoadDependJs(moduledef.meta.depends);
        var dh = $B.util.dh;
        var config = $B.config;
        if (dh.isNull(moduledef.meta.modulename)) {
            if ($B.modules.config.showerror) {
                throw new Error("modulename涓嶈兘涓虹┖");
            } else {//trigger error event
            }
            return;
        }
        if (!dh.isFunction(moduledef.define)) {
            if ($B.modules.config.showerror) {
                throw new Error("define ");
            } else {//trigger error event
            }
            return;
        }
        var name = moduledef.meta.modulename;
        if ($B.modules.allModules[name]) {
            if ($B.modules.config.showerror) {
                //throw new Error("define涓嶈兘閲嶅悕鎴栬€呭娆″姞�?);
            } else {//trigger error event
            }
            return;
        }
        $B.modules.allModules[name] = moduledef;
        $B.modules._checkwaitingfuncs();
    },
    _autoLoadDependJs: function(depends) {
        if (depends) {
            for (var i = 0; i < depends.length; i++) {
                var autoloadfile = depends[i].split("|");
                if (autoloadfile.length == 2) {
                    depends[i] = autoloadfile[0];
                    if ($B.modules.allModuleFiles[autoloadfile[1]] == undefined) {
                        $B.modules.loadjs([autoloadfile[1]]);
                    }
                }
            }
        }
    },
    use: function(depends, execfunc) {
        if (arguments.length == 1 || depends == null || depends.length == 0) {
            $B.modules._execfunc(execfunc);
        } else {
            $B.modules._autoLoadDependJs(depends);
            $B.modules.waitRuningFuncs.push({funcs: execfunc, depends: depends});
            $B.modules._checkfuncandrun(depends, execfunc, $B.modules.waitRuningFuncs.length - 1);
        }
    }
}
$B.modules._initjs();