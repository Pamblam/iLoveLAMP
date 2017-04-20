/**
 * Terminal UI Element plugin for jQuery
 * WTFPL
 */
(function($) {

    // the main function that is instatiated 
    // upon each element in the group
    function Terminal(textarea, params) {
        var self = this;
		if("TEXTAREA" !== $(textarea).prop("tagName")) throw new Error("$().Terminal requires a textarea element");
        self.ele = textarea;
		self.intro = params.username+"@"+params.hostname+":"+params.path+params.symbol+" ";
		$(self.ele).val(self.intro);
		$(self.ele).addClass("Terminal");
		self.commandHistory = [];
		self.commandHistoryIndex = 0;
		self.busy = false;
		
		self.setCommand = function(command){
			var lines = self.ele.value.split("\n")
			lines.pop();
			lines.push(self.intro+command);
			self.ele.value = lines.join("\n");
		};
		
		$(self.ele).keydown(function(e){
			// if busy
			if(self.busy){
				e.preventDefault();
				return false;
			}
			// if backspace
			if(e.which == 8){
				var lastLine = self.ele.value.split("\n").pop().substr(self.intro.length);
				if(lastLine.length < 1){
					e.preventDefault();
					return false;
				}
				return true;
			}
			// arrow keys
			if([37,38,39,40].indexOf(e.which) > -1){
				// do stuff to show previous commands if up or down
				if(e.which == 38){
					if(undefined === self.commandHistory[self.commandHistoryIndex]){
						self.commandHistoryIndex = 0;
						self.setCommand("");
					}else{
						self.setCommand(self.commandHistory[self.commandHistoryIndex]);
						self.commandHistoryIndex++;
					}
				}
				if(e.which == 40){
					if(undefined === self.commandHistory[self.commandHistoryIndex]){
						self.commandHistoryIndex = self.commandHistory.length-1;
						self.setCommand("");
					}else{
						self.setCommand(self.commandHistory[self.commandHistoryIndex]);
						self.commandHistoryIndex--;
					}
				}
				e.preventDefault();
				return false;
			}
			// enter key
			if(e.which == 13){
				self.busy = true;
				var lastLine = self.ele.value.split("\n").pop().substr(self.intro.length).trim();
				self.commandHistory.unshift(lastLine);
				self.commandHistoryIndex = 0;
				params.io(lastLine, function(out){
					self.ele.value += "\n > "+out;
				}, function(){
					self.ele.value += "\n"+self.intro;
					self.busy = false;
				});
				e.preventDefault();
				return false;
			}
			
			if([46, 35, 34, 33, 12].indexOf(e.which) > -1){
				e.preventDefault();
				return false;
			}
			
			return true;
		});
		
		var breakSelect = false;
		$(self.ele).on('select focus', function(){
			if(breakSelect){
				breakSelect = false;
				return;
			}
			breakSelect = true;
			console.log("resetting things");
			if(self.ele.setSelectionRange){
				var len = $(self.ele).val().length * 2;
				self.ele.setSelectionRange(len, len);
			}else $(self.ele).val($(self.ele).val());
			self.ele.scrollTop = 999999;
		});
		
		$(self.ele).focus();
    }

    // throw it all on top of the jQuery object.
    $.fn.Terminal = function(p, pp) {
		if(this.length === 1 && typeof p === "string" && $(this[0]).data('tInstance') !== 'undefined'){
			if(undefined === pp)
				return $(this).data('tInstance')[p]();
			else
				return $(this).data('tInstance')[p](pp);
		}else{
			return this.each(function() {
				params = typeof p === 'object' ? p : {};
				if(!params.hostname) params.hostname = "home";
				if(!params.username) params.username = "user";
				if(!params.path) params.path = "~";
				if(!params.symbol) params.symbol = "$";
				if(!params.io) params.io = function(input, output, done){ output('Command not found: '+input); done(); };
				if (typeof $(this).data('tInstance') === 'undefined')
					$(this).data('tInstance', new Terminal(this, params));
			});
		}
    };

})(jQuery);


