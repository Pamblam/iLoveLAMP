

iLoveLAMP.modules.databases = (function(){
	var activeDB = false;
	
	function showResultsTable(results){
		if(!results.length) return $("#sqlresultstable").html("<b>No results to show</b>");
		var htmlbuf = ['<table class="table table-striped table-hover table-condensed"><thead><tr>'];
		for(var header in results[0]){
			if(!results[0].hasOwnProperty(header)) continue;
			htmlbuf.push('<th>'+results[0][header].trim()+'</th>');
		}
		htmlbuf.push("</tr></thead><tbody>");
		for(var i=0; i<results.length; i++){
			htmlbuf.push("<tr>");
			for(var header in results[i]){
				if(!results[i].hasOwnProperty(header)) continue;
				htmlbuf.push('<td>'+results[i][header].trim()+'</th>');
			}
			htmlbuf.push("</tr>");
		}
		htmlbuf.push("</tbody></table>");
		$("#sqlresultstable").html(htmlbuf.join(''));
		
		var dt = $("#sqlresultstable").find("table").DataTable({
			"scrollX": true
		});
		
	}
	
	function runQuery(query, cb){
		if(typeof cb !== "function") cb = function(){};
		iLoveLAMP.api("sql_query", {
			server: iLoveLAMP.currentServer,
			db: activeDB,
			query: query
		}).then(function(resp){
			cb(resp.data);
		});
	}
	
	function loadDB(db){
		activeDB = db;
		runQuery("show tables", function(res){
			$("#tabledispdd").empty();
			$("#tabledispdd").append("<option value='_iLLQueryResults_'>Query Results</option>");
			for(var i=0; i<res.length; i++){
				for(var col in res[i]){
					if(!res[i].hasOwnProperty(col)) continue;
					$opt = $("<option>");
					$opt.val(res[i][col]);
					$opt.html(res[i][col]);
					$("#tabledispdd").append($opt);
					break;
				}
			}
		});
	}
	
	function init(){
		iLoveLAMP.getServers(function(resp){
			var server = resp.data[iLoveLAMP.currentServer];
			if(!server.DATABASES || !server.DATABASES.length) return iLoveLAMP.showErrorPage("There are no databases listed for this server. Add a database in the Manage Servers module.");
			for(var i=0; i<server.DATABASES.length; i++){
				$opt = $("<option>");
				$opt.val(i);
				$opt.data("database", server.DATABASES[i]);
				$opt.html(server.DATABASES[i].name);
				$opt.appendTo("#dbdd");
			}
			var db = $("#dbdd").find("option:selected").data("database");
			loadDB(db);
		});
		var editor = CodeMirror.fromTextArea($("#sqlinput")[0], {
			mode:  "text/x-sql",
			lineNumbers: true,
			value: "Loading..."
		});
		
		$("#dbdd").change(function(){
			var db = $(this).find("option:selected").data("database");
			loadDB(db);
		});
		
		$("#runsqlbtn").click(function(){
			runQuery(editor.getValue(), function(resp){
				$("#tabledispdd").val("_iLLQueryResults_");
				showResultsTable(resp);
			});
		});
		
		$("#tabledispdd").change(function(){
			if($(this).val() === "_iLLQueryResults_") return;
			var sql = "SELECT * FROM `"+$(this).val()+"` LIMIT 50";
			var formatted = sqlFormatter.format(sql);
			editor.getDoc().setValue(formatted);
			runQuery(editor.getValue(), function(resp){
				showResultsTable(resp);
			});
		});
		
		$("#formatsqlbtn").click(function(){
			var sql = editor.getValue();
			var formatted = sqlFormatter.format(sql);
			editor.getDoc().setValue(formatted);
		});
	}
	
	return {
		requiresServer: true,
		title: "Databases",
		icon: "database",
		init: init
	};
})();
