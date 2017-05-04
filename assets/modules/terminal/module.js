

iLoveLAMP.modules.terminal = (function(){
	var persistCommands = [];
	var persisttNext = false;
	
	function init(){
		persistCommands = [];
		persisttNext = false;
		iLoveLAMP.getServer(iLoveLAMP.currentServer, function(server){
			$("#terminal").Terminal({
				hostname: server.HOST,
				username: server.USER,
				io: function(input, output, done){
					if(persistCommands.length) input = persistCommands.join("; ")+"; "+input;
					if(persisttNext) persistCommands.push(input);
					iLoveLAMP.api("terminal", {server: iLoveLAMP.currentServer, cmd: input}).then(function(resp){
						persisttNext = false;
						$("#persistcmdbtn").removeClass("btn-success").addClass("btn-primary").html('<span class="glyphicon glyphicon-flag"></span> Persist Next Command');
						output(resp.data.trim());
						done();
					});
				}
			});
		});
		$("#dlshell").click(function(e){
			e.preventDefault();
			$f = $("<form action=./assets/API.php method=POST>")
					.append("<input type=hidden name=server value='"+iLoveLAMP.currentServer+"' />")
					.append("<input type=hidden name=action value='dlshell' />")
					.appendTo('body')
					.submit()
					.remove();
			var text = "Before the shell script can be run, you need to make it executable:"+
				"<pre><code>sudo chmod +x /path/to/script</code></pre>";
			iLoveLAMP.BSAlert(text);
		});
		$("#persistcmdbtn").click(function(e){
			e.preventDefault();
			persisttNext = !persisttNext;
			if(persisttNext){
				$(this).removeClass("btn-primary").addClass("btn-success").html('<span class="glyphicon glyphicon-flag"></span> Persisting...');
			}else{
				$(this).removeClass("btn-success").addClass("btn-primary").html('<span class="glyphicon glyphicon-flag"></span> Persist Next Command');
			}
		});
	}
	
	return {
		requiresServer: true,
		title: "Terminal",
		icon: "terminal",
		init: init
	};
})();
