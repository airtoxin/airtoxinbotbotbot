var _ = require( 'lodash' );
var Tweet = ( function () {
	return function ( tweetObj ) {
		var self = this;

		self.tweet = tweetObj;

		/*
		メタデータを取り除いたツイートテキストを返す
		 */
		self.getFlatText = function () {
			var indices = self.getIndices();
			var text = self.stripByIndices( self.tweet.text, indices );
			return text.trim();
		};

		self.getIndices = function () {
			var ent = self.tweet.entities;

			var hashtags = ent.hashtags      ? ent.hashtags.map( function ( d ) { return d.indices; } ) : [];
			var medias   = ent.media         ? ent.media.map( function ( d ) { return d.indices; } ) : [];
			var urls     = ent.urls          ? ent.urls.map( function ( d ) { return d.indices; } ) : [];
			var mentions = ent.user_mentions ? ent.user_mentions.map( function ( d ) { return d.indices; } ) : [];
			return ( [] ).concat( hashtags, medias, urls, mentions );
		};

		/*
		textからtwitter indicesの配列の該当箇所を取り除いた新しいtextを返す
		 */
		self.stripByIndices = function ( text, indices ) {
			var indices = _.sortBy( indices, function ( idx ) {
				return -idx[0];
			} );
			return _.reduce( indices, function ( txt, idx ) {
				return txt.slice( 0, idx[ 0 ] ) + txt.slice( idx[ 1 ], text.length );
			}, text );
		};

		self.getMentions = function () {
			if ( _.isEmpty( self.tweet.entities.user_mentions ) ) return [];
			return self.tweet.entities.user_mentions.map( function ( mention ) {
				return mention.screen_name;
			} );
		};

		self.getUserScreenName = function () {
			return self.tweet.user.screen_name;
		};

		self.getUserName = function () {
			return self.tweet.user.name;
		};

		self.getID = function () {
			return self.tweet.id_str;
		};

		self.isRetweet = function () {
			return !!self.tweet.retweeted_status;
		};
	};
}() );

module.exports = Tweet;
