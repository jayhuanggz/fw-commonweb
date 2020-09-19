var fs = require('fs');
var path = require('path');
var regex = new RegExp('^(?:[a-z]+:)?//', 'i');

var crypto = require('crypto');

var FisModuleManager = function(config) {

    var self = this;
    self.root = config.root || '/';
    self.comboBase = config.comboBase || '/combo';
    self.defaultGroup = config.defaultGroup;
    self.comboSep = config.comboSep || '~';
    self.modules = {};
    self.resources = {};
    self.amdModules = {};
    self.domain = config.domain;
    self.resourceDomain = config.resourceDomain;
    var content = fs.readFileSync(config.mapFile, 'utf8');
    var file = JSON.parse(content);
    self.version = crypto.createHash('md5').update(content).digest('hex');
    self._buildModules(file);



};

FisModuleManager.prototype = {

    getResource: function (id) {


        return this.resources[id];
    },

    _buildModules: function(config) {
        var self = this,
            res = config.res;

        var key, mod;

        for (key in res) {
            if (res.hasOwnProperty(key)) {
                mod = res[key];
                self._buildModule(res, key, mod);

            }
        }

    },


    getVersion: function() {
        return this.version;


    },

    getModuleMappings: function() {
        return this.amdModules;
    },

    write: function() {

        var self = this,
            ids = arguments,
            i, j, id, mod, imports = [],
            visited = {},
            mods;

        for (i = 0; i < ids.length; i++) {
            id = ids[i];

            mods = self._findRequiredModules(id, visited);

            if (mods) {
                for (j = 0; j < mods.length; j++) {
                    mod = mods[j];
                    if (mod.type === 'js') {
                        imports.push('<script src="' + mod.uri + '"></script>');
                    } else {
                        imports.push('<link rel="stylesheet" href="' + mod.uri + '"/>');
                    }
                }
            }


        }

        return imports.join('\n');

    },

    getModuleUri: function(id) {

        var mod = this.modules[id];

        if (!mod) {
            throw new Error('Module not found: ' + id);
        }

        return mod.uri;

    },

    writeCombo: function() {
        var self = this,
            ids = arguments,
            i, j, id, mod, imports = [],
            visited = {},
            mods, resourceDomain = self.resourceDomain;

        var type;


        for (i = 0; i < ids.length; i++) {
            id = ids[i];

            mods = self._findRequiredModules(id, visited);

            if (mods) {
                for (j = 0; j < mods.length; j++) {
                    mod = mods[j];


                    var uri = '',
                        group = mod.group;


                    var modUri = mod.uri;

                    if (resourceDomain) {
                        modUri = modUri.substr(modUri.indexOf(resourceDomain) + resourceDomain.length);
                        uri += modUri;
                    } else {
                        uri += mod.id;
                    }



                    imports.push(uri);

                    if (!type) {
                        type = mod.type;
                    }

                }
            }


        }
        var result = '';
        if (mod.type === 'js') {

            result += '<script src="';
            result +=resourceDomain;
            result += self.comboBase;
            result += self.comboSep;
            result += imports.join(self.comboSep);
            result += '"></script>';
        } else {
            result += '<link rel="stylesheet" href="';
            result +=resourceDomain;
            result += self.comboBase;
            result += self.comboSep;
            result += imports.join(self.comboSep);
            result += '"/>';
        }

        return result;

    },

    _findRequiredModules: function(id, excluded) {

        var self = this,
            modules = self.modules;

        if (!excluded.hasOwnProperty(id)) {
            excluded[id] = true;

            var mod = modules[id];

            if (!mod) {
                throw new Error('Cannot find module: ' + id);
            }

            var result = [mod];

            var deps = mod.deps;


            if (deps && deps.length > 0) {
                var i, depModules;


                for (i = 0; i < deps.length; i++) {
                    depModules = self._findRequiredModules(deps[i].id, excluded);
                    if (depModules && depModules.length > 0) {
                        result = result.concat(depModules);
                    }
                }

            }
            return result;
        }

    },


    _buildModule: function(res, key, mod) {
        var self = this,
            modules = self.modules,
            module, deps, extras, resourceDomain = self.resourceDomain;

        module = modules[key];
        if (mod.type === 'js' || mod.type === 'css') {
            if (!modules.hasOwnProperty(key)) {


                module = {
                    id: key,
                    uri: mod.uri,
                    deps: [],
                    type: mod.type
                };


                modules[key] = module;

                extras = mod.extras || {};


                module.group = extras.group || self.defaultGroup;
                module.name = extras.moduleId;

                var amdUri, type = mod.type;


                if (resourceDomain) {

                    amdUri = module.uri.substr(module.uri.indexOf(resourceDomain) + resourceDomain.length);

                } else {
                    if (module.group) {
                        amdUri = '/' + module.group + '/' + key;
                    } else {

                        amdUri = '/' + key;
                    }
                    if (amdUri.indexOf(type) === -1) {
                        amdUri += '.' + type;
                    }
                }


                var amd = {
                    uri: amdUri,
                    group: extras.group || self.defaultGroup
                };

                deps = mod.deps;

                if (deps) {
                    var i;
                    var dep;
                    for (i = 0; i < deps.length; i++) {
                        dep = deps[i];


                        if (res.hasOwnProperty(dep)) {

                            dep = self._buildModule(res, dep, res[dep]);
                            module.deps.push(dep);


                            if (!amd.deps) {
                                amd.deps = [];
                            }
                            amd.deps.push(dep.name || dep.id);



                        }


                    }
                }
                var amdName = module.name || module.id;


                self.amdModules[amdName] = amd;



            }
            return module;

        } else {
            if (!self.resources.hasOwnProperty(key)) {


                self.resources[key] = mod.uri;


            }
        }


    }
};


module.exports = FisModuleManager;
