<?php

class Terminal{
	
	private static $config;
	
	public static function init($serverName){
		if(!self::isRunning()){
			asyncPage::startOutput();
			$GLOBALS['return']['response'] = "Starting terminal session";
			$GLOBALS['return']['data'] = array();
			header("Content-Type: application/json");
			echo json($GLOBALS['return']);
			asyncPage::sendOutput();
			self::startDaemon($serverName);
		}
	}
	
	public static function output(){
		$GLOBALS['return']['response'] = "Gathered output.";
		$GLOBALS['return']['data'] = self::getPendingOutput();
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
		if (!$ssh->login($config['servers'][$serverName]['USER'], $config['servers'][$serverName]['PASS'])) oops('Login Failed'); // defined in API.php
		$config['ill_terminal'] = array("in"=>"", "out"=>"", "time"=>0, "outlog"=>array());
		$time = time();
		self::setConfig($config);
		while(self::isRunning()){
			$config = self::getConfig();
			$config['ill_terminal']['time'] = time() - $time;
			if(!empty($congif['ill_terminal']['in'])){
				$ssh->write($config['ill_terminal']['in']."\n");
				$config['ill_terminal']['in'] = "";
				sleep(3);
				$r = $ssh->read();
				$config['ill_terminal']['out'] .= $r;
				$congif['ill_terminal']['outlog'][] = $r;
				self::setConfig($config);
			}else{
				$r = $ssh->read();
				$config['ill_terminal']['out'] .= $r;
				$congif['ill_terminal']['outlog'][] = $r;
				self::setConfig($config);
				sleep(3);
			}
			
			
			
		}
	}
	
	private static function getPendingOutput(){
		$config = self::getConfig();
		if(!isset($config['ill_terminal'])) oops('Terminal is not currently running');
		$out = $config['ill_terminal']['out'];
		$config['ill_terminal']['out'] = "";
		self::setConfig($config);
		return $out;
	}
	
	private static function getPendingInput(){
		$config = self::getConfig();
		if(!isset($config['ill_terminal'])) oops('Terminal is not currently running');
		return $config['ill_terminal']['in'];
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
		return self::$config;
	}
	
}
