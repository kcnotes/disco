(function () {
    var discussrc = {};

    var SERVICES = 'https://services.fandom.com/discussion/',
        config   = mw.config.get([
            'wgCityId',
            'wgVersion',
            'wgServer',
            'wgScriptPath'
        ]),
        cityId   = config.wgCityId,
        isUCP    = config.wgVersion !== '1.19.24',
        communityBasePath = config.wgServer + config.wgScriptPath;
    
    var templates = {};
    
    // Ungrouped single post RC entry
    templates.post = 
        '{{#post}}' +
            '<li data-mw-ts="{{parsedDate.mwformat}}" class="fandom-discussrc-entry">' +
                '<span class="mw-changeslist-line-inner">' + 
                    // '()' +
                    // ' <span class="mw-changeslist-separator"></span> ' +
                    // '&lrm;' +
                    // '{{#new}}' +
                    '<abbr class="newpage" title="{{mw.recentchanges-label-newpage}}">{{mw.newpageletter}}</abbr> ' +
                    // '{{/new}}' + 
                    '{{{rcmessage}}}{{mw.semicolon-separator}} ' +
                    '{{parsedDate.time}}' +
                    ' <span class="mw-changeslist-separator"></span> ' +
                        '<span dir="ltr" class="mw-plusminus-pos mw-diff-bytes">+{{diffBytes}}</span>&lrm; ' +
                    ' <span class="mw-changeslist-separator"></span> &lrm; ' +
                    '{{^isIP}}' + 
                    '<a href="/wiki/User:{{createdByFinal}}"' +
                        'class="mw-userlink" title="User:{{createdByFinal}}">' + 
                        '<bdi>{{createdByFinal}}</bdi>' + 
                    '</a>' +
                    '{{/isIP}}' +
                    '{{#isIP}}' +
                        '<a href="/wiki/Special:Contributions/{{createdByFinal}}"' +
                            'class="mw-userlink mw-anonuserlink" title="Special:Contributions/{{createdByFinal}}">' +
                            '<bdi>{{createdByFinal}}</bdi>' +
                        '</a>' +
                    '{{/isIP}} ' +
                    '<span class="mw-usertoollinks mw-changeslist-links">' +
                        '<span>' +
                            '<a href="/wiki/Message_Wall:{{createdByFinal}}"' +
                                'class="mw-usertoollinks-wall"' +
                                'title="Message Wall:{{createdByFinal}}">{{mw.messagewall-usertools-label}}</a>' +
                        '</span> ' +
                        '{{^isIP}}' +
                        '<span>' +
                            '<a href="/wiki/Special:Contributions/{{createdByFinal}}"' +
                                'class="mw-usertoollinks-contribs"' +
                                'title="Special:Contributions/{{createdByFinal}}">{{mw.contribslink}}</a>' +
                        '</span> ' +
                        '{{/isIP}}' +
                        '<span>' +
                            '<a href="/wiki/Special:Block/{{createdByFinal}}" class="mw-usertoollinks-block"' +
                                'title="Special:Block/{{createdByFinal}}">{{mw.blocklink}}</a>' +
                        '</span>' +
                    '</span> ' +
                    '<span class="comment comment--without-parentheses">' +
                        '{{#limitLength}}{{rawContent}}{{renderedContentStripped}}{{/limitLength}}' +
                    '</span>' +
                '</span>' + 
            '</li>' +
        '{{/post}}';
    
    /**
     * Get posts/threads from current wiki's Discussions
     * @param {*} type - one of ['threads', 'posts']
     * @param {*} options - params to send to the API
     */
    discussrc.getDiscussions = function(type, data) {
        var params = '?' + new URLSearchParams(data);
        return fetch(SERVICES + cityId + '/' + type + params, {
            method: 'GET',
            credentials: 'include'
        });
    };

    // MW messages for RecentChanges
    discussrc.MWMESSAGES = [
        'parentheses-start',
        'parentheses-end',
        'newpageletter',
        'semicolon-separator',
        'contribslink',
        'blocklink',
        'recentchanges-label-newpage',
        'messagewall-usertools-label'
    ];
    
    // Store translated MW messages
    discussrc.msg = {};
    
    // Get MW messages from MediaWiki: pages
    discussrc.getMessages = function() {
        return new mw.Api().loadMessagesIfMissing(discussrc.MWMESSAGES).done(function() {
            discussrc.MWMESSAGES.forEach(function(msg) {
                discussrc.msg[msg] = mw.msg(msg);
            });
        });
    };

    /**
     * API to perform mapping from container IDs to article names, and user ID
     * to username
     * @param {Array<String>} containerIds list of container ids for articles
     * @param {Array<String>} userIds list of user IDs
     */
    discussrc.getArticleNames = function(containerIds, userIds) {
        containerIds = containerIds || [];
        userIds = userIds || [];
        var data = {
            controller: 'FeedsAndPosts',
            method: 'getArticleNamesAndUsernames',
            stablePageIds: containerIds.join(','),
            userIds: userIds.join(','),
            format: 'json'
        };
        var params = '?' + new URLSearchParams(data);
        return fetch(communityBasePath + '/wikia.php' + params, {
            method: 'GET',
            credentials: 'include'
        });
    };

    /**
     * Mustache lambda to Limit the summary string to 100
     * @return limit length function for Mustache
     */
    discussrc.limitLength = function() {
        return function(text, render) {
            if (render(text).length > 100)
                return render(text).substr(0, 100) + '...';
            return render(text);
        }
    };

    /**
     * Parses a Discussions timestamp to other formats for RC entries
     * @param {String} epochSecond epochSecond
     */
    discussrc.parseDate = function(epochSecond) {
        var date = new Date(epochSecond * 1000);
        var hours = date.getHours();
        hours = ((hours < 10) ? '0' : '') + hours;
        var mins = date.getMinutes();
        mins = ((mins < 10) ? '0' : '') + mins;
        var month = date.getMonth() + 1;
        month = ((month < 10) ? '0' : '') + month;
        var day = date.getDate();
        day = ((day < 10) ? '0' : '') + day;
        var localDate = '' + date.getFullYear().toString() + month + day;
        return {
            mwformat: date.toISOString().replace(/([:T\-]|.000Z)/g, ''),
            time: hours + ':' + mins,
            localDate: localDate
        };
    }

    /**
     * Constructs the main RC message for article comments, walls and Discussions
     * @param {Post} post post data from API
     */
    discussrc.createRCMessage = function(post) {
        // Obtain common information
        var username      = post.createdBy.id !== '0' ? post.createdBy.name : post.creatorIp.slice(1),
            threadTitle   = post._embedded.thread[0].title,
            containerType = post._embedded.thread[0].containerType,
            url           = '';
        post.createdByFinal = username;
        
        // Format based on type of post
        switch (containerType) {
            case 'ARTICLE_COMMENT':
                var threadTitle = post.articleName.title;
                url = communityBasePath + post.articleName.relativeUrl;
                url += '?commentId=' + post.id;
                // Article comment (<page>)
                return discussrc.i18n.msg('article-comments-rc-comment', 
                    url, threadTitle).parse();
            case 'WALL':
                var wallOwner = post.forumName.slice(0, -13);
                url = communityBasePath + 
                          '/wiki/Message_Wall:' + wallOwner.replace(/ /g, '_') + 
                          '?threadId=' + post.threadId;
                // anchor for replies
                if (post.position !== 1) {
                    url += '#' + post.id;
                }
                var threadLink = '[' + url + ' ' + threadTitle + ']';
                // <thread> on <user>'s wall
                return discussrc.i18n.msg('wall-recentchanges-thread-group', 
                    threadLink, 'Message_Wall:' + wallOwner, wallOwner.replace(/_/g, ' ')).parse();
            case 'FORUM':
                var boardURL = communityBasePath + '/f?catId=' + post.forumId;
                url = communityBasePath + '/f/p/' + post.threadId;
                // anchor for replies
                if (post.position !== 1) {
                    url += '/r/' + post.id;
                }
                var threadLink = '[' + url + ' ' + threadTitle + '] ';
                // <thread> on <board> Board
                return window.dev.i18n._parse(threadLink) + 
                    discussrc.i18n.msg('forum-recentchanges-new-message',
                        boardURL, post.forumName).parse();
            default:
                break;
        }

        return containerType + ' | ' + threadTitle + ' | ' + username;
    };

    discussrc.processPosts = function(postsData, callback) {
        console.log(postsData);
        var containerIds = [];

        // Perform some processing
        postsData._embedded['doc:posts'].forEach(function (post) {
            var thread = post._embedded.thread[0];
            if (thread.containerType === 'ARTICLE_COMMENT' &&
                containerIds.indexOf(thread.containerId) === -1) {
                containerIds.push(thread.containerId);
            }
        });
        // Get article names
        discussrc.getArticleNames(containerIds)
        .then(function (res) {
            return res.json();
        })
        .then(function (articles) {
            console.log(articles);
            postsData._embedded['doc:posts'].forEach(function (post) {
                var thread = post._embedded.thread[0];
                if (thread.containerType === 'ARTICLE_COMMENT') {
                    post.articleName = articles.articleNames[thread.containerId];
                }
                post.new = post.position === 1;
                post.isIP = post.createdBy.id === '0';
                if (post.renderedContent) {
                    post.renderedContentStripped = post.renderedContent.replace(/<\/?.*?>/g, '');
                }
                post.rcmessage = discussrc.createRCMessage(post);
                post.parsedDate = discussrc.parseDate(post.creationDate.epochSecond);
                if (post.jsonModel) {
                    post.diffBytes = post.jsonModel.length.toLocaleString();
                    if (!post.renderedContentStripped && !post.rawContent) {
                        var jsonModel = JSON.parse(post.jsonModel).content;
                        post.renderedContentStripped = jsonModel.length === 0 ? "" : jsonModel.map(function (d) {
                            return d.type == "paragraph" && d.content ? d.content.map(function (td) {
                                return td.text || "";
                            }) : "";
                        }).join(" ").replace(/  /, " ");
                    }
                } else if (post.renderedContent) {
                    post.diffBytes = post.renderedContent.length.toLocaleString();
                }
            });

            callback(postsData._embedded['doc:posts']);
            // var $elem = $('.mw-special-Recentchanges ul.special')[0];
            // $($elem).prepend(
            //     Mustache.render(templates.groupedPosts, {
            //         limitLength: discussrc.limitLength,
            //         data: postsData,
            //         mw: discussrc.msg
            //     })
            // );
        });
    };

    discussrc.showUngroupedLiveRC = function(posts) {
        var i = 0;

        $('.special li').each(function () {
            var mwts = $(this).data('mw-ts').toString(),
                post = posts[i],
                today = new Date($(this).parent().prev('h4').text()),
                previousDay = new Date($(this).parent().next('h4').text());

            while (post && post.parsedDate.mwformat > mwts) {
                console.log(mwts, post.parsedDate);
                $(this).before($(Mustache.render(templates.post, {
                    limitLength: discussrc.limitLength,
                    post: post,
                    mw: discussrc.msg
                })));
                post = posts[++i];
            }
            if ($(this).is(':last-child')) {
                while (post && post.parsedDate.mwformat <= mwts && new Date(post.creationDate.epochSecond * 1000) >= today) {
                    console.log(mwts, post.parsedDate);
                    console.log('last');
                    console.log($(this).text());
                    $(this).parent().append($(Mustache.render(templates.post, {
                        limitLength: discussrc.limitLength,
                        post: post,
                        mw: discussrc.msg
                    })));
                    post = posts[++i];
                }
            }
            console.log('next day');
        });
    };

    // Load Mustache, i18n.js
    discussrc.preloadScriptCount = 1;
    discussrc.preload = function() {
        if (!--discussrc.preloadScriptCount) discussrc.init();
    };

    discussrc.init = function() {
        mw.hook('structuredChangeFilters.ui.initialized').add(function () {
            var msgPromise = discussrc.getMessages();
            // UCP, JS-enabled, ungrouped
            discussrc.getDiscussions('posts', {
                limit: 100,
                responseGroup: 'small'
            })
            .then(function(res) { return res.json(); })
            .then(function(postsData) {
                $.when(msgPromise).then(function() {
                    discussrc.processPosts(postsData, discussrc.showUngroupedLiveRC);
                });
            });
        });
    };

    // Load scripts, calls discussrc.init when done
    mw.loader.using('mediawiki.template.mustache', discussrc.preload);
    importArticle({
        type: 'script',
        article: 'u:dev:MediaWiki:I18n-js/code.js'
    });
    mw.hook('dev.i18n').add(function (i18n) {
        i18n.loadMessages('u:noreply-ucp:MediaWiki:Custom-DiscussRC/i18n.json').done(function (i18n) {
            discussrc.i18n = i18n;
        });
    });
    
    window.discussrc = discussrc;
}());
