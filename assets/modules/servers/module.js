

iLoveLAMP.modules.servers = (function(){
	
	function showError(err){
		$("#server_mod_success").hide();
		$("#server_mod_error").html("<strong>Error: </strong> "+err).show();
		setTimeout(function(){
			$("#server_mod_error").hide();
		}, 5000);
	}
	
	function showSuccess(success){
		$("#server_mod_error").hide();
		$("#server_mod_success").html("<strong>Success: </strong> "+success).show();
		setTimeout(function(){
			$("#server_mod_success").hide();
		}, 5000);
	}
	
	function validateAndSave(server){
		$.ajax({
			url: "./assets/API.php",
			data: {
				action: "check_server",
				server: server
			},
			type: "POST"
		}).done(function(resp){
			if(resp.success){
				$("#all_servers_dd").find("option").each(function(){
					if($(this).val() === server.orig_name) $(this).val(server.new_name);
				});
				showSuccess(resp.response);
				iLoveLAMP.getServers(function(){}, true);
			}else{
				showError(resp.response);
			}
		});
	}
	
	function init(){
		iLoveLAMP.getServers(function(resp){
			
			for(var server in resp.data){
				if(!resp.data.hasOwnProperty(server)) continue;
				$("#all_servers_dd").append("<option value='"+server+"'>"+server+"</option>");
			}
			
			$("#all_servers_dd").change(function(){
				$("#server_title").val($(this).val() === "NEW" ? "" : resp.data[$(this).val()].NAME);
				$("#srever_host").val($(this).val() === "NEW" ? "" : resp.data[$(this).val()].HOST);
				$("#srever_user").val($(this).val() === "NEW" ? "" : resp.data[$(this).val()].USER);
				$("#server_error_logs").val($(this).val() === "NEW" ? "" : resp.data[$(this).val()].ERROR_LOG);
				$("#server_access_logs").val($(this).val() === "NEW" ? "" : resp.data[$(this).val()].ACCESS_LOG);
				$("#is_default_server").prop("checked", $(this).val() !== "NEW" && resp.data[$(this).val()].DEFAULT);
				$("#srever_pw").val('');
			});
			$("#submit_server_changes").click(function(){
				var server = {};
				server.orig_name = $("#all_servers_dd").val();
				server.new_name = $("#server_title").val();
				server.host = $("#srever_host").val();
				server.user = $("#srever_user").val();
				server.error_log = $("#server_error_logs").val();
				server.access_log = $("#server_access_logs").val();
				server.pass = $("#srever_pw").val();
				server.default = $("#is_default_server").is(":checked") ? 1 : 0;
				if([server.new_name, server.host, server.user].indexOf("") > -1)  return showError("Title, host, user and password are required.");
				if($("#is_default_server").is(":checked")){
					for(var s in resp.data){
						if(!resp.data.hasOwnProperty(s)) continue;
						resp.data[s].DEFAULT = false;
					}
					if("NEW"!==server.orig_name) resp.data[server.orig_name].DEFAULT = true;
				}
				if(server.orig_name !== server.new_name){
					resp.data[server.new_name] = resp.data[server.orig_name];
					delete resp.data[server.orig_name];
				}
				validateAndSave(server);
			});
			
		});
	}
	
	return {
		requiresServer: false,
		title: "Manage Servers",
		icon: "sitemap",
		init: init
	};
})();
