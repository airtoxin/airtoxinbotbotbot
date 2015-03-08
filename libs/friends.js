var Friends = ( function () {
	return function ( friendsObj ) {
		var self = this;

		self.friends = friendsObj;
	};
}() );

module.exports = Friends;
