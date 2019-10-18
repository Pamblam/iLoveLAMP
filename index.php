<?php
session_start();
require realpath(dirname(__FILE__))."/assets/userAuth.php";
if(!function_exists("auth_user")) die("Error: Corrupted userAuth.php. No auth_user function found.");
if(auth_user() === false) die("Access denied.");

?><!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<title>iLoveLAMP</title>
		<meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
		<link rel="stylesheet" href="assets/css/bootstrap.css">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/css/font-awesome.min.css">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.10.0/styles/default.min.css">
		<link rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/dataTables.bootstrap.min.css">
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/notify/0.4.2/styles/metro/notify-metro.min.css">
		<link href="assets/codemirror/lib/codemirror.css" rel="stylesheet">
		<link rel="stylesheet" href="assets/css/terminal.css">
		<link rel="stylesheet" href="assets/css/AdminLTE.min.css">
		<link rel="stylesheet" href="assets/css/skins.css">

		<style>
			.CodeMirror {
				border: 1px solid #eee;
				background: #eee;
				height: auto;
				padding-left:1em;
			}
		</style>
		<!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
		<!--[if lt IE 9]>
		<script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
		<script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
		<![endif]-->
	</head>
	<body class="hold-transition sidebar-mini">
		<div class="wrapper">

			<?php require realpath(dirname(__FILE__))."/assets/templates/header.html"; ?>

			<aside class="main-sidebar">
				<section class="sidebar">
					<ul class="sidebar-menu" id="main-menu">
						<li class="header">Modules</li>
					</ul>
				</section>
			</aside>

			<div class="content-wrapper">
				<section class="content" id="page-inner"></section>
			</div>

			<footer class="main-footer">
				<div class="pull-right hidden-xs">
					<b>"Don't bane the dillies!"</b>
				</div>
				<i class="fa fa-lightbulb-o"></i> <strong>iLove</strong>LAMP
			</footer>

			<aside class="control-sidebar control-sidebar-dark">
				<ul class="nav nav-tabs nav-justified control-sidebar-tabs">
					<li><a href="#control-sidebar-home-tab" data-toggle="tab"><i class="fa fa-home"></i></a></li>
					<li><a href="#control-sidebar-settings-tab" data-toggle="tab"><i class="fa fa-gears"></i></a></li>
				</ul>
			</aside>
		</div>

		<script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
		<script src="https://code.jquery.com/ui/1.11.4/jquery-ui.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.10.0/highlight.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.10.0/languages/css.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.10.0/languages/http.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.10.0/languages/javascript.min.js"></script>
		<script src="https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js"></script>
		<script src="https://cdn.datatables.net/1.10.13/js/dataTables.bootstrap.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/notify/0.4.2/notify.min.js"></script>
		<script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
		<script src='assets/js/sql-formatter.min.js'></script>
		<script src='assets/codemirror/lib/codemirror.js'></script>
		<script src='assets/codemirror/addon/selection/selection-pointer.js'></script>
		<script src="assets/codemirror/mode/javascript/javascript.js"></script>
		<script src="assets/codemirror/mode/php/php.js"></script>
		<script src="assets/codemirror/mode/clike/clike.js"></script>
		<script src="assets/codemirror/mode/css/css.js"></script>
		<script src="assets/codemirror/mode/xml/xml.js"></script>
		<script src="assets/codemirror/mode/sql/sql.js"></script>
		<script src="assets/codemirror/mode/vbscript/vbscript.js"></script>
		<script src="assets/codemirror/mode/htmlmixed/htmlmixed.js"></script>
		<script src="assets/codemirror/addon/display/autorefresh.js"></script>
		<script>$.widget.bridge('uibutton', $.ui.button);</script>
		<script src="assets/js/bootstrap.min.js"></script>
		<script src="assets/js/terminal.js"></script>
		<script src="assets/js/dateFormatter.js"></script>
		<script src="assets/js/textChange.js"></script>
		<script src="assets/js/theme.js"></script>
		<script src="assets/js/fileUpload.js"></script>
		<script src="assets/js/jSQL.js"></script>
		<script src="assets/js/iLoveLAMP.js"></script>
	</body>
</html>
