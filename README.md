
# iLoveLAMP

[![iLoveLAMP YouTube clip](http://i.imgur.com/K2nnFPV.png)](https://www.youtube.com/watch?v=gId6nrMDmUU)

iLL is a suite of LAMP tools with a dynamic, responsive interface; error logging, resource management, etc. It provides an interface for many of the things you might do via SSH.

## Modules

#### Dashboard

Dashboard is the default module. It is loaded when iLoveLAMP is opened. This page contains links to the other modules and an overview of the currently selected server.

[![iLoveLAMP Dashboard Screenshot](http://i.imgur.com/oivhHgn.png)](http://i.imgur.com/oivhHgn.png)

#### Quick IDE

Quick IDE has 2 functions. It provides a sandbox area that can be used to execute and optionally save code snippets containing HTML, PHP, and Javascript. This module is also used by the File System module to open certain file types.

[![iLoveLAMP Quick IDE Screenshot](http://i.imgur.com/Ym1KmLF.png)](http://i.imgur.com/Ym1KmLF.png)

#### File System

The File System browser allows you to view a visual representation of the server's file structure. It has the same main features as Mac's Finder, Window's Explorer, and Linux's Nautilus, including file upload (without FTP) via drag n drop or button press, create and edit files and directories and the standard sort and search functions.

[![iLoveLAMPFile System Screenshot](http://i.imgur.com/91t5HGA.png)](http://i.imgur.com/91t5HGA.png)

#### Databases

This module is used to browse databases on the server, as well as execute arbitrary SQL and even beautify SQL statements. Results are displayed in a neat sortable and searchable Datatable.

[![iLoveLAMP Databases Screenshot](http://i.imgur.com/2Wk2mpo.png)](http://i.imgur.com/2Wk2mpo.png)

#### Tail Logs

Tail Logs allows you to tail pretty syntax highlighted logs on your server,  which helps to make debugging simpler.

[![iLoveLAMP Tail Logs Screenshot](http://i.imgur.com/9lqmAWn.png)](http://i.imgur.com/9lqmAWn.png)

#### Processes

Processes allows the user to monitor and kill currently running processes on the server.

[![iLoveLAMP Processes Screenshot](http://i.imgur.com/V2Lu1EA.png)](http://i.imgur.com/V2Lu1EA.png)

#### Terminal

Terminal is a non-interactive shell that allows you to run arbitrary commands on the server without having to manually SSH in to the server. This module also provides a downloadable shell script that allows the user to SSH into the server in a real terminal from a single command.

[![iLoveLAMP Processes Screenshot](http://i.imgur.com/fJ13Y12.png)](http://i.imgur.com/fJ13Y12.png)

#### Manage Servers

This module is where you set up your servers. This lists the location of the log files, SQL databases, default theme for each server and more.

[![iLoveLAMP Manage Servers Screenshot](http://i.imgur.com/S4Hi5gn.png)](http://i.imgur.com/S4Hi5gn.png)

#### Settings

This is where you can change general iLL settings related to anything from cookies to file type preferences. There is also an interface here that allows the application to download and update the lastest version of iLoveLAMP directly from the Github repo.

[![iLoveLAMP Settings Screenshot](http://i.imgur.com/A7A8Ueb.png)](http://i.imgur.com/A7A8Ueb.png)

## Install

I haven't worked out all the proper permissions required and there is no user authentication and little security, so don't put it on a live server yet; stick to your dev server for now.

 1. Open a terminal and move into the webroot.
	
		cd /path/to/webroot/
		
 2. Download and install the app.

        wget -qO- -O tmp.zip https://github.com/Pamblam/iLoveLAMP/archive/master.zip && unzip tmp.zip && rm tmp.zip

 3. Rename the directory to `ill`.
 
        mv iLoveLAMP-master ill

 4. Give it permissions so it can update itself. Like I said, I haven't worked out the proper permissions, but 777 will work, so keep it on the dev server.

        sudo chmod -R 777 ill

 5. Configure it. Navigate the the app's Servers module in your browser at `http://localhost/ill/#servers`. Add the details for all your servers by selecting "New Server" from the dropdown and entering a server name, the host, user and password that you would normally use to SSH into the server. You can add as many servers as you want.

### Licensing

There are several 3rd party extensions being used, some written by myself, some written by others. For now, I leave it up to the user to comb thru the source code and check the respective licenses of each library. Any code that is specific to this project is released under the MIT license. 

**Use this at your own risk. I am not liable if you fuck it up.**

### @Todo

 - Bugsweep
 - Installer/set-up page w/ compatibility check
 - Support Oracle in the databases section
 - Resources module
 - Write some documentation in the Wiki
 - Figure out what the licenses are for each of the 3rd party libraries and include them in the README
 - Implement some kind of upload progress display when uploading large files

<hr>

##### "Don't bane the dillies!"