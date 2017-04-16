iLoveLAMP.modules.logs = (function(){
	
	function init(){
		$.ajax({
			url: "./assets/API.php",
			data: {
				action: "logs",
				server: iLoveLAMP.currentServer
			},
			type: "POST"
		}).done(function(resp){
			console.log(resp);
		});
	}
	
	return {
		requiresServer: true,
		title: "Logs",
		icon: "file-text",
		init: init
	};
})();