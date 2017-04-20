

iLoveLAMP.modules.settings = (function(){
	
	function init(){
		iLoveLAMP.setUp(function(){
			checkForUpdates();
			var lastUpdate = new Date(iLoveLAMP.illSettings.last_update).format("m/d/y g:i a");
			if(iLoveLAMP.illSettings.use_cookies !== false) $("#use_cookies").prop("checked", true);
			$("#lastUpdateTime").text(lastUpdate);
			$("#default_theme").val(iLoveLAMP.illSettings.theme);
			$("#submit_settings_changes").click(function(){
				$("html, body").animate({ scrollTop: 0 }, "slow");
				var settings = {
					theme: $("#default_theme").val(),
					use_cookies: $("#use_cookies").is(":checked")
				};
				iLoveLAMP.changeSettings(settings, function(resp){
					if(resp.success){
						iLoveLAMP.illSettings = settings;	
						showSuccess(resp.response);
						iLoveLAMP.setTheme();
					}else showError(resp.response);
				});
			});
		});
	}
	
	function showError(err){
		$("#settings_mod_success").hide();
		$("#settings_mod_error").html("<strong>Error: </strong> "+err).show();
		setTimeout(function(){
			$("#settings_mod_error").hide();
		}, 5000);
	}
	
	function showSuccess(success){
		$("#settings_mod_error").hide();
		$("#settings_mod_success").html("<strong>Success: </strong> "+success).show();
		setTimeout(function(){
			$("#settings_mod_success").hide();
		}, 5000);
	}
	
	var updateInterval = false;
	function doUpdate(){
		$("#updateText").html('iLL is updating now! Please wait.');
		$("#updatestatus").html('<div class="progress"><div class="progress-bar progress-bar-primary progress-bar-striped updatepg" role="progressbar" style="width: 1%"></div></div><div id="udinfo">Initializing update</div>');
		if(updateInterval !== false) return;
		var pendingresp = false;
		updateInterval = setInterval(function(){
			if(pendingresp) return;
			pendingresp = true;
			$.ajax({
				url: "./assets/API.php",
				data: {action: "do_update"},
				type: "POST"
			}).done(function(resp){
				pendingresp = false;
				if(resp.data.completed_pct === 100){
					clearInterval(updateInterval);
					updateInterval = false;
					$("#updateText").html("<b>iLove</b>LAMP is up to date. <span class='glyphicon glyphicon-ok'></span>");
					$("#updatestatus").empty();
				}
				$(".updatepg").css({width: resp.data.completed_pct+"%"});
				$("#udinfo").html(resp.response);
			});
		}, 1000);
	}
	
	function isUpdating(cb){
		$.ajax({
			url: "./assets/API.php",
			data: {action: "is_updating"},
			type: "POST"
		}).done(function(u){
			cb(u.resp)
		});
	}
	
	function checkForUpdates(){
		$.ajax({
			url: "https://api.github.com/repos/Pamblam/iLoveLAMP"
		}).done(function(resp){
			var newUpdateTime = new Date(resp.pushed_at);
			var lastUpdateTime = new Date(iLoveLAMP.illSettings.last_update);
			if(newUpdateTime.getTime() > lastUpdateTime.getTime()){
				isUpdating(function(updating){
					if(updating) return doUpdate();
					$("#updateText").html('An update is available. <a href="#" id="updateNowBtn"><span class="glyphicon glyphicon-exclamation-sign"></span> Update now</a>.');
					$("#updateNowBtn").click(function(e){
						e.preventDefault();
						doUpdate();
					});
				});
			}else{
				$("#updateText").html("<b>iLove</b>LAMP is up to date. <span class='glyphicon glyphicon-ok'></span>");
			}
		});
	}
	
	return {
		requiresServer: false,
		title: "Settings",
		icon: "gear",
		init: init
	};
})();
