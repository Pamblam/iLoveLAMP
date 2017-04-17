<?php

/**
 * The basic class for handling async PHP requests
 * @author Rob Parham 10/26/15
 */
class asyncPage{
	
	/**
	 * To be called that the start of any page that is intended to
	 * return content to the browser and close connection before 
	 * stopping excecution. 
	 */
	public static function startOutput(){
		ignore_user_abort(true);
		set_time_limit(0);
		ob_start();
	}
	
	/**
	 * To be called after sending output back for the browser and before
	 * executing any long-running code
	 */
	public static function sendOutput(){
		$contentLength = ob_get_length();
		header("Content-Length: $contentLength");
		header('Connection: close');
		ob_end_flush();
		ob_flush();
		flush();
		if (session_id()) session_write_close();
	}
	
}