

iLoveLAMP.modules.files = (function(){
	
	var cwd = false;
	var files = [];
	var sortType = "type";
	
	function terminal(cmd, cb){
		iLoveLAMP.api("terminal", {server: iLoveLAMP.currentServer, cmd: cmd}).then(function(resp){
			cb(resp.data);
		});
	}
	
	function displayFiles(){
		sortedFiles = files;
		var term = ($("#filesearch").val() || "").trim().toUpperCase();
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
			$thumb.html("<a href='#' title='"+data.name+"' name='"+data.name+"' style='text-decoration: none; color: "+color+" !important; text-align: center;'>"+
				'<span class="fsicon"></span><br>'+
				data.name+'</a>');
			$thumb.data("file", data);
			$thumb.appendTo("#foldersDiv");

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
						case "ZIP": 
							filetype = "ft_zip_files"; 
							action = iLoveLAMP.illSettings[filetype] ? iLoveLAMP.illSettings[filetype] : "unzip";
							icon = '<i class="fa fa-file-zip-o"></i>';
							break;
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
			
			var DELAY = 700, clicks = 0, timer = null;
			$thumb.find("a").click(function(e){
				e.preventDefault();
				clicks++;  //count clicks
				if (clicks === 1) {
					timer = setTimeout(function () {
						// single click
						var title = "<small>"+cwd+"/</small><br><big><b>"+icon+" "+data.name;
						if(data.type == "directory") title += "/";
						title += "</b></big>";
						var buttons = [{
							title: "Open",
							btnclass: "btn-primary",
							icon: "<span class='glyphicon glyphicon-ok-sign'></span>",
							action: function(){
								$(this).modal('hide');
								var _this = this;
								setTimeout(function(){ $(_this).remove();}, 1000);
								openFile(data, action, filetype);
							}
						},{
							title: "Cancel",
							btnclass: "btn-default",
							icon: "<span class='glyphicon glyphicon-arrow-left'></span>",
							action: function(){
								$(this).modal('hide');
								var _this = this;
								setTimeout(function(){ $(_this).remove();}, 1000);
							}
						}];
						if(data.type != "directory"){
							if(["ft_image_files", "ft_pdf_files"].indexOf(filetype) > -1 && action !== "modal"){
								buttons.push({
									title: "Open in Modal",
									btnclass: "btn-info",
									icon: "<span class='glyphicon glyphicon-modal-window'></span>",
									action: function(){
										$(this).modal('hide');
										var _this = this;
										setTimeout(function(){ $(_this).remove(); }, 1000);
										openFile(data, "modal", filetype);
									}
								});
							}
							if(["ft_image_files", "ft_pdf_files"].indexOf(filetype) > -1 && action !== "new_tab"){
								buttons.push({
									title: "Open in Tab",
									btnclass: "btn-info",
									icon: "<span class='glyphicon glyphicon-share'></span>",
									action: function(){
										openFile(data, "new_tab", filetype);
									}
								});
							}
							if(action !== "download"){
								buttons.push({
									title: "Download",
									btnclass: "btn-info",
									icon: "<span class='glyphicon glyphicon-download'></span>",
									action: function(){
										$(this).modal('hide');
										var _this = this;
										setTimeout(function(){ $(_this).remove(); }, 1000);
										openFile(data, "download", filetype);
									}
								});
							}
							if(action !== "qide"){
								buttons.push({
									title: "Edit Raw",
									btnclass: "btn-info",
									icon: "<span class='glyphicon glyphicon-edit'></span>",
									action: function(){
										$(this).modal('hide');
										var _this = this;
										setTimeout(function(){ $(_this).remove(); }, 1000);
										openFile(data, "qide", filetype);
									}
								});
							}
						}
						buttons.push({
							title: "Delete",
							btnclass: "btn-danger",
							icon: "<span class='glyphicon glyphicon-warning-sign'></span>",
							action: function(){
								var _this = this;
								if(filetype == "directory" && confirm("Warning: This will delete all files in this directry! Are you sure you want to delete this?")){
									terminal("rm -rf \""+cwd+"/"+data.name+"\"", function(){
										jSQL.query("DELETE FROM files_mod WHERE dir = '"+cwd+"' AND server = ?").execute([iLoveLAMP.currentServer]);
										jSQL.commit();
										$(_this).modal('hide');
										setTimeout(function(){ 
											$(_this).remove(); 
											loadDirectory(cwd);
										}, 1000);
									});
								}else if(filetype != "directory" && confirm("Warning: This will delete this file! Are you sure you want to delete this?")){
									terminal("rm \""+cwd+"/"+data.name+"\"", function(){
										jSQL.query("DELETE FROM files_mod WHERE dir = '"+cwd+"' AND server = ?").execute([iLoveLAMP.currentServer]);
										jSQL.commit();
										$(_this).modal('hide');
										setTimeout(function(){ 
											$(_this).remove();  
											loadDirectory(cwd);
										}, 1000);
									});
								}else{
									$(this).modal('hide');
									setTimeout(function(){ $(_this).remove(); }, 1000);
								}
							}
						});
						buttons.reverse();
						var mid = iLoveLAMP.Modal(
							title, 
							"<center><table class='table table-striped table-bordered table-condensed'><tbody>"+
							"<tr><th>Perms</th><td>"+data.perms+"</td></tr>"+
							"<tr><th>Links</th><td>"+data.links+"</td></tr>"+
							"<tr><th>Owner</th><td>"+data.owner+"</td></tr>"+
							"<tr><th>Group</th><td>"+data.group+"</td></tr>"+
							"<tr><th>Size</th><td>"+data.size+"</td></tr>"+
							"<tr><th>Modified</th><td>"+data.modified+"</td></tr>"+
							"</tbody></table><div class='actionbar'></div></center>",
							buttons
						);
						clicks = 0;
					}, DELAY);
				} else {
					clearTimeout(timer); 
					// double click
					openFile(data, action, filetype);
					clicks = 0; 
				}
				
				return false;
			}).dblclick(function(e){
				e.preventDefault(); 
			});
			
		})(sortedFiles[i]);
	
	}
	
	function openFile(data, action, filetype){
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
			case "unzip":
				terminal("cd \""+cwd+"\"; unzip \""+data.name+"\"", function(resp){
					if(resp.toLowerCase().indexOf("command not found") > -1) alert("Install unzip command using:\nsudo apt-get install unzip");
					else loadDirectory(cwd);
				});
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
	}
	
	function getDirectory(directory, cb){
		var dir = jSQL.query("SELECT files FROM files_mod WHERE dir = '"+directory+"' AND server = ?").execute([iLoveLAMP.currentServer]).fetch();
		if(undefined !== dir.files) return cb(dir.files);
		terminal("cd \""+directory+"\"; ls -lap", function(resp){
			if(iLoveLAMP.illSettings.use_cookies){
				jSQL.query("INSERT INTO files_mod (server, dir, files) values (?, ?, ?)")
					.execute([iLoveLAMP.currentServer, directory, resp]);
				jSQL.query("UPDATE files_mod_locs SET current = ? WHERE server = ?")
					.execute([directory, iLoveLAMP.currentServer]);
				jSQL.commit();
			}
			cb(resp);
		});
	}
	
	function loadDirectory(directory){
		directory = directory.trim();
		getDirectory(directory, function(resp){
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
	
	function getCurrentDir(cb){
		var locs = jSQL.query("SELECT * FROM files_mod_locs WHERE server = ?").execute([iLoveLAMP.currentServer]).fetch();
		if(undefined !== locs.current && locs.current !== "") return cb(locs.current);
		if(undefined !== locs.home) return cb(locs.home);
		terminal("pwd", function(wd){
			jSQL.query("INSERT INTO files_mod_locs (server, home, current) VALUES (?, ?, ?)")
				.execute([iLoveLAMP.currentServer, wd, ""]);
			jSQL.commit();
			loadDirectory(wd);
		});
	}
	
	function init(){
		jSQL.query("CREATE TABLE IF NOT EXISTS files_mod (server, dir, files)").execute();
		jSQL.query("CREATE TABLE IF NOT EXISTS files_mod_locs (server, home, current)").execute();
		jSQL.commit();
		cwd = false;
		files = [];
		sortType = "type";
		$("#foldersDiv").html("<b>Loading...</b>");
		getCurrentDir(loadDirectory);
		
		$("#refreshCWD").click(function(e){
			e.preventDefault();
			if(!cwd) return;
			jSQL.query("DELETE FROM files_mod WHERE dir = '"+cwd+"' AND server = ?").execute([iLoveLAMP.currentServer]);
			jSQL.commit();
			loadDirectory(cwd);
		});
		
		$("#goHomeBtnFiles").click(function(e){
			e.preventDefault();
			var locs = jSQL.query("SELECT home FROM files_mod_locs WHERE server = ?").execute([iLoveLAMP.currentServer]).fetch();
			if(locs.home !== undefined) return loadDirectory(locs.home);
			getCurrentDir(loadDirectory);
		});
		
		$('#newFolderbtn').click(function(e){
			e.preventDefault();
			var newFolderName = prompt("Enter a name for the new folder.");
			if(!newFolderName || "" == newFolderName.trim()) return;
			terminal("mkdir \""+cwd+"/"+newFolderName.trim()+"\"", function(){
				jSQL.query("DELETE FROM files_mod WHERE dir = '"+cwd+"' AND server = ?").execute([iLoveLAMP.currentServer]);
				jSQL.commit();
				loadDirectory(cwd);
			});
		});
		
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
			if(!filename || "" === filename.trim()) return;
			iLoveLAMP.api("write_file", {
				path: cwd,
				server: iLoveLAMP.currentServer,
				file: filename,
				contents: " "
			}).then(function(resp){
				jSQL.query("DELETE FROM files_mod WHERE dir = '"+cwd+"' AND server = ?").execute([iLoveLAMP.currentServer]);
				jSQL.commit();
				loadDirectory(cwd);
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
	
	function resetFileUpload(){
		$("#uploadFilebtn").fileUpload({
			dragArea: "#foldersDiv", 
			dragEnterClass: "dragover",
			change: function(){
				var upload = $("#uploadFilebtn").fileUpload("getFiles"); 
				while(upload.length > 1) upload.shift();
				
				var data = new FormData();
				data.append("uploadFile", upload[0]);
				data.append("path", cwd);
				data.append("server", iLoveLAMP.currentServer);
				data.append("contents", iLoveLAMP.currentServer);
				iLoveLAMP.api("upload_file", data, true).then(function(resp){
					if(resp.success){
						jSQL.query("DELETE FROM files_mod WHERE dir = '"+cwd+"' AND server = ?").execute([iLoveLAMP.currentServer]);
						jSQL.commit();
						loadDirectory(cwd);
					}
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
