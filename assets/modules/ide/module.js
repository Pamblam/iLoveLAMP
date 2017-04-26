

iLoveLAMP.modules.ide = (function(){
	
	var activeScript = false;
	
	function b64EncodeUnicode(str) {
		return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
			return String.fromCharCode('0x' + p1);
		}));
	}
	
	function b64DecodeUnicode(str) {
		return decodeURIComponent(atob(str).split('').map(function(c) {
			return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
		}).join(''));
	}

	var newScript = '<html>\n\t<head>\n\t\t<title>QuickFiddle (<'+'?php echo basename(__FILE__); ?>)</title>\n\t\t<style>\n\t\t\tbody{ margin:2em 10%; }\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div id="myDiv">Loading...</div>\n\t\t<script src="//code.jquery.com/jquery-2.2.4.min.js"></scri'+'pt>\n\t\t<script>\n\t\t\t$(function(){\n\t\t\t\t$("#myDiv").html("<b>Hello, world!</b>");\n\t\t\t});\n\t\t</sc'+'ript>\n\t</body>\n</html>';
	
	function loadAllScripts(editor){
		$.ajax({
			url: "./assets/API.php",
			data: {action: "quickide_get"}
		}).done(function(data){
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
			});
		});
	}
	
	function init(){
		
		activeScript = false;
		var editor = CodeMirror.fromTextArea($("#idecode")[0], {
			mode:  "application/x-httpd-php",
			lineNumbers: true,
			value: "<html></html>"
		});
		editor.getDoc().setValue(newScript);
		loadAllScripts(editor);
		
		$("#ideDeleteBtn").click(function(e){
			e.preventDefault(e);
			if(activeScript === false){
				$(this).hide();
				return;
			}
			editor.getDoc().setValue(newScript);
			$.ajax({
				url: "./assets/API.php",
				data: {action: "quickide_delete", name: activeScript},
				type: "POST"
			}).done(function(resp){
				loadAllScripts(editor);
				activeScript = false;
				$("#idescriptname").val('');
				$("#ideDeleteBtn").hide();
			});
		});
		
		$("#iderunbtn").click(function(e){
			e.preventDefault(e);
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
		
		$("#closePreview").click(function(){
			$("iframe[name='ideFrame']").slideUp();
			$(this).hide();
		});
		
		$("#ideSaveBtn").click(function(e){
			e.preventDefault(e);
			var name = $("#idescriptname").val();
			$("#ideSaveBtn").html('<span class="glyphicon glyphicon-floppy-save"></span> Saving...');
			$("#ideSaveBtn").prop('disabled', true);
			$.ajax({
				url: "./assets/API.php",
				data: {action: "quickide_save", code: editor.getValue(),  name: name},
				type: "POST"
			}).done(function(resp){
				loadAllScripts(editor);
				$("#ideSaveBtn").html('<span class="glyphicon glyphicon-floppy-disk"></span> Save');
				$("#ideSaveBtn").prop('disabled', false).removeProp('disabled');
				activeScript = resp.data.name;
				$("#idescriptname").val(activeScript);
				$("#ideDeleteBtn").show();
			});
		});
		
		$("#idescriptname").keyup(function(){
			activeScript = false;
			$("#ideDeleteBtn").hide();
		});
	}
	
	return {
		requiresServer: false,
		title: "Quick IDE",
		icon: "file-text-o",
		init: init
	};
})();
