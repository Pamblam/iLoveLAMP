<?php
session_start();

error_reporting(0);
ini_set('display_errors', 0);

// Create the return array
$return = array(
	"response" => "Success",
	"success" => true,
	"data" => array()
);

require realpath(dirname(__FILE__))."/userAuth.php";
if(!function_exists("auth_user")) oops("Error: Corrupted userAuth.php. No auth_user function found.");
if(auth_user() === false) oops("Access denied.");

// Make sure an action parameter has been sent to this endpoint
checkParams(array("action"));

switch($_REQUEST['action']){
	
	case "get_wc_status":
		checkParams(array("server", "path"));
		$ssh = getSSH($_REQUEST['server']);
		$raw = $ssh->exec("svn st -u {$_REQUEST['path']}");
		$lines = explode("\n", $raw);
		$parsed = array();
		foreach($lines as $line){
			if(strpos($line, "/")===false) continue;
			$line = explode(" ", $line);
			if($line[0] === "?") continue;
			$parsed[] = array_pop($line);
		}
		$return['response'] = "Gathered status info for Working Copy";
		$return['data'] = $parsed;
		output();
		break;
	
	case "sql_query":
		checkParams(array("server", "db", "query"));
		$ssh = getSSH($_REQUEST['server']);
		$database = $_REQUEST['db'];
		switch($database['type']){
			case "mysql":
				$resp = $ssh->read();
				$ssh->write('mysql -u '.$database['user'].' -p '.$database['name']."\n");
				$ssh->read("Enter password: ");
				$ssh->write($database['pass']."\n");
				$resp .= $ssh->read();
				if(strpos($resp, "mysql>") === false) oops("Could not login to MySQL. $resp");
				$query = trim($_REQUEST['query'], " ;\n\r\t");
				$ssh->write($query.";\n");
				$resp = $ssh->read();
				$data = array();
				if(strpos($resp, "-+\r\n") !== false){
					$lines = explode("-+\r\n", $resp);
					array_shift($lines); // pop the first one off
					$headersRow = explode("|", array_shift($lines));
					array_pop($headersRow); array_shift($headersRow);
					$headers = array();
					foreach($headersRow as $header) $headers[] = trim($header);
					$rawLines = explode("|\r\n", $lines[0]);
					array_pop($rawLines); // pop the last one off
					foreach($rawLines as $rawLine){
						$columns = explode("|", $rawLine);
						array_shift($columns); // pop the first one off
						$row = array();
						foreach($columns as $k=>$rawColumn) $row[$headers[$k]] = trim($rawColumn);
						$data[] = $row;
					}
				}
				$return['response'] = "Ran statement.";
				$return['data'] = $data;
				output();
				break;
			case "oracle":

				break;
			default: oops("Unrecognised DBMS type.");
		}
		break;
	
	case "upload_file":
		checkParams(array("server", "path"));
		if(empty($_FILES['uploadFile'])) oops("No file uploaded");
		$ssh = getSSH($_REQUEST['server']);
		$return['response'] = "Attempted to write file.";
		
		// Validate file upload
		$message = 'Error uploading file';
        switch( $_FILES['uploadFile']['error'] ) {
            case UPLOAD_ERR_OK:
                $message = false;;
                break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $message .= ' - file too large. Inrease your upload_max_filesize and post_max_size limits in php.ini.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $message .= ' - file upload was not completed.';
                break;
            case UPLOAD_ERR_NO_FILE:
                $message .= ' - zero-length file uploaded.';
                break;
            default:
                $message .= ' - internal error #'.$_FILES['newfile']['error'];
                break;
        }
		if($message) oops($message);
		
		// Acquire checksum...
		$cksum = explode(" ", exec("cksum \"".$_FILES['uploadFile']['tmp_name']."\""));
		array_pop($cksum); $cksum = implode(" ", $cksum); // pop off the filename since it's a temp name and won't match
		
		// Base 64 encode file contents
		$contents = file_get_contents($_FILES['uploadFile']['tmp_name']);
		$base64 = base64_encode($contents);
		if(empty($base64)) oops("Error encoding");
		
		// Create the encoded file on the server in chunks
		$tempname = time().".tmp";
		$cmd1 = array();
		$b64Chunks = strlen($base64) > 5000 ? str_split($base64, 5000) : array($base64);
		foreach($b64Chunks as $chunk){
			$c = $ssh->exec('echo "'.$chunk.'" >> '.$_REQUEST['path']."/".$tempname);
			if(!empty($c)) oops("Error uploading to server: ".$c);
		}
		
		// Try to decode using perl first
		$cmd2 = 'perl -MMIME::Base64 -i -0777ne \'print decode_base64($_)\' "'.$_REQUEST['path']."/".$tempname."\"";
		$c = $ssh->exec($cmd2);
		if(!empty($c)){
			// perl didn't work, let's try php
			$cmd2 = 'php -r "\$b64 = file_get_contents(\''.$_REQUEST['path']."/".$tempname.'\'); file_put_contents(\''.$_REQUEST['path']."/".$tempname.'\', base64_decode(\$b64));"';
			$c = $ssh->exec($cmd2);
			if(!empty($c)) oops("Error decoding file. Ensure that either PHP or Perl are installed.");
		}
		
		// Rename the temp file to the original filename
		$cmd3 = 'mv "'.$_REQUEST['path']."/".$tempname."\" \"".$_REQUEST['path']."/".$_FILES['uploadFile']['name'].'"';
		$c = $ssh->exec($cmd3);
		if(!empty($c)) oops("Error renaming temp file after upload.");
		
		// make sure checksum matches
		$cksum2 = explode(" ", $ssh->exec("cksum \"".$_REQUEST['path']."/".$_FILES['uploadFile']['name']."\""));
		array_pop($cksum2); $cksum2 = implode(" ", $cksum2); // pop off the filename 
		if($cksum !== $cksum2){
			$ssh->exec("rm \"".$_REQUEST['path']."/".$_FILES['uploadFile']['name']."\"");
			oops("Chksum mismatch - File removed.");
		}
		
		$return['data'] = $_REQUEST['path']."/".$_FILES['uploadFile']['name'];
		output();
		break;
	
	case "write_file":
		header('X-XSS-Protection: 0');
		checkParams(array("server", "path", "file", "contents"));
		$ssh = getSSH($_REQUEST['server']);
		$return['response'] = "Attempted to write file";
		$contents = $_REQUEST['contents'];
		$return['data'] = $ssh->exec('echo '.escapeshellarg($contents).' >| '.escapeshellarg($_REQUEST['path']."/".$_REQUEST['file']));
		output();
		break;
	
	case "download":
		checkParams(array("server", "path", "file"));
		$ssh = getSSH($_REQUEST['server']);
		
		$destPath = sys_get_temp_dir();
		$fileName = $_REQUEST['file'];
		$sourcePath = $_REQUEST['path'];
		
		$fullFileName= '"'.$sourcePath."/".$fileName.'"';
		$cmd = "cat $fullFileName";
		$raw = $ssh->exec($cmd);
		
		$mmcmd = "file -bi $fullFileName";
		$mimetype = trim($ssh->exec($mmcmd));
		
		$fscmd = "wc -c < $fullFileName";
		$size = floatval(trim($ssh->exec($fscmd)));
		
		$output = empty($_REQUEST['output']) ? "download" : $_REQUEST['output'];
		if($output === "download"){
			header("Content-Type: application/octet-stream");
			header("Content-Transfer-Encoding: Binary");
			header('Content-Length: ' . $size);
			header("Content-disposition: attachment; filename=\"".$fileName."\"");
			echo $raw; exit;
		}
		
		if($output === "show"){
			header('Content-Type:'.$mimetype);
			header('Content-Length: ' . $size);
			echo $raw; exit;
		}
		break;
	
	case "quickide_get":
		header('X-XSS-Protection: 0');
		$data = array();
		$ideScriptsPath = realpath(dirname(__FILE__))."/modules/ide/idescripts";
		$scripts = scandir($ideScriptsPath);
		foreach($scripts as $script){
			if($script == "." || $script == "..") continue;
			$scriptCode = file_get_contents("$ideScriptsPath/$script");
			$endComment = strpos($scriptCode, "?>");
			if($endComment === false) continue;
			$json = trim(substr($scriptCode, 0, $endComment), " /?<ph>");
			$details = json_decode($json, true);
			$code = substr($scriptCode, $endComment+2);
			$details['code'] = $code;
			$details['filename'] = $script;
			$data[] = $details;
		}
		$return['response'] = "Gathered All QuickIDE Scripts.";
		$return['data'] = $data;
		output();
		break;
	
	case "quickide_save":
		header('X-XSS-Protection: 0');
		checkParams(array("code"));
		$code = $_REQUEST['code'];
		$name = !empty($_REQUEST['name']) ? $_REQUEST['name'] : false;
		$scriptFileName = false;
		$untitledCnt = 0;
		
		// Check if there is an existing script with this name already
		$ideScriptsPath = realpath(dirname(__FILE__))."/modules/ide/idescripts";
		$scripts = scandir($ideScriptsPath);
		foreach($scripts as $script){
			if($script == "." || $script == "..") continue;
			$scriptCode = file_get_contents("$ideScriptsPath/$script");
			$endComment = strpos($scriptCode, "?>");
			if($endComment === false) continue;
			$json = trim(substr($scriptCode, 0, $endComment), " /?<ph>");
			$details = json_decode($json, true);
			if($details['name'] === $name){
				$scriptFileName = $script;
				break;
			}else if(strpos($details['name'], "Untitled ") === 0){
				$ucnt = intval(substr($details['name'], 9));
				if($untitledCnt <= $ucnt) $untitledCnt = $ucnt+1;
			}
		}
		
		if(!$scriptFileName) $scriptFileName = microtime().".php";
		if(!$name) $name = "Untitled $untitledCnt";
		
		$details = array(
			"lastEdit" => date("d//m/y g:i a"),
			"name" => $name
		);
				
		$code = "<?php // ".json_encode($details)." ?>$code";
		
		$tempName = "$ideScriptsPath/$scriptFileName";
		$fh = fopen($tempName, "w+");
		fwrite($fh, $code);
		fclose($fh);
		
		$return['response'] = "Saved script";
		$return['data'] = $details;
		output();
		break;

	case "quickide_delete":
		header('X-XSS-Protection: 0');
		checkParams(array("name"));
		$name = $_REQUEST['name'];
		$scriptFileName = false;
		
		$ideScriptsPath = realpath(dirname(__FILE__))."/modules/ide/idescripts";
		$scripts = scandir($ideScriptsPath);
		foreach($scripts as $script){
			if($script == "." || $script == "..") continue;
			$scriptCode = file_get_contents("$ideScriptsPath/$script");
			$endComment = strpos($scriptCode, "?>");
			if($endComment === false) continue;
			$json = trim(substr($scriptCode, 0, $endComment), " /?<ph>");
			$details = json_decode($json, true);
			if($details['name'] === $name){
				$r = unlink("$ideScriptsPath/$script");
				$return['response'] = $r ? "Deleted script" : "Unable to delete script";
				$return['success'] = $r;
				output();
				exit;
			}
		}
		$return['response'] = "Script not found.";
		$return['success'] = false;
		output();
		break;

	case "quickide_run":
		header('X-XSS-Protection: 0');
		checkParams(array("code"));
		$ideScriptsPath = realpath(dirname(__FILE__))."/modules/ide/idescripts";
		$time = microtime();
		$tempName = "$ideScriptsPath/$time.php";
		$fh = fopen($tempName, "w+");
		fwrite($fh, $_REQUEST['code']);
		fclose($fh);
		require($tempName);
		unlink($tempName);
		exit;
		break;
	
	case "dlshell":
		checkParams(array("server"));
		$config = getConfig();
		$script = '#!/usr/bin/expect -f'."\n".
			'spawn ssh '.$config['servers'][$_REQUEST['server']]['USER'].'@'.$config['servers'][$_REQUEST['server']]['HOST']."\n".
			'expect "assword:"'."\n".
			'send "'.$config['servers'][$_REQUEST['server']]['PASS'].'\r"'."\n".
			'interact;';
		header("Content-Type: text/x-shellscript");
		header("Content-Transfer-Encoding: Binary");
		header("Content-disposition: attachment; filename=\"".$_REQUEST['server'].".sh\""); 
		echo $script;
		break;
	
	case "terminal":
		checkParams(array("server", "cmd"));
		$ssh = getSSH($_REQUEST['server']);
		$raw = $ssh->exec("{$_REQUEST['cmd']}");
		$return['response'] = "Ran command";
		$return['data'] = $raw;
		output();
		break;
	
	case "do_update";
		$config = getConfig();
		if(isset($config['ill_updating'])){
			$return['response'] = $config['ill_updating']['response'];
			$return['data'] = $config['ill_updating']['data'];
			output();
		}else{
			require realpath(dirname(__FILE__))."/classes/asyncTask.php";
			require realpath(dirname(__FILE__))."/classes/gitUpdater.php";
			asyncPage::startOutput();
			$return['response'] = "Starting download";
			$return['data'] = array("completed_pct"=>1);
			header("Content-Type: application/json");
			echo json($GLOBALS['return']);
			asyncPage::sendOutput();
			new gitUpdater();
		}
		break;
	
	case "is_updating":
		$config = getConfig();
		$return['response'] = (isset($config['ill_updating']) ? "C" : "Not c")."urrently updating iLL.";
		$return['data'] = isset($config['ill_updating']);
		output();
		break;
	
	case "get_processes":
		require realpath(dirname(__FILE__))."/classes/pman.php";
		checkParams(array("server"));
		$ssh = getSSH($_POST['server']);
		$pman = new pMan($ssh);
		$return['data'] = $pman->plist();
		$return['response'] = "Gathered processes.";
		output();
		break;
	
	case "get_resources":
		require realpath(dirname(__FILE__))."/classes/pman.php";
		checkParams(array("server"));
		$ssh = getSSH($_POST['server']);
		$pman = new pMan($ssh);
		$return['data'] = $pman->details();
		$return['response'] = "Gathered processes.";
		output();
		break;
		
	case "kill_process":
		require realpath(dirname(__FILE__))."/classes/pman.php";
		checkParams(array("server", "pid"));
		$ssh = getSSH($_POST['server']);
		$raw = $ssh->exec("kill -9 {$_POST['pid']}");
		$return['data'] = $raw;
		$return['response'] = "Killed process {$_POST['pid']}.";
		output();
		break;
	
	case "get_modules":
		$mods_dir = realpath(dirname(__FILE__))."/modules";
		$f = scandir($mods_dir, 1);
		$files = array();
		foreach($f as $file){
			if($file[0] === ".") continue;
			$files[] = $file;
		}
		$return['response'] = "Gathered Modules";
		$return['data'] = $files;
		output();
		break;
	
	case "get_servers":
		$servers = getConfig();
		$data = array();
		foreach($servers['servers'] as $name=>$config){
			$data[$name] = array(
				"NAME" => $name,
				"USER" => $config['USER'],
				"HOST" => $config['HOST'],
				"LOGS" => $config['LOGS'],
				"THEME" => $config['THEME'],
				"DEFAULT" => $config['DEFAULT'],
				"DATABASES" => !empty($config['DATABASES']) ? $config['DATABASES'] : array(),
				"SVNWCS" => !empty($config['SVNWCS']) ? $config['SVNWCS'] : array(),
			);
		}
		$return['response'] = "Gathered ".count($data)." servers.";
		$return['data'] = $data;
		output();
		break;
	
	case "get_logs":
		checkParams(array("server", "log"));
		$config = getConfig();
		$ssh = getSSH($_POST['server']);
		$raw = $ssh->exec("tail -n 100 {$config['servers'][$_POST['server']]['LOGS'][$_POST['log']]}");
		$return['response'] = "Gatheered logs.";
		$return['data'] = $raw;
		output();
		break;
	
	case "get_settings":
		$config = getConfig();
		unset($config['servers']);
		$return['response'] = "Gathered settings.";
		$return['data'] = $config;
		output();
		break;
	
	case "set_settings":
		$config = getConfig();
		foreach($_REQUEST['settings'] as $setting=>$val){
			if($setting === "use_cookies") $val = $val === "true";
			$config[$setting] = $val;
		}
		$json = json($config);
		$fh = fopen("config.json", "w+");
		if($fh===false) oops("Can't open config file.");
		if(fwrite($fh, $json) === false) oops("Can't write to config file.");
		fclose($fh);
		
		$return['response'] = "Configuration updated.";
		output();
		break;
		
	case "check_server":
		$servers = getConfig();
		$pass = empty($_REQUEST['server']['pass']) ? false : $_REQUEST['server']['pass'];
		if(empty($pass))
			foreach($servers['servers'] as $name=>$config)
				if($name === $_REQUEST['server']['orig_name'])
					$pass = $config['PASS'];
		
		$ssh = getSSH($_REQUEST['server']['host'], $_REQUEST['server']['user'], $pass);
		
		if(!empty($_REQUEST['server']['logs'])){
			foreach($_REQUEST['server']['logs'] as $logName=>$logPath){
				$raw = $ssh->exec('[ -f '.$logPath.' ] && echo "1" || echo "0"');
				$raw = trim($raw); $raw = intval($raw);
				if(!$raw) oops("Error Log file not found for $logName");
			}
		}
		
		if(!empty($_REQUEST['server']['svn_wcs'])){
			foreach($_REQUEST['server']['svn_wcs'] as $wcName=>$wcPath){
				$raw = $ssh->exec('cd "'.$wcPath.'"; svn info');
				$raw = strpos($raw, "Repository Root") !== false;
				if(!$raw) oops("$wcPath is not a subversion working copy");
			}
		}
		
		// Validate and add each database
		if(!empty($_REQUEST['server']['databases'])){
			foreach($_REQUEST['server']['databases'] as $database){
				switch($database['type']){
					case "mysql":
						$resp = $ssh->read();
						$ssh->write('mysql -u '.$database['user'].' -p '.$database['name']."\n");
						$ssh->write($database['pass']."\n");
						$resp .= $ssh->read();
						if(strpos($resp, "mysql>") === false) oops("Could not login to MySQL.");
						break;
					case "oracle":
						
						break;
					default: oops("Unrecognised DBMS type.");
				}
			}
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
				"LOGS"=> isset($_REQUEST['server']['logs']) ? $_REQUEST['server']['logs'] : array(),
				"THEME"=> $_REQUEST['server']['theme'],
				"DEFAULT"=> !empty($_REQUEST['server']['default']),
				"DATABASES"=>empty($_REQUEST['server']['databases']) ? array() : $_REQUEST['server']['databases'],
				"SVNWCS"=>empty($_REQUEST['server']['svn_wcs']) ? array() : $_REQUEST['server']['svn_wcs'],
			);
		}else{
			$servers['servers'][$_REQUEST['server']['new_name']] = array(
				"USER"=> $_REQUEST['server']['user'],
				"PASS"=> $pass,
				"HOST"=> $_REQUEST['server']['host'],
				"LOGS"=> isset($_REQUEST['server']['logs']) ? $_REQUEST['server']['logs'] : array(),
				"THEME"=> $_REQUEST['server']['theme'],
				"DEFAULT"=> !empty($_REQUEST['server']['default']),
				"DATABASES"=>empty($_REQUEST['server']['databases']) ? array() : $_REQUEST['server']['databases'],
				"SVNWCS"=>empty($_REQUEST['server']['svn_wcs']) ? array() : $_REQUEST['server']['svn_wcs']
			);
			unset($servers['servers'][$_REQUEST['server']['orig_name']]);
		}
		$json = json($servers);
		$fh = fopen("config.json", "w+");
		if($fh===false) oops("Can't open config file.");
		if(fwrite($fh, $json) === false) oops("Can't write to config file.");
		fclose($fh);
		
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

$_phpseclib_ = false;
function getSSH($NameOrHost, $user=false, $pass=false){
	if(!$GLOBALS['_phpseclib_']) 
		require realpath(dirname(__FILE__))."/classes/vendor/autoload.php";
	$GLOBALS['_phpseclib_'] = true;
	if(empty($user)){
		$config = getConfig();
		$host = $config['servers'][$NameOrHost]['HOST'];
		$user = $config['servers'][$NameOrHost]['USER'];
		$pass = $config['servers'][$NameOrHost]['PASS'];		
	}else $host = $NameOrHost;
	try{ $ssh = new \phpseclib\Net\SSH2($host); }
	catch(Exception $e){ oops("Could not connect to host $host"); }
	$connected = false; $time = time();
	while($time+20 > time() && !$connected){
		try{ $connected = !!$ssh->login($user, $pass); }
		catch(Exception $e){}
		$errors = $ssh->getErrors();
		if(!empty($errors)){
			if(!isset($GLOBALS['return']['errors'])) $GLOBALS['return']['errors'] = array();
			$GLOBALS['return']['errors'][] = $errors;
		}
		if($connected) break;
		sleep(3);
	}
	if(!$connected) oops("Could not login to host $host using the $user account");
	return $ssh;
}

function getConfig(){
	$servers = file_get_contents("config.json");
	$servers = json_decode($servers, true);
	return $servers;
}
