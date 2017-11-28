var _ = require( 'lodash' );
var config = require( 'config' );
var Mecab = require( 'mecab-async' );
if ( config.mecab.dict_path ) Mecab.command = 'mecab -d ' + config.mecab.dict_path;
var mecab = new Mecab();

var NLP = ( function () {
	return function () {
		var self = this;

		self.getKeywords = function ( text ) {
			return _.chain( mecab.parseSync( text ) ).filter( function ( token ) {
				return ( token[ 1 ] === '名詞' && token[ 2 ] === '一般' );
			} ).map( function ( token ) {
				return token[ 0 ];
			} ).value();
		};

		self.tokenize = function ( text ) {
			return mecab.wakachiSync( text );
		};
	};
}() );

module.exports = NLP;
