var _ = require( 'lodash' );
var config = require( 'config' );
var async = require( 'neo-async' );
var Twitter = require( 'twitter' );
var Brain = require( './libs/brain' );
var Tweet = require( './libs/tweet' );
var DM = require( './libs/dm' );
var Friends = require( './libs/friends' );
var FavoriteEvent = require( './libs/favorite_event' );

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
				} ).on( 'favorite', function ( streamData ) {
					self._streamDataFactory( streamData, function ( data, process ) {
						process( data );
					} );
				} ).on( 'error', self.errorHandler );
			} );
		};

		self._streamDataFactory = function ( streamData, callback ) {
			var transform;
			var process = self.noop;

			// DM Data
			if ( !_.isEmpty( streamData.direct_message ) ) {
				transform = new DM( streamData );
				process = function ( dm ) {
					self.watchEmergencyShutdown( dm );
				};
			}
			// Friends Data
			if ( !_.isEmpty( streamData.friends ) ) {
				transform = new Friends( streamData );
			}
			// Tweet Data
			if ( streamData.id ) {
				transform = new Tweet( streamData );
				process = function ( tweet ) {
					self.watchCommonTweet( tweet );
					self.watchReply( tweet );
					self.watchFavorite( tweet );
				};
			}
			// Favorite Event
			if ( streamData.event === 'favorite' ) {
				transform = new FavoriteEvent( streamData );
				process = function ( favoriteEvent ) {
					self.watchFavoriteEvent( favoriteEvent );
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

		self.watchCommonTweet = function ( tweet ) {
			self.learn( tweet );
			brain.memorizeTweet( tweet );
		};

		brain.on( 'burst:tweet', function ( text, count ) {
			if ( count > config.tweet.burst_threshold ) return;

			setTimeout( function () {
				self.sendTweet( text );
			}, _.random( config.tweet.min_time, config.tweet.max_time ) );
		} );

		self.watchReply = function ( tweet ) {
			if ( tweet.isRetweet() ) return;
			if ( !_.includes( tweet.getMentions(), self.settings.screen_name ) ) return;

			brain.memorizeReplyed( tweet );
			var timeout = setTimeout( function () {
				self.sendReply( tweet );
			}, _.random( config.reply.min_time, config.reply.max_time ) );
		};

		brain.on( 'burst:replyed', function ( userName, count ) {
			if ( count > config.reply.burst_threshold ) return;

			var burstText = userName + 'さんが僕のこと好きすぎます…';
			self.sendTweet( burstText );
		} );

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

		self.watchFavoriteEvent = function ( favoriteEvent ) {
			brain.memorizeFavorited( favoriteEvent );
		};

		brain.on( 'burst:favorited', function ( userName, count ) {
			if ( count % config.favorite_event.burst_threshold !== 0 ) { return; }
			var tweetText = userName + _.reduce( _.range( count ), function ( text, i ) {
				return text + '…';
			},'' )

			setTimeout( function () {
				self.sendTweet( tweetText );
			}, _.random( config.favorite_event.min_time, config.favorite_event.max_time ) );
		} );

		self.learn = function ( tweet ) {
			if ( !_.includes( config.bot.teachers, tweet.getUserScreenName() ) ) { return; }
			brain.learn( tweet );
		};

		self.initialize = function ( callback ) {
			async.each( config.bot.teachers, function ( teacher, nextTeacher ) {
				var maxID = null;
				async.eachSeries( _.range( 1, 51 ), function ( i, nextIndex ) {
					var options = {
						screen_name: teacher,
						count: 200,
						exclude_replies: true,
						include_rts: false
					};
					if ( maxID ) options.max_id = maxID;
					client.get( 'statuses/user_timeline', options, function ( error, tweets ) {
						if ( error ) return nextIndex( error );
						maxID = ( new Tweet( tweets[ tweets.length - 1 ] ) ).getID();
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

		self.sendTweet = function ( text ) {
			text = text || brain.getTweetText();
			client.post( 'statuses/update', {
				status: text
			}, self.errorHandler );
		};

		self.start = function () {
			if ( !brain.loadFromDump ) {
				self.initialize( function ( error ) {
					self.errorHandler( error );
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
