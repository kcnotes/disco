/**
 * Utility functions for Disco
 */
(function (window, $) {
    if (window.Disco && window.Disco.Discuss) return;

    var Discuss = {};
    var templates = {};

    templates.main = 
        '<div id="disco-discuss">' +
            '{{#_embedded.doc:posts}}' +
                '<p><strong>{{_embedded.thread.0.title}}</strong>:' +
                '{{{jsonModelHTML}}}' +
            '</p>----{{/_embedded.doc:posts}}' +
            '<div id="loadmore">load more</div>' +
        '</div>';

    templates.forums = 
        '<div id="disco-discuss">' +
            '{{#_embedded.doc:forum}}' +
                '<div class="ddss-forum">' +
                    '<div class="ddss-forum_counts">{{threadCount}} {{threadsPlural}}</div>' +
                    '<div class="ddss-forum_name"><a href="/wiki/Discuss/forum/{{id}}" data-forumid="{{id}}">{{name}}</a></div>' +
                    '<div class="ddss-forum_latest">' + 
                        '{{#latestContribution.username}}' + 
                            'Last post by ' + 
                            '<a href="/wiki/Special:Contributions/{{latestContribution.username}}">{{latestContribution.username}}</a>' +
                            ' {{latestContribution.date.timeago}}' +
                        '{{/latestContribution.username}}' +
                        '{{^latestContribution.username}}' +
                        '{{/latestContribution.username}}' +
                    '</div>' +
                '</div>' +
            '{{/_embedded.doc:forum}}' +
        '</div>';

    Discuss.loadmore = 0;

    Discuss.parseJSONModel = function(node) {
        if (node === null) return;
        if (Array.isArray(node)) return node.map((item, index) => {
            return Discuss.parseJSONModel(item);
        });
        let content = '';
        switch (node.content && (content = Discuss.parseJSONModel(node.content)), node.type) {
            case 'image':
                return $('<div>{image}</div>');
            case 'openGraph':
                return $('<div>{opengraph}</div>');
            case 'paragraph':
                if (content) {
                    return $('<p/>').append(content);
                } else {
                    return $('<p/>').append('<br />');
                }
            case 'bulletList':
                return $('<ul/>').append(content);
            case 'orderedList':
                return $('<ol/>').append(content);
            case 'listItem':
                return $('<li/>').append(content);
            case 'code_block':
                return $('<pre/>').append($('<code/>').append(content));
            case 'text': {
                let result = node.text;
                if (node.marks) {
                    node.marks.forEach(function(mark) {
                        switch (mark.type) {
                            case 'em':
                                result = $('<em/>').append(result);
                                break;
                            case 'strong':
                                result = $('<strong/>').append(result);
                                break;
                            case 'link': {
                                result = $('<link/>').append(result);
                                break;
                            }
                            case 'mention':
                                break;
                        }
                    });
                }
                return result;
            }
            default:
                return content;
        }
    }

    Discuss.showForums = function() {
        $('#WikiaMainContent').empty();
        var site = new Disco.Site(mw.config.get('wgCityId'), true);
        site.listCategories({responseGroup: 'full'}).then(function(data) {
            var userIds = data._embedded['doc:forum'].map(function(forum) {
                return forum.latestContribution.author;
            });
            userIds = userIds.filter(function(id) {
                return id;
            })
            // Get usernames from IDs
            site.getUsers(userIds).then(function(users) {
                data._embedded['doc:forum'].forEach(function (forum) {
                    // pluralise thread/s
                    forum.threadsPlural = forum.threadCount === 1 ? 'thread' : 'threads';
                    // Calculate latest reply time ago
                    if (!forum.latestContribution.date) return;
                    var date = new Date(0);
                    date.setUTCSeconds(forum.latestContribution.date.epochSecond);
                    forum.latestContribution.date.timeago = $.timeago(date);
                    // Retrieve latest reply username
                    var latestUserId = forum.latestContribution.author;
                    forum.latestContribution.username = users.users[latestUserId].username;
                });
                $('#WikiaMainContent').append(Mustache.render(templates.forums, data));
                Discuss.addForumsListener();
            });
        });
    };

    Discuss.addForumsListener = function() {
        $('.ddss-forum_name a').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var forumId = $(this).data('forumid');
            console.log(forumId);
        });
    }

    Discuss.init = function() {
        $('#WikiaMainContent').empty().css({'width': '100%', 'min-height': '600px'});
        $('#WikiaRailWrapper').remove();
        var site = new Disco.Site(mw.config.get('wgCityId'), true);
        site.listPosts({limit: 20}).then(function(data) {
            data._embedded['doc:posts'].forEach(function(doc) {
                var model = JSON.parse(doc.jsonModel);
                var $model = Discuss.parseJSONModel(model);
                if (Array.isArray($model)) {
                    doc.jsonModelHTML = $model.map(function(node) {
                        return node.html();
                    }).join('');
                } else {
                    doc.jsonModelHTML = $model.html();
                }
            });
            $('#WikiaMainContent').append(Mustache.render(templates.main, data)).html();
            Discuss.loadmore += 1;
            $('#loadmore').on('click', function (e) {
                site.listPosts({page: Discuss.loadmore, limit: 20}).then(function (data) {
                    $('#WikiaMainContent').append(Mustache.render(templates.main, data));
                }); 
            });
        });
    };

    function checkmwLoad() {
        if (typeof mw !== 'undefined' && typeof $ !== 'undefined') {
            var isUCP = mw.config.get('wgVersion') !== '1.19.24';
            if (isUCP) {
                mw.loader.using(['mediawiki.template.mustache'], function (require) {
                    $(Discuss.showForums);
                });
            } else {
                $(Discuss.showForums);
            }
        }
    }
    setTimeout(checkmwLoad, 1000);

    window.Disco.Discuss = Discuss;

})(window, window.jQuery);