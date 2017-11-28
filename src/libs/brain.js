var _ = require( 'lodash' );
var fs = require( 'fs' );
var util = require( 'util' );
var path = require( 'path' );
var config = require( 'config' );
var cache = require( 'expire-cache' );
var Markov = require( 'markoff' );
var NLP = require( './nlp' );
var EventEmitter2 = require( 'eventemitter2' ).EventEmitter2;

var Brain = ( function () {
	return function () {
		var self = this;

		var tweetCache = cache.namespace( 'tweet' );
		var favoritedCache = cache.namespace( 'favorited' );
		var replyedCache = cache.namespace( 'replyed' );

		var dumpFilePath = path.join( __dirname, '..', 'dump.json' );

		var markov = new Markov( { stateSize: 2 } );
		var nlp = new NLP();

		self.loadFromDump = false;
		self.keywords = [];
		self._errorHandle = function ( error ) { if ( error ) { console.log("@error:", error); } };

		if ( fs.existsSync( dumpFilePath ) ) {
			var dump = require( dumpFilePath );
			markov.load( dump );
			self.loadFromDump = true;
		}

		self.learn = function ( tweet ) {
			var text = tweet.getFlatText();
			markov.addTokens( nlp.tokenize( text ) );
			self._save();
		};

		self.getTweetText = function () {
			var text = self._join( markov.chain( config.markov.chain_length ) );
			text = text.replace( /EOS/g, '\n' );
			self.keywords = nlp.getKeywords( text );
			return text;
		};

		self.getReplyText = function () {
			return self._join( markov.chain( config.markov.chain_length ) );
		};

		self.isFavoriteText = function ( text ) {
			var keywords = _.union( config.bot.favorite.always_favorites, self.keywords );
			return _.some( _.map( keywords, function ( keyword ) {
				return text.indexOf( keyword ) >= 0;
			} ) );
		};

		self.memorizeTweet = function ( tweet ) {
			var key = tweet.getFlatText();
			var prevCount = favoritedCache.get( key );
			var count = ~~prevCount + 1;

			tweetCache.set( key, count, config.tweet.cache_span );
			if ( count >= config.tweet.burst_threshold ) { self.emit( 'burst:tweet', key, count ); }
		};

		self.memorizeFavorited = function ( favoriteEvent ) {
			var key = favoriteEvent.getDoerScreenName();
			var prevVal = favoritedCache.get( key );
			var val = {
				name: favoriteEvent.getDoerName(),
				count: prevVal ? prevVal.count + 1 : 1
			};

			favoritedCache.set( key, val, config.favorite_event.span );
			if ( val.count >= config.favorite_event.burst_threshold ) { self.emit( 'burst:favorited', val.name, val.count ); }
		};

		self.memorizeReplyed = function ( tweet ) {
			var key = tweet.getUserScreenName();
			var prevVal = replyedCache.get( key );
			var val = {
				name: tweet.getUserName(),
				count: prevVal ? prevVal.count + 1 : 1
			};

			replyedCache.set( key, val, config.reply.cache_span );
			if ( val.count >= config.reply.burst_threshold ) { self.emit( 'burst:replyed', val.name, val.count ); }
		};

		self._save = function () {
			var dump = markov.save();
			fs.writeFile( dumpFilePath, JSON.stringify( dump ), { flag: 'w+' }, self._errorHandle );
		};

		self._join = function ( tokens ) {
			return _.reduce( tokens, function ( text, token ) {
				if ( text.match( /[a-zA-Z]$/ ) && token.match( /^[a-zA-Z]/ ) ) { return text + ' ' + token; }
				return text + token;
			}, '' );
		};
	};
}() );

util.inherits( Brain, EventEmitter2 );

module.exports = Brain;
