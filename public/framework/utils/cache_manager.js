define('framework/utils/cache_manager', function () {

    var cachesConfigs, Providers = {

        localstorage: {

            cache: window.localStorage,

            support: function () {
                var ls = window.localStorage;
                if (ls) {
                    try {
                        ls.setItem('test', '1');
                        return true;
                    } catch (err) {
                        return false;

                    }

                }

            },
            put: function (key, val) {
                this.cache.removeItem(key);
                try {
                    this.cache.setItem(key, val);
                } catch (err) {

                }
            },

            get: function (key) {

                return this.cache.getItem(key);
            }
        },
        inmemory: {

            cache: {},
            support: function () {
                return true;
            },
            put: function (key, val) {
                if (enabled) {
                    this.cache[key] = val;
                }
            },
            get: function (key) {
                if (enabled) {
                    return this.cache[key];
                } else {
                    return undefined;

                }
            }
        }
    };

    var provider, caches = {}, enabled = true;

    var CacheManager = {

        getCache: function (name) {

            var cache = caches[name];

            if (!cache) {
                cache = new Cache(name);
                caches[name] = cache;
            }

            return cache;

        },

        disable: function () {
            enabled = false;
        },

        enable: function () {
            enabled = true;
        },

        setProvider: function (val) {
            provider = val;
        },

        getProvider: function () {

            if (provider) {
                return provider;
            }

            provider = Providers.localstorage;

            while (!provider.support()) {
                provider = Providers.inmemory;
            }

            return provider;
        }
    };

    var Cache = function (name) {
        if (!name) {
            throw 'Cache must specify a name!';
        }
        this.name = name;
        this.timeout = cachesConfigs ? cachesConfigs[name] : 0;

    };

    Cache.prototype = {

        get: function (key) {
            if (enabled) {

                var cached = provider.get(this.name + '-' + key), timeout = this.timeout;
                if (cached && timeout > 0) {
                    var lastAccessedKey = this._getLastAccessedKey(key), lastAccessed = provider.get(lastAccessedKey), now = Date.now();
                    if (lastAccessed > 0 && lastAccessed + timeout < now) {
                        this.evict(key);
                        provider.put(lastAccessedKey, undefined);
                        cached = undefined;
                    } else {
                        provider.put(lastAccessedKey, now);
                    }
                }

                return cached;
            } else {
                return undefined;
            }

        },

        _getLastAccessedKey: function (key) {
            return this.name + '-lastaccessed-' + key;

        },

        evict: function (key) {
            if (enabled) {
                provider.put(this.name + '-' + key, undefined);
                var lastAccessedKey = this._getLastAccessedKey(key);
                provider.put(lastAccessedKey, Date.now());
            }
        },

        put: function (key, val) {
            if (enabled) {
                provider.put(this.name + '-' + key, val);
            }

        }
    };

    CacheManager.Providers = Providers;

    provider = CacheManager.getProvider();

    FW.CacheManager = CacheManager;


    CacheManager.config = function (config) {
        cachesConfigs = config;
        if (!cachesConfigs) {
            cachesConfigs = {};
        }
    };


});
