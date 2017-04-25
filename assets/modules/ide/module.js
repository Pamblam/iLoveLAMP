

iLoveLAMP.modules.ide = (function(){
	
	var newScript = '<html>\n\t<head>\n\t\t<title>QuickFiddle (<'+'?php echo basename(__FILE__); ?>)</title>\n\t\t<style>\n\t\t\tbody{ margin:2em 10%; }\n\t\t</style>\n\t</head>\n\t<body>\n\t\t<div id="myDiv">Loading...</div>\n\t\t<script src="//code.jquery.com/jquery-2.2.4.min.js"></scri'+'pt>\n\t\t<script>\n\t\t\t$(function(){\n\t\t\t\t$("#myDiv").html("<b>Hello, world!</b>");\n\t\t\t});\n\t\t</sc'+'ript>\n\t</body>\n</html>';
	
	function init(){
		var editor = CodeMirror.fromTextArea($("#idecode")[0], {
			mode:  "application/x-httpd-php",
			lineNumbers: true,
			value: "<html></html>"
		});
		editor.getDoc().setValue(newScript);
		
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
			}else{
				$("iframe[name='ideFrame']").slideUp();
			}
		});
		
		
	}
	
	return {
		requiresServer: false,
		title: "Quick IDE",
		icon: "file-text-o",
		init: init
	};
})();
