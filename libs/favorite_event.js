var FavoriteEvent = ( function () {
	return function ( favoriteEventObj ) {
		var self = this;

		self.favoriteEvent = favoriteEventObj;

		self.getDoerScreenName = function () {
			return self.favoriteEvent.source.screen_name;
		};

		self.getDoerName = function () {
			return self.favoriteEvent.source.name;
		};
	};
}() );

module.exports = FavoriteEvent;
