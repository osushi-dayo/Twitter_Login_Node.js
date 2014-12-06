//アプリケーションのホストとポート
exports.host = "127.0.0.1";
exports.port = "3000";

//セッション管理にデータベースを使用。
//mongodが起動していれば.存在しない名前でも自動で新規作成してくれる。
exports.db_name = "twitter_login_sample";
exports.db_host = "127.0.0.1";// データベースのホスト

//Twitterのトークン
//アクセストークンはsignin_with_twitterのみの場合は不要
exports.CONSUMER_KEY =        'YOUR_CONSUMER_KEY';
exports.CONSUMER_SECRET =     'YOUR_CONSUMER_SECRET';
exports.ACCESS_TOKEN_KEY =    'YOUR_ACCESS_TOKEN_KEY';
exports.ACCESS_TOKEN_SECRET = 'YOUR_ACCESS_TOKEN_SECRET';

//推測されない文字列
exports.session_key = "RANDOM_STR";
exports.session_key_secret = "RANDOM_STR";

