/**
 * Utility functions for Disco
 */
(function(window, $) {
    if (window.Disco && window.Disco.util) return;
    
    var util = {};

    util.servicesURL = 'https://services.fandom.com/discussion/';
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
     * @param {string} method request method type, e.g. get, post
     * @param {Object} data - parameters/body to send with the request
     * @param {Object} options - options for jQuery AJAX
     */
    util.fetch = function(path, method, data, options) {
        if (Array.isArray(path)) {
            path = path.join('/') + '/';
        }
        method = method || 'get';
        data = data || {};
        options = options || {};
        var settings = Object.assign({}, {
            methid: method,
            data: data
        }, options);

        return $.ajax(util.servicesURL + path, settings);
    };

    /**
     * Function to return a promise
     */
    util.resolve = function(data) {
        return $.Deferred().resolve(data);
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