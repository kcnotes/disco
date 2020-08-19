/**
 * Handles individual posts on Discussions sites. 
 * The Discussions API for Posts is a bit weird and should only be used to 
 * create posts/replies. Fetching content should be done using 
 * {@link Disco.Thread}.
 * Use this API when creating a new thread.
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
     * Get post contents and other information.
     */
    Post.prototype.get = function() {
        var self = this;
        return util.fetch(['discussion', this.siteId, 'posts', this.postId], 'get', {
            responseGroup: 'full',
            viewableOnly: this.showDeleted
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            return util.resolve(self.fromJSON(data));
        });
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