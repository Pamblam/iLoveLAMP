
var iLoveLAMP = (function ($) {
    "use strict";
	
	$(document).on('click', "#server-ind", function(e){
		e.preventDefault();
		iLoveLAMP.chooseServer();
		return false;
	});
	

    $(document).ready(function () {
		iLoveLAMP.setUp(function(){
			iLoveLAMP.loadModules(function(){
				iLoveLAMP.initServer(function(){
					var initialModule = "dashboard";
					if(window.location.hash && iLoveLAMP.modules[window.location.hash.substr(1)]){
						initialModule = window.location.hash.substr(1);
					}
					iLoveLAMP.loadPage(initialModule);
				});
			});
		});
    });

	$(document).on("click", ".change_mod", function(e){
		e.preventDefault();
		if($(this).data('mod'))
		iLoveLAMP.loadPage($(this).data('mod'));
		return false;
	});
	
	function createCookie(name,value,days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	}

	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}
	
	var AllServers = {};
	var currentTheme = false;
	
    return {

		currentServer: false,
		currentModule: false,
		illSettings: false,
		
		modules: {},
		
		changeSettings:function(settings, cb){
			if("function" !== typeof cb) cb = function(){};
			$.ajax({
				url: "./assets/API.php",
				data: {action: "set_settings", settings: settings},
				type: "POST"
			}).done(cb);
		},
		
		setServer: function(serverName){
			if(iLoveLAMP.illSettings.use_cookies) createCookie("currentServer", serverName, 365);
			iLoveLAMP.currentServer = serverName;
			var theme = AllServers.data[serverName].THEME;
			if(theme === "DEFAULT") theme = iLoveLAMP.illSettings.theme;
			iLoveLAMP.setTheme(theme);
			$("#current_server_display_name").html(serverName);
			// reload current module, if there is a current module
			if(iLoveLAMP.currentModule) iLoveLAMP.loadPage(iLoveLAMP.currentModule);
		},
		
		setUp: function(cb, forceReset){
			forceReset = forceReset || false;
			if("function" !== typeof cb) cb = function(){};
			if(false!== iLoveLAMP.illSettings  && !forceReset) return cb(iLoveLAMP.illSettings);
			$.ajax({
				url: "./assets/API.php",
				data: {action: "get_settings"},
				type: "POST"
			}).done(function(resp){
				iLoveLAMP.illSettings = resp.data;
				if(!resp.data.theme) iLoveLAMP.illSettings.theme = "skin-red-light";
				iLoveLAMP.setTheme(iLoveLAMP.illSettings.theme);
				cb(iLoveLAMP.illSettings);
			});
		},
		
		setTheme: function(theme){
			if(undefined === theme){
				theme = iLoveLAMP.illSettings.theme;
				if(iLoveLAMP.currentServer && AllServers.data[iLoveLAMP.currentServer].THEME !== "DEFAULT")
					theme = AllServers.data[iLoveLAMP.currentServer].THEME;
			}
			if(currentTheme === theme) return;
			var skins = ['skin-blue','skin-blue-light','skin-yellow',	
				'skin-yellow-light','skin-green','skin-green-light',
				'skin-purple','skin-purple-light','skin-red','skin-red-light',
				'skin-black','skin-black-light'];
			for(var i=skins.length; i--;) 
				$("."+skins[i]).removeClass(skins[i]).addClass(theme);
			if(!$("body").hasClass(theme)) $("body").addClass(theme);
			currentTheme = theme;
		},
		
		getServer: function(serverName, cb){
			iLoveLAMP.getServers(function(data){
				var resp = false;
				if(data.data[serverName]) resp = data.data[serverName];
				cb(resp);
			});
		},
		
		getServers: function(cb, forceReset){
			forceReset = forceReset || false;
			if("function" !== typeof cb) cb = function(){};
			if(AllServers.data !== undefined && !forceReset) return cb(AllServers);
			$.ajax({
				url: "./assets/API.php",
				data: {action: "get_servers"},
				type: "POST"
			}).done(function(resp){
				AllServers = resp;
				cb(resp);
			});
		},
		
        loadPage: function (page) {
			iLoveLAMP.getServers(function(resp){
				if((iLoveLAMP.modules[page].requiresServer && iLoveLAMP.modules[page].requiresServer && !iLoveLAMP.currentServer) || Object.keys(AllServers).length < 1) 
					return iLoveLAMP.showErrorPage("This module requires a server. Choose one by clicking the Servers icon in the top right, or add one in the 'Servers' module.");
				if(iLoveLAMP.currentModule !== false && iLoveLAMP.modules[iLoveLAMP.currentModule].exit) iLoveLAMP.modules[iLoveLAMP.currentModule].exit()
				iLoveLAMP.currentModule = page;
				window.location.hash = '#'+page;
				$(".active").removeClass("active");
				$("#page-inner").html("<center style='margin:1em;'><img src='./assets/imgs/loader.gif' /></center>");
				$("#page-inner").load("./assets/modules/"+page+"/ui.html", function(){
					if(iLoveLAMP.modules[page].init) iLoveLAMP.modules[page].init();
				});
				$(".change_mod").each(function(){
					if($(this).data('mod') === page){
						$(this).addClass('active');
					}
				});
			});
        },
		
		loadModules: function(done){
			$.ajax({
				url: "./assets/API.php",
				data: {action: "get_modules"},
				type: "POST"
			}).done(function(resp){
				var counter = 0;
				for(var n=resp.data.length; n--;)(function(i){
					counter++;
					$.getScript("./assets/modules/"+i+"/module.js", function(){
						(function waitForModule(){
							if(iLoveLAMP.modules[i]){
								$("#main-menu").append('<li class="'+(i==='dashboard'?'active':'')+'"><a href="#" data-mod='+i+' class=change_mod><i class="fa fa-'+iLoveLAMP.modules[i].icon+' "></i> <span>'+iLoveLAMP.modules[i].title+'</span></a></li>');
								counter--;
								if(counter === 0) done();
							}else setTimeout(waitForModule, 50);
						})();
					});
				})(resp.data[n]);
			});
		},
		
		showErrorPage: function(msg){
			$("#page-inner").html("<center><h1><i class='fa fa-exclamation-triangle'></i> Wait...</h1><p>"+msg+"</p></center>");
		},
		
		initServer: function(callback){
			if("function" !== typeof callback) callback = function(){};
			iLoveLAMP.getServers(function(resp){
				$(".servercount").html(Object.keys(resp.data).length);
				if(!iLoveLAMP.illSettings.use_cookies || !readCookie("currentServer")){
					for(var server in resp.data)
						if(resp.data.hasOwnProperty(server) && resp.data[server].DEFAULT && resp.data[server].DEFAULT === true)
							iLoveLAMP.setServer(server);
				}else{
					iLoveLAMP.setServer(readCookie("currentServer"));
				}
				if(!iLoveLAMP.currentServer && Object.keys(resp.data).length > 0) iLoveLAMP.chooseServer(callback);
				else if(Object.keys(resp.data).length > 0){
					callback();
				}else callback();
			});
		},
		
		chooseServer: function(callback){
			if("function" !== typeof callback) callback = function(){};
			iLoveLAMP.getServers(function(resp){
				if(Object.keys(resp.data).length > 0){
					var htmlBuffer = [];
					htmlBuffer.push("<h3>Choose a server to use for this session</h3>");
					htmlBuffer.push("<p>You can change the server at any time by clicking the <i class='fa fa-server'></i> Servers icon at the top of the page.</p>");
					htmlBuffer.push('<div class="form-group"><label for="server_chooser_dd">Choose a Server: </label><select class="form-control" id="server_chooser_dd"><option value="">...</option>');
					for(var server in resp.data)
						if(resp.data.hasOwnProperty(server))
							htmlBuffer.push('<option value="'+server+'">'+server+'</option>');
					htmlBuffer.push('</select></div>');
					iLoveLAMP.BSAlert(htmlBuffer.join(''), callback);
					$("#server_chooser_dd").change(function(){
						if($(this).val() === "") return;
						iLoveLAMP.setServer($(this).val());
					});
				}else{
					iLoveLAMP.BSAlert("<center><h1><i class='fa fa-exclamation-triangle'></i> Wait...</h1><p>You don't have any servers set up yet. Add one in the Servers module.</p></center>");
				}
			});
		},
		
		BSAlert: function(text, cb){
			if("function" !== typeof cb) cb=function(){};
			var mid = "modal"+Math.floor(Math.random() * 10000000000000001);
			var html = '<div class="modal fade" id="'+mid+'" tabindex="-1"'+
				'role="dialog" aria-labelledby="myModalLabel" aria-hidden='+
				'"true"><div class="modal-dialog"><div class="modal-conten'+
				't"><div class="modal-header"><button type="button" class='+
				'"close" aria-label="Close"><span ari'+
				'a-hidden="true">&times;</span></button><h4 class="modal-t'+
				'itle" id="myModalLabel">&nbsp;</h4></div><div class="modal'+
				'-body">'+text+'</div><div class="modal-footer"><button t'+
				'ype="button" class="btn btn-primary close">Ok</button></div></d'+
				'iv></div></div>';
			$('body').append(html); 
			$("#"+mid).find('.close').click(function(){
				$("#"+mid).modal('hide');
				setTimeout(function(){ $("#"+mid).remove(); cb();}, 1000);
			});
			$("#"+mid).modal('show');
		}
	
    }
	
}(jQuery));