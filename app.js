var _ = require( 'lodash' );
var config = require( 'config' );
var async = require( 'neo-async' );
var Twitter = require( 'twitter' );
var Brain = require( './libs/brain' );
var Tweet = require( './libs/tweet' );

var Bot = ( function () {
	return function () {
		var self = this;

		var brain = new Brain();

		var client = new Twitter( {
			consumer_key: config.auth.consumer_key,
			consumer_secret: config.auth.consumer_secret,
			access_token_key: config.auth.access_token_key,
			access_token_secret: config.auth.access_token_secret
		} );

		self.errorHandler = function ( error ) { if ( error ) { console.log("@error:", error); } };
		self.nope = function () {};

		self.startStreaming = function () {
			client.stream( 'user', {}, function ( stream ) {
				stream.on( 'data', function ( tw ) {
					if ( !tw.id ) return;

					var tweet = new Tweet( tw );
					self.watchLearn( tweet );
					self.watchReply( tweet );
					self.watchFavorite( tweet );
				} ).on( 'error', self.errorHandler );
			} );
		};

		self.watchReply = function ( tweet ) {
			if ( !_.includes( tweet.getMentions(), self.settings.screen_name ) ) return;

			setTimeout( function () {
				self.sendReply( tweet );
			}, _.random( config.reply.min_time, config.reply.max_time ) );
		};

		self.sendReply = function ( tweet ) {
			var reply = '@' + tweet.getUserScreenName() + ' ' + brain.getReplyText();
			reply = reply.slice( 0, 140 );

			client.post( 'statuses/update', {
				status: reply,
				in_reply_to_status_id: tweet.getID()
			}, self.errorHandler );
		};

		self.watchFavorite = function ( tweet ) {
			if ( tweet.getUserScreenName() === self.settings.screen_name ) { return; }
			if ( !brain.isFavoriteText( tweet.getFlatText() ) ) { return; }

			setTimeout( function () {
				self.createFavorite( tweet );
			}, _.random( config.bot.favorite.min_time, config.bot.favorite.max_time ) );
		};

		self.createFavorite = function ( tweet ) {
			client.post( 'favorites/create', {
				id: tweet.getID(),
				include_entities: false
			}, self.errorHandler );
		};

		self.watchLearn = function ( tweet ) {
			if ( !_.includes( config.bot.teachers, tweet.getUserScreenName() ) ) { return; }
			brain.learn( tweet );
		};

		self.initialize = function ( callback ) {
			async.each( config.bot.teachers, function ( teacher, nextTeacher ) {
				var sinceID = null;
				async.eachSeries( _.range( 1, 11 ), function ( i, nextIndex ) {
					var options = {
						screen_name: teacher,
						count: 200,
						exclude_replies: true,
						include_rts: false
					};
					if ( sinceID ) options.since_id = sinceID;
					client.get( 'statuses/user_timeline', options, function ( error, tweets ) {
						if ( error ) return nextIndex( error );
						sinceID = ( new Tweet( tweets[ tweets.length - 1 ] ) ).getID();
						async.each( tweets, function ( tw, nextTw ) {
							brain.learn( new Tweet( tw ) );
							nextTw();
						}, nextIndex );
					} );
				}, nextTeacher );
			}, callback );
		};

		self.startTweeting = function () {
			self.sendTweet();
			setInterval( self.sendTweet, config.tweet.span );
		};

		self.sendTweet = function () {
			var text = brain.getTweetText();
			client.post( 'statuses/update', {
				status: text
			}, self.errorHandler );
		};

		self.start = function () {
			if ( !brain.loadFromDump ) {
				self.initialize( function ( error ) {
					console.log("@error:", error);
					self._start();
				} );
			} else {
				self._start();
			}
		};

		self._start = function () {
			client.get( 'account/settings', {}, function ( error, settings ) {
				self.settings = settings;
				self.startStreaming();
				self.startTweeting();
			} );
		};
	};
}() );

var bot = new Bot();
bot.start();
