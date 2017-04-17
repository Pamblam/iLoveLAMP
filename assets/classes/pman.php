<?php
class pMan{
    private $user;
    private $parr = [];
    private $details = [];
	private $ssh = null;
	
	/**
	 * @param VALIDATED Net_SSH2 instance $ssh
	 * @param username $user
	 */
    public function __construct($ssh, $user = ""){
		$this->ssh = $ssh;
        if(!empty($user)){
            $this->user = $user;
        }
        $this->init();
    }
    
    public function plist(){
        return $this->parr;
    }
    
    public function details(){
        return $this->details;
    }
    
    public function kill($array){
        if(empty($this->user)){
            return "Please specify username.";
        }
        $o = [];
        foreach($array as $a){
            if(empty($a) || !is_numeric($a)){ continue; }
            $this->exec('kill -6 '.$a, $o);
        }
        $ret = "";
        foreach($o as $l){
            $ret .= $l."\r\n";
        }
        return $ret;
    }
    
    public function optimize(){
        if(empty($this->user)){
            return "Please specify username.";
        }
        $o = [];
        $this->exec('kill -6 $(pgrep -u '.$this->user.')', $o);
        return $o;
    }
    
	public function exec($command, &$r){
		$raw = $this->ssh->exec($command);
		$r = explode("\n", $raw);
		return $r;
	}
	
    private function init(){
        $r = [];
        $processes = [];
        $command = "top -n 1 -b";
        if(!empty($this->user)){
            $command .= " -u ".$this->user;
        }
        $this->exec($command,$r);
        foreach($r as $i=>$res){
            switch($i){
                case(0):
                    $la = explode("average:",$res);
					if(isset($la[1])){
						$la = $la[1];
						$la = explode(",",$la);
						$this->details['LOAD_AVG'] = [];
						$this->details['LOAD_AVG']['1_MIN'] = (float) trim($la[0]);
						$this->details['LOAD_AVG']['5_MIN'] = (float) trim($la[0]);
						$this->details['LOAD_AVG']['15_MIN'] = (float) trim($la[0]);
					}else{
						$this->details['LOAD_AVG'] = [];
						$this->details['LOAD_AVG']['1_MIN'] = -1;
						$this->details['LOAD_AVG']['5_MIN'] = -1;
						$this->details['LOAD_AVG']['15_MIN'] = -1;
					}
                    break;
                case(1):
                    $pl = explode(",",$res);
                    $this->details['COUNTS'] = [];
                    foreach($pl as $k=>$v){
                        $v = preg_replace('/\D/', '', $v);
                        switch($k){
                            case(0):
                                $this->details['COUNTS']['TOTAL'] = (int) $v;
                                break;
                            case(1):
                                $this->details['COUNTS']['RUNNING'] = (int) $v;
                                break;
                            case(2):
                                $this->details['COUNTS']['SLEEPING'] = (int) $v;
                                break;
                            case(3):
                                $this->details['COUNTS']['STOPPED'] = (int) $v;
                                break;
                            case(4):
                                $this->details['COUNTS']['ZOMBIE'] = (int) $v;
                                break;
                        }
                    }
                    break;
                case(2):
                    $this->details['CPU'] = [];
                    $cpu = substr($res,7);
                    $cpu = explode(",",$cpu);
                    foreach($cpu as $c){
                        $c = trim($c);
                        if(false !== strpos($c,"us")){
                            $this->details['CPU']['USER_CPU_TIME'] = (float) preg_replace('/[^\\d.]+/', '', $c);
                        }elseif(false !== strpos($c,"sy")){
                            $this->details['CPU']['SYSTEM_CPU_TIME'] = (float) preg_replace('/[^\\d.]+/', '', $c);
                        }elseif(false !== strpos($c,"ni")){
                            $this->details['CPU']['NICE_CPU_TIME'] = (float) preg_replace('/[^\\d.]+/', '', $c);
                        }elseif(false !== strpos($c,"wa")){
                            $this->details['CPU']['IO_WAIT_TIME'] = (float) preg_replace('/[^\\d.]+/', '', $c);
                        }elseif(false !== strpos($c,"hi")){
                            $this->details['CPU']['HARD_TIME'] = (float) preg_replace('/[^\\d.]+/', '', $c);
                        }elseif(false !== strpos($c,"si")){
                            $this->details['CPU']['SOFT_TIME'] = (float) preg_replace('/[^\\d.]+/', '', $c);
                        }elseif(false !== strpos($c,"st")){
                            $this->details['CPU']['STEAL_TIME'] = (float) preg_replace('/[^\\d.]+/', '', $c);
                        }
                    }
                    break;
                case(3):
                    $this->details['MEMORY'] = [];
                    $this->details['MEMORY']['PHYSICAL'] = [];
                    $mem = substr($res,4);
                    $mem = explode(",",$mem);
                    foreach($mem as $k=>$v){
                        $v = trim($v);
                        switch($k){
                            case(0):
                                $this->details['MEMORY']['PHYSICAL']['TOTAL'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                            case(1):
                                $this->details['MEMORY']['PHYSICAL']['IN_USE'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                            case(2):
                                $this->details['MEMORY']['PHYSICAL']['AVAILABLE'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                            case(3):
                                $this->details['MEMORY']['PHYSICAL']['BUFFERS'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                        }
                    }
                    if(isset($this->details['MEMORY']['PHYSICAL']['TOTAL'])){
                        if(isset($this->details['MEMORY']['PHYSICAL']['IN_USE'])){
                            @$this->details['MEMORY']['PHYSICAL']['IN_USE'] = $this->details['MEMORY']['PHYSICAL']['IN_USE']."mb (".round((($this->details['MEMORY']['PHYSICAL']['IN_USE']/$this->details['MEMORY']['PHYSICAL']['TOTAL'])*100),1)."%)";
                        }
                        if(isset($this->details['MEMORY']['PHYSICAL']['AVAILABLE'])){
                            @$this->details['MEMORY']['PHYSICAL']['AVAILABLE'] = $this->details['MEMORY']['PHYSICAL']['AVAILABLE']."mb (".round((($this->details['MEMORY']['PHYSICAL']['AVAILABLE']/$this->details['MEMORY']['PHYSICAL']['TOTAL'])*100),1)."%)";
                        }
                        if(isset($this->details['MEMORY']['PHYSICAL']['BUFFERS'])){
                            @$this->details['MEMORY']['PHYSICAL']['BUFFERS'] = $this->details['MEMORY']['PHYSICAL']['BUFFERS']."mb (".round((($this->details['MEMORY']['PHYSICAL']['BUFFERS']/$this->details['MEMORY']['PHYSICAL']['TOTAL'])*100),1)."%)";
                        }
                        $this->details['MEMORY']['PHYSICAL']['TOTAL'] = $this->details['MEMORY']['PHYSICAL']['TOTAL']."mb";
                    }
                    break;
                case(4):
                    $this->details['MEMORY']['SWAP'] = [];
                    $mem = substr($res,5);
                    $mem = explode(",",$mem);
                    foreach($mem as $k=>$v){
                        $v = trim($v);
                        switch($k){
                            case(0):
                                $this->details['MEMORY']['SWAP']['TOTAL'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                            case(1):
                                $this->details['MEMORY']['SWAP']['IN_USE'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                            case(2):
                                $this->details['MEMORY']['SWAP']['AVAILABLE'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                            case(3):
                                $this->details['MEMORY']['SWAP']['CACHE'] = intval(preg_replace('/[^\\d.]+/', '', $v))/1000;
                                break;
                        }
                    }
                    if(isset($this->details['MEMORY']['SWAP']['TOTAL'])){
                        if(isset($this->details['MEMORY']['SWAP']['IN_USE'])){
                            try{
                                $this->details['MEMORY']['SWAP']['IN_USE'] = $this->details['MEMORY']['SWAP']['IN_USE']."mb (".round((@($this->details['MEMORY']['SWAP']['IN_USE']/$this->details['MEMORY']['SWAP']['TOTAL'])*100),1)."%)";
                            }catch(Exception $e){
                                $this->details['MEMORY']['SWAP']['IN_USE'] = "n/a";
                            }
                        }
                        if(isset($this->details['MEMORY']['SWAP']['AVAILABLE'])){
                            try{
                                $this->details['MEMORY']['SWAP']['AVAILABLE'] = $this->details['MEMORY']['SWAP']['AVAILABLE']."mb (".round((@($this->details['MEMORY']['SWAP']['AVAILABLE']/$this->details['MEMORY']['SWAP']['TOTAL'])*100),1)."%)";
                            }catch(Exception $e){
                                $this->details['MEMORY']['SWAP']['AVAILABLE'] = "n/a";
                            }
                        }
                        if(isset($this->details['MEMORY']['SWAP']['CACHE'])){
                            try{
                                $this->details['MEMORY']['SWAP']['CACHE'] = $this->details['MEMORY']['SWAP']['CACHE']."mb (".round((@($this->details['MEMORY']['SWAP']['CACHE']/$this->details['MEMORY']['SWAP']['TOTAL'])*100),1)."%)";
                            }catch(Exception $e){
                                $this->details['MEMORY']['SWAP']['CACHE'] = "n/a";
                            }
                        }
                        $this->details['MEMORY']['SWAP']['TOTAL'] = $this->details['MEMORY']['SWAP']['TOTAL']."mb";
                    }
                    break;
                case(5):
                    break;
                case(6):
                    break;
                default:
                    $processes[] = $res;
            } 
        }
        $n = 0;
        foreach($processes as $p){
            $pro = trim(preg_replace('/\s+/', ' ',$p));
            $pro = explode(" ",$pro);
            $this->parr[$n]['PID'] = isset($pro[0]) ? $pro[0] : 0 ;
            $this->parr[$n]['USER'] = isset($pro[1]) ? $pro[1] : 0;
            $this->parr[$n]['PRIORITY'] = isset($pro[2]) ? $pro[2] : 0;
            $this->parr[$n]['TOTAL_MEMORY'] = isset($pro[4]) ? $pro[4] : 0;
            $this->parr[$n]['RES_MEMORY'] = isset($pro[5]) ? $pro[5] : 0 ;
            $this->parr[$n]['SHARED_MEMORY'] = isset($pro[6]) ? $pro[6] : 0;
            if(isset($pro[7])){
                switch($pro[7]){
                    case("D"):
                        $this->parr[$n]['STATUS'] = "DEAD";
                        break;
                    case("R"):
                        $this->parr[$n]['STATUS'] = "RUNNING";
                        break;
                    case("S"):
                        $this->parr[$n]['STATUS'] = "ASLEEP";
                        break;
                    case("T"):
                        $this->parr[$n]['STATUS'] = "TRACED";
                        break;
                    case("Z"):
                        $this->parr[$n]['STATUS'] = "ZOMBIE";
                        break;
                }
            }else{
                $this->parr[$n]['STATUS'] = "N/A";
            }
            $this->parr[$n]['CPU_USAGE'] = isset($pro[8]) ? $pro[8] : 0;
            $this->parr[$n]['MEM_USAGE'] = isset($pro[9]) ? $pro[9] : 0;
            $this->parr[$n]['TIME'] = isset($pro[10]) ? $pro[10] : 0;
            $this->parr[$n]['COMMAND'] = isset($pro[11]) ?$pro[11] : 0;
            $this->parr[$n]['VERBOSE'] = "Verbose cmd not available for PID: ".$this->parr[$n]['PID'];
            $e = array();
            exec("ps ".$this->parr[$n]['PID'],$e);
            if(count($e) > 1){
                $v = $e[1];
                $v = trim(preg_replace('/\s+/', ' ',$v));
                $v = explode(" ",$v);
                $verb = ""; 
                $x = 0;
                foreach($v as $ve){
                    if($x > 3){
                        $verb .= $ve." ";
                    }
                    $x++;
                }
                $this->parr[$n]['VERBOSE'] = trim($verb);
            }
            $n++;
        }
    }
}
