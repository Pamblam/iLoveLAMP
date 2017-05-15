

iLoveLAMP.modules.subversion = (function(){
	var wcs = [];
	function init(){
		iLoveLAMP.getServers(function(resp){
			$("#wcsblock").empty();
			var server = resp.data[iLoveLAMP.currentServer];
			for(var name in server.SVNWCS)(function(name){
				if(!server.SVNWCS.hasOwnProperty(name)) return;
				var index = wcs.length;
				wcs.push({name: name, path: server.SVNWCS['name']});	
				iLoveLAMP.api("get_wc_status", {path: server.SVNWCS[name], server: iLoveLAMP.currentServer}).then(function(resp){
					$("#wcsblock").append("<h3 id='wc"+index+"'>"+name+"</h3>");
					for(var i=0; i< resp.data.length; i++)(function(){
						$("#wcsblock").append("<a href=# class='svnobj wc"+i+"'>"+resp.data[i]+"<br></a>");
						$(".wc"+i).click(function(e){
							e.preventDefault();
							var _this = this;
							iLoveLAMP.api("svn_up", {path: $(_this).text().trim(), server: iLoveLAMP.currentServer}).then(function(r){
								$(_this).remove();
							});
						});
					})(i);
				});
			})(name);
			if(!wcs.length) iLoveLAMP.showErrorPage("There are no listed SVN Working Copies for this server. Add some in the Servers module.");
		});
	}
	
	return {
		requiresServer: true,
		title: "Subversion",
		icon: "bar-chart",
		init: init
	};
})();
