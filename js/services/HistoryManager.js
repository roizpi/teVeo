var HistoryManager = (function(_super,environment){

	__extends(HistoryManager, _super);

	function HistoryManager () {
		// body...
	}

	
	HistoryManager.prototype.hasLastActivity = function() {
		return false;
	};

	HistoryManager.prototype.getLatestActivity = function() {
		return false;
	};

	return HistoryManager;

})(Component,environment);