

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
		$("html, body").animate({ scrollTop: 0 }, "slow");
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
				iLoveLAMP.getServers(function(){iLoveLAMP.setTheme()}, true);
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
				$("#server_theme").val($(this).val() === "NEW" ? "DEFAULT" : resp.data[$(this).val()].THEME);
				$("#is_default_server").prop("checked", $(this).val() !== "NEW" && resp.data[$(this).val()].DEFAULT);
				$("#srever_pw").val('');
				$(".error_log_row").remove();
				if($(this).val() !== "NEW"){
					for(var logName in resp.data[$(this).val()].LOGS){
						if(!resp.data[$(this).val()].LOGS.hasOwnProperty(logName)) continue;
						addErrorLogRow();
						$(".error_log_row").last().find("input").first().val(logName);
						$(".error_log_row").last().find("input").last().val(resp.data[$(this).val()].LOGS[logName]);
					}
				}
			});
			$("#submit_server_changes").click(function(){
				var server = {};
				server.orig_name = $("#all_servers_dd").val();
				server.new_name = $("#server_title").val();
				server.host = $("#srever_host").val();
				server.user = $("#srever_user").val();
				server.theme = $("#server_theme").val();
				server.logs = {};
				$(".error_log_row").each(function(){
					server.logs[$(this).find("input").first().val()] = $(this).find("input").last().val();
				});
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
			
			$("#add_log_file").click(addErrorLogRow);
			
		});
		
		$(document).on('click', '.removeLog', closeLog);
	}
	
	function addErrorLogRow(){
		$('<div class="row error_log_row" style="margin-bottom: 1em"><div class="col-md-4">'+
			'<input type="text" class="form-control" placeholder="Log Name">'+
			'</div><div class="col-md-8"><div class="input-group">'+
			'<input type="text" class="form-control" placeholder="Log Path">'+
			'<span class="input-group-btn">'+
			'<button class="btn btn-danger removeLog" type="button"> <i class="fa fa-minus-square"></i> </button></span>'+
			'</div></div></div>').insertBefore("#add_log_file");
	}
	
	function closeLog(){
		$(this).parent().parent().parent().parent().remove();
	}
		
	function exit(){
		$(document).off('click', '.removeLog', closeLog);
	}
		
	return {
		requiresServer: false,
		title: "Manage Servers",
		icon: "sitemap",
		init: init,
		exit: exit
	};
})();
