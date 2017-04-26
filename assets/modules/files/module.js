

iLoveLAMP.modules.files = (function(){
	
	var cwd = false;
	var files = [];
	var sortType = "type";
	
	function terminal(cmd, cb){
		$.ajax({
			url: "./assets/API.php",
			data: {action: "terminal", server: iLoveLAMP.currentServer, cmd: cmd},
			type: "POST"
		}).done(function(resp){
			cb(resp.data);
		});
	}
	
	function displayFiles(){
		sortedFiles = files;
		var term = $("#filesearch").val().trim().toUpperCase();
		if(term !== ""){
			sortedFiles = sortedFiles.filter(function(file){
				var f = file.name.toUpperCase();
				return f.indexOf(term) > -1;
			});
		}
		sortedFiles.sort(function(a, b){
			switch(sortType){
				case "name":
					return a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1;
					break;
				case "size":
					return a.size > b.size ? 1 : -1;
				case "type":
					if(a.type === b.type) return a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1;
					if(a.type === "directory") return -1;
					return 1;
					break;
			}
		});
		$("#foldersDiv").empty();
		for(var i=0; i<sortedFiles.length; i++)(function(file){
			var glyph = file.type == "directory" ? 'glyphicon-folder-open' : 'glyphicon glyphicon-file';
			var color = file.type == "directory" ? '#10a1c9' : '#14ccff';
			$thumb = $("<div style='color: "+color+" !important; display:inline-block; margin:.5em; height: 6em; width: 6em; overflow: hidden; text-overflow: ellipsis;'>");
			$thumb.html("<a href='#' style='text-decoration: none; color: "+color+" !important; text-align: center;'>"+
				'<span class="glyphicon '+glyph+'" style="font-size:4em;"></span><br>'+
				file.name+'</a>');
			$thumb.data("file", file);
			$thumb.appendTo("#foldersDiv");
			$thumb.find("a").click(function(e){
				e.preventDefault();
				var data = $(this).parent().data("file");
				if(data.type === "directory") return loadDirectory(cwd+"/"+data.name);
				console.log("show a modal with options to open this file...");
			});
			$thumb.popover({ 
				trigger: "hover",
				content: "<table class='table table-striped table-bordered table-condensed'><tbody>"+
					"<tr><th>Perms</th><td>"+file.perms+"</td></tr>"+
					"<tr><th>Links</th><td>"+file.links+"</td></tr>"+
					"<tr><th>Owner</th><td>"+file.owner+"</td></tr>"+
					"<tr><th>Group</th><td>"+file.group+"</td></tr>"+
					"<tr><th>Size</th><td>"+file.size+"</td></tr>"+
					"<tr><th>Modified</th><td>"+file.modified+"</td></tr></tbody></table>",
				placement: "bottom",
				title: file.name,
				html: true
			});
		})(sortedFiles[i]);
	
	}
	
	function loadDirectory(directory){
		directory = directory.trim();
		terminal("cd "+directory+"; ls -lap", function(resp){
			$("#filesearch").val('');
			$("#cwd").val(directory);
			cwd = directory;
			var rows = resp.split("\n");
			rows.shift(); rows.shift(); rows.shift();
			files = [];
			for(var i=0; i<rows.length; i++){
				var parts = rows[i].replace(/\s+/g,' ').trim().split(" ");
				var file = {
					perms: parts.shift(),
					links: parts.shift(),
					owner: parts.shift(),
					group: parts.shift(),
					size: parts.shift(),
					modified: parts.shift()+" "+parts.shift()+" "+parts.shift(),
					name: parts.shift(),
					type: "file"
				};
				if(undefined === file.name) continue;
				while(parts.length) file.name += " "+parts.shift();
				if(file.name.charAt(file.name.length - 1) === "/"){
					file.type = "directory";
					file.name = file.name.substr(0, file.name.length-1);
				}
				files.push(file);
			}
			displayFiles();
		});
	}
	
	function init(){
		cwd = false;
		files = [];
		sortType = "type";
		$("#foldersDiv").html("<b>Loading...</b>");
		terminal("pwd", loadDirectory);
		
		$('a[data-sortby]').click(function(e){
			e.preventDefault();
			sortType = $(this).data("sortby");
			displayFiles();
		});
		
		$("#filesearch").keyup(displayFiles);
		
		$("#parentDir").click(function(){
			if(!cwd || cwd === "/") return;
			if(cwd.substr(0,1) === "/") cwd = cwd.substr(1,cwd.length-1);
			if(cwd.substr(cwd.length-1,1) === "/") cwd = cwd.substr(0,cwd.length-1);
			var parts = cwd.split("/");
			parts.pop();
			var parentDir = "/"+parts.join("/");
			loadDirectory(parentDir);
		});
		
		$('#cwd').keydown(function (e) {
			if(e.keyCode != 13) return;
			var dir = $(this).val();
			if(dir.substr(dir.length-1,1) === "/") dir = dir.substr(0,dir.length-1);
			terminal("cd "+dir, function(resp){
				if(resp.indexOf("No such file or directory") > -1) $('#cwd').val(cwd);
				else loadDirectory(dir);
			});
		});
	}
	
	return {
		requiresServer: true,
		title: "File System",
		icon: "files-o",
		init: init
	};
})();
