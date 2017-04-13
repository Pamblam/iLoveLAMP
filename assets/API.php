<?php
session_start();

//ini_set('display_errors', 0);

// Create the return array
$return = array(
	"response" => "Success",
	"success" => true,
	"data" => array()
);

// Make sure an action parameter has been sent to this endpoint
checkParams(array("action"));

switch($_REQUEST['action']){
		
	case "get_modules":
		$mods_dir = realpath(dirname(__FILE__))."/modules";
		$files = scandir($mods_dir, 1);
		array_pop($files);
		array_pop($files);
		$return['response'] = "Gathered Modules";
		$return['data'] = $files;
		output();
		break;
	
	case "get_servers":
		$servers = file_get_contents("config.json");
		$servers = json_decode($servers, true);
		$data = array();
		foreach($servers['servers'] as $name=>$config){
			$data[$name] = array(
				"NAME" => $name,
				"USER" => $config['USER'],
				"HOST" => $config['HOST'],
				"ERROR_LOG" => $config['ERROR_LOG'],
				"ACCESS_LOG" => $config['ACCESS_LOG'],
				"DEFAULT" => $config['DEFAULT']
			);
		}
		$return['response'] = "Gathered ".count($data)." servers.";
		$return['data'] = $data;
		output();
		break;
	
	case "error_logs":
		
		
		$ssh = new Net_SSH2($config['HOST']);
		if (!$ssh->login($config['USER'], $config['PASS'])) exit('Login Failed');
		$raw = $ssh->exec("cd {$config['PATH']}; tail -n 100 {$config['NAME']}");
	
		break;
		
	case "check_server":
		set_include_path(get_include_path() . PATH_SEPARATOR . realpath(dirname(__FILE__))."/classes/sshlib");
		require 'Net/SSH2.php';
		$servers = file_get_contents("config.json");
		$servers = json_decode($servers, true);
		$pass = empty($_REQUEST['server']['pass']) ? false : $_REQUEST['server']['pass'];
		if(empty($pass))
			foreach($servers['servers'] as $name=>$config)
				if($name === $_REQUEST['server']['orig_name'])
					$pass = $config['PASS'];
		try{
			$ssh = new Net_SSH2($_REQUEST['server']['host']);
			if(!$ssh->login($_REQUEST['server']['user'], $pass)) 
				oops("Could not login. Invalid host, user or password.");
		}catch(Exception $e){ 
			oops("Could not login. Invalid host, user or password", $e); 
		}
		
		if(!empty($_REQUEST['server']['error_log'])){
			$raw = $ssh->exec('[ -f '.$_REQUEST['server']['error_log'].' ] && echo "1" || echo "0"');
			$raw = trim($raw); $raw = intval($raw);
			if(!$raw) oops("Error Log file not found");
		}
		
		if(!empty($_REQUEST['server']['access_log'])){
			$raw = $ssh->exec('[ -f '.$_REQUEST['server']['error_log'].' ] && echo "1" || echo "0"');
			$raw = trim($raw); $raw = intval($raw);
			if(!$raw) oops("Access Log file not found");
		}
		
		// if it's default, remove other default
		if(!empty($_REQUEST['server']['default']))
			foreach($servers['servers'] as $k=>$v)
				$servers['servers'][$k]["DEFAULT"] = false;
		
		// if it's new add it
		if($_REQUEST['server']['new_name'] === $_REQUEST['server']['orig_name']){
			$servers['servers'][$_REQUEST['server']['new_name']] = array(
				"USER"=> $_REQUEST['server']['user'],
				"PASS"=> $pass,
				"HOST"=> $_REQUEST['server']['host'],
				"ERROR_LOG"=> $_REQUEST['server']['error_log'],
				"ACCESS_LOG"=> $_REQUEST['server']['access_log'],
				"DEFAULT"=> !empty($_REQUEST['server']['default'])
			);
		}else{
			$servers['servers'][$_REQUEST['server']['new_name']] = array(
				"USER"=> $_REQUEST['server']['user'],
				"PASS"=> $pass,
				"HOST"=> $_REQUEST['server']['host'],
				"ERROR_LOG"=> $_REQUEST['server']['error_log'],
				"ACCESS_LOG"=> $_REQUEST['server']['access_log'],
				"DEFAULT"=> !empty($_REQUEST['server']['default'])
			);
			unset($servers['servers'][$_REQUEST['server']['orig_name']]);
		}
		$json = json($servers);
		$fh = fopen("config.json", "w+");
		fwrite($fh, $json);
		fclose($fh);
		
		//$return['data'] = $servers;
		$return['response'] = "Server validated and updated.";
		output();
		break;
	
	default: oops("Error: invalid action parameter");
}

function checkParams($reqd){
	foreach($reqd as $param)
		if(!isset($_REQUEST[$param])) 
			oops("Error: Missing $param parameter.");
}

function oops($oopsie, $e = false){
	$GLOBALS['return']['response'] = $oopsie;
	$GLOBALS['return']['success'] = false;
	$GLOBALS['return']['data'] = $e===false ? array() : $e->message;
	output();
}

function output(){
	header("Content-Type: application/json");
	echo json($GLOBALS['return']);
	exit;
}

function json($array){
	$json = json_encode($array);
    $result = '';
    $level = 0;
    $in_quotes = false;
    $in_escape = false;
    $ends_line_level = NULL;
    $json_length = strlen( $json );
    for($i = 0; $i < $json_length; $i++){
        $char = $json[$i];
        $new_line_level = NULL;
        $post = "";
        if($ends_line_level !== NULL){
            $new_line_level = $ends_line_level;
            $ends_line_level = NULL;
        }
        if($in_escape) $in_escape = false;
        else if($char === '"') $in_quotes = !$in_quotes;
        else if(!$in_quotes)
            switch($char){
                case '}': 
				case ']':
                    $level--;
                    $ends_line_level = NULL;
                    $new_line_level = $level;
                    break;
                case '{': 
				case '[':
                    $level++;
                case ',':
                    $ends_line_level = $level;
                    break;
                case ':':
                    $post = " ";
                    break;
                case " ": 
				case "\t": 
				case "\n": 
				case "\r":
                    $char = "";
                    $ends_line_level = $new_line_level;
                    $new_line_level = NULL;
                    break;
            }
        else if($char === '\\') $in_escape = true;
        if($new_line_level !== NULL) $result .= "\n".str_repeat( "\t", $new_line_level );
        $result .= $char.$post;
    }
    return $result;
}