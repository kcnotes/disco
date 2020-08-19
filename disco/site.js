/**
 * Handles the top level Discussions for a wiki, and encapsulates functionality
 * for other API objects.
 * 
 * Usage:
 * new Site('147').getPost('4400000000000054659');
 * new Site(2188342);
 * https: //github.com/github-tools/github/blob/master/lib/GitHub.js
 */
(function(window, Disco) {
    if (window.Disco && window.Disco.Site) return;

    util = Disco.util;
    
    /**
     * Represents a Discussions site for a wiki.
     * @constructor
     * @param {string} siteId - the wiki ID
     * @param {boolean} showDeleted - whether the user can view deleted posts
     */
    function Site(siteId, showDeleted) {
        this.siteId = siteId;
        this.showDeleted = showDeleted || false;
        return this;
    }
    
    /**
     * Creates a Post wrapper. 
     * Call .get() to obtain the Post data.
     * @param {string} postId - post ID
     * @param {function} cb - callback function
     * @returns {jQuery.Promise} - promise, resolves to a Post object
     */
    Site.prototype.getPost = function (postId, cb) {
        return new Disco.Post(this.siteId, postId, this.showDeleted);
    };
    
    /**
     * Gets a list of new or hot posts.
     * @param {Object} options - view options for the list of posts
     * @param {number} options.limit - number of results to return, default 10
     * @param {number} options.page - the pagination position, default 0
     * @param {string} options.pivot - id of the post to pivot from
     * @param {string} options.containerType - @see Disco.util.CONTAINER_TYPE
     * @param {string} options.since - date since
     * @param {string} options.until - date until
     * @param {string} options.reported - show reported posts?
     * @param {string} options.sortKey - @see Disco.util.SORT_KEY
     * @param {string} options.responseGroup - 'small' or 'full' post details
     */
    Site.prototype.listPosts = function(options) {
        options = options || {};
        options.viewableOnly = this.showDeleted;
        return util.fetch(['discussion', this.siteId, 'posts'], 'GET', options)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                return util.resolve(data);
            });
    };

    /**
     * Gets a list of new or hot threads.
     * @param {Object} options - view options for the list of posts
     * @param {number} options.limit - number of results to return, default 10
     * @param {number} options.page - the pagination position, default 0
     * @param {string} options.pivot - id of the post to pivot from
     * @param {string} options.forumId - filter to certain forums
     * @param {string} options.excludedThreads - threads to exclude
     * @param {string} options.since - date since
     * @param {string} options.until - date until
     * @param {string} options.reported - show reported posts?
     * @param {string} options.sortKey - @see Disco.util.SORT_KEY
     * @param {string} options.responseGroup - 'small' or 'full' post details
     */
    Site.prototype.listThreads = function (options) {
        options = options || {};
        options.viewableOnly = this.showDeleted;
        return util.fetch(['discussion', this.siteId, 'threads'], 'GET', options)
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                return util.resolve(data);
            });
    };

    /**
     * Get a list of categories (forum boards) on Discussions.
     * @param {Object} options - view options for the list of posts
     * @param {string} options.responseGroup - 'small' or 'full' post details
     */
    Site.prototype.listCategories = function (options) {
        options = options || {};
        options.viewableOnly = this.showDeleted;
        return util.fetch(['discussion', this.siteId, 'forums'], 'GET', options)
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                return util.resolve(data);
            });
    };
    Site.prototype.getInsights = function() {};
    Site.prototype.getGuidelines = function() {};
    Site.prototype.setGuidelines = function() {};
    Site.prototype.getAttributes = function() {};
    Site.prototype.getAttribute = function() {};
    Site.prototype.setAttribute = function () {};

    /**
     * Get information about a list of users
     * @param {Array<string>} userIds - array of user IDs to look up
     */
    Site.prototype.getUsers = function (userIds) {
        var path = ['user-attribute', 'user', 'bulk'];
        var userIds = userIds.map(function (id) {
            return 'id=' + id;
        })
        return util.fetch(path, 'GET', userIds.join('&'))
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                return util.resolve(data);
            });
    };

    if (!window.Disco) window.Disco = {};
    window.Disco.Site = Site;
})(window, window.Disco);