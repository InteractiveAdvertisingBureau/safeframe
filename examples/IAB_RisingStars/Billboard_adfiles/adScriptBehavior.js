var extern = window.extern || $sf.ext;
var sfAPI = extern;

 function writeLog(message){
  var el = document.getElementById("feedback");
  if(el) el.innerHTML += message + "<br />";
 }

 function status_update(status, data)
 {
  if(status == "expanded"){
  }
  else if (status == "geom-update") {
   // update viewability
  }
 }

 /**
 * Expand the ad by calling the SafeFrame API
 */
 function expandAd(dim){
  var g, ex, obj;
	if ($sf.ext) {
		   try {
				  var expel = document.getElementById("showAdButton");
				  if(expel){
					expel.style.display = "none";
				  }
				  var adimg = document.getElementById("adImage");
				  if(adimg){
					adImage.style.display = "block";
				  }
				g = $sf.ext.geom(); // the geometry object
				ex = g && g.exp;
				obj = {};
				
				if(dim){
					obj.l=dim.l || 0;
					obj.r=dim.r || 970;
					obj.t=dim.t || 0;
					obj.b=dim.b || 250;
					obj.push= dim.push || true;
				}
				else{				
					obj.l=0;
					obj.r=970;
					obj.t=0;
					obj.b=250;
					obj.push=true;
				}
				//if (Math.abs(ex.l) >= expandedWidth && Math.abs(ex.t) >= expandedHeight) {
				  $sf.ext.expand(obj);
			//}
		   } catch (e) {
			//do not expand, not enough room
		   }
	} 
	else {
	   //api expansion not supported
	}
 } 

 function collapseAd(){
  $sf.ext.collapse();
  window.setTimeout(function(){
	  var expel = document.getElementById("showAdButton");
	  if(expel){
		expel.style.display = "block";
	  }
	  var adimg = document.getElementById("adImage");
	  if(adimg){
		adImage.style.display = "none";
	  }
  }, 500);
 }


 if (extern) {
  try {
   extern.register(970, 1, status_update);
  } catch (e) {
   writeLog("Exception or no safeframes available: " + e.message);
  }
 }

// Expand the ad on mouseover
(function(){
 setTimeout(function(){
  var body = document.getElementsByTagName('body')[0];
  body.style.height='100%';
  expandAd(window.sampleAdDim);

  /*
  body.addEventListener('mouseover', function(){
   expandAd();
  });
  body.addEventListener('mouseout', function(){
   collapseAd();
  });
  */

 }, 10);

})();
