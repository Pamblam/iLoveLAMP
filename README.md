
# iLoveLAMP

Camma camma leepa chai.. dig? iLL is a suite of sweet LAMP tools with a dynamic, responsive interface; error logging, resource management, etc. It provides an interface for many of the things you might do via SSH.

As of now there are several modules still to be written, but the framework is done, so let's do a readme..

![enter image description here](http://i.imgur.com/fYACOsZ.png)

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

![enter image description here](http://i.imgur.com/hhilT28.png)

### Updating

Once installed, keeping it up to date is as simple as clicking the "Update link" in the Settings module.

![enter image description here](http://i.imgur.com/AmRvL2V.png)

### Licensing

Anything I wrote is released under the MIT license. See the source code for third party libraries and their own licenses.

**Use this at your own risk. I am not liable if you fuck it up.**

<hr>

##### "Don't bane the dillies!"