

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
		for(var i=0; i<sortedFiles.length; i++)(function(data){
			var glyph = data.type == "directory" ? 'glyphicon-folder-open' : 'glyphicon glyphicon-file';
			var color = data.type == "directory" ? '#10a1c9' : '#14ccff';
			$thumb = $("<div class='fsthumb' style='color: "+color+" !important; display:inline-block; margin:.5em; height: 6em; width: 6em; overflow: hidden; text-overflow: ellipsis;'>");
			$thumb.html("<a href='#' style='text-decoration: none; color: "+color+" !important; text-align: center;'>"+
				'<span class="fsicon"></span><br>'+
				data.name+'</a>');
			$thumb.data("file", data);
			$thumb.appendTo("#foldersDiv");
			$thumb.find("a").click(function(e){
				e.preventDefault();
				return false;
			});

			var filetype = data.type === "directory" ?  "directory" : "ft_other_files";
			var action = data.type === "directory" ?  false : "qide";
			var icon = data.type === "directory" ? '<i class="fa fa-folder-o"></i>' : '<i class="fa fa-file-o"></i>';
			
			// if it's not a folder figure out what type of file it is
			if(filetype !== "directory"){
				// if the ilename starts with a dot, it's hidden
				if(data.name.substr(0, 1) === "."){
					filetype = "ft_hidden_files";
					action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "download";
					icon = '<i class="fa fa-file"></i>';
				}else{
					switch(data.name.split(".").pop().toUpperCase()){
						case "JPG": case "GIF": case "JPEG": case "BMP": case "PNG": case "SVG":
							filetype = "ft_image_files"; 
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "modal";
							icon = '<i class="fa fa-file-image-o"></i>';
							break;
						case "HTML": case "HTM": case "XHTML":
							filetype = "ft_html_files"; 
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "qide";
							icon = '<i class="fa fa-file-code-o"></i>';
							break;
						case "PHP":
							filetype = "ft_php_files"; 
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "qide";
							icon = '<i class="fa fa-file-code-o"></i>';
							break;
						case "JS":
							filetype = "ft_js_files"; 
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "qide";
							icon = '<i class="fa fa-file-code-o"></i>';
							break;
						case "CSS":
							filetype = "ft_css_files"; 
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "qide";
							icon = '<i class="fa fa-file-code-o"></i>';
							break;
						case "CONF": case "CNF": case "CONFIG":
							filetype = "ft_conf_files"; 
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "qide";
							icon = '<i class="fa fa-file-code-o"></i>';
							break;
						case "TXT":
							filetype = "ft_plaintext_files";
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "qide";
							icon = '<i class="fa fa-file-text-o"></i>';
							break;
						case "PDF":
							filetype = "ft_pdf_files";
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "modal";
							icon = '<i class="fa fa-file-pdf-o"></i>';
							break;
					}
				}
			}
			
			$icon = $(icon).css("font-size", "4em");
			$thumb.find(".fsicon").append($icon);
			
			$thumb.find("a").dblclick(function(e){
				e.preventDefault();
				if(data.type === "directory") return loadDirectory(cwd+"/"+data.name);
				switch(action){
					case "modal":
						var fileUrl = "./assets/API.php?action=download&server="+encodeURIComponent(iLoveLAMP.currentServer)+"&path="+encodeURIComponent(cwd)+"&file="+encodeURIComponent(data.name)+"&output=show";
						if(filetype === "ft_image_files") markup = "<b>Preview for: "+data.name+"</b><br><br><center><img src='"+fileUrl+"' style=max-width:100%;></center>";
						else markup = "<b>Preview for: "+data.name+"</b><br><br><iframe src='"+fileUrl+"' style='width:100%; border:0;'></iframe>";
						iLoveLAMP.BSAlert(markup);
						break;
					case "qide":
						iLoveLAMP.modules.ide.preload = {
							filpath: cwd,
							server: iLoveLAMP.currentServer,
							file: data.name
						};
						iLoveLAMP.loadPage('ide');
						break;
					case "new_tab":
						$form = $("<form action=./assets/API.php method=POST target=_blank>");
						$form.append("<input type=hidden name=action value=download />");
						$server = $("<input type=hidden name=server />");
						$server.val(iLoveLAMP.currentServer);
						$form.append($server);
						$path = $("<input type=hidden name=path />");
						$path.val(cwd);
						$form.append($path);
						$file = $("<input type=hidden name=file />");
						$file.val(data.name);
						$form.append($file);
						$form.append("<input type=hidden name=output value=show />");
						$form.appendTo('body').submit().remove();
						break;
					case "download":
					default:
						$form = $("<form action=./assets/API.php method=POST>");
						$form.append("<input type=hidden name=action value=download />");
						$server = $("<input type=hidden name=server />");
						$server.val(iLoveLAMP.currentServer);
						$form.append($server);
						$path = $("<input type=hidden name=path />");
						$path.val(cwd);
						$form.append($path);
						$file = $("<input type=hidden name=file />");
						$file.val(data.name);
						$form.append($file);
						$form.appendTo('body').submit().remove();
						break;
				}

			});
			$thumb.popover({ 
				delay: { "show": 1000, "hide": 100 },
				trigger: "manual",
				content: "<center><table class='table table-striped table-bordered table-condensed'><tbody>"+
					"<tr><th>Perms</th><td>"+data.perms+"</td></tr>"+
					"<tr><th>Links</th><td>"+data.links+"</td></tr>"+
					"<tr><th>Owner</th><td>"+data.owner+"</td></tr>"+
					"<tr><th>Group</th><td>"+data.group+"</td></tr>"+
					"<tr><th>Size</th><td>"+data.size+"</td></tr>"+
					"<tr><th>Modified</th><td>"+data.modified+"</td></tr>"+
					"</tbody></table><b>Double Click to Open</b></center>",
				placement: "auto",
				title: data.name,
				html: true
			}).on("mouseenter", function () {
				var _this = this;
				$(".fsthumb").popover("hide");
				$(_this).popover("show");
				$(".popover").on("mouseleave", function () {
					$(_this).popover('hide');
				});
			}).on("mouseleave", function () {
				var _this = this;
				setTimeout(function () {
					if (!$(".popover:hover").length) {
						$(_this).popover("hide");
					}
				}, 300);
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
		
		$("#newFilebtn").click(function(e){
			e.preventDefault();
			var filename = prompt("Enter a filename to create.");
			if("" === filename.trim) return;
			$.ajax({
				url: "./assets/API.php",
				data: {
					action: "write_file",
					path: cwd,
					server: iLoveLAMP.currentServer,
					file: filename,
					contents: " "
				}
			}).done(function(resp){
				displayFiles();
				iLoveLAMP.modules.ide.preload = {
					filpath: cwd,
					server: iLoveLAMP.currentServer,
					file: filename
				};
				iLoveLAMP.loadPage('ide');
			});
		});
		
		resetFileUpload();
	}
	
	var hgInterval = false, hgposit=0;
	function resetFileUpload(){
		$("#uploadFilebtn").fileUpload({
			dragArea: "#foldersDiv", 
			dragEnterClass: "dragover",
			change: function(){
				var upload = $("#uploadFilebtn").fileUpload("getFiles"); 
				while(upload.length > 1) upload.shift();
				
				var data = new FormData();
				data.append("uploadFile", upload[0]);
				data.append("action", "upload_file");
				data.append("path", cwd);
				data.append("server", iLoveLAMP.currentServer);
				data.append("contents", iLoveLAMP.currentServer);
				
				$.ajax({
					url: "./assets/API.php",
					data: data,
					type: "POST",
					cache: false,
					processData: false,
					contentType: false
				}).done(function(resp){
					if(!resp.success) alert(resp.response);
					else loadDirectory(cwd);
				});
				
			}
		});
	}
	
	function exit(){
		$("#fileUploadGhostDiv").remove();
	}
	
	return {
		requiresServer: true,
		title: "File System",
		icon: "files-o",
		init: init,
		exit: exit
	};
})();
