

iLoveLAMP.modules.processes = (function(){
	
	var dt; // the datatable instance
	var lastUpdate = 0;
	var int;
	
	function secondsToString(seconds){
		var numyears = Math.floor(seconds / 31536000);
		var numdays = Math.floor((seconds % 31536000) / 86400);
		if(numyears > 0) return numyears + " year"+(numyears!==1?"s":"")+", " + numdays + " day"+(numdays!==1?"s":"");
		var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
		if(numdays > 0) return numdays + " day"+(numdays!==1?"s":"")+", " + numhours + " hour"+(numhours!==1?"s":"");
		var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
		if(numhours > 0) return numhours + " hour"+(numhours!==1?"s":"")+", " + numminutes + " minute"+(numminutes!==1?"s":"");
		var numseconds = Math.floor((((seconds % 31536000) % 86400) % 3600) % 60);
		if(numminutes > 0) return numminutes + " minute"+(numminutes!==1?"s":"")+", " + numseconds + " second"+(numseconds!==1?"s":"");
		else return numseconds + " second"+(numseconds!==1?"s":"");
	}
	
	function getProcesses(cb){
		if(typeof cb !== "function") return;
		$.ajax({
			url: "./assets/API.php",
			data: {
				action: "get_processes",
				server: iLoveLAMP.currentServer
			},
			type: "POST"
		}).done(cb);
	}
	
	function init(){
		$(".reloadBtn").html('<i class="fa fa-hourglass-1"></i> Loading...').prop('disabled', true);
		var glass = 1;
		var hg = setInterval(function(){
			glass++;
			if(glass === 4) glass = 1;
			$(".reloadBtn").html('<i class="fa fa-hourglass-'+glass+'"></i> Loading...').prop('disabled', true);
		},750);
		getProcesses(function(processes){
			clearInterval(hg);
			$(".reloadBtn").html('<span class="glyphicon glyphicon-refresh"></span> Refresh').prop('disabled', false).removeProp('disabled').removeClass("btn-disabled");
			lastUpdate = new Date().getTime()/1000;
			if(!int){
				int = setInterval(function(){
					var seconds = (new Date().getTime()/1000) - lastUpdate;
					var disp = secondsToString(seconds);
					$("#seccounter").text(disp);
				}, 1000);
			}
			var columns = [];
			var buf = ['<table class="table table-striped table-hover table-condensed"><thead><tr><th>Kill</th>'];
			$(".columnsList").find("label").each(function(){
				columns.push($(this).find("input").val());
				buf.push('<th>'+$(this).text().trim()+'</th>');
			});
			buf.push("</tr></thead><tbody>");
			for(var i = 0; i < processes.data.length; i++){
				buf.push("<tr><td> <span class='glyphicon glyphicon-minus killtask' data-pid='"+processes.data[i].PID+"'></span> </td>");
				for(var n=0; n<columns.length; n++)
					buf.push("<td>"+processes.data[i][columns[n]]+"</td>");
				buf.push("</tr>");
			}
			buf.push("</tbody></table>");
			$(".processes-table").html(buf.join(''));
			dt = $(".processes-table").find("table").DataTable({
				"scrollX": true,
				columnDefs: [
					{ orderable: false, targets: [0] }
				],
				"order": [[2, 'desc']],
			});
			var col_id = 1;
			$(".columnsList").find("label").each(function(){
				if(!$(this).find("input").is(":checked")){
					var column = dt.column(col_id);
					column.visible(!column.visible());
				}
				(function(col_id, $el){
					$el.change(function(){
						var column = dt.column(col_id);
						column.visible(!column.visible());
					});
				})(col_id, $(this));
				col_id++;
			});
			$(".killtask").click(function(){
				var _this = this;
				if(confirm("Are you sure you wanna kill this task?")){
					$.ajax({
						url: "./assets/API.php",
						data: {
							action: "kill_process",
							server: iLoveLAMP.currentServer,
							pid: $(this).data("pid")
						},
						type: "POST"
					}).done(function(){
						$(_this).parent().parent().remove();
					});
				}
			});
			$(".reloadBtn").click(init);
		});
	}
	
	function exit(){
		if(int) clearInterval(int);
	}
	
	return {
		requiresServer: true,
		title: "Processes",
		icon: "tasks",
		init: init,
		exit: exit
	};
})();
