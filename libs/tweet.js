var _ = require( 'lodash' );
var Tweet = ( function () {
	return function ( tweetObj ) {
		var self = this;

		self.tweet = tweetObj;
		// self.tweet = { created_at: 'Thu Mar 05 15:22:05 +0000 2015',
  // id: 573503755565449200,
  // id_str: '573503755565449217',
  // text: '@airtoxinbotbot @airtoxinbotbot @airtoxinbotbot テスト #テスト https://t.co/Qt3IdudASn #wef http://t.co/QQFvOBmbAj',
  // source: '<a href="http://itunes.apple.com/us/app/twitter/id409789998?mt=12" rel="nofollow">Twitter for Mac</a>',
  // truncated: false,
  // in_reply_to_status_id: null,
  // in_reply_to_status_id_str: null,
  // in_reply_to_user_id: 1299385009,
  // in_reply_to_user_id_str: '1299385009',
  // in_reply_to_screen_name: 'airtoxinbotbot',
  // user:
  //  { id: 388737036,
  //    id_str: '388737036',
  //    name: 'ドロドロロリえあんぬ',
  //    screen_name: '_eannu_',
  //    location: '',
  //    profile_location: null,
  //    url: null,
  //    description: 'あきらめたく…ない……アイドル…諦めたくない！！',
  //    protected: false,
  //    followers_count: 985,
  //    friends_count: 1242,
  //    listed_count: 48,
  //    created_at: 'Tue Oct 11 08:04:33 +0000 2011',
  //    favourites_count: 71298,
  //    utc_offset: -36000,
  //    time_zone: 'Hawaii',
  //    geo_enabled: true,
  //    verified: false,
  //    statuses_count: 36590,
  //    lang: 'ja',
  //    contributors_enabled: false,
  //    is_translator: false,
  //    is_translation_enabled: false,
  //    profile_background_color: '131516',
  //    profile_background_image_url: 'http://pbs.twimg.com/profile_background_images/461521619467239424/2x5MXm0v.jpeg',
  //    profile_background_image_url_https: 'https://pbs.twimg.com/profile_background_images/461521619467239424/2x5MXm0v.jpeg',
  //    profile_background_tile: true,
  //    profile_image_url: 'http://pbs.twimg.com/profile_images/419268293950578688/7pr8-C4K_normal.jpeg',
  //    profile_image_url_https: 'https://pbs.twimg.com/profile_images/419268293950578688/7pr8-C4K_normal.jpeg',
  //    profile_banner_url: 'https://pbs.twimg.com/profile_banners/388737036/1398610296',
  //    profile_link_color: '2F52DE',
  //    profile_sidebar_border_color: 'FFFFFF',
  //    profile_sidebar_fill_color: 'DDEEF6',
  //    profile_text_color: '333333',
  //    profile_use_background_image: true,
  //    default_profile: false,
  //    default_profile_image: false,
  //    following: null,
  //    follow_request_sent: null,
  //    notifications: null },
  // geo: null,
  // coordinates: null,
  // place: null,
  // contributors: null,
  // retweet_count: 0,
  // favorite_count: 0,
  // entities:
  //  { hashtags:
  //     [ { text: 'テスト', indices: [ 52, 56 ] },
  //       { text: 'wef', indices: [ 81, 85 ] } ],
  //    symbols: [],
  //    user_mentions:
  //     [ { screen_name: 'airtoxinbotbot',
  //         name: 'airtoxinbotbot',
  //         id: 1299385009,
  //         id_str: '1299385009',
  //         indices: [ 0, 15 ] },
  //       { screen_name: 'airtoxinbotbot',
  //         name: 'airtoxinbotbot',
  //         id: 1299385009,
  //         id_str: '1299385009',
  //         indices: [ 16, 31 ] },
  //       { screen_name: 'airtoxinbotbot',
  //         name: 'airtoxinbotbot',
  //         id: 1299385009,
  //         id_str: '1299385009',
  //         indices: [ 32, 47 ] } ],
  //    urls:
  //     [ { url: 'https://t.co/Qt3IdudASn',
  //         expanded_url: 'https://dev.twitter.com/overview/api/entities',
  //         display_url: 'dev.twitter.com/overview/api/e…',
  //         indices: [ 57, 80 ] } ],
  //    media:
  //     [ { id: 573503754923720700,
  //         id_str: '573503754923720704',
  //         indices: [ 86, 108 ],
  //         media_url: 'http://pbs.twimg.com/media/B_V-oGWUwAARQM7.jpg',
  //         media_url_https: 'https://pbs.twimg.com/media/B_V-oGWUwAARQM7.jpg',
  //         url: 'http://t.co/QQFvOBmbAj',
  //         display_url: 'pic.twitter.com/QQFvOBmbAj',
  //         expanded_url: 'http://twitter.com/_eannu_/status/573503755565449217/photo/1',
  //         type: 'photo',
  //         sizes:
  //          { small: { w: 340, h: 340, resize: 'fit' },
  //            thumb: { w: 150, h: 150, resize: 'crop' },
  //            medium: { w: 600, h: 600, resize: 'fit' },
  //            large: { w: 600, h: 600, resize: 'fit' } } } ] },
  // extended_entities:
  //  { media:
  //     [ { id: 573503754923720700,
  //         id_str: '573503754923720704',
  //         indices: [ 86, 108 ],
  //         media_url: 'http://pbs.twimg.com/media/B_V-oGWUwAARQM7.jpg',
  //         media_url_https: 'https://pbs.twimg.com/media/B_V-oGWUwAARQM7.jpg',
  //         url: 'http://t.co/QQFvOBmbAj',
  //         display_url: 'pic.twitter.com/QQFvOBmbAj',
  //         expanded_url: 'http://twitter.com/_eannu_/status/573503755565449217/photo/1',
  //         type: 'photo',
  //         sizes:
  //          { small: { w: 340, h: 340, resize: 'fit' },
  //            thumb: { w: 150, h: 150, resize: 'crop' },
  //            medium: { w: 600, h: 600, resize: 'fit' },
  //            large: { w: 600, h: 600, resize: 'fit' } } } ] },
  // favorited: false,
  // retweeted: false,
  // possibly_sensitive: false,
  // lang: 'ja',
  // timestamp_ms: '1425568925168' };

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

		self.getID = function () {
			return self.tweet.id_str;
		};
	};
}() );

module.exports = Tweet;
