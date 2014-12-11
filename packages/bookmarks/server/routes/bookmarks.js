'use strict';

// User routes use users controller
var bookmarks = require('../controllers/bookmarks.js');

//bookmarks route api
module.exports = function(Bookmarks, app, auth, database) {

    //接受新提交的bookmarks
    app.route('/api/bookmarks/post')
        .post(bookmarks.receive);


    //获取频道内的书签
    app.route('/api/bookmarks/init')
        .get(bookmarks.init);

    //用户支持书签
    app.route('/api/bookmarks/like/:bookmarkId')
        .post(bookmarks.like);
    //用户反对书签
    app.route('/api/bookmarks/hate/:bookmarkId')
        .post(bookmarks.hate);

    //获取离请求日期最近的某天的所有书签
    app.route('/api/bookmarks/oneDay/:channelId')
        .get(bookmarks.oneDay);

    //审核通过某个书签
    app.route('/api/bookmarks/pass/:channelId/:bookmarkId')
        .post(bookmarks.pass);

    //编辑并通过某个书签
    app.route('/api/bookmarks/edit/:channelId/:bookmarkId')
        .post(bookmarks.edit);

    //删除并通过某个书签
    app.route('/api/bookmarks/delete/:channelId/:bookmarkId')
        .post(bookmarks.delete);
};