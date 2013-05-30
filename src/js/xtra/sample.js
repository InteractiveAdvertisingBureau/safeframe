/*
* Sample SafeFrame extension.
* This sample helps you understand the basics of adding an extension to SafeFrame
* by utilizing the $sf.xtra namespace.
*
* This file creates both a host and ext side extension.
* By including this source file in both the publisher page (host)
* and the ad vender source (ext) the extension is able to add functionality
* to SafeFrame that can be consumed on both sides.
*/

/**
 * @fileOverview Sample SafeFrame extension - host side.
 * @author <a href="mailto:ccole[AT]emination.com">Chris Cole</a>
 * @version 1.0.0
*/

/** @ignore */
(function(win) {
	
	var hostExtension, // Object for the host-side extension
		extExtension;  // Object for the ext-side extensions
		
	
	hostExtension = {
		consumeButter : function(){
			console.log('buttering the bread');
		},
		
		sendSandwich : function(){
			console.log('sending sandwich now');
		}	
	}
	
	extExtension = {
		sendButter : function(){
			console.log('sending butter now');
		},
		
		eatSandwich : function(sandwich){
			console.log('eating a yummy sandwich');
		}	
	}
	
	// register this extension
	win.$sf.xtra.register('sample', { host: hostExtension, ext: extExtension});
	
})(window);
