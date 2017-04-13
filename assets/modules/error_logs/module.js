iLoveLAMP.modules.error_logs = (function(){
	
	function init(){
		$.ajax({
			url: "./assets/API.php",
			data: {
				action: "error_logs",
				server: iLoveLAMP.currentServer
			},
			type: "POST"
		}).done(function(resp){
			console.log(resp);
		});
	}
	
	return {
		requiresServer: true,
		title: "Error Logs",
		icon: "exclamation-triangle",
		init: init
	};
})();