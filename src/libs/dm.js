var DM = ( function () {
	return function ( dmObj ) {
		var self = this;

		self.dm = dmObj;

		self.getSenderScreenName = function () {
			return self.dm.direct_message.sender.screen_name;
		};

		self.getText = function () {
			return self.dm.direct_message.text;
		};
	};
}() );

module.exports = DM;
