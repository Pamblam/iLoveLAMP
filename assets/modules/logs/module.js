iLoveLAMP.modules.logs = (function(){
	
	var currentLog = false;
	var logs = {};
	var rawLogs = "";
	
	function fatalError(msg){
		$("#log_content").html('<div class="alert alert-danger">'+msg+'</div>');
	}
	
	function init(){
		
		iLoveLAMP.getServer(iLoveLAMP.currentServer, function(server){
			if(!server) return iLoveLAMP.showErrorPage("Please choose a server and then reload the Logs module.");
			
			for(var logname in server.LOGS){
				if(!server.LOGS.hasOwnProperty(logname)) continue;
				logs[logname] = server.LOGS[logname];
				currentLog = logname;
				$("#logList").append("<option value='"+currentLog+"'>"+currentLog+"</option>");
			}

			if(!currentLog) return iLoveLAMP.showErrorPage("This server has no logs. Add some and then reload this module, or select another server.");
			$("#logList").val(currentLog);
			
			loadLog(currentLog);
			
			$("#reloadBtn").click(function(){loadLog(currentLog)});
			$("#filter_input").textChange(filterAndDisplay);
			$("#logList").change(function(){
				currentLog = $(this).val();
				loadLog(currentLog);
			});
			$("#logLen").change(filterAndDisplay);
		});
	}
	
	function loadLog(logName){
		iLoveLAMP.api("get_logs", {server: iLoveLAMP.currentServer, log: logName}).then(function(resp){
			rawLogs = resp.data;
			filterAndDisplay();
		});
	}
	
	function filterAndDisplay(){
		var len = $("#logLen").val();
		var filter = $("#filter_input").val().toLowerCase();
		var display = rawLogs.split("\n").filter(function(line){
			return line.toLowerCase().indexOf(filter) > -1;
		}).slice(-1 * len).join("\n");
		$("#logContent").html("<pre>"+display+"</pre>");
		hljs.highlightBlock($("#logContent pre")[0]);
	}
	
	return {
		requiresServer: true,
		title: "Tail Logs",
		icon: "file-text",
		init: init
	};
})();