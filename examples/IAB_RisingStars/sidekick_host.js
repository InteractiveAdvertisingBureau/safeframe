String.prototype.VwIx=function(s){return this.toLowerCase().indexOf(s.toLowerCase())}
String.prototype.VwHas=function(){for(var i=0;i<arguments.length;i++)if(this.VwIx(arguments[i])>-1)return true;return false;}
window.VwCmd=function(nam,func){var vret=0,obj=document.getElementById(nam);obj=VwDIE?window[nam]:document[nam];if(obj){try{eval("vret=obj."+func);return vret;}catch(e){return vret;}}}
window.VwAg=navigator.userAgent.toLowerCase();
window.VwDopr=VwAg.VwHas("opera");
window.VwDIE=VwAg.VwHas("msie")&&!VwDopr;
window.VwIE9=VwAg.VwHas("msie 9");
window.VwAnimateStartTime;
window.VwAnimateTime = 2000;
window.VwAnimateInterval=null;
window.VwDistanceToScroll=0;

//In the Banner panel, the call to action will call this function to initiate the sidekick expand animation
function animateExpand(){
//	var sdiv = document.getElementById("sidekickDiv");
//	if(sdiv)sdiv.style.display="block";

	//acount for scrollbar size on ie9 browsers
  if(VwIE9)document.documentElement.scrollLeft+=16;
  
  //get the current time and use this as the animation start time
  window.VwAnimateStartTime=new Date();
  
  //clear any current intervals related to animating 
  clearInterval(window.VwAnimateInterval);
  
  //start expand animation
  window.VwAnimateInterval = setInterval("VwScrollToRight();",15);
  VwScrollToRight();
}

//In the Sidekick panel, the call to action will call this function to initiate the sidekick retract animation
function animateRetract(){
	
	//get the current time and use this as the animation start time
  window.VwAnimateStartTime=new Date();
  
  //clear any current intervals related to animating 
  clearInterval(VwAnimateInterval);
  
  //start retract animation
  window.VwAnimateInterval = setInterval("VwScrollToLeft();",15);
  VwScrollToLeft();
}

//easing
function VwEasing(t, b, c, d){
  t = t/(d/2);
  if (t < 1) return c/2*t*t + b;
  t--;
  return -c/2 * (t*(t-2) - 1) + b;
}

//get current Y scrollbar location
function getScrollXY() {
  var scrOfX = 0, scrOfY = 0;
  if( typeof( window.pageYOffset ) == 'number' ) {
    //Netscape compliant
    scrOfY = window.pageYOffset;
    scrOfX = window.pageXOffset;
  } else if( document.body && ( document.body.scrollLeft || document.body.scrollTop ) ) {
    //DOM compliant
    scrOfY = document.body.scrollTop;
    scrOfX = document.body.scrollLeft;
  } else if( document.documentElement && ( document.documentElement.scrollLeft || document.documentElement.scrollTop ) ) {
    //IE6 standards compliant mode
    scrOfY = document.documentElement.scrollTop;
    scrOfX = document.documentElement.scrollLeft;
  }
  return scrOfY;
}

//this function is called by animateExpand() to start expand easing animation
function VwScrollToRight(){
  try{
    var VwCurrentTime = new Date();
    var VwTimePassed = VwCurrentTime.getTime() - window.VwAnimateStartTime.getTime();
    window.VwDistanceToScroll = document.body.scrollWidth;
    
    //the animation will continue to ease until the specified animation time.
    if(VwTimePassed< window.VwAnimateTime){
      var VwScrollAmount = VwEasing(VwTimePassed, 0,window.VwDistanceToScroll, window.VwAnimateTime);
      window.scrollTo(VwScrollAmount,getScrollXY());
    }else{
    	
    	//once the animation completes, clear all animation intervals
      clearInterval(window.VwAnimateInterval);
      
      //notify flash panels the animation has completed to start flash content
      VwCmd('bannerSwfObjID','expandComplete()');
      VwCmd('sidekickSwfObjID','expandComplete()');
    }
  }catch(e) {}
}

//this function is called by animateRetract() to start retract easing animation
function VwScrollToLeft(){
  try{
    var VwCurrentTime = new Date();
    var VwTimePassed = VwCurrentTime.getTime() - window.VwAnimateStartTime.getTime();
    window.VwDistanceToScroll = document.body.scrollWidth;
    
    //the animation will continue to ease until the specified animation time.
    if(VwTimePassed< window.VwAnimateTime){
      var VwScrollAmount = VwEasing(VwTimePassed, 0,window.VwDistanceToScroll, window.VwAnimateTime);
      window.scrollTo(window.VwDistanceToScroll-VwScrollAmount+10,getScrollXY());
    }else{
    	var sdiv = document.getElementById("sidekickDiv");
			if(sdiv)sdiv.style.display="none";
    	//once the animation completes, clear all animation intervals
      clearInterval(window.VwAnimateInterval);
      window.scrollTo(0,getScrollXY());
      
      //notify flash panels the animation has completed to start flash content
      VwCmd('bannerSwfObjID','retractComplete()');
      VwCmd('sidekickSwfObjID','retractComplete()');
    }
  }catch(e) {}
}