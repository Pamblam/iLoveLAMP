/**
 * Exposes an event called "textChange" which is triggered 
 * 2 seconds after user stops typing into an input or textarea.
 * This is useful when you want to catch a text change before the input 
 * goes out of focus, but not on every single keystroke.
 * @Author Rob Parham
 * @Website https://github.com/Pamblam/textChange
 */
(function($){
	var listenInterval = 1;
	$(document).on("keyup", "textarea,input", function(e){
		e.preventDefault();
		var ele = this;
		$(ele).data("textChangeTime", Date.now());
		setTimeout(function(){
			var lastTextChangeTime = $(ele).data("textChangeTime");
			var currentTextChangeTime = Date.now();
			var timeSinceLastChange = currentTextChangeTime-lastTextChangeTime;
			if(timeSinceLastChange > (listenInterval*1000)){
				$(ele).trigger({
					type: "textChange"
				});
			}
		}, (listenInterval*1000));
	});
	$.fn.textChange=function(eventHandler){
		if("function"!==typeof eventHandler) return;
		return $(this).each(function(){
			$(this).on("textChange", eventHandler);
		});
	};
})(jQuery);