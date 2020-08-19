/**
 * Utility functions for Disco
 */
(function(window, $) {
    if (window.Disco && window.Disco.util) return;
    
    var util = {};

    util.servicesURL = 'https://services.fandom.com/';
    util.CONTAINER_TYPE = [
        'FORUM',
        'WALL',
        'ARTICLE_COMMENT'
    ];
    util.SORT_KEY = [
        'creation_date',
        'trending'
    ];
    
    /**
     * Make a request
     * @param {string|Array} path - Discussions API path
     * @param {string} method request method type, e.g. GET, POST
     * @param {Object} data - parameters/body to send with the request
     * @param {Object} options - options for fetch request
     */
    util.fetch = function(path, method, data, options) {
        if (Array.isArray(path)) {
            path = path.join('/') + '/';
        }
        method = method || 'GET';
        data = data || {};
        options = options || {};
        params = '';
        var settings = Object.assign({}, {
            method: method,
            credentials: 'include'
        }, options);

        if (method.toUpperCase() === 'GET') {
            if (typeof data === 'string') {
                params = '?' + data;
            }
            else if (Object.keys(params).length !== 0) {
                params = '?' + new URLSearchParams(data);
            }
        } else {
            settings.body = data;
        }

        return fetch(util.servicesURL + path + params, settings);
    };

    /**
     * Function to return a promise
     */
    util.resolve = function(data) {
        return data;
    }

    /**
     * Set the domain for all API calls. 
     * @param {String} domain - services URL, e.g. https://services.fandom.com/
     */
    util.setDomain = function(domain) {
        util.servicesURL = domain + 'discussion/';
    }

    if (!window.Disco) window.Disco = {};
    window.Disco.util = util;
})(window, window.jQuery);