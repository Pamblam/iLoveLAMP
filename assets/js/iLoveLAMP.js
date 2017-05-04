
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
	var loadingNewPage = false;
	var hash = "";
	setInterval(function () {
		if (location.hash != hash && location.hash !== "" && location.hash !== loadingNewPage) {
			var page = window.location.hash.substr(1);
			if(iLoveLAMP.modules[page] === undefined) return;
			hash = window.location.hash;
			loadingNewPage = hash;
			iLoveLAMP.getServers(function(resp){
				if((iLoveLAMP.modules[page].requiresServer !== undefined && iLoveLAMP.modules[page].requiresServer && !iLoveLAMP.currentServer) || Object.keys(AllServers).length < 1) 
					return iLoveLAMP.showErrorPage("This module requires a server. Choose one by clicking the Servers icon in the top right, or add one in the 'Servers' module.");
				if(iLoveLAMP.currentModule !== false && iLoveLAMP.modules[iLoveLAMP.currentModule].exit) iLoveLAMP.modules[iLoveLAMP.currentModule].exit()
				iLoveLAMP.currentModule = page;
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
				setTimeout(function(){ loadingNewPage = false; }, 150);
			});
		}
	}, 100);
	
    return {

		currentServer: false,
		currentModule: false,
		illSettings: false,
		
		modules: {},
		
		notify: function(msg, cls){
			if(undefined === cls) cls = 'info';
			$.notify(msg, {
				globalPosition: "bottom right",
				className: cls,
				autoHide: false
			});
			var $notify = $('.notifyjs-corner').children().first();
			return {
				close: function(){
					$notify.trigger('notify-hide');
				},
				get: function(){
					return $notify;
				}
			};
		},
		
		api: function(action, data, isUpload){
			return new Promise(function(done){
				var notification = iLoveLAMP.notify("Waiting for server to do: "+action+"  ", "info");
				notification.get().find("[data-notify-text]").append("<img src='https://www.thingiverse.com/img/ajax-loader.gif'>");
				var params = {};
				if(true === isUpload){
					params.cache = false;
					params.processData = false;
					params.contentType = false;
					data.append("action", action);
				}else{
					data.action = action;
				}
				params.url = "./assets/API.php";
				params.data = data;
				params.type = "POST";
				$.ajax(params).done(function(resp){
					notification.close();
					if(resp.hasOwnProperty("success") && !resp.success){
						var n = iLoveLAMP.notify(resp.response, "error"); 
						setTimeout(function(){ n.close(); }, 3000);
					}
					done(resp);
				});
			});
		},
		
		changeSettings:function(settings, cb){
			if("function" !== typeof cb) cb = function(){};
			iLoveLAMP.api("set_settings", {settings: settings}).then(cb);
		},
		
		setServer: function(serverName){
			if(iLoveLAMP.illSettings.use_cookies) createCookie("currentServer", serverName, 365);
			for(var mod in iLoveLAMP.modules){
				if(!iLoveLAMP.modules.hasOwnProperty(mod)) continue;
				if("function" === typeof iLoveLAMP.modules[mod].onServerChange) 
					iLoveLAMP.modules[mod].onServerChange();
			}
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
			iLoveLAMP.api("get_settings", {}).then(function(resp){
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
			iLoveLAMP.api("get_servers", {}).then(function(resp){
				AllServers = resp;
				cb(resp);
			});
		},
		
        loadPage: function (page) {
			window.location.hash = '#'+page;
        },
		
		loadModules: function(done){
			iLoveLAMP.api("get_modules", {}).then(function(resp){
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
		
		Modal: function(title, html, buttons){
			if(!Array.isArray(buttons)) buttons = [];
			var mid = "modal"+Math.floor(Math.random() * 10000000000000001);
			var footer = "";
			if(buttons.length){
				footer = '<div class="modal-footer">';
				for( var i = 0 ; i < buttons.length ; i++ ){
					var icon = buttons[i].icon ? buttons[i].icon : "";
					var btnclass = buttons[i].btnclass ? buttons[i].btnclass : "btn-default";
					footer += "<button type=button class='btn "+btnclass+"'>"+icon+" "+buttons[i].title+" </button>";
				}
				footer += '</div>';
			}
			var html = '<div class="modal fade" id="'+mid+'" tabindex="-1"'+
				'role="dialog" aria-labelledby="myModalLabel" aria-hidden='+
				'"true"><div class="modal-dialog"><div class="modal-conten'+
				't"><div class="modal-header"><h4 class="modal-t'+
				'itle" id="myModalLabel">'+title+'</h4></div><div class="modal'+
				'-body">'+html+'</div>'+footer+'</d'+
				'iv></div></div>';
			$('body').append(html); 
			$("#"+mid).find(".modal-footer").find("button").each(function(i){
				$(this).click(function(){
					buttons[i].action.call($("#"+mid)[0]);
				});
			});
			$("#"+mid).modal('show');
			return mid;
		},
		
		BSAlert: function(text, cb){
			if("function" !== typeof cb) cb=function(){};
			$("#"+mid).find('.ok').click(function(){
				$("#"+mid).modal('hide');
				setTimeout(function(){ $("#"+mid).remove(); ok();}, 1000);
			});
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
	
    };
	
}(jQuery));