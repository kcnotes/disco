/**
 * Handles the top level Discussions for a wiki.
 */
(function(window) {
    if (window.Disco && window.Disco.Site) return;

    util = Disco.util;
    
    /**
     * Represents a Discussions, Message Wall or Article comment post
     * @param {Number} siteId - the wiki ID
     * @param {Number} postId - the post ID
     */
    function Post(siteId, postId, showDeleted) {
        this.siteId = siteId;
        this.postId = postId;
        this.showDeleted = showDeleted || false;
        this.data = null;
        return this;
    }

    /**
     * Get post contents and information.
     */
    Post.prototype.get = function(cb) {
        var self = this;
        return util.fetch([this.siteId, 'posts', this.postId], 'get', {
            responseGroup: 'full',
            viewableOnly: this.showDeleted
        })
        .then(function(data) {
            return util.resolve(self.fromJSON(data));
        }).done(cb);
    };

    Post.prototype.fromJSON = function(data) {
        if (data.siteId) {
            this.siteId = data.siteId;
        }
        if (data.id) {
            this.postId = data.id;
        }
        this.data = data;
        return this;
    }

    if (!window.Disco) window.Disco = {};
    window.Disco.Post = Post;
})(window); 