var _ = require( 'lodash' );
var config = require( 'config' );
var async = require( 'neo-async' );
var Twitter = require( 'twitter' );
var Brain = require( './libs/brain' );
var Tweet = require( './libs/tweet' );
var DM = require( './libs/dm' );
var Friends = require( './libs/friends' );

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
		self.noop = function () {};

		self.startStreaming = function () {
			client.stream( 'user', {}, function ( stream ) {
				stream.on( 'data', function ( streamData ) {
					self._streamDataFactory( streamData, function ( data, process ) {
						process( data );
					} );
				} ).on( 'error', self.errorHandler );
			} );
		};

		self._streamDataFactory = function ( streamData, callback ) {
			var transform;
			var process = self.noop;

			if ( !_.isEmpty( streamData.direct_message ) ) {
				transform = new DM( streamData );
				process = function ( dm ) {
					self.watchEmergencyShutdown( dm );
				};
			}

			if ( !_.isEmpty( streamData.friends ) ) {
				transform = new Friends( streamData );
			}

			if ( !_.isEmpty( streamData.id ) ) {
				transform = new Tweet( streamData );
				process = function ( tweet ) {
					self.watchLearn( wrapper );
					self.watchReply( wrapper );
					self.watchFavorite( wrapper );
				};
			}

			callback( transform, process );
		};

		self.watchEmergencyShutdown = function ( dm ) {
			if ( dm.getSenderScreenName() !== config.bot.admin ) return;
			if ( dm.getText().indexOf( config.bot.emergency_shutdown_password ) !== 0 ) return;
			self.emergencyShutdown();
		};

		self.emergencyShutdown = function () {
			process.exit( 1 );
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
