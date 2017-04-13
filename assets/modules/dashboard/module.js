iLoveLAMP.modules.dashboard = (function(){
	
	function init(){
		$.ajax({
			url: "./assets/API.php",
			data: {action: "get_modules"},
			type: "POST"
		}).done(function(resp){
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
		});
	}
	
	return {
		requiresServer: false,
		title: "Dashboard",
		icon: "desktop",
		init: init
	};
})();