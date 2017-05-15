iLoveLAMP.modules.dashboard = (function(){
	
	var isOpen = false;
	var timeKeeperInterval = false;
	var lastUpdate;
	var mem_chart, mem_data;
	var swap_chart, swap_data;
	var sys_chart, sys_data;
	var user_chart, user_data;
	
	function exit(){
		isOpen = false;
		if(timeKeeperInterval) clearInterval(timeKeeperInterval);
		mem_chart = undefined;
		swap_chart = undefined;
		sys_chart = undefined;
		mem_data = undefined;
		swap_data = undefined;
		sys_data = undefined;
		user_data = undefined;
		user_data = undefined;
	}
	
	function getResources(){
		iLoveLAMP.api("get_resources", {server: iLoveLAMP.currentServer}).then(function(resp){
			$('#memory-gauge').show();
			$('#swap-gauge').show();
			$('#sys-gauge').show();
			$('#user-gauge').show();

			var guage_options = {
				width: 75, height: 75,
				redFrom: 90, redTo: 100,
				yellowFrom: 75, yellowTo: 90,
				minorTicks: 5
			};
		
			// calculate memory
			var availablePhysical = parseFloat(resp.data.MEMORY.PHYSICAL.AVAILABLE.substr(0, resp.data.MEMORY.PHYSICAL.AVAILABLE.indexOf("mb")));
			var inUsePhysical = parseFloat(resp.data.MEMORY.PHYSICAL.IN_USE.substr(0, resp.data.MEMORY.PHYSICAL.IN_USE.indexOf("mb")));
			var phys = Math.floor(inUsePhysical / availablePhysical * 10000) / 100;

			// calculate memory
			var swap = parseFloat(resp.data.MEMORY.SWAP.AVAILABLE.substr(0, resp.data.MEMORY.SWAP.AVAILABLE.indexOf("mb")));
			var inUsePhysical = parseFloat(resp.data.MEMORY.SWAP.IN_USE.substr(0, resp.data.MEMORY.SWAP.IN_USE.indexOf("mb")));
			var swap = Math.floor(inUsePhysical / availablePhysical * 10000) / 100;

			$("#memory-text").html(phys+"<small>%</small>");
			$("#swap-text").html(swap+"<small>%</small>");
			$("#sys-text").html(resp.data.CPU.SYSTEM_CPU_TIME+"<small>%</small>");
			$("#user-text").html(resp.data.CPU.USER_CPU_TIME+"<small>%</small>");

			google.charts.load('current', {'packages':['gauge']});
			google.charts.setOnLoadCallback(function(){
				mem_data = google.visualization.arrayToDataTable([
					['Label', 'Value'],
					['Memory', phys]
				]);

				swap_data = google.visualization.arrayToDataTable([
					['Label', 'Value'],
					['SWAP', swap]
				]);

				sys_data = google.visualization.arrayToDataTable([
					['Label', 'Value'],
					['Sys CPU', resp.data.CPU.SYSTEM_CPU_TIME]
				]);
				
				user_data = google.visualization.arrayToDataTable([
					['Label', 'Value'],
					['Usr CPU', resp.data.CPU.USER_CPU_TIME]
				]);

				user_chart = new google.visualization.Gauge($('#user-gauge')[0]);
				user_chart.draw(user_data, guage_options);
				
				mem_chart = new google.visualization.Gauge($('#memory-gauge')[0]);
				mem_chart.draw(mem_data, guage_options);

				sys_chart = new google.visualization.Gauge($('#sys-gauge')[0]);
				sys_chart.draw(sys_data, guage_options);

				swap_chart = new google.visualization.Gauge($('#swap-gauge')[0]);
				swap_chart.draw(swap_data, guage_options);

				lastUpdate = new Date().getTime()/1000;
				timeKeeperInterval = setInterval(function(){
					var seconds = (new Date().getTime()/1000) - lastUpdate;
					var disp = secondsToString(seconds);
					$(".last-resource-update").html("As of "+disp+" ago");
				}, 1000);

			});
		});
	}
	
	function secondsToString(seconds){
		var numyears = Math.floor(seconds / 31536000);
		var numdays = Math.floor((seconds % 31536000) / 86400);
		if(numyears > 0) return numyears + " year"+(numyears!==1?"s":"");
		var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
		if(numdays > 0) return numdays + " day"+(numdays!==1?"s":"");
		var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
		if(numhours > 0) return numhours + " hour"+(numhours!==1?"s":"");
		var numseconds = Math.floor((((seconds % 31536000) % 86400) % 3600) % 60);
		if(numminutes > 0) return numminutes + " minute"+(numminutes!==1?"s":"");
		else return numseconds + " second"+(numseconds!==1?"s":"");
	}
	
	function init(){
		isOpen = true;
		$('#memory-gauge').hide();
		$('#swap-gauge').hide();
		$('#sys-gauge').hide();
		$('#user-gauge').hide();
		
		iLoveLAMP.api("get_modules", {}).then(function(resp){
			// wait for all modules to load
			(function wait(done){
				setTimeout(function(){
					var safe = true;
					for(var i=resp.data.length; i--;){ 
						if(undefined === iLoveLAMP.modules[resp.data[i]])
							safe = false;
					}
					if(safe) done();
					else wait(done);
				}, 50);
			})(function(){
				var row = false;
				for(var i=0; i<resp.data.length; i++){
					if(i % 6 === 0){
						if(!row){
							row = $('<div class="row text-center pad-top">');
						}else{
							$("#dashWrapper").append(row);
							row = $('<div class="row text-center">');
						}
					}
					row.append('<div class="col-lg-2 col-md-2 col-sm-2 col-xs-6"><div class="div-square"><a href="#" data-mod='+resp.data[i]+' class=change_mod><i class="fa fa-'+iLoveLAMP.modules[resp.data[i]].icon+' fa-5x"></i><h4>'+iLoveLAMP.modules[resp.data[i]].title+'</h4></a></div></div>');
				}
				if(row) $("#dashWrapper").append(row);
			});
			
			if(iLoveLAMP.currentServer){
				$(".refresh-resources").click(function(e){
					e.preventDefault();
					getResources();
				});
				
				getResources();
			}else $(".guages-row").hide();
		});
	}
	
	return {
		requiresServer: false,
		title: "Dashboard",
		icon: "desktop",
		init: init,
		exit: exit
	};
})();