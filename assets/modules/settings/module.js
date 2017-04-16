

iLoveLAMP.modules.settings = (function(){
	
	function init(){
		$("#default_theme").val(iLoveLAMP.illSettings.theme);
		
		$("#submit_settings_changes").click(function(){
			$("html, body").animate({ scrollTop: 0 }, "slow");
			var settings = {
				theme: $("#default_theme").val()
			};
			iLoveLAMP.changeSettings(settings, function(resp){
				if(resp.success){
					iLoveLAMP.illSettings = settings;	
					showSuccess(resp.response);
					iLoveLAMP.setTheme();
				}else showError(resp.response);
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
	
	return {
		requiresServer: false,
		title: "Settings",
		icon: "gear",
		init: init
	};
})();
