<?php

class Terminal{
	
	public static function init($serverName){
		if(!self::isRunning()){
			asyncPage::startOutput();
			$return['response'] = "Starting terminal session";
			$return['data'] = array();
			header("Content-Type: application/json");
			echo json($GLOBALS['return']);
			asyncPage::sendOutput();
			self::startDaemon($serverName);
		}
	}
	
	public static function output(){
		$return['response'] = "Gathered output.";
		$return['data'] = self::getPendingOutput();
		header("Content-Type: application/json");
		echo json($GLOBALS['return']);
		exit;
	}
	
	public static function addCommand($cmd){
		$config = self::getConfig();
		if(!isset($config['ill_terminal'])) oops('Terminal is not currently running');
		$config['ill_terminal']['in'] = $cmd;
		self::setConfig($config);
	}
	
	private function startDaemon($serverName){
		$config = self::getConfig();
		$ssh = new \phpseclib\Net\SSH2($config['servers'][$serverName]['HOST']);
		if (!$ssh->login($config['servers'][$serverName]['USER'], $config['servers'][$serverName])) oops('Login Failed'); // defined in API.php
		$config['ill_terminal'] = array("in"=>"", "out"=>"");
		self::setConfig($config);
		$out = "";
		while(self::isRunning()){
			$o = self::getPendingOutput();
			if(empty($o) && !empty($out)){
				$config = self::getConfig();
				$config['ill_terminal']['out'] = $out;
				$out = "";
				self::setConfig($config);
			}else if(!empty($o)){
				$out .= $o;
			}
			sleep(3);
		}
	}
	
	private static function getPendingOutput(){
		$config = self::getConfig();
		if(!isset($config['ill_terminal'])) oops('Terminal is not currently running');
		return $config[ill_terminal]['out'];
	}
	
	private static function getPendingInput(){
		$config = self::getConfig();
		if(!isset($config['ill_terminal'])) oops('Terminal is not currently running');
		return $config[ill_terminal]['in'];
	}
	
	private static function isRunning(){
		$config = self::getConfig();
		return isset($config['ill_terminal']);
	}
	
	private static function setConfig($config){
		self::getConfig();
		foreach($config as $k=>$v) self::$config[$k]=$v;
		$json = json(self::$config); // json() is defined in the API.php file
		$fh = fopen("config.json", "w+");
		if($fh===false) exit("Can't open config file.");
		if(fwrite($fh, $json) === false) exit("Can't write to config file.");
		fclose($fh);
	}
	
	private static function getConfig(){
		$config = file_get_contents("config.json");
		self::$config = json_decode($config, true);
	}
	
}
