var _ = require( 'lodash' );
var fs = require( 'fs' );
var path = require( 'path' );
var config = require( 'config' );
var Markov = require( 'markoff' );
var NLP = require( './nlp' );

var Brain = ( function () {
	return function () {
		var self = this;

		var dumpFilePath = path.join( __dirname, '..', 'dump.json' );

		var markov = new Markov();
		var nlp = new NLP();

		self.loadFromDump = false;
		self.keywords = [];
		self._errorHandle = function ( error ) { console.log("@error:", error); };

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
			// var keywords = nlp.getKeywords( text );
			// return _.some( _.map( keywords, function ( keyword ) {
			//	return _.includes( _.union( config.bot.favorite.always_favorites, brain.keywords ), keyword );
			// } ) );
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

module.exports = Brain;
