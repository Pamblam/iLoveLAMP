<?php
/**
 * When initialized this class will begin a long running task that will download 
 * and attempt to install the entire iLL software from the Github server.
 */
require realpath(dirname(__FILE__))."/GitInstaller.php";
class gitUpdater{
	
	private $installer;
	public static $config;
	
	public function __construct() {
		self::getConfig();
		if(isset(self::$config['ill_updating'])) exit;
		if(!$this->updateAvailable()) $this->finish();
		self::setConfig(array(
			'ill_updating' => array(
				'data' => array(
					'completed_pct' => 2
				),
				'response' => 'Connecting to repository'
			)
		));
		
		$installer = new GitInstaller('Pamblam', 'iLoveLAMP', array(__CLASS__, 'handleError'));
		$installer->skipFiles(array(
			'assets/config.json',
			'nbproject/',
			'nbproject/project.properties',
			'nbproject/project.xml'
		));
		$installer->setLoopHook(array(__CLASS__, 'loopHook'));
		$versions = $installer->getVersions();
		$version = array_pop($versions);
		$installer->installVersion($version['id'], realpath(dirname(dirname(dirname(__FILE__)))));
		
		$this->finish();
	}
	
	public function loopHook($filenumber, $totalfiles, $filename){
		self::setConfig(array(
			'ill_updating' => array(
				'data' => array(
					'completed_pct' => $totalfiles===$filenumber ? 100 : intval($filenumber/$totalfiles*100)
				),
				'response' => empty($filename) ? "Finishing up" : "Updating $filename"
			)
		));
	}
	
	public function handleError($msg){
		self::setConfig(array(
			'ill_updating' => array(
				'data' => array(
					'completed_pct' => 2
				),
				'response' => $msg
			)
		));
		$this->finish();
	}
	
	public function updateAvailable(){
		// do something here to determine if an update is actually available
		return true;
	}
	
	public function finish(){
		self::setConfig(array(
			'last_update' => date('c'),
			'ill_updating' => array(
				'data' => array(
					'completed_pct' => 100
				),
				'response' => 'All Done'
			)
		));
		sleep(3);
		unset(self::$config['ill_updating']);
		$json = json(self::$config); // json() is defined in the API.php file
		$fh = fopen("config.json", "w+");
		if($fh===false) exit("Can't open config file.");
		if(fwrite($fh, $json) === false) exit("Can't write to config file.");
		fclose($fh);
		exit;
	}
	
	public static function setConfig($config){
		self::getConfig();
		foreach($config as $k=>$v) self::$config[$k]=$v;
		$json = json(self::$config); // json() is defined in the API.php file
		$fh = fopen("config.json", "w+");
		if($fh===false) exit("Can't open config file.");
		if(fwrite($fh, $json) === false) exit("Can't write to config file.");
		fclose($fh);
	}
	
	public static function getConfig(){
		$config = file_get_contents("config.json");
		self::$config = json_decode($config, true);
	}
	
}
