/**
 * Handles threads on Discussions sites.
 */
(function (window) {
    if (window.Disco && window.Disco.Thread) return;

    util = Disco.util;

    /**
     * Represents a thread in Discussions, composed of a base post and 
     * multiple reply posts
     * @param {Number} siteId - the wiki ID
     * @param {Number} threadId - the thread ID
     */
    function Thread(siteId, threadId, showDeleted) {
        this.siteId = siteId;
        this.threadId = threadId;
        this.showDeleted = showDeleted || false;
        this.data = null;
        return this;
    }

    /**
     * Get post contents and other information.
     */
    Thread.prototype.get = function () {
        var self = this;
        return util.fetch(['discussion', this.siteId, 'threads', this.postId], 'get', {
                responseGroup: 'full',
                viewableOnly: this.showDeleted
            })
            .then(function (res) {
                return res.json();
            })
            .then(function (data) {
                return util.resolve(self.fromJSON(data));
            });
    };

    Thread.prototype.fromJSON = function (data) {
        if (data.siteId) {
            this.siteId = data.siteId;
        }
        if (data.id) {
            this.threadId = data.id;
        }
        this.data = data;
        return this;
    }

    if (!window.Disco) window.Disco = {};
    window.Disco.Thread = Thread;
})(window);