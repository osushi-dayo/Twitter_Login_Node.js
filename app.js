var express = require('express')
, session = require('express-session')
, http = require('http')
, path = require('path')
, url = require('url')
, bodyParser  = require('body-parser')
, tw = require('twit')
, io = require('socket.io')(http)
, everyauth = require('everyauth')
, ECT = require('ect')
, methodOverride = require('method-override')
, MongoStore = require('connect-mongo')(session);

var app = express();
var settings = require('./settings.js');

if (app.get('env') === 'development'){

}

everyauth.everymodule
    .handleLogout( function (req, res){
        //ログアウト時の処理
    })
    .moduleErrback(function (err){
        if(err){console.log(err);}
    }).findUserById(function (userId, callback) {
        console.log('findByUserId called');
        return callback();
    });

everyauth.twitter
    .consumerKey(settings.CONSUMER_KEY)
    .consumerSecret(settings.CONSUMER_SECRET)
    .moduleTimeout( 10000 )
    .findOrCreateUser( function (session, accessToken, accessSecret, twitUser) {
        //セッションに必要情報を書き込む
        //sessionが他のページにアクセスされた時のreq.sessionで取り出せる
        session.twitteruser = {
            "name":twitUser.screen_name,
            "id_str":twitUser.id_str,
            "SESSION_ACCESS_TOKEN":accessToken,
            "SESSION_ACCESS_TOKEN_SECRET":accessSecret
        };

        //keyにidを持つオブジェクトを返り値として返す。twitUserでなくても良い。
        return twitUser;

    })
    .redirectPath('/signin_with_twitter');//ログイン後のリダイレクト先

app.set('port', process.env.PORT || settings.port);
app.set('views', __dirname + '/views');
app.engine('ect', ECT({ watch: true, root: __dirname + '/views', ext: '.ect' }).render);
app.set('view engine', 'ect');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    key: settings.session_key,
    secret: settings.session_key_secret,
    cookie: {maxAge: 60000 * 15}, // cookieの有効な時間(ms) 15分
    store: new MongoStore({
        db: settings.db_name, // require
        host: settings.db_host, // default: 127.0.0.1
        clear_interval: 60 * 15 // expiredされたセッションを消す間隔(秒) 15分
    })
}));
app.use(everyauth.middleware(app)); //これより上でeveryauthの設定を行う。routerはこの下。
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
var io = require('socket.io').listen(server);


app.get('/', function(req, res){
    res.render('index');
});


app.get('/login',function(req, res){
    //ここにアクセスがあったら「http://localhost:3000/auth/twitter」にリダイレクト
    //ログイン成功したら上のeveryauthのredirectPathで指定したページに戻ってくる
    res.redirect(302, "/auth/twitter");
});


app.get('/single_use', function(req, res){//単一ユーザー

    console.log("single user");

    var T = new tw({
        consumer_key: settings.CONSUMER_KEY,
        consumer_secret: settings.CONSUMER_SECRET,
        access_token: settings.ACCESS_TOKEN_KEY,
        access_token_secret: settings.ACCESS_TOKEN_SECRET
    });
    //ログインしたユーザーのタイムラインを10件取得。(api制限が15回/15分なのでやり過ぎ注意)
    T.get('statuses/home_timeline', {count:10}, function(err, tweetobjects, response) {
        if(err){console.log(err);}
        //tweetobjectsが10件のツイートの情報
        res.render('single_use',{
            test_sentence:"ectテンプレートのパラメータ受け渡しテスト",
            tw_obj:tweetobjects
        });
    });

});


app.get('/signin_with_twitter', function(req, res){//ログイン後はここに飛ぶ

    if(!req.session.twitteruser){//セッションが無効なら
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('Session Timeout!');
        return
    }

    console.log("signin with twitter");
    //console.log(req.session.twitteruser);
    //アクセストークンはsessionに格納されている方のアクセストークンを使う
    var T = new tw({
        consumer_key: settings.CONSUMER_KEY,
        consumer_secret: settings.CONSUMER_SECRET,
        access_token: req.session.twitteruser.SESSION_ACCESS_TOKEN,
        access_token_secret: req.session.twitteruser.SESSION_ACCESS_TOKEN_SECRET
    });
    //ログインしたユーザーのタイムラインを10件取得。(api制限が15回/15分なのでやり過ぎ注意)
    T.get('statuses/home_timeline', {count:10}, function(err, tweetobjects, response) {
        if(err){console.log(err);}
        //tweetobjectsが10件のツイートの情報
        res.render('signin_with_twitter',{
            test_sentence:"ectテンプレートのパラメータ受け渡しテスト",
            tw_obj:tweetobjects
        });
    });


});


//socket.ioを使うときは以下に記述するのでそのままではsessionを使えない
//expressとのsession共有をする必要がある(未実装)
io.on('connection', function (socket) {
    console.log("connected");
});

