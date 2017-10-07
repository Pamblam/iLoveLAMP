

iLoveLAMP.modules.ide = (function(){
	
	var activeScript = false;

	var newScript = '<html>\n\t<head>\n\t\t<title>QuickFiddle (<'+'?php echo basename(__FILE__); ?>)</title>\n\t\t<style>\n\t\t\tbody{ margin:2em 10%; }\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div id="myDiv">Loading...</div>\n\t\t<script src="//code.jquery.com/jquery-2.2.4.min.js"></scri'+'pt>\n\t\t<script>\n\t\t\t$(function(){\n\t\t\t\t$("#myDiv").html("<b>Hello, world!</b>");\n\t\t\t});\n\t\t</sc'+'ript>\n\t</body>\n</html>';
	
	function loadAllScripts(editor){
		iLoveLAMP.api("quickide_get", {}).then(function(data){
			$(".scriptswell").empty();
			for(var i=data.data.length; i--;){
				$(".scriptswell").append("<button type=button class='btn btn-info btn-xs' data-index='"+i+"'><span class='glyphicon glyphicon-bookmark'></span> "+data.data[i].name+"</button>&nbsp;");
			}
			$(".scriptswell").find("button").click(function(e){
				e.preventDefault();
				var script = data.data[$(this).data('index')];
				editor.getDoc().setValue(script.code);
				$("#idescriptname").val(script.name);
				activeScript = script.name;
				$("#ideDeleteBtn").show();
				$("#iderunbtn").show();
				$("input[name='idetarget']").parent().show();
				iLoveLAMP.modules.ide.preload = false;
				$("#idescriptname").prop("disabled", false).removeProp('disabled');;
			});
		});
	}
	
	function init(){
		
		activeScript = false;
		var editor = CodeMirror.fromTextArea($("#idecode")[0], {
			mode:  "application/x-httpd-php",
			lineNumbers: true,
			value: "<html>Loading...</html>"
		});
		var preload = iLoveLAMP.modules.ide.preload;
		if(false === preload) editor.getDoc().setValue(newScript);
		else{
			// Get file contents
			iLoveLAMP.api("download", {
				path: iLoveLAMP.modules.ide.preload.filpath,
				file: iLoveLAMP.modules.ide.preload.file,
				server: iLoveLAMP.modules.ide.preload.server,
				output: "show"
			}).then(function(data){
				iLoveLAMP.modules.ide.preload.code = data;
				editor.getDoc().setValue(data);
				$("#idescriptpath").text(iLoveLAMP.modules.ide.preload.filpath + '/');
				$("#idescriptpath").removeClass('hidden');
				$("#idescriptname").val(iLoveLAMP.modules.ide.preload.file);
				$("#iderunbtn").hide();
				$("input[name='idetarget']").parent().hide();
				$("#idescriptname").prop("disabled", true);
			});
		}
		
		loadAllScripts(editor);
		
		$("#ideDeleteBtn").click(function(e){
			e.preventDefault();
			if(activeScript === false){
				$(this).hide();
				return;
			}
			editor.getDoc().setValue(newScript);
			iLoveLAMP.api("quickide_delete", {name: activeScript}).then(function(resp){
				loadAllScripts(editor);
				activeScript = false;
				$("#idescriptname").val('');
				$("#ideDeleteBtn").hide();
				$("input[name='idetarget']").hide();
			});
		});
		
		$("#iderunbtn").click(function(e){
			e.preventDefault();
			var target = $("input[name='idetarget']:checked").val();
			var code = editor.getValue();
			var form = $("<form action=./assets/API.php method=POST target="+target+">");
			var input = $("<input type=hidden name=code>");
			input.val(code);
			form.append(input).append('<input type=hidden value=quickide_run name=action>').appendTo('body').submit().remove();
			if("ideFrame" === target){
				$("iframe[name='ideFrame']").slideDown();
				$("#closePreview").show();
			}else{
				$("iframe[name='ideFrame']").slideUp();
				$("#closePreview").hide();
			}
		});
		
		$("#closePreview").click(function(e){
			e.preventDefault();
			$("iframe[name='ideFrame']").slideUp();
			$(this).hide();
		});
		
		$("#ideNewBtn").click(function(e){
			e.preventDefault();
			activeScript = false;
			$("#ideDeleteBtn").hide();
			if(iLoveLAMP.modules.ide.preload === false){
				$("#idescriptname").val('');
				editor.getDoc().setValue(newScript);
			}else editor.getDoc().setValue(iLoveLAMP.modules.ide.preload.code);
		});
		
		$("#ideSaveBtn").click(function(e){
			e.preventDefault(e);
			if(iLoveLAMP.modules.ide.preload === false){
				var name = $("#idescriptname").val();
				$("#ideSaveBtn").html('<span class="glyphicon glyphicon-floppy-save"></span> Saving...');
				$("#ideSaveBtn").prop('disabled', true);
				iLoveLAMP.api("quickide_save", {code: editor.getValue(),  name: name}).then(function(resp){
					loadAllScripts(editor);
					$("#ideSaveBtn").html('<span class="glyphicon glyphicon-floppy-disk"></span> Save');
					$("#ideSaveBtn").prop('disabled', false).removeProp('disabled');
					activeScript = resp.data.name;
					$("#idescriptname").val(activeScript);
					$("#ideDeleteBtn").show();
				});
			}else{
				if(!confirm("You are editing a file on a remote server. Are you sure you want to save this file?")) return;
				$("#ideSaveBtn").html('<span class="glyphicon glyphicon-floppy-save"></span> Saving...');
				$("#ideSaveBtn").prop('disabled', true);
				iLoveLAMP.api("write_file", {
					path: iLoveLAMP.modules.ide.preload.filpath,
					file: iLoveLAMP.modules.ide.preload.file,
					server: iLoveLAMP.modules.ide.preload.server,
					contents: editor.getValue()
				}).then(function(resp){
					loadAllScripts(editor);
					$("#ideSaveBtn").html('<span class="glyphicon glyphicon-floppy-disk"></span> Save');
					$("#ideSaveBtn").prop('disabled', false).removeProp('disabled');
				});
			}
		});
		
		$("#idescriptname").keyup(function(){
			activeScript = false;
			$("#ideDeleteBtn").hide();
		});
	}
	
	function exit(){
		iLoveLAMP.modules.ide.preload = false;
	}
	
	return {
		requiresServer: false,
		title: "Quick IDE",
		icon: "file-text-o",
		init: init,
		preload: false,
		exit: exit
	};
})();
