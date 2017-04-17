<?php
/**
 * When initialized this class will begin a long running task that will download 
 * and attempt to install the entire iLL software from the Github server.
 */
class gitUpdater {
	
	public $config;
	
	public function __construct() {
		$this->getConfig();
		if(isset($this->config['ill_updating'])) exit;
		if(!$this->updateAvailable()) $this->finish();
		$this->setConfig(array(
			'ill_updating' => array(
				'data' => array(
					'completed_pct' => 2
				),
				'response' => 'Connecting to repository'
			)
		));
		
		// do stuff here to perform actual update
		// this is just dummy code to emulate it for the ui
		sleep(2);
		$this->setConfig(array('ill_updating' => array('data' => array('completed_pct' => 7),'response' => 'Doing some stuff')));
		sleep(2);
		$this->setConfig(array('ill_updating' => array('data' => array('completed_pct' => 25),'response' => 'Doing some more stuff')));
		sleep(2);
		$this->setConfig(array('ill_updating' => array('data' => array('completed_pct' => 78),'response' => 'Doing some other stuff')));
		sleep(2);
		$this->setConfig(array('ill_updating' => array('data' => array('completed_pct' => 92),'response' => 'Doing some things')));
		
		$this->finish();
	}
	
	public function updateAvailable(){
		// do something here to determine if an update is actually available
		return true;
	}
	
	public function finish(){
		$this->setConfig(array(
			'ill_updating' => array(
				'data' => array(
					'completed_pct' => 100
				),
				'response' => 'All Done'
			)
		));
		sleep(3);
		unset($this->config['ill_updating']);
		$json = json($this->config); // json() is defined in the API.php file
		$fh = fopen("config.json", "w+");
		if($fh===false) exit("Can't open config file.");
		if(fwrite($fh, $json) === false) exit("Can't write to config file.");
		fclose($fh);
		exit;
	}
	
	public function setConfig($config){
		$this->getConfig();
		foreach($config as $k=>$v) $this->config[$k]=$v;
		$json = json($this->config); // json() is defined in the API.php file
		$fh = fopen("config.json", "w+");
		if($fh===false) exit("Can't open config file.");
		if(fwrite($fh, $json) === false) exit("Can't write to config file.");
		fclose($fh);
	}
	
	public function getConfig(){
		$config = file_get_contents("config.json");
		$this->config = json_decode($config, true);
	}
	
}
