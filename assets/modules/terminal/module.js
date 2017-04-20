

iLoveLAMP.modules.terminal = (function(){
	
	function init(){
		$("#terminal").Terminal({
			hostname: "browser",
			username: "javascript",
			io: function(input, output, done){
				var out;
				try{ out= eval(input); }
				catch(e){ out = e.message; }
				if(["string", "number"].indexOf(typeof out) > -1) output(out);
				done();
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
