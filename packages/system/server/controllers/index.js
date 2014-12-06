'use strict';

var mean = require('meanio');

var mongoose = require('mongoose'),
    async = require('async'),
    User = mongoose.model('User'),
    Channel2User = mongoose.model('Channel2User'),
    Channels = mongoose.model('Channels'),
    Bookmarks = mongoose.model('Bookmarks'),
    tool=require('../../../../config/tools/tool'),
    myVerify=require('../../../../config/tools/verify');

//渲染首页 注入用户数量,频道数量,标签数量
exports.render = function(req, res,Package) {
    async.parallel([
        function(cb){
        User.count({},function(err,user_number){cb(err,user_number)});
        },
        function(cb){
            Channels.count({},function(err,channel_number){cb(err,channel_number)});
        },
        function(cb){
            Bookmarks.count({checked:{$in:[1,3,5]}},function(err,label_number){cb(err,label_number)});
        }],function(err,result){
            if(err){
                console.log(err);
            }
            else{
                var user_number=result[0];
                var channel_number=result[1];
                var label_number=result[2];
                Package.render('index',{user_number:user_number,channel_number:channel_number,label_number:label_number,user:req.user},
                    function(err,html){
                    if(err) consoe.log(err);
                        res.send(html);
                    }
                )
            }
        })

};

//渲染发现页面
exports.explore = function(req, res,Package){
    var limit = 20;//每页限制显示数
    var p=req.query.p||1;
    if (!myVerify.isNumber(p)){p=1;}//判断参数是否合法
    async.waterfall([function(cb){
        Channels.count({},function(err,count){
            if (err) return console.log(err);
            cb(err,count);
        })
    },
    //所有热门频道 按关注度排行
    function(count,callback){
        var pageLength=Math.ceil(count/limit),page=tool.skipPage(p,pageLength);
        var minPage;
        //防止大于翻页上限
        if(p>pageLength&&pageLength>0) minPage=pageLength;
        else minPage=p;
        //防止超过下限
        if (minPage<1){minPage=1;}
        Channels.find().sort({subNum:-1,bmkNum:-1}).skip(limit*(minPage-1)).limit(limit).exec(function (err, channels) {
            if(err) return console.log(err);
            callback(err,channels,page);
        });
    },
    //用户关注的频道
    function(channels,page,callback){
        if (!req.user) return callback(null,channels,page,[]);
        Channel2User.find({'userId':req.user._id},function(err,channel2user){
            if (err) return console.log(err);
            var channel2userId=[];
            channel2user.forEach(function(item){
                channel2userId.push(item.channelId+'');
            });
            callback(err,channels,page,channel2userId);
        })
    }
    ],function(err,channels,page,channel2userId){
        if (err) return console.log(err);
        channels.forEach(function(item,index,array){
            if (channel2userId.indexOf(item._id+'')>-1){
                array[index].isAttention=true;//已经关注
            }
        });console.log(channels);
            Package.render('explore', {
                channels:channels,user:req.user,page:page
            }, function(err, html) {
                if(err) console.log(err);
                res.send(html);
            });
        });
}

//查询处理
exports.query = function(req,res,Package){
    if(!req.query.q){
        return res.redirect('/explore');
    }
    //查询最大字数 searchMax
    var searchMax=15;
    var search = req.query.q;
    var searchPage=req.query.p||1;
    if (!myVerify.isNumber(searchPage)) {return res.status(400).send({info:'参数类型错误'})}
    searchPage=+searchPage;
    var limit=30;//单页显示数
    if(search.length>=searchMax){
        search=search.substr(0,searchMax);
    }
    search=tool.stripscript(search);//过滤非法字符 仅支持中文 数字 英文下划线搜索
    async.waterfall([
        //返回频道总数count
        function(cb){
            Channels.count({name:new RegExp(search,'i')},function(err,count){
                if (err) console.log(err);
                cb(err,count);
            });
        },
        function(count,callback){
            var pageLength=Math.ceil(count/limit);
            var minPage;
            //防止大于翻页上限
            if(searchPage>pageLength&&pageLength>0) minPage=pageLength;
            else minPage=searchPage;
            //防止超过下限
            if (minPage<1){minPage=1;}
            Channels.find({name:new RegExp(search,'i')}).sort({subNum:1}).skip(limit*(minPage-1)).limit(limit).exec(function(err,channels){
                var page=tool.skipPage(minPage,pageLength);
                if (err) return console.log(err);
                callback(err,page,channels);
            });
        },
        function(page,channels,callback){
            if (!req.user) return callback(null,page,channels,[]);
            Channel2User.find({'userId':req.user._id},function(err,channel2user){
                if (err) return console.log(err);
                var channel2userId=[];
                channel2user.forEach(function(item){
                    channel2userId.push(item.channelId+'');
                });
                callback(err,page,channels,channel2userId);
            })
        }],
        function(err,page,channels,channel2userId){
            if (err) return console.log(err);//bug
            channels.forEach(function(item,index,array){
                array[index].isAttention=false;
                if (channel2userId.indexOf(item._id+'')>-1){
                    array[index].isAttention=true;//已经关注
                }
            });
        Package.render('query',{channels:channels,query:search,page:page,user:req.user},function(err,html){
            if (err) console.log(err);
            res.send(html);
        });       
    })
};

exports.web_api_discovery = function(req, res) {
  var searchMax = 15;
  var keyword = req.query.keyword;
  if (!myVerify.isString(keyword)) {return res.status(400).send({info:'参数类型错误'})}
  if(keyword.length >= searchMax) {
    keyword = keyword.substr(0, searchMax);
  }
  keyword=tool.stripscript(keyword);//过滤非法字符
  Channels.find({name: new RegExp(keyword, 'i')}).sort({subNum: 1}).exec(function(err, channels) {
    if (channels.length > 0)
      res.json({message: 'ok', data: channels})
    else
      res.json({message: '未找到'})
  });
};



