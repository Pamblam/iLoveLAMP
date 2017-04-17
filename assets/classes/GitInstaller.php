<?php

class GitInstaller{
	
	private $author_name;
	private $repo_name;
	private $versions;
	static $error_handler;
	private $skipFiles = array();
	private $hook;
	
	public function __construct($author_name, $repo_name, $error_handler=array()){
		$this->author_name = $author_name;
		$this->repo_name = $repo_name;
		self::$error_handler = $error_handler;
		$this->getVersions();
	}
	
	/**
	 * Set an array of files to skip when installing
	 * @param type $files
	 */
	public function skipFiles($files){
		$this->skipFiles = $files;
	}
	
	/**
	 * Set a hook to be called on each loop
	 */
	public function setLoopHook($hook){
		$this->hook = $hook;
	}
	
	/**
	 * Do the actual download and install
	 * @param type $version_id
	 * @param type $installPath
	 */
	public function installVersion($version_id, $installPath){
		$installPath = "/".trim($installPath, " /");
		if(!file_exists($installPath)) $this->errorHandler(0,"Installpath directory does not exist.");
		if(!is_dir($installPath)) $this->errorHandler(0,"Installpath directory is not a directory.");
		
		$version = false;
		for($i=0; $i<count($this->versions); $i++)
			if($this->versions[$i]['id'] === $version_id)
				$version = $this->versions[$i];
		if(!$version) $this->errorHandler(0,"Version ID not found.");
		
		// Download the file
		$archiveName = tempnam("/tmp", "GIT");
		$this->request($version['zip'], array(), $archiveName);
		
		// see what's in the file
		$zip = new ZipArchive;
		$zip->open($archiveName);
		set_error_handler(array(__CLASS__, "errorHandler"), E_WARNING);
		for($i = 0; $i < $zip->numFiles; $i++){
			$file = $zip->getNameIndex($i);	
			$newFile = explode("/",$file);
			array_shift($newFile);
			$newFile = implode("/",$newFile);
			
			// skip files that are explicitly skipped
			if(in_array($newFile, $this->skipFiles)) continue;
			
			$from = "zip://".$archiveName."#".$file;
			$to = "$installPath/$newFile";
			
			// skip the first empty directory
			if(trim($installPath, " /") === trim($to, " /")) continue;
			
			$FullFileName = $zip->statIndex($i); 
			if($FullFileName['name'][strlen($FullFileName['name'])-1] =="/"){
				if(!file_exists($to)) mkdir($to);
			}else{
				copy($from, $to);
			}
			
			// call the hook if it's set
			if($this->hook) call_user_func_array($this->hook, array($i, $zip->numFiles, $to));
		}
		if($this->hook) call_user_func_array($this->hook, array($zip->numFiles, $zip->numFiles, ''));
		restore_error_handler();
	}
	
	/**
	 * Is called when there is an error
	 * @param type $errno
	 * @param type $errstr
	 */
	public function errorHandler($errno, $errstr){
		if(!empty(self::$error_handler)){
			call_user_func(self::$error_handler, $errstr);
		}else exit("poooop".$errstr);
	}
	
	/**
	 * Get a list of all downloadable versions
	 * @return array
	 */
	public function getVersions(){
		if(!empty($this->versions)) return array_values($this->versions);
		$versions = array();
		$releases = $this->request("https://api.github.com/repos/{$this->author_name}/{$this->repo_name}/releases");
		$releases = json_decode($releases, true);
		foreach($releases as $release){
			$versions[] = array(
				"id" => $release['id'],
				"type" => "release",
				"version_id" => $release['tag_name'],
				"version_info" => $release['name'],
				"date" => strtotime($release['published_at']),
				"zip" => $release['zipball_url']
			);
		}
		$commits = $this->request("https://api.github.com/repos/{$this->author_name}/{$this->repo_name}/commits");
		$commits = json_decode($commits, true);
		foreach($commits as $commit){
			$versions[] = array(
				"id" => $commit['sha'],
				"type" => "commit",
				"version_id" =>  'unofficial',
				"version_info" => $commit['commit']['message'],
				"date" => strtotime($commit['commit']['committer']['date']),
				"zip" => "https://github.com/{$this->author_name}/{$this->repo_name}/archive/{$commit['sha']}.zip"
			);
		}
		usort($versions, array(__CLASS__,'versionSort'));
		$this->versions = $versions;
		return array_values($versions);
	}
	
	
	/**
	 * Helper function to sort versions from getVersions() method
	 */
	private function versionSort($a, $b){
		return $a['date'] > $b['date'];
	}
	
	/*
	 * Makes an HTTP request via GET or POST, and can download a file
	 * @returns - Returns the response of the request
	 * @param $url - The URL to request, including any GET parameters
	 * @param $params - An array of POST values to send
	 * @param $filename - If provided, the response will be saved to the 
	 *    specified filename
	 */
	private function request($url, $params = array(), $filename = ""){
	   $ch = curl_init();
	   $curlOpts = array(
		   CURLOPT_URL=>$url,
		   // Set Useragent
		   CURLOPT_USERAGENT=>
		   'Mozilla/5.0 (Windows NT 6.3; WOW64; rv:29.0) 
				  Gecko/20100101 Firefox/29.0',
		   // Don't validate SSL 
		   // This is to prevent possible errors with self-signed certs
		   CURLOPT_SSL_VERIFYPEER=>false,
		   CURLOPT_SSL_VERIFYHOST=>false,
		   CURLOPT_RETURNTRANSFER=>true,
		   CURLOPT_FOLLOWLOCATION=>true
	   );
	   if(!empty($filename)){
		   // If $filename exists, save content to file
		   $file2 = fopen($filename, 'w+')
				   or die("Error[" . __FILE__ . ":" . __LINE__ . "] 
				  Could not open file: $filename");
		   $curlOpts[CURLOPT_FILE] = $file2;
	   }
	   if(!empty($params)){
		   // If POST values are given, send that shit too
		   $curlOpts[CURLOPT_POST] = true;
		   $curlOpts[CURLOPT_POSTFIELDS] = $params;
	   }
	   curl_setopt_array($ch, $curlOpts);
	   $answer = curl_exec($ch);
	   // If there was an error, show it
	   if(curl_error($ch)) die(curl_error($ch));
	   if(!empty($filename)) fclose($file2);
	   curl_close($ch);
	   return $answer;
	}
	
}
