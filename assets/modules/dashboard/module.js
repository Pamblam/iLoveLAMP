iLoveLAMP.modules.dashboard = (function(){
	
	var isOpen = false;
	
	function exit(){
		isOpen = false;
	}
	
	function getResources(cb){
		if(typeof cb !== "function") return;
		iLoveLAMP.api("get_resources", {server: iLoveLAMP.currentServer}).then(cb);
	}
	
	function init(){
		isOpen = true;
		$('#chart_div').hide();
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
				getResources(function(resp){
					$('#chart_div').show();
					var availablePhysical = parseFloat(resp.data.MEMORY.PHYSICAL.AVAILABLE.substr(0, resp.data.MEMORY.PHYSICAL.AVAILABLE.indexOf("mb")));
					var inUsePhysical = parseFloat(resp.data.MEMORY.PHYSICAL.IN_USE.substr(0, resp.data.MEMORY.PHYSICAL.IN_USE.indexOf("mb")));
					var val = inUsePhysical / availablePhysical * 100;
					google.charts.load('current', {'packages':['gauge']});
					google.charts.setOnLoadCallback(function(){
						var data = google.visualization.arrayToDataTable([
							['Label', 'Value'],
							['Memory', val]
						]);

						var options = {
							width: 400, height: 120,
							redFrom: 90, redTo: 100,
							yellowFrom: 75, yellowTo: 90,
							minorTicks: 5
						};

						console.log(resp, options); 

						var chart = new google.visualization.Gauge($('#chart_div')[0]);

						chart.draw(data, options);

						(function refreshProcesses(){
							if(isOpen) getResources(function(resp){ 
								var availablePhysical = parseInt(resp.data.MEMORY.PHYSICAL.AVAILABLE.substr(0, resp.data.MEMORY.PHYSICAL.AVAILABLE.indexOf("mb")));
								var inUsePhysical = parseInt(resp.data.MEMORY.PHYSICAL.IN_USE.substr(0, resp.data.MEMORY.PHYSICAL.IN_USE.indexOf("mb")));
								var val = inUsePhysical / availablePhysical * 100;
								data.setValue(0, 1, val);
								chart.draw(data, options);
								if(isOpen) setTimeout(refreshProcesses, 3000);
							});
						})();
					});
				});
			}
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