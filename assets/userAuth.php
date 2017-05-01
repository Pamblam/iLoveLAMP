<?php

/**
 * This function will be evaluated on every API call and before loading the 
 * interface. If this function returns `false` the user will be denied access 
 * to the requested service. Do no do redirection in this function if the user
 * is not authorized as this function will also be called on AJAX requests.
 * session_start() is always called before this function.
 */
function auth_user(){
	
	// Do something here to authenticate user, 
	// perhaps from existing session data.
	
	return true;
}

