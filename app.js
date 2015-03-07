var _ = require( 'lodash' );
var fs = require( 'fs' );
var util = require( 'util' );
var config = require( 'config' );
var async = require( 'neo-async' );
var Twitter = require( 'twitter' );
var Mecab = require( 'mecab-async' );
var Markov = require( 'markoff' );
var Tweet = require( './libs/tweet' );
var NLP = require( './libs/nlp' );
var EventEmitter2 = require( 'eventemitter2' ).EventEmitter2;

var Bot = ( function () {
	return function () {
		var self = this;

		var mecab = new Mecab();
		var markov = new Markov();
		var nlp = new NLP();

		var client = new Twitter( {
			consumer_key: config.auth.consumer_key,
			consumer_secret: config.auth.consumer_secret,
			access_token_key: config.auth.access_token_key,
			access_token_secret: config.auth.access_token_secret
		} );

		self.errorHandle = function ( error ) { if ( error ) { console.log("@error:", error); } };
		self.nope = function () {};

		self.keywords = [];
		self.on( 'tweet', function ( text ) {
			self.keywords = nlp.getKeywords( text );
		} );

		self.startStreaming = function () {
			client.stream( 'user', {}, function ( stream ) {
				stream.on( 'data', function ( tw ) {
					if ( !tw.id ) return;
					self.emit( 'stream', new Tweet( tw ) );
				} ).on( 'error', self.errorHandle );
			} );
		};

		self.watchReply = function ( tweet ) {
			if ( !_.includes( tweet.getMentions(), self.settings.screen_name ) ) return;

			setTimeout( function () {
				self.sendReply( tweet );
			}, _.random( config.reply.min_time, config.reply.max_time ) );
		};
		self.on( 'stream', self.watchReply );

		self.sendReply = function ( tweet ) {
			var reply = '@' + tweet.getUserScreenName() + ' ' + self.getTweetText();
			reply = reply.slice( 0, 140 );

			client.post( 'statuses/update', {
				status: reply,
				in_reply_to_status_id: tweet.getID()
			}, self.errorHandle );
		};

		self.watchFavorite = function ( tweet ) {
			var keywords = nlp.getKeywords( tweet.getFlatText() );

			var isFavorite = _.some( _.map( keywords, function ( keyword ) {
				return _.includes( _.union( config.bot.favorite.always_favorites, self.keywords ), keyword );
			} ) );
			if ( !isFavorite ) { return; }

			setTimeout( function () {
				self.createFavorite( tweet )
			}, _.random( config.bot.favorite.min_time, config.bot.favorite.max_time ) );
		};
		self.on( 'stream', self.watchFavorite );

		self.createFavorite = function ( tweet ) {
			client.post( 'favorites/create', {
				id: tweet.getID(),
				include_entities: false
			}, self.errorHandle );
		};

		self.watchLearn = function ( tweet ) {
			if ( !_.includes( config.bot.teachers, tweet.getUserScreenName() ) ) { return; }
			self.learn( tweet, self.save );
		};
		self.on( 'stream', self.watchLearn );

		self.learn = function ( tweet, callback ) {
			var text = tweet.getFlatText();
			markov.addTokens( nlp.tokenize( text ) );
			callback();
		};

		self.getTweetText = function () {
			return self.join( markov.chain( config.markov.chain_length ) );
		};

		self.initialize = function ( users, callback ) {
			async.each( users, function ( user, nextUser ) {
				var sinceID = null;
				async.eachSeries( _.range( 1, 11 ), function ( i, nextIndex ) {
					var options = {
						screen_name: user,
						count: 200,
						exclude_replies: true,
						include_rts: false
					};
					if ( sinceID ) options.since_id = sinceID;
					client.get( 'statuses/user_timeline', options, function ( error, tweets ) {
						if ( error ) return nextIndex( error );
						sinceID = ( new Tweet( tweets[ tweets.length - 1 ] ) ).getID();
						async.each( tweets, function ( tw, nextTw ) {
							self.learn( new Tweet( tw ), nextTw );
						}, nextIndex );
					} );
				}, nextUser );
			}, callback );
		};

		self.startTweeting = function () {
			var doTweet = function () {
				var text = self.getTweetText();
				client.post( 'statuses/update', {
					status: text
				}, self.errorHandle );
				self.emit( 'tweet', text );
			};

			doTweet();
			setInterval( doTweet, config.tweet.span );
		};

		self.save = function () {
			var serial = markov.save();
			fs.writeFile( './dump.json', JSON.stringify( serial ), { flag: 'w+' }, self.errorHandle );
		};

		self.load = function ( callback ) {
			fs.readFile( './dump.json', function ( error, serial ) {
				markov.load( JSON.parse( serial ) );
				callback();
			} );
		};

		self.join = function ( chains ) {
			return _.reduce( chains, function ( text, chain ) {
				if ( text.match( /[a-zA-Z]$/ ) && chain.match( /^[a-zA-Z]/ ) ) { return text + ' ' + chain; }
				return text + chain;
			}, '' );
		};

		self.start = function () {
			var launch = function () {
				client.get( 'account/settings', {}, function ( error, settings ) {
					self.settings = settings;
					self.startStreaming();
					self.startTweeting();
				} );
			};

			if ( fs.existsSync( './dump.json' ) ) {
				self.load( launch );
			} else {
				self.initialize( config.bot.teachers, function ( error ) {
					self.errorHandle( error );
					self.save();
					launch();
				} );
			}
		};
	};
}() );

util.inherits( Bot, EventEmitter2 );

var bot = new Bot();
bot.start();
