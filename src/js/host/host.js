/*
* Copyright (c) 2012, Interactive Advertising Bureau
* All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

/**
 * @namespace $sf.host Defines the Publisher side api, and helper functions
 * @name $sf.host
 * @author <a href="mailto:ssnider@yahoo-inc.com">Sean Snider</a>
 * @author <a href="mailto:ccole[AT]emination.com">Chris Cole</a>
 * @version 1.1.0
 *
*/

/** @ignore */
(function(win) {

	var NULL						= null,
		TRUE						= true,
		FALSE						= false,
		DEFAULT_RENDER_TIMEOUT		= 60000,
		POS_ID_AUTO_PREFIX			= "sf_pos",
		POS_REL_BOX_ID_PREFIX		= "sf_pos_rel_el",
		SF_DATATAG_CLASS			= "sf_data",
		SF_POSELEM_WRAPPER_CLASS	= "sf_position",
		AUTO_BOOT_MAX_RETRIES		= 100,
		GEOM_UPDATE_INTRVAL			= 750,
		XCOM_RESP_DELAY				= 1,
		IE_BORDER_ADJ				= 2,
		INTERSECT_FACTOR			= 10,
		BF_POS_MSG					= "onBeforePosMsg",
		POS_MSG						= "onPosMsg",
		SUPPORTS_FEATURES			=
		{
			"exp-ovr":			1,
			"exp-push":			0,
			"bg":				0,
			"pin":				0,
			"read-cookie":		0,
			"write-cookie":		0
		},
		EXPAND_COMMAND 			= "exp-ovr",
		COLLAPSE_COMMAND 		= "collapse",
		ERROR_COMMAND 			= "error",
		NOTIFY_EXPAND			= "expand",
		NOTIFY_GEOM_UPDATE		= "geom-update",
		NOTIFY_COLLAPSE			= COLLAPSE_COMMAND,
		NOTIFY_FOCUS_CHANGE		= "focus-change",
		DEFAULT_ZINDEX			= 3000,
		OBJ						= "object",
		FUNC					= "function",
		STR						= "string",
		ST						= "style",
		PROTO					= "prototype",
		LEN						= "length",
		WIDTH					= "width",
		HEIGHT					= "height",
		PX						= "PX",
		CLIP					= "clip",
		SCROLL					= "scroll",
		ONSCROLL				= "onscroll",
		COMPAT_MODE				= "compatMode",
		DOC_EL					= "documentElement",
		DOC						= "document",
		NODE_TYPE				= "nodeType",
		CONTAINS				= "contains",
		COMPARE_DOC_POS			= "compareDocumentPosition",
		EL_FROM_PT				= "elementFromPoint",
		AUTO					= "auto",
    	HIDDEN					= "hidden",
		OVER					= "overflow",
		TFXD					= "toFixed",
		ATTACH					= "attach",
		DETACH					= "detach",
		MSG						= "message",
		PMSG					= "postMessage",
		GUID					= "guid",
		FLASH_MIME 				= "application/x-shockwave-flash",
		sf						= (win && win.$sf),
		VERSION					= (sf && sf.ver),
		env						= (sf && sf.env),
		ua						= (env && env.ua),
		lib						= (sf && sf.lib),
		lang					= (lib && lib.lang),
		dom						= (lib && lib.dom),
		iframes					= (dom && dom.iframes),
		_cbool					= (lang && lang.cbool),
		_cnum					= (lang && lang.cnum),
		_cstr					= (lang && lang.cstr),
		_callable				= (lang && lang.callable),
		_noop					= (lang && lang.noop),
		_guid					= (lang && lang[GUID]),
		_mix					= (lang && lang.mix),
		_elt					= (dom && dom.elt),
		_par					= (dom && dom.par),
		_tags					= (dom && dom.tags),
		_attr					= (dom && dom.attr),
		_doc					= (dom && dom.doc),
		_tagName				= (dom && dom.tagName),
		_view					= (dom && dom.view),
		_ifr_view				= (iframes && iframes.view),
		_purge					= (dom && dom.purge),
		_ready					= (dom && dom.ready),
		_es						= (win && win.escape),
		M						= (win && win.Math),
		_max					= (M && M.max),
		_min					= (M && M.min),
		_round					= (M && M.round),
		_rect					= NULL,
		ParamHash				= (lang && lang.ParamHash),
		dc						= (win && win[DOC]),
		isIE					= (env && env.isIE),
		ieVer					= ((ua && ua.ie) || 0),
		wbVer					= ((ua && ua.webkit) || 0),
		geckVer					= ((ua && ua.gecko) || 0),
		operaVer				= ((ua && ua.opera) || 0),
		loc						= (win && win.location),
		locHost					= (loc && ((loc.protocol + "//" + (loc.host||loc.hostname)) || "")), // missing the port number

		rendered_ifrs			= {},
		msg_pipes				= {},
		ifr_dest_id_map 		= {},
		pending_ifrs			= {},
		complete_ifrs			= {},
		scroll_parents_attached	= {},
		mgr_bounds_details		= FALSE,
		canUseHTML5				= FALSE,
		html5Bound				= FALSE,
		win_events_attached		= FALSE,
		geom_update_timer		= 0,
		focus_update_timer		= 0,
		current_status			= NULL,
		msghostfb				= NULL,
		flash_ver 				= NULL,
		config					= NULL;
		
	var flashActiveXVersions = [
		"ShockwaveFlash.ShockwaveFlash.11",
		"ShockwaveFlash.ShockwaveFlash.8",
		"ShockwaveFlash.ShockwaveFlash.7",
		"ShockwaveFlash.ShockwaveFlash.6",
		"ShockwaveFlash.ShockwaveFlash"
	];

	/* --BEGIN-SafeFrames publisher data class definitions */

	/**
	 * Configure the base-level settings for the SafeFrames library
	 * Note that only one configuration can be active at a given time.
	 * Therefore you cannot change the configuration by creating a new $sf.host.Config while
	 * the SafeFrames library is busy (however you can add new position configurations).
	 * Instatiating a new config, when the library is not busy will destroy / remove all currently
	 * managed positions and there configurations.
	 *
	 * @name $sf.host.Config
	 * @constructor
	 * @public
	 * @param {Object} conf An object containing properties for configuration
	 * @param {Boolean} [conf.auto] Whether or not to have SafeFrames automatically boostrap an render any SafeFrames tags within the page
	 * @param {String} conf.cdn The protocol,host name, and port parts of a URI, that is a 2ndary origin, used with SafeFrames to render content. For example JS files would be loaded from conf.cdn+"/"+conf.root+"/"+conf.version+"/[filename]"
	 * @param {Boolean} [conf.debug] Whether or not debug mode is on or off
	 * @param {String} conf.root The root path part of the URI that is a 2ndary origin, used with SafeFrames to render content. For example the HTML file for rendering content into would beloaded from conf.cdn+"/"+conf.root+"/"+conf.version+"/"+conf.renderFile
	 * @param {String} conf.renderFile The filename (may also include path info), for which to render content into via a SafeFrame.
	 * @param {String} [conf.msgFile] The filename (may also include path info), for which to use as a proxy for x-domain messaging whenever HTML5 messaging is not available. Only required if supporting older browsers.
	 * @param {Number} [conf.to] The maximum amount of time in milliseconds to wait for a SafeFrame to finish rendering, defaults to 60 seconds.
	 * @param {Function} [conf.onBeforePosMsg] A callback function that gets fired before any cancellable action is requested to be peformed from a a SafeFrame, such as expansion, etc.  Return true out of this callback function to cancel/disallow the action in question.
	 * @param {Function} [conf.onPosMsg] A callback function that gets fired when an action requested by a SafeFrame is performed
	 * @param {Function} [conf.onStartPosRender] A callback function that gets fired when a SafeFrame starts to render 3rd party content.
	 * @param {Function} [conf.onEndPosRender] A callback function that gets fired when a SafeFrame finishes rendering 3rd party content.
	 * @param {Object} [conf.positions] A map of positions to automatically configure, where each key equals the id of the $sf.host.PosConfig object, and the value is an object containing said object's settings.
	 *
	*/

	function Config(conf)
	{
		var me = this, pos_map, conf_pos_map, posID, pos_conf, pos_id, boot_up;

		if (!arguments.length) return (config) ? _mix({}, config) : NULL;

		if (!(me instanceof Config)) return new Config(conf);

		if (!conf) {
			config = NULL;
			return NULL;
		}
		boot_up				= !!(config);
		me.auto				= ("auto" in conf) ? _cbool(conf.auto) : TRUE;
		me.cdn				= _cstr(conf.cdn);
		me.debug			= _cbool(conf.debug);
		me.root				= _cstr(conf.root);
		me.renderFile		= _cstr(conf.renderFile);
		me.msgFile			= _cstr(conf.msgFile);
		me.to				= _cnum(conf.to, DEFAULT_RENDER_TIMEOUT);
		me.ver				= _cstr(conf.ver) || VERSION;
		me.onBeforePosMsg	= _callable(conf.onBeforePosMsg) ? conf.onBeforePosMsg : _noop;
		me.onPosMsg			= _callable(conf.onPosMsg) ? conf.onPosMsg : _noop;
		me.onStartPosRender	= _callable(conf.onStartPosRender) ? conf.onStartPosRender : _noop;
		me.onEndPosRender	= _callable(conf.onEndPosRender) ? conf.onEndPosRender : _noop;
		me.onFailure 		= _callable(conf.onFailure) ? conf.onFailure3 : _noop;

		conf_pos_map		= conf.positions;
		me.positions		= pos_map = {};

		if (conf_pos_map) {
			for (posID in conf_pos_map)
			{
				pos_conf = conf_pos_map[posID];
				if (pos_conf && typeof pos_conf == OBJ) {
					pos_id			= posID || pos_conf.id || _guid(POS_ID_AUTO_PREFIX);
					pos_map[pos_id]	= new PosConfig(pos_conf);
				}
			}
		}
		config	= me;
		boot_up = !!(boot_up && me.auto && lang && lang.ns("$sf.host.boot"));

		try {
			if (boot_up) sf.host.boot();
		} catch (e) {

		}
		return _mix({},config);
	}

	/**
	 * Configure a particualar position for rendering a SafeFrame
	 * Each $sf.host.PosConfig object has an id property that should be unique.  Creating a new $sf.host.PosConfig with an id, that has already been
	 * used results in changing the old $sf.host.PosConfig settings, and can only be done if the SafeFrames library is not busy.
	 * Automatically ads to the position map of the $sf.host.Config object if said config has already been created.
	 *
	 * @name $sf.host.PosConfig
	 * @public
	 * @constructor
	 * @param {Object|String} posIDorObj The id of the $sf.host.PosConfig instance, or an object containing all settings that are to be used for the instance.
	 * @param {String} [posIDorObj.id] The id of the $sf.host.PosConfig instance, if not specified one will be generated automatically.
	 * @param {String} [posIDorObj.dest] The HTML element id attribute of the HTML element in the document where a SafeFrame will be rendered. Said element MUST exist within the page prior to a render.
	 * @param {String} [posIDorObj.bg] The color of the background to be used inside the SafeFrame. Default equals "transparent".
	 * @param {String} [posIDorObj.tgt] The name of the target window where hyperlinks inside a SafeFrame will navigate too...Note that "_self" is not allowed and always converted to "_top". Allowed values are any string value not prefixed with "_", or "_top" or "_blank".
	 * @param {String} [posIDorObj.css] A string of CSS rules, or a URL that points to a CSS style sheet to be used inside the SafeFrame
	 * @param {Number} [posIDorObj.w] The width of the SafeFrame, specified in pixels. Cannot be specified in em, % or another values.
	 * @param {Number} [posIDorObj.h] The height of the SafeFrame, specified in pixels. Cannot be specified in em, % or another values.
	 * @param {String} [posIDorObj.size] A string formated as "widthXheight", that defines the width and height of the SafeFrame. The delimiter character "X" is can be specified as lower or upper case.
	 * @param {String} [posIDorObj.z] The z-index of the SafeFrame.
	 * @param {Object} [posIDorObj.supports] An object containing key/value pairs for what features/actions are supported by the SafeFrame, and its corresponding value represents a boolean detereming whether that feature can be used.  Currently supported keys are "exp-ovr" == SafeFrame can expand in overlay mode, "exp-push" == SafeFrame can expand in push mode, and "bg" == SafeFrame can change the background of the publisher / host.
	 * @param {String} [destID] The HTML element id attribute of the HTML element in the document where a SafeFrame will be rendered. Said element MUST exist within the page prior to a render.
	 * @param {Object} [baseConf] An object representing a $sf.host.Config object to automatically use / create for the SafeFrames library. Note that baseConf can only be used one time, otherwise you have to use the $sf.host.Config object directly.
	 *
	*/

	function PosConfig(posIDorObj, destID, baseConf)
	{
		var me = this, typ = (posIDorObj && typeof posIDorObj) || "", sz, sz_split;

		if (!(me instanceof PosConfig)) return new PosConfig(posIDorObj,destID,baseConf);

		if (typ == OBJ) {
			me.id		= _cstr(posIDorObj.id);
			me.dest		= _cstr(posIDorObj.dest || destID);
			me.bg		= _cstr(posIDorObj.bg) || "transparent";
			me.tgt		= _cstr(posIDorObj.tgt) || "_top";
			me.css		= _cstr(posIDorObj.css);
			me.w		= _cnum(posIDorObj.w, 0);
			me.h		= _cnum(posIDorObj.h, 0);
			me.z		= _cnum(posIDorObj.z, 0);
			me.supports = _mix({}, posIDorObj.supports || SUPPORTS_FEATURES, TRUE, TRUE, TRUE);

			if (!me.w || !me.h) {
				sz 	= _cstr(posIDorObj.size);
				if (sz) {
					sz_split	= sz.split(/x/gi);
					me.w		= _cnum(sz_split[0], 0);
					me.h		= _cnum(sz_split[1], 0);
					me.size		= sz;
				} else {
					me.size		= "";
				}
			} else {
				me.size			= me.w + "x" + me.h;
			}
		} else if (typ == "string") {
			me.id		= _cstr(posIDorObj);
			me.dest		= _cstr(posIDorObj.dest);
		} else {
			me.dest		= "";
			me.bg		= "transparent",
			me.tgt		= "_top";
			me.css		= "";
			me.w		= 0;
			me.h		= 0;
			me.size		= "";
			me.z		= 0;
			me.supports	= {};
		}

		me.id = me.id || _guid(POS_ID_AUTO_PREFIX);

		if (!config && baseConf) Config(baseConf);
		if (config) config.positions[me.id] = me;

		return _mix({}, me);
	}

	/**
	 * Construct a set of dynamic key/value pairs that can be shared as meta-data with the 3rd party content inside a SafeFrame.
	 * All data is treated as protected, and can only be specfied during construction of this object.
	 *
	 * @exports PosMeta as $sf.host.PosMeta#
	 * @public
	 * @constructor
	 * @class
	 * @param {Object} shared_object An object containing keys and values to be shared as meta-data inside the SafeFrame
	 * @param {String} [owner_key] A key name to be used to hold pseudo private keys / values of meta data.
	 * @param {Object} [owned_obj] An object containing psuedo private keys and values to be shared as meta-data inside the SafeFrame.
	 * @example
	 * var shared_data 		 = {content_id:8978098,partner_id:99},
	 *     private_data_key	 = "rmx",
	 * 	   private_data      = {section_id:2342,site_id:23904},
	 *     meta_data		 = new $sf.host.PosMeta(shared_data, private_data_key, private_data);
	 *
	 * //show section id on host side
	 * alert(meta_data.value("rmx", "site_id")); //== 23904
	 *
	 * @example
	 * //now retrieve this information inside the safe frame
	 *
	 * var content_id = $sf.vend.meta("content_id"); //== 8978098
	 *
	 * var rmx_section_id = $sf.vend.meta("rmx", "section_id") //== 2342, but note that vendor side code must know the "owner_key" upfront.
	 *
	*/

	function PosMeta(shared_obj, owner_key, owned_obj)
	{

		var me = this, shared, non_shared, old, posConf;

		if (!(me instanceof PosMeta)) return new PosMeta(key,owned_obj,pos,shared_obj);


		shared 		= {};
		non_shared	= {};

		if (!owner_key || typeof owner_key != STR) return me;

		if (shared_obj && typeof shared_obj == OBJ) shared = _mix(shared, shared_obj);

		if (owned_obj && typeof owned_obj == OBJ) non_shared[owner_key] = owned_obj;


		/**
		 * A method retrieves a meta data value from this object.
		 *
		 * @exports get_value as $sf.host.PosMeta#value
		 * @param {String} propKey The name of the value to retrieve
		 * @param {String} [owner_key] The name of the owner key of the meta data value. By default, it is assumed to be shared, so nothing needs to be passed in unless looking for a specific proprietary value
		 * @return {String|Number|Boolean}
		 * @default {String} ""
		 * @public
		 * @function
		 *
		*/
		function get_value(propKey, owner_key)
		{
			var ret = "";
			if (!propKey || typeof propKey != STR) return ret;
			if (!owner_key || typeof owner_key != STR) owner_key = "shared";

			if (owner_key == "shared") {
				ret = shared[propKey] || "";
			} else {
				ret = (propKey in non_shared) ? (non_shared[prop_key] || "") : "";
			}
			return ret;
		}

		/**
		 * Return a serialized string representation (in url query string format) of the meta data object
		 *
		 * @exports serialize as $sf.host.PosMeta#toString
		 * @function
		 * @public
		 *
		*/

		function serialize()
		{
			var obj 			= new ParamHash();
				obj.shared		= shared;
				obj.non_shared	= non_shared;

			return obj.toString();
		}

		me.toString = serialize;
		me.value	= get_value;

	}


	/**
	 * Create the HTML markup for a position if a src property was used
	 *
	 * @name $sf.host-_create_pos_markup
	 * @function
	 * @private
	 * @static
	 * @return {String}
	 *
	*/

	function _create_pos_markup(src)
	{
		if (src) {
			// TODO: Macro expansion within src url
			// Spec section 4.6
			// $(sf_ver}
			// $(ck_on}
			// $(flash_ver}
			if(src.indexOf("${sf_ver}") > -1){
				src = src.replace(/\${sf_ver}/gi, $sf.ver);
			}
			if(src.indexOf("${ck_on}") > -1){
				var ckVal = _cookies_enabled_test() ? '1' : '0';
				src = src.replace(/\${ck_on}/gi, ckVal);
			}
			if(src.indexOf("${flash_ver}") > -1){
				var fVer = _get_flash_version();
				src = src.replace(/\${flash_ver}/gi, fVer);
			}
			
			
		}
		
		return _cstr(["<scr","ipt type='text/javascript', src='", src, "'></scr", "ipt>"]);
	}
	
	/**
	* Get the falsh version number
	*/
	function _get_flash_version(){
		if(flash_ver !== NULL){
			return flash_ver;
		}
		
		if(navigator.plugins && navigator.plugins.length>0){
			var mimeTypes = navigator.mimeTypes;
            if(mimeTypes && mimeTypes[FLASH_MIME] && mimeTypes[FLASH_MIME].enabledPlugin && mimeTypes[FLASH_MIME].enabledPlugin.description){
                flash_ver = mimeTypes[FLASH_MIME].enabledPlugin.version;
            }
		}
		else if(sf.env.isIE){
			// ActiveX detect
			var i, obj, tmpVer, p;
			for(i=0; i < flashActiveXVersions.length; i++){
				try{
					obj = new ActiveXObject(flashActiveXVersions[i]);
					tmpVer = obj.GetVariable("$version");
					p = tmpVer.indexOf(' ');
					if(p > -1){
						flash_ver = tmpVer.substr(p+1).replace(/,/gi, ".");;
					}
					else{
						flash_ver = tmpVer.replace(/,/gi, ".");
					}
					break;
					// "WIN 11,3,378,5"
				}catch(err){
					obj = NULL;
					flash_ver = 0;
					continue;
				}
			}
		}
		else{
			flash_ver = 0;
		}
		
		return flash_ver;
		
		var getActiveXVersion = function(activeXObj){
        var version = -1;
        try{
            version = activeXObj.GetVariable("$version");
        }catch(err){}
        return version;
    };
	}

	/**
	* Test to see if cookies are enabled
	*/
	function _cookies_enabled_test()
	{
		var cookieEnabled = (navigator.cookieEnabled) ? true : false;

		if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled)
		{ 
			document.cookie="testcookie";
			cookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
			if(navigator){
				navigator.cookieEnabled = cookieEnabled;
			}
		}
		return (cookieEnabled);
	}

	/**
	 * Construction a postion content object that contains HTML, optionally meta-data, and optionally a position configuration to use.
	 * The id specified must match an id for a $sf.host.PosConfig (although said config could be specfied directly here via arguments).
	 *
	 * @name $sf.host.Position
	 * @constructor
	 * @public
	 * @param {Object|String} posIDorObj The id of the position which maps to its configuration, or an object represeting the various values of an $sf.host.Position instance.
	 * @param {String} [posIDorObj.id] The id of the position which maps to its configuration.
	 * @param {String} [posIDorObj.html] The HTML content to be rendered inside the SafeFrame. Note that HTML strings which have SCRIPT tags or other special characters may need to be properly escaped in order to avoid JavaScript syntax errors.
	 * @param {String} [posIDorObj.src] An optional URL to be used for redering inside the SafeFrame which will automatically generate a SCRIPT tag with the specified URL.
	 * @param {$sf.host.PosMeta} [posIDorObj.meta] An optional instance of the $sf.host.PosMeta object to be passed along into the SafeFrame
	 * @param {Object} [posIDorObj.conf] An optional representation of an $sf.host.PosConfig object to be used as the configuration for the SafeFrame position.
	 * @param {String} [html] The HTML content to be rendered inside the SafeFrame. Note that HTML strings which have SCRIPT tags or other special characters may need to be properly escaped in order to avoid JavaScript syntax errors.
	 * @param {$sf.host.PosMeta} [meta] An optional instance of the $sf.host.PosMeta object to be passed along into the SafeFrame
	 * @param {Object} [conf] An optional representation of an $sf.host.PosConfig object to be used as the configuration for the SafeFrame position.
	 *
	*/

	/*
	 * This is a data objet constructor, and we don't want dom interactions placed inside here
	 *
	*/
	function Position(posIDorObj, html, meta, conf)
	{
		var me 	= this,
			typ = (posIDorObj && typeof posIDorObj),
			origHtml = html,
			id;

		// the reason for this check is so that some one doesn't have to do "new $sf.host.Position", they
		// can just do "$sf.host.Position"

		if (!(me instanceof Position)) return new Position(posIDorObj, html, meta, conf);

		// Insure config is initialized
		if(config == null){
			var msg = "Publisher Config not initialized - abort";
			logger.error(msg);
			info.errs.push(msg);
			return;
		}

		if (typ == OBJ) {
			_mix(me, posIDorObj);
		} else {
			id = me.id = _cstr(posIDorObj) || _guid(POS_ID_AUTO_PREFIX);
		}

		if (!html) {
			if (me.src) {
				me.html = _create_pos_markup(me.src);
			} else {
				me.html = me.html || "";
				me.src	= "";
			}
		} else {
			me.html	= html;
			me.src	= "";
		}

		if (!me.html) me.html		= "";

		me.meta = meta || me.meta || {};
		me.conf = conf || me.conf || {};

		if (id) {
			if (config && config.positions[id]) {
				me.conf = config.positions[id];
			} else {
				if (conf) {
					conf.id	= id;
					me.conf = new PosConfig(conf);
				}
			}
		}
	}

	/* --END-SafeFrames publisher data class definitions */


	/* --BEGIN--SafeFrames publisher side dom helper functions */
	/* removed the concept of needing a "host" file and put all that logic to keep the file sturcture simple */

	/**
	 * @namespace $sf.lib.dom.msghost Contains functionality to reside in the top level page for sending and receiving x-domain messages to SafeFrame containers
	 * @name $sf.lib.dom.msghost
	 *
	*/

	/**
	 * Returns the root document HTMLElement / node
	 * @name $sf.lib.dom-_docNode
	 * @private
	 * @static
	 * @function
	 * @param {HTMLElement} [el] An HTMLElement to use as a reference for finding the root document element.
	 * @returns {HTMLElement}
	 *
	*/

	function _docNode(el)
	{
		var d			= (el && _doc(el)) || dc,
			compatMode	= d[COMPAT_MODE],
			root		= d[DOC_EL];

		if (compatMode && !operaVer && compatMode != 'CSS1Compat')
    		root = d.body;

   		return root;
    }

    /**
     * Returns whether or not a value is specified in pixels
     * @name $sf.lib.dom-_isPX
     * @private
     * @static
     * @function
     * @param {String} val A css value of size
     * @returns {Boolean}
     *
    */

    function _isPX(val)
	{
   		val = _cstr(val);
   		if (val && val.search(/\D+/g) == -1) return TRUE;
   		if (val && val.search(/px/gi) != -1) return TRUE;
   	}

   	/**
     * Return an array of values of clipping region information. Array represents top, right, bottom, left values respectively.
     * If values are not specified in pixels, or no clip region is defined for that element, -1 is returned for each value.
     *
     * @name $sf.lib.dom-_getClip
     * @private
     * @function
     * @static
     * @param {HTMLStyleObject} curSt The current style object of an HTMLElement
     * @return {Array}
     *
    */

    function _getClip(curSt)
    {
		var ret = [-1,-1,-1,-1], props = [CLIP+"Top",CLIP+"Right",CLIP+"Bottom",CLIP+"Left"],
			idx = 0, clipVal, prop, val, len;

		if (!curSt) return ret;

		if (ieVer) {
			while (prop = props[idx])
			{
				clipVal = curSt[prop];
				if (_isPX(clipVal)) {
					clipVal	= _cnum(clipVal,-1);
					if (clipVal >= 0) ret[idx] = clipVal;
				}
				idx++;
			}
		} else {
			clipVal = curSt[CLIP];
			if (clipVal && clipVal.search(/\d+/g) != -1) {
				clipVal		= clipVal.replace(/\w+\(([^\)]*?)\)/g, "$1");
				ret			= clipVal.split(" ");
				ret			= (ret[LEN] <= 1) ? ret.split(",") : ret;
				len			= ret[LEN];
				idx			= 0;
				while (len--)
				{
					val = ret[idx];
					if (!_isPX(val)) {
						ret[idx] = -1;
					} else {
						ret[idx] = _cnum(val,-1);
					}
					idx++;
				}
			}
		}

		return ret;
	}


	/**
	 * Returns border values in pixels if possible to help calculate geometry of an element
	 *
	 * @name $sf.lib.dom-_calcBorders
	 * @private
	 * @static
	 * @function
	 * @param {HTMLElement} el The HTMLElement for which to look at. . .
	 * @param {Object} rect The rect object generated for the HTMLElement in question to be adjusted
	 * @returns {Object} rect
	 *
	*/

	function _calcBorders(el, rect)
   	{
     	var t = 0, l = 0, st, re = /^t(?:able|d|h|r|head|foot)$/i;

		st 	= currentStyle(el);
		if (st) {
	     	t 	= st["borderTopWidth"]
	     	l 	= st["borderLeftWidth"];
	     	t = (_isPX(t)) ? _cnum(t,0) : 0;
	     	l = (_isPX(l)) ? _cnum(l,0) : 0;

	     	if (geckVer && re.test(_tagName(el))) //getBrowserVersion should already be called since this method is only called from getRectNonIE
	     		t = l = 0;
	    }
	    rect = rect || {t:0,l:0};

     	rect.t += t;
     	rect.l += l;
     	return rect;
    }

    /**
     * Retrieve scroll values of a document
     *
     * @name $sf.lib.dom-_get_doc_scroll
     * @private
     * @static
     * @function
     * @param {HTMLElement} [el] An HTMLElement to use as a reference document rather than the default main document
     * @return {Object} Contains x, y, w, h properties for scrolling
     *
    */

    function _get_doc_scroll(el)
	{
   		var pos = {x:0,y:0,w:0,h:0}, def = {scrollLeft:0,scrollTop:0,scrollWidth:0,scrollHeight:0}, d, de, dv, db, offsetX = 0, offsetY = 0;

		d		= _doc(el) || dc;
		de		= d[DOC_EL] || def;
		db		= d.body || def;
		dv 		= d.defaultView; //only for non-ie
		if (dv) {
			offsetX	= _cnum(dv.pageXOffset,0);
			offsetY	= _cnum(dv.pageYOffset,0);
		}
		pos.x = _max(de.scrollLeft, db.scrollLeft, offsetX);
		pos.y = _max(de.scrollTop, db.scrollTop, offsetY);
		pos.w = _max(de.scrollWidth, db.scrollWidth, 0);
		pos.h = _max(de.scrollHeight, db.scrollHeight,0);
   		return pos;
   	}

   	/**
   	 * Calculate a geometric rectangle for a given element. Note that for IE browsers
   	 * we can use the "getBoundingClientRect" function which saves us some time / increases
   	 * peformance. . however it really can only be called if the DOM is completely loaded,
   	 * and if that is the case we fallback to the brute-force / non-IE method.
   	 *
   	 * @name $sf.lib.dom-_getRectIE
   	 * @private
   	 * @static
   	 * @function
   	 * @param {HTMLElement} el  The element for which to derive a rectangle object
   	 * @returns {Object} An object representing the rectangle for the given HTMLElement
   	 *
   	*/

	function _getRectIE(el)
   	{
	    var rect 	= {t:0,l:0,r:0,b:0,w:0,h:0,z:0},
	    	_back 	= "BackCompat",
	    	scroll, box, d, de, compatMode,st,
	    	adjustX, adjustY, bLeft, bTop;

        if (el && el[NODE_TYPE] == 1) {
			try {
				d			= _doc(el) || dc;
				if (!dom.ready()) return _getRectNonIE(el);

				scroll 		= _get_doc_scroll(el);
				box			= el.getBoundingClientRect();
		       	rect.t		= box.top;
	        	rect.l		= box.left;

	        	adjustX		=
	        	adjustY 	= IE_BORDER_ADJ;
	        	compatMode	= d[COMPAT_MODE];
	        	de			= d[DOC_EL];
	        	st			= currentStyle(de);
	        	bLeft		= st["borderLeftWidth"];
	        	bTop		= st["borderTopWidth"];

				if (ieVer === 6) {
					if (compatMode != _back) {
						adjustX =
						adjustY = 0;
					}
				}
				if (compatMode == _back) {
					bLeft 	= (_isPX(bLeft)) ? _cnum(bLeft,0) : 0;
					adjustX	= bLeft;
					bTop	= (_isPX(bTop)) ? _cnum(bTop,0) : 0;
					adjustY = bTop;
					rect.t -= adjustX;
					rect.l -= adjustY;
				}
				rect.t += scroll.y;
				rect.l += scroll.x;
				rect.b = rect.t + el.offsetHeight;
				rect.r = rect.l + el.offsetWidth;
				rect.w = _max((rect.r-rect.l),0);
				rect.h = _max((rect.b-rect.t),0);
				rect.z = currentStyle(el, "zIndex");
			} catch (e) {
				rect = {t:0,l:0,r:0,b:0,w:0,h:0,z:0};
			}
		}
		return rect;
    }

    /**
   	 * Calculate a geometric rectangle for a given element. For non-IE browsers, we must use
   	 * brute-force and walk up the offsetParent tree. Also takes in consideration for some
   	 * other slight variations in browsers.
   	 *
   	 * @name $sf.lib.dom-_getRectNonIE
   	 * @private
   	 * @static
   	 * @function
   	 * @param {HTMLElement} el  The element for which to derive a rectangle object
   	 * @returns {Object} An object representing the rectangle for the given HTMLElement
   	 *
   	*/

	function _getRectNonIE(el)
    {
    	var rect		= {t:0,l:0,r:0,b:0,w:0,h:0,z:0},
    		scrollTop	= 0,
    		scrollLeft	= 0,
    		bCheck		= FALSE,
    		root		= _docNode(el),
    		scroll 		= _get_doc_scroll(el),
    		parentNode, w, h;

    	if (el && el[NODE_TYPE] == 1) {
    		try {
	    		rect.l		= el.offsetLeft || 0;
	    		rect.t		= el.offsetTop || 0;
	    		parentNode	= el;

				bCheck	= (geckVer || wbVer > 519);

	    		while (parentNode = parentNode.offsetParent)
	    		{
	    			rect.t += parentNode.offsetTop || 0;
	    			rect.l += parentNode.offsetLeft || 0;
	    			if (bCheck)
	    				_calcBorders(parentNode, rect);

	    			if (parentNode == root) break;
	    		}

	    		parentNode = el;

				if (currentStyle(parentNode, "position")  != "fixed") {
					parentNode = el;

					while (parentNode = _par(parentNode))
					{
						if (parentNode[NODE_TYPE] == 1) {
							scrollTop 	= parentNode.scrollTop || 0;
							scrollLeft 	= parentNode.scrollLeft || 0;

							//Firefox does something funky with borders when overflow is not visible.
				        	if (geckVer && currentStyle(parentNode, OVER) != "visible")
				        		_calcBorders(parentNode, rect);

		                    rect.l -= scrollLeft;
		                    rect.t -= scrollTop;
						}
	                    if (parentNode == root) break;
					}

					rect.t += scroll.y;
					rect.l += scroll.x;
				} else {
					rect.t += scroll.y;
					rect.l += scroll.x;
				}
				if (!ieVer && el == _docNode(el)) {
					h = el.clientHeight;
					w = el.clientWidth;
				} else {
					h = el.offsetHeight;
					w = el.offsetWidth;
				}

				rect.b = rect.t + h;
				rect.r = rect.l + w;
				rect.w = _max((rect.r-rect.l), 0);
				rect.h = _max((rect.b-rect.t), 0);
				rect.z = currentStyle(el, "zIndex");
			} catch (e) {
				rect = {t:0,l:0,r:0,b:0,w:0,h:0,z:0};
			}
		}

		return rect;
    }

    /**
     * Returns an object that represents a rectangle with the geometric information of an HTMLDocument
     * (includes scroll width / height)
     *
     * @name $sf.lib.dom.docRect
     * @public
     * @static
     * @function
     * @param {HTMLElement} [el] An HTMLElement to use as the reference for an HTMLDocument
     * @returns {Object}
     *
    */

    function docRect(el)
    {
    	var root	= _docNode(el),
    		w		= 0,
    		h		= 0;

    	if (root) {
    		w	= root.scrollWidth || 0;
    		h	= root.scrollHeight || 0;
    	}
   		return {t:0,l:0,b:h,r:w,w:w,h:h};
    }

    /**
     * Returns an object that represents a rectangle with the geometric information of an HTMLWindow
     * (does not include scroll width / height)
     *
     * @name $sf.lib.dom.winRect
     * @public
     * @static
     * @function
     * @param {HTMLElement} [el] An HTMLElement to use as the references for an HTMLWindow
     * @returns {Object}
     *
    */

    function winRect(el)
    {
    	var wi		= (el && _view(el)) || win,
    		h		= wi.innerHeight || 0,
    		w		= wi.innerWidth || 0,
    		t		= wi.screenY || wi.screenTop || 0,
    		b		= h+t,
    		l		= wi.screenX || wi.screenLeft || 0,
    		r		= w+l,
    		root	= _docNode(el);

    	if (!h && !w && root) {
   			h = root.clientHeight || 0;
   			w = root.clientWidth || 0;
   			r = l+w;
   			b = t+h;
    	}
   		return {t:t,l:l,b:b,r:r,w:w,h:h};
    }

	/**
	 * Returns whether or not an HTMLElement is contained within another HTMLElement
	 *
	 * @name $sf.lib.dom.contains
	 * @public
	 * @static
	 * @function
	 * @param {HTMLElement} element The HTMLElement reference to search within
	 * @param {HTMLElement} needle The HTMLElement for which you want to check if its contained by the 1st parameter
	 * @returns {Boolean}
	 *
	*/

	function contains(element, needle)
	{
		var ret = FALSE, el_node_type = ((element && element[NODE_TYPE]) || -1), needle_node_type = ((needle && needle[NODE_TYPE]) || -1);

		if (el_node_type == 1 && needle_node_type != -1) {
			if (element[CONTAINS]) {
				if (operaVer || needle_node_type == 1) {
					ret = element[CONTAINS](needle);
				} else {
					while (needle)
					{
						if (element === needle) {
							ret = TRUE;
							break;
						}
						needle = needle.parentNode;
					}
				}
			} else if (element[COMPARE_DOC_POS]) {
				ret = (element === needle || !!(element[COMPARE_DOC_POS](needle) & 16));
			}
		}
		return ret;
	}

	/**
	 * Returns the current value of a style attribute, or the current style object in its entirety depending on whether an attribute parameter is specified
	 *
	 * @name $sf.lib.dom.currentStyle
	 * @public
	 * @static
	 * @function
	 * @param {HTMLElement} el The HTMLElement for which to retrieve style information
	 * @param {String} [attr] The style attribute (in JavaScript notation, e.g. 'backgroundColor' rather than 'background-color') to fetch.
	 * @return {HTMLStyleObject} An HTMLStyleObject containing all current style attribute values
	 * @return {String} The value of an style attribute (only if attr parameter is specified).
	 *
	*/

    function currentStyle(el, attr)
    {
    	var val = "", hasAttr = !!(arguments[LEN] && attr), comp = "getComputedStyle", e;

    	if (hasAttr) {
    		if (ieVer) {
				try {
					val = el.currentStyle[attr];
				} catch (e) {
					val = "";
				}
			} else {
				try {
					val = _view(el)[comp](el,NULL)[attr];
				} catch (e) {
					val = "";
				}
			}
		} else {
			if (ieVer) {
				try {
					val = el.currentStyle;
				} catch (e) {
					val = NULL;
				}
			} else {
				try {
					val = _view(el)[comp](el,NULL);
				} catch (e) {
					val = NULL;
				}
			}
		}
		return val;
	}

	/**
	 * Calculate the surrounding boundaries of an HTMLElement, and whether or not the HTMLElement is "in-view" of the user
	 *
	 * @name $sf.lib.dom.bounds
	 * @public
	 * @static
	 * @function
	 * @param {HTMLElement} el The element for which to calculate information
	 * @param {Object} [details] An object reference used as an output parameter in which further details about the boundaries of the element are specified
	 * @param {Boolean} [check_3D] Check the element within 3 dimensional space such that any elements covering said element are also take into consideration
	 * @returns {Object} info An object containing information about the element boundaries
	 *
	*/

	function bounds(el, details, check_3D)
    {
		var par					= el && _par(el),
    		root				= _docNode(el),
    		el_rect				= _rect(el),
    		root_rect			= _rect(root),
    		root_scroll			= _get_doc_scroll(root),
    		doc_rect			= docRect(el),
    		clip_rect			= {t:0,l:0,r:0,b:0,w:0,h:0},
    		exp_rect			= {t:0,l:0,r:0,b:0,xs:0,ys:0,xiv:0,yiv:0,iv:0,w:0,h:0},
    		xsb_h				= 0,
    		ysb_w				= 0,
    		is_scroll_node		= FALSE,
    		is_using_doc_root_r	= FALSE,
    		is_using_doc_root_b	= FALSE,
    		cur_st, w, h, t, l, r, b, scroll_width, offset_width, client_width,
    		scroll_height, offset_height, client_height,over_x_val, scroll_left, scroll_top,
    		over_y_val, clip, x_hidden, y_hidden, ref_node, temp_rect, is_scroll_node = FALSE;

       	details = (details && typeof details == OBJ) ? details : {};

    	if (par) {
    		/*
    		 * Here we are looping through parent nodes to check if any of them have clip / overflow
    		 * settings which would create a new boundary point (as opposed to the body of the document)
    		 *
    		 * Ideally I would have liked to break the logic out that finds said reference node, away
    		 * from the calculation part. . however during optimization phases, it was quick to store
    		 * off variables for from dom properties for width / height
    		 *
    		*/

    		while (cur_st = currentStyle(par))
    		{
				if (cur_st["display"] == "block" ||
					cur_st["position"] == "absolute" ||
					cur_st["float"] != "none" ||
					cur_st["clear"] != "none") {
					over_x_val		= cur_st[OVER+"X"];
					over_y_val		= cur_st[OVER+"Y"];
					clip			= _getClip(cur_st);
					if (par == root) {
						scroll_width	= root_scroll.w;
						scroll_height	= root_scroll.h;
					} else {
						scroll_width	= par.scrollWidth;
						scroll_height	= par.scrollHeight;
					}
					offset_width	= par.offsetWidth;
					offset_height	= par.offsetHeight;
					client_width	= par.clientWidth;
					client_height	= par.clientHeight;

					if (over_x_val == HIDDEN || clip[1] > 0 || clip[3] > 0) {
						if (!ref_node) {
							x_hidden = 1;
							ref_node = par;
						}
					}

					if (over_y_val == HIDDEN || clip[0] > 0 || clip[2] > 0) {
						if (!ref_node) {
							y_hidden = 1;
							ref_node = par;
						}
					}

					if (over_x_val == SCROLL) {
						ref_node 		= par;
						xsb_h 			= offset_height-client_height;
						is_scroll_node	= TRUE;
					}

					if (over_y_val == SCROLL) {
						if (!ref_node) ref_node = par;
						ysb_w = offset_width-client_width;
						is_scroll_node	= TRUE;
					}

					if (over_x_val == AUTO) {
						if (!ref_node) ref_node = par;
						if (scroll_width > client_width) {
							//scrolling is on
							xsb_h = offset_height - client_height;
						}
						is_scroll_node	= TRUE;
					}
					if (over_y_val == AUTO) {
						if (!ref_node) ref_node = par;
						if (scroll_height > client_height) {
							ysb_w = offset_width - client_width;
						}
						is_scroll_node	= TRUE;
					}

					if (ref_node) break;
				}
				if (par == root) {
					if (scroll_width > client_width) {
						//scrolling is on
						h	  = (win.innerHeight || 0) || offset_height;
						xsb_h = h - client_height;
					}
					if (scroll_height > client_height) {
						w	  = (win.innerWidth || 0) || offset_width;
						ysb_w = w - client_width;
					}
					is_scroll_node	= TRUE;
				}
				par = _par(par);
				if (!par || par[NODE_TYPE] != 1) break;
    		}
    	}

    	if (el_rect.w && el_rect.h) {
    		/*
    		 * Now look at the element dimensions vs the ref node dimensions
    		 *
    		*/

	    	if (!ref_node || ref_node == root) {

	    		/*
	    		 * if ref node is the root node we need a bit of special processing
	    		 *
	    		*/

	    		exp_rect.t	= _max(el_rect.t, 0);
	    		exp_rect.l	= _max(el_rect.l, 0);

	    		if (ieVer && dc[COMPAT_MODE] == "BackCompat" && _attr(root,SCROLL) == "no") {
	    			y_hidden = x_hidden = 1;
	    		} else {
					cur_st		= currentStyle(root);
		    		if (cur_st) {
		    			x_hidden	= (cur_st[OVER+"X"] == HIDDEN);
		    			y_hidden	= (cur_st[OVER+"Y"] == HIDDEN);
		    		}
		    	}

	    		if (root_scroll.h > root.clientHeight) {
	    			if (y_hidden) {
	    				exp_rect.b	= 0;
	    			} else {
	    				is_using_doc_root_b	= TRUE;
	    				exp_rect.b			= _max( ((doc_rect.h-el_rect.h)-xsb_h)-el_rect.t, 0);
	    			}
	    		} else {
					exp_rect.b	= _max( ((root_rect.h-el_rect.h)-xsb_h)-el_rect.t, 0);
				}

				if (root_scroll.w > root.clientWidth) {
					if (x_hidden) {
						exp_rect.r	= 0;
					} else {
						is_using_doc_root_r	= TRUE;
						exp_rect.r			= _max( ((doc_rect.w-el_rect.w)-ysb_w)-el_rect.l, 0);
					}
				} else {
					exp_rect.r	= _max( ((root_rect.r-el_rect.w)-ysb_w)-el_rect.l, 0);
				}


	    	} else {
    			cur_st		= currentStyle(ref_node);

    			/* In standards mode, body's offset and client numbers will == scroll numbers which is not what we want */
				if (_tagName(ref_node) == "body") {
					ref_node = root;
					t		 = el_rect.t;
					l		 = el_rect.l;
				} else {
					t = l = 0;
				}

		    	clip_rect	= _rect(ref_node);

		    	if (clip[1] > 0) {
					clip_rect.w = clip[1];
					clip_rect.r = clip_rect.l + clip_rect.w;
				}
				if (clip[3] > 0) {
					clip_rect.l = clip_rect.l+clip[3];
					clip_rect.w = clip_rect.w-clip[3];
				}

				if (clip[2] > 0) {
					clip_rect.h	= clip[2];
					clip_rect.b = clip_rect.t + clip_rect.h;
				}

				if (clip[0] > 0) {
					clip_rect.t = clip_rect.t+clip[0];
					clip_rect.h = clip_rect.h-clip[0];
				}

		    	if (el_rect.t > clip_rect.t && clip_rect.t > 0)  t = el_rect.t-clip_rect.t;
		    	if (el_rect.l > clip_rect.l && clip_rect.l > 0)  l = el_rect.l-clip_rect.l;

				scroll_top		= ref_node.scrollTop;
				scroll_left		= ref_node.scrollLeft;
				scroll_height	= ref_node.scrollHeight;
				scroll_width	= ref_node.scrollWidth;

		    	exp_rect.t	= _max(t,0);
		    	exp_rect.l	= _max(l,0);

	    		if (cur_st) {
	    			x_hidden	= (cur_st[OVER+"X"] == HIDDEN || clip[1] > 0 || clip[3] > 0);
	    			y_hidden	= (cur_st[OVER+"Y"] == HIDDEN || clip[0] > 0 || clip[2] > 0);
	    		}

    			if (el_rect.t >= clip_rect.b) {
    				exp_rect.b = 0;
    			} else {
    				if (!y_hidden && el_rect.t >= clip_rect.b) y_hidden = 1;

    				if (scroll_height > ref_node.clientHeight) {
    					if (y_hidden) {
    						exp_rect.b = 0;
    					} else {
    						exp_rect.b	= _max( ((scroll_height-el_rect.h)-xsb_h)-t, 0);
    					}
    				} else {
    					exp_rect.b	= _max( ((clip_rect.h-el_rect.h)-xsb_h)-t, 0);
    				}
    			}

    			if (el_rect.l >= clip_rect.r) {
    				exp_rect.r = 0;
    			} else {
    				if (!x_hidden && el_rect.l >= clip_rect.r) x_hidden = 1;

    				if (scroll_width > ref_node.clientWidth) {
    					if (x_hidden) {
    						exp_rect.r = 0;
    					} else {
    						exp_rect.r	= _max( ((scroll_width-el_rect.w)-ysb_w)-l, 0);
    					}
    				} else {
	    				exp_rect.r	= _max( ((clip_rect.w-el_rect.w)-ysb_w)-l, 0);
	    			}
    			}
    		}

    		exp_rect.xs			= (xsb_h)?1:0;
    		exp_rect.ys			= (ysb_w)?1:0;
    		exp_rect.w			= exp_rect.r+exp_rect.l;
    		exp_rect.h			= exp_rect.t+exp_rect.b;

			if (!ref_node || ref_node == root) {
				temp_rect = root_rect;
				ref_node  = root;
			} else {
				temp_rect = clip_rect;
			}

			l = _max(el_rect.l,temp_rect.l);
			r = _min(el_rect.r,(is_using_doc_root_r) ? _min(doc_rect.r,temp_rect.r) : temp_rect.r);
			w = _max(r - l,0);
			t = _max(el_rect.t,temp_rect.t);
			b = _min(el_rect.b,(is_using_doc_root_b) ? _min(doc_rect.b,temp_rect.b) : temp_rect.b);
			h = _max(b-t,0);

			exp_rect.xiv = _cnum((w / el_rect.w)[TFXD](2));
			exp_rect.yiv = _cnum((h / el_rect.h)[TFXD](2));
			exp_rect.iv	 = _cnum(((w * h) / (el_rect.w * el_rect.h))[TFXD](2));

		}

		details.refNode 	= ref_node||root;
		details.isRoot		= (ref_node == root);
		details.canScroll	= is_scroll_node;
		details.refRect		= (!ref_node || ref_node == root) ? root_rect : clip_rect;
		details.expRect		= exp_rect;
		details.rect		= el_rect;

		if (check_3D) {
    		(function() {
				var idx	= 0, len = 0, arOvrlaps, el_w, el_h, el_area, ovr_node, ovr_node_rect,
					t, b, l, r, h, w, ovr_area, new_iv, new_xiv, new_yiv;

				if (exp_rect.iv > .5) {
	    			mgr_bounds_details		= details;
	    			arOvrlaps				= overlaps(el,_cnum(check_3D,1,1));
	    			mgr_bounds_details		= NULL;
	    			len						= arOvrlaps[LEN];
	    			el_w					= el_rect.w;
	    			el_h					= el_rect.h,
	    			el_area					= el_w * el_h;

    				if (len) {
						while (ovr_node = arOvrlaps[idx++])
						{
							ovr_node_rect 	= _rect(ovr_node);
							l				= _max(el_rect.l, ovr_node_rect.l);
							r				= _min(el_rect.r, ovr_node_rect.r);
							t				= _max(el_rect.t, ovr_node_rect.t);
							b				= _min(el_rect.b, ovr_node_rect.b);
							w				= r - l;
							h 				= b - t;
							ovr_area		= w * h;
							new_xiv			= (1 - (w / el_w))[TFXD](2);
							new_yiv			= (1 - (h / el_h))[TFXD](2);
							new_iv			= (1 - (ovr_area / el_area))[TFXD](2);

							if ((new_xiv>0 && new_xiv < exp_rect.xiv) || (new_yiv>0 && new_yiv < exp_rect.yiv)) {
								exp_rect.xiv = new_xiv;
								exp_rect.yiv = new_yiv;
								exp_rect.iv	 = new_iv;
							}
						}
					}
				}
			})();
		}

		return exp_rect;
    }


    /**
     * Find any HTMLElements that are covering a given HTMLElement.
     *
     * @name $sf.lib.dom.overlaps
     * @public
     * @static
     * @function
     * @param {HTMLElement} el The HTMLElement for which to find any other elements that may be covering it.
     * @param {Number} [limit] The maximum number of covering elements to return
     * @returns {Array} An array of elements that are covering the given element
     *
    */

    function overlaps(el,limit)
    {
    	var rect 		= _rect(el),
    		doc			= _doc(el),
    		root		= _docNode(doc),
    		t	 		= rect.t,
    		l	 		= rect.l,
    		w	 		= rect.r-rect.l,
    		h			= rect.b-rect.t,
    		factor		= INTERSECT_FACTOR,
    		ret			= [],
    		baseW		= _round(w / factor),
    		baseH		= _round(h / factor),
    		curW		= baseW,
    		curH		= baseH,
    		seen		= {},
    		par_details	= {},
    		points		= [],
    		idx			= 0,
    		x, y, pt, id, checkEl, ref_par_node, ref_par_rect, maxX, maxY;

		if (mgr_bounds_details) {
			par_details = mgr_bounds_details;
		} else {
	    	bounds(el,par_details,TRUE);
	    }

    	ref_par_node = par_details.refNode;
    	ref_par_rect = par_details.refRect;
    	if (ref_par_rect && ref_par_node && ref_par_node != root) {
    		maxX = ref_par_rect.r;
    		maxY = ref_par_rect.b;
    	} else {
    		maxX = l+w;
    		maxY = t+h;
    	}

    	if (doc && root && doc[EL_FROM_PT]) {
    		while (curW < w)
			{
				curH	= baseH;
				while (curH < h)
				{
					x		= l+curW;
					y		= t+curH;
					if (x < maxX && y < maxY) points.push([x,y]);
					curH += baseH;
				}
				curW  += baseW;
			}

			limit = _cnum(limit, points[LEN]);

			while (pt = points[idx++])
			{
				checkEl = doc[EL_FROM_PT](pt[0],pt[1]);
				try {
					if (checkEl && checkEl.nodeType == 1 && checkEl !== root && checkEl !== el && !contains(el, checkEl)) {
						id	= _attr(checkEl,"id");
						if (!id) {
							id = lang.guid("geom_inter");
							_attr(checkEl,"id",id);
						}
						if (!seen[id] && ret[LEN] < limit) {
							seen[id] = 1;
							ret.push(checkEl);
						}
					}
				} catch (e) { }
			}
		}
		id = "";
		for (id in seen)
		{
			if (id.indexOf("geom_inter") == 0) {
				checkEl = _elt(id);
				if (checkEl) _attr(checkEl,"id",NULL);
			}
		}
		return ret;
    }

    /* --END--SafeFrames publisher side dom helper functions */

    /* --BEGIN--SafeFrames publisher side dom msg host helper functions */

	/**
	 * A proxy wrapper for calling into the cross-domain messaging host fall back library
	 * Looks for namespace will be $sf.lib.dom.msghost_fb
	 * Said library is used in cases where there is not HTML5 style messaging (i.e. no postMessage method available).
	 *
	 * @name $sf.lib.dom.msghost-_call_xmsg_host_fb
	 * @private
	 * @static
	 * @function
	 * @param {String} methName The method name in the msg host library to call
	 * @param {*} arg1 An arbitrary argument to pass to said method as the 1st arg
	 * @param {*} arg2 An arbitrary argument to pass to said method as the 2nd arg
	 * @param {*} arg3 An arbitrary argument to pass to said method as the 3rd arg
	 * @returns {*} whatever comes back from the method
	 *
	*/

	function _call_xmsg_host_fb(methName,arg1,arg2,arg3)
	{
		if (!msghostfb) msghostfb = dom.msghost_fb;

		return methName && msghostfb && msghostfb[methName] && msghostfb[methName](arg1,arg2,arg3);
	}

	/**
	 * Listen for an initial HTML5 postMessage event, to validate that HTML5 style
	 * messaging can be used
	 *
	 * @name $sf.lib.dom.msghost-_check_html5_init
	 * @private
	 * @static
	 * @function
	 * @param {HTMLEvent} evt The raw HTML event object received from the postMessage call
	 *
	*/

	function _check_html5_init(evt)
	{
		if (!canUseHTML5 && evt && evt.data == initID) {
			canUseHTML5	= TRUE;
			dom.evtCncl(evt);
			dom[DETACH](win, MSG, _check_html5_init);
		}
	}

	/**
	 * Listen for onmessage events in the main window. Validate that message is for us, and if so
	 * pass it through to the rest of the code and cancel further handling.
	 *
	 * @name $sf.lib.dom.msghost-_handle_msg_from_outside
	 * @private
	 * @static
	 * @function
	 * @param {HTMLEvent} evt The raw HTML event object received from the postMessage call
	 *
	*/

	function _handle_msg_from_outside(evt)
	{
		var data		= evt && evt.data,
			msg_win		= evt && evt.source,
			params		= data && (data.indexOf(GUID) != -1) && ParamHash(data),
			tgtID 		= params && params.id,
			ifr			= tgtID && _elt(tgtID),
			fr_win		= ifr && _ifr_view(ifr),
			pipe  		= tgtID && msg_pipes[tgtID],
			dataGUID	= params && params[GUID],
			pipeGUID	= pipe && pipe[GUID],
			cb			= pipe && pipe._xmsgcb,
			ret			= FALSE;

		if (pipeGUID && dataGUID && dataGUID == pipeGUID && msg_win && fr_win && fr_win == msg_win) {
			try {
				ret = cb(params.msg);
			} catch (e) {
				ret = FALSE;
			}
		}
		if (ret) dom.evtCncl(evt);
		return ret;
	}

	/**
	 * Send a message to a child iframe.
	 *
	 * @name $sf.lib.dom.msghost.send
	 * @public
	 * @static
	 * @function
	 * @param {String} tgtID The HTML id attribute of the iframe element for which to send a message
	 * @param {String} data The string of data to send to the given iframe
	 * @returns {Boolean} Whether or not message was send succesfully (note that this does not mean message was handled / recevied, only that sending was ok).
	 *
	*/

	function send_msg_to_child_iframe(tgtID, data)
	{
		var pipe 	= tgtID && msg_pipes[tgtID],
			success = FALSE,
			msgObj, w, el, e;

		if (!pipe) {
			success = _call_xmsg_host_fb("send",tgtID, data);
		} else {
			if (pipe) {
				msgObj		= ParamHash();
				msgObj.msg	= data;
				msgObj.guid	= pipe.guid;

				if (usingHTML5()) {
					el 		= _elt(tgtID);
					w		= _ifr_view(el);
					try {
						w[PMSG](_cstr(msgObj),pipe.srcHost || "*");
						success = TRUE;
					} catch (e) {
						success = FALSE;
					}
				} else {
					success = _call_xmsg_host_fb("send", tgtID, data);
				}
			}
		}
		msgObj = w = el = NULL;
		return success;
	}

	/**
	 * Get whether or not HTML5 style messaging can be used
	 *
	 * @name $sf.lib.dom.msghost.usingHTML5
	 * @public
	 * @static
	 * @function
	 * @returns {Boolean}
	 *
	*/

	function usingHTML5()
	{
		return canUseHTML5;
	}

	/**
	 * Gets a location of the hosting page, stripped of the search hash,
	 * but leaving query parameters, port, host, path, etc.
	 *
	*/
	function _strippedEncodedLocation()
	{
		var cleaned, pos = loc.href.indexOf("#");

		if (pos > -1){
			cleaned = loc.href.substr(0, pos);
		} else {
			cleaned = loc.href;
		}
		pos = cleaned.indexOf("?");
		if (pos > -1) {
			cleaned = cleaned.substr(0, pos);
		}

		return escape(cleaned);
	}


	/**
	 * Prepare an iframe in the top level window to be able to send / receive cross-domain messages
	 * Generally this method is called from $sf.lib.iframes.  The attrs object in question should
	 * represent key/value pairs of HTML attributes for the iframe. Note that the attrs object passed
	 * in will be modified with a new "name" property, to send information into the iframe and setup
	 * messaging.
	 *
	 * @name $sf.lib.dom.msghost.prep
	 * @public
	 * @static
	 * @function
	 * @param {Object} attrs Information required to set up the cross-domain messaging channel
	 * @param {String} attrs.id The IFRAME HTML id attribute
	 * @param {String} attrs.src The URL / src attribute of the IFRAME
	 * @param {String} [attrs.guid] The guid / signature to use to validate that messages sent/ received can be accepted. If not specified, one will be created automatically.
	 * @param {String} [attrs.name] The IFRAME HTML name attribute which will be used to send an intial message to the HTML document inside the IFRAME.
	 * @returns {Object} An object with various properties detailing the messaging pipe-line.
	 *
	*/

	function prep_iframe_msging(attrs)
	{
		var pipe = NULL, iframeName, nameParams, src, srcHost, newPipe,
			locStripped = _strippedEncodedLocation();


		if (attrs) {
			iframeName		= attrs.name;
			nameParams		= ParamHash(iframeName);
			src				= _cstr(attrs.src);
			srcHost			= src && src.substring(0, src.indexOf("/",9));
			srcHost			= (srcHost.search(/http/gi) != 0) ? "" : srcHost;
			pipe			= ParamHash(nameParams);
			pipe.id			= attrs.id || ("iframe_" + _guid());
			pipe.src		= src;
			pipe.srcHost	= srcHost;
			pipe[GUID]		= pipe[GUID] || _guid();
			pipe.host		= locHost;
			pipe.loc		= locStripped;
			pipe.proxyID	= "";

			if (usingHTML5()) {
				pipe.html5		= 1;
				pipe.proxyPath	= "";
			} else {
				newPipe			= _call_xmsg_host_fb("prep", pipe);
				if (newPipe) pipe = newPipe;
			}

			attrs.name		= pipe;
		}
		return pipe;
	}


	/**
	 * Listen for messages from an IFRAME. Note that on the host / publisher side
	 * this library only allows for one message handler to be attached to a given
	 * IFRAME.
	 *
	 * @name $sf.lib.dom.msghost.attach
	 * @public
	 * @static
	 * @function
	 * @param {HTMLElement} el The IFRAME reference to attach a listener callback too. .
	 * @param {Object} pipe The message pipe object created from $sf.lib.dom.msghost.prep
	 * @param {Function} cb The callback function to fire when a message is received
	 *
	*/

	function attach_iframe_msging(el,pipe,cb)
	{
		var tgtID;

		if (_tagName(el) == "iframe") {
			tgtID 	= _attr(el,"id");
			if (tgtID && pipe && (pipe instanceof ParamHash) && tgtID == pipe.id) {
				if (usingHTML5()) {
					msg_pipes[tgtID]	= pipe;
					pipe._xmsgcb		= cb;
					if (!html5Bound) {
						dom[ATTACH](win, MSG, _handle_msg_from_outside);
						html5Bound = TRUE;
					}
				} else {
					_call_xmsg_host_fb(ATTACH,el,pipe,cb);
				}
			}
		}
	}


	/**
	 * Detach listening for messages from an IFRAME
	 *
	 * @name $sf.lib.dom.msghost.detach
	 * @public
	 * @static
	 * @function
	 * @param {HTMLElement} el The IFRAME reference to detach a listener
	 *
	*/

	function detach_iframe_msging(el)
	{
		var id		= _attr(el,"id"),
			pipe	= id && msg_pipes[id],
			w		= NULL,
			empty	= TRUE;

		if (!pipe) {
			_call_xmsg_host_fb(DETACH,el);
			return;
		}
		if (pipe) {
			pipe._xmsgcb	 =
			msg_pipes[id] 	 = NULL;
			pipe			 = NULL;
			delete msg_pipes[id];
		}
		id	= "";
		for (id in msg_pipes)
		{
			pipe = msg_pipes[id];
			if (pipe && pipe[GUID]) {
				empty = FALSE;
				break;
			}
		}
		if (empty && usingHTML5() && html5Bound) {
			html5Bound	= FALSE;
			dom[DETACH](win, MSG, _handle_msg_from_outside);
		}

		el = w = pipe = NULL;
	}

	/* --END--SafeFrames publisher side dom msg host helper functions */


	/**
	 * Fire the specifed callback out to the publisher. Note that other arguments beyond the 1st argument are passed throug to the callback.
	 *
	 * @name $sf.host-_fire_pub_callback
	 * @static
	 * @private
	 * @function
	 * @param {String} cb_name The callback name to fire
	 *
	*/

	function _fire_pub_callback(cb_name /* args to call back */)
	{
		var cb_args = [], args = arguments, len = args[LEN], 
			idx = 0, f, 
			ret = FALSE, 
			e, a;
			
		if (config) {
			f	= config[cb_name];
			if (f) {
				while (len--)
				{
					a = args[idx++];
					if(a != cb_name){
						cb_args.push(a);
					}
				}
				try {
					ret = f.apply(NULL,cb_args);
				} catch (e) {
					ret = FALSE;
				}
			}
		}
		return ret;  //ADDED BY SEAN
	}

	/**
	 * Nuke the position an report that said position took too long to render
	 *
	 * @name $sf.host-_handle_render_timeout
	 * @static
	 * @private
	 * @function
	 * @param {String} pos_id The position id that has taken too long
	 *
	*/

	function _handle_render_timeout(pos_id)
	{
		var pend = pos_id && pending_ifrs[pos_id];
		if (pend) {
			clearTimeout(pend);
			nuke(pos_id);
			_fire_pub_callback(POS_MSG, "render-timeout", pos_id);
		}
		if (!_has_pending_renders()) current_status = "";
	}


	/**
	 * Clear the timer that fires every so often to update the geometry in side
	 * of SafeFrames
	 *
	 * @name $sf.host-_clear_geom_update_timer
	 * @static
	 * @private
	 * @function
	 *
	*/
    function _clear_geom_update_timer()
    {
    	if (geom_update_timer) {
    		clearTimeout(geom_update_timer);
    		geom_update_timer = 0;
    	}
    }
	
	/**
	 * Clear the timer that fires every so often to update the geometry in side
	 * of SafeFrames
	 *
	 * @name $sf.host-_clear_geom_update_timer
	 * @static
	 * @private
	 * @function
	 *
	*/
    function _clear_focus_update_timer()
    {
    	if (focus_update_timer) {
    		clearTimeout(focus_update_timer);
    		focus_update_timer = 0;
    	}
    }

	/**
	 * Set up the timer function that updates each SafeFrame with up to date geometric information
	 *
	 * @name $sf.host-_set_geom_update_timer
	 * @static
	 * @private
	 * @function
	 *
	*/
    function _set_focus_update_timer(in_focus)
    {
    	_clear_focus_update_timer();
		focus_update_timer = setTimeout(function() { _update_focus(in_focus); }, 2);
    }
	
	/**
	 * Set up the timer function that updates each SafeFrame with up to date geometric information
	 *
	 * @name $sf.host-_set_geom_update_timer
	 * @static
	 * @private
	 * @function
	 *
	*/
    function _set_geom_update_timer(is_win_scroll)
    {
    	_clear_geom_update_timer();
    	if (is_win_scroll) {
    		geom_update_timer = setTimeout(_update_geom_win_scroll, GEOM_UPDATE_INTRVAL);
    	} else {
    		geom_update_timer = setTimeout(_update_geom_win_resize, GEOM_UPDATE_INTRVAL);
    	}
    }

	/**
     * Update all SafeFrames with updated geometric information
     *
     * @name $sf.host-_update_geom
     * @static
     * @private
     * @function
     * @param {Boolean} is_win_scroll Whether or not we are updating due to the main window being scrolled
     *
    */

    function _update_geom(is_win_scroll)
    {
    	var posID, params, msgObj, id, ifr, g;
    	for (posID in rendered_ifrs)
    	{
    		if (is_win_scroll && (posID in scroll_parents_attached)) continue;

    		params 			= rendered_ifrs[posID];
    		id				= (params && params.dest);
    		ifr				= (id && _elt(id));
    		if (ifr && params) {
    			g				= _build_geom(posID, ifr, TRUE);
    			msgObj			= ParamHash();
    			msgObj.pos		= posID;
    			msgObj.cmd		= NOTIFY_GEOM_UPDATE;
	    		msgObj.geom		= _es(g);

    			_fire_pub_callback(POS_MSG, posID, NOTIFY_GEOM_UPDATE, g);
    			_send_response(params, msgObj);
    		}
    	}
    	_clear_geom_update_timer();
    }

	/**
	 * Update all SafeFrames with updated geometric information due to a window resize
	 * event.
	 *
	 * @name $sf.host-_update_geom_win_resize
	 * @static
	 * @private
	 * @function
	 *
	*/
    function _update_geom_win_resize()
    {
		_update_geom();
    }

	/**
	 * Update all SafeFrames with updated geometric information due to a window scroll event
	 *
	 * @name $sf.host-_update_geom_win_scroll
	 * @static
	 * @private
	 * @function
	 *
	*/

    function _update_geom_win_scroll()
    {
		_update_geom(TRUE);
    }


	/**
	 * Update a SafeFrame that has new geometric information due to its parent HTML element
	 * scrolling.
	 *
	 * @name $sf.host-_handle_node_scroll
	 * @static
	 * @private
	 * @function
	 *
	*/
	function _handle_node_scroll(evt, posID, node)
	{
		var scr_handle = scroll_parents_attached[posID], g;
		if (scr_handle) {
			if (scr_handle.tID) {
				clearTimeout(scr_handle.tID);
				delete scr_handle.tID;
			}
			scr_handle.tID = setTimeout(function()
			{
				var params = rendered_ifrs[posID],
					id		= (params && params.dest),
					ifr		= (id && _elt(id)),
					g, msgObj;

				if (ifr && params) {
					g				= _build_geom(posID, ifr, TRUE);
					msgObj			= ParamHash();
	    			msgObj.pos		= posID;
	    			msgObj.cmd		= NOTIFY_GEOM_UPDATE;
	    			msgObj.geom		= _es(g);
	    			_fire_pub_callback(POS_MSG, posID, NOTIFY_GEOM_UPDATE, g);
	    			_send_response(params, msgObj);
	    		}

	    		delete scr_handle.tID;

	    	}, GEOM_UPDATE_INTRVAL);
		}
	}
	
	/**
     * Update all SafeFrames with updated focus information
     *
     * @name $sf.host-_update_focus
     * @static
     * @private
     * @function
     * @param {Boolean} in_focus True when the window has gained focus
     *
    */

    function _update_focus(in_focus)
    {
    	var posID, params, msgObj, id, ifr;
    	for (posID in rendered_ifrs)
    	{
    		params 			= rendered_ifrs[posID];
    		id				= (params && params.dest);
    		ifr				= (id && _elt(id));
    		if (ifr && params) {
    			msgObj			= ParamHash();
				data 			= ParamHash();
    			msgObj.pos		= posID;
    			msgObj.cmd		= data.cmd = NOTIFY_FOCUS_CHANGE;
				msgObj.value	= in_focus;

    			_fire_pub_callback(POS_MSG, posID, NOTIFY_FOCUS_CHANGE, in_focus);
    			_send_response(params, msgObj);
    		}
    	}
    	_clear_focus_update_timer();
    }

	
	/**
	* Handle the window focus event, which notifies ads of the change
	*
	*/
	function _handle_win_focus(evt)
	{
		_set_focus_update_timer(TRUE);
	}

	/**
	* Handle the window blur event, which notifies ads of the change
	*
	*/
	function _handle_win_blur(evt)
	{
		var f = win[DOC].hasFocus();
		_set_focus_update_timer(f);
	}

	/**
	 * Handle the window onscroll event, eventually leading to a geometric update
	 *
	 * @name $sf.host-_handle_win_geom_scroll
	 * @static
	 * @private
	 * @function
	 * @param {HTMLEvent} evt The raw event object
	 *
	*/
    function _handle_win_geom_scroll(evt)
    {
		_set_geom_update_timer(1);
    }

	/**
	 * Handle the window onresize event, eventually leading to a geometric update
	 * once the window events are slowed down
	 *
	 * @name $sf.host-_handle_win_geom_resize
	 * @static
	 * @private
	 * @function
	 * @param {HTMLEvent} evt The raw event object
	 *
	*/
    function _handle_win_geom_resize(evt)
    {
    	_set_geom_update_timer();
    }

	/**
	 * Handle the window unload event, clearing up our state
	 *
	 * @name $sf.host-_handle_unload
	 * @static
	 * @private
	 * @function
	 * @param {HTMLEvent} evt The raw event object
	 *
	*/
    function _handle_unload(evt)
    {
    	var prop, scr_handle, e;

		_clear_geom_update_timer();

    	try {
    		dom.detach(win, SCROLL, _handle_win_geom_scroll);
    		dom.detach(win, "resize", _handle_win_geom_resize);
    		dom.detach(win, "unload", _handle_unload);
			dom.detach(win, "focus", _handle_win_focus);
			dom.detach(win, "blur", _handle_win_blur);
			
    		for (prop in scroll_parents_attached)
    		{
    			scr_handle = scroll_parents_attached[prop];
    			if (scr_handle) {
    				if (scr_handle.tID) clearTimeout(scr_handle.tID);
    				dom.detach(scroll_parents_attached[prop], SCROLL, scr_handle[ONSCROLL]);
    				scr_handle[ONSCROLL] 	=
    				scr_handle.node			= NULL;
    			}
				scroll_parents_attached[prop] = NULL;
				delete scroll_parents_attached[prop];
			}
			win_events_attached	= FALSE;
    	} catch (e) {

    	}
    }

	/**
     * Handle the window message event, passed from raw event handling of the msghost code.
     * Pass through the data to our format handling functions for expand, etc.
     *
     * @name $sf.host-_handle_msg_evt
     * @static
     * @private
     * @function
     * @param {String|Object} data the message to be handled
     * @return {Boolean} return whether or not the message was handled
     *
    */

	function _handle_msg_evt(data)
	{
		var msgObj, ret = FALSE, info;

		msgObj 	= ParamHash(data,NULL,NULL,TRUE,TRUE);
		if (msgObj && msgObj.pos) {
			info	= rendered_ifrs[msgObj.pos];
			if (info) {
				switch (msgObj.cmd)
				{
					case "exp-push":
						_expand_safeframe(msgObj,TRUE);
						ret = TRUE;
					break;
					case "exp-ovr":
						_expand_safeframe(msgObj);
						ret = TRUE;
					break;
					case "collapse":
						_collapse_safeframe(msgObj);
						ret = TRUE;
					break;
					case "msg":
						_fire_pub_callback(POS_MSG, msgObj.pos, "msg", msgObj.msg);
						ret = TRUE;
					break;
					case ERROR_COMMAND:
						_record_error(msgObj);
						ret = TRUE;
					break;
					case NOTIFY_GEOM_UPDATE:
						sf.lib.logger.log("Geom update complete: " + msgObj.pos);
						ret = TRUE;
					break;
					case "read-cookie":
						var canRead = info.conf && info.conf.supports && info.conf.supports[msgObj.cmd] && info.conf.supports[msgObj.cmd] != "0";
						if(canRead){
							_read_cookie(msgObj);
							ret = TRUE;
						}
						else{
							ret = FALSE;
						}
					break;
					case "write-cookie":
						var canWrite = info.conf && info.conf.supports && info.conf.supports[msgObj.cmd] && info.conf.supports[msgObj.cmd] != "0";
						if(canWrite){
							_write_cookie(msgObj);
							ret = TRUE;
						}
						else{
							ret = FALSE;
						}
					break;
						
				}
			}
		}
		return ret;
    }

    /**
     * Check whether or not there are any SafeFrames being rendered
     *
     * @name $sf.host-_has_pending_renders
     * @static
     * @private
     * @function
     *
    */

    function _has_pending_renders()
    {
    	var all_renders_done = TRUE, pos_id;

    	for (pos_id in pending_ifrs)
    	{
    		all_renders_done = FALSE;
    		break;
    	}
    	return all_renders_done;
    }


    /**
     * Send a response back down to the SafeFrame after a message was handled
     *
     * @name $sf.host-_send_response
     * @private
     * @static
     * @function
     * @param {$sf.lib.lang.ParamHash} params The parameters object stored for a rendered SafeFrame holding state information
     * @param {$sf.lib.lang.ParamHash} msgObj The message to send back down into the SafeFrame
     *
    */

    function _send_response(params, msgObj)
    {
		/** @ignore */
		/* we use a timeout here so that sending a response is asynchronus,just in case we got ping-pong messages */

		current_status = "sending-msg-down-" + msgObj.cmd;

		setTimeout(function()
		{
			var id = params && params.dest;

			if (id && msgObj) send_msg_to_child_iframe(id, msgObj.toString());
			current_status = "";

			msgObj = id = params = NULL;
		}, XCOM_RESP_DELAY);
    }

	/**
     * Handle the onload event from the IFRAME tag created for a SafeFrame.
     * Note that b/c we used our own library to create the IFRAME ($sf.lib.dom.iframes),
     * the "this" keyword will now properly point to the IFRAME in question.
     *
     * @name $sf.host-_handle_frame_load
     * @private
     * @static
     * @function
     *
    */

    function _handle_frame_load()
    {
		var el = this, pos_id = dom.attr(el, "_pos_id"), all_renders_done = TRUE;

		if (pending_ifrs[pos_id]) {
			clearTimeout(pending_ifrs[pos_id]);
			delete pending_ifrs[pos_id];
			complete_ifrs[pos_id]	= pos_id;
			dom.attr(el, "_pos_id", NULL);
			dom.attr(el, "name", NULL);
			el[ST].visibility 	= "inherit";
			el[ST].display		= "block";
			_fire_pub_callback("onEndPosRender", pos_id);
		}

		if (!_has_pending_renders()) current_status = "";
    }

    /**
     * Build an extra IFRAME to put behind any iframe that is expanding, to protect
     * against painting issues in IE with window'd mode flash.
     *
     * @name $sf.host-_shim_frame
     * @private
     * @static
     * @function
     *
    */

    function _shim_frame(id, showIt, w, h, z)
    {
		if (!isIE) return;

		var ifr = _elt(id), shmID = "shm_" + id, shmFrm = _elt(shmID);

		if (showIt) {
			if (shmFrm) {
				shmFrm[ST].visibility = "visible";
				return;
			}
			shmFrm  = iframes.clone(ifr, {id:shmID,src:"",name:shmID}, [WIDTH, ":", w, PX,";position:absolute;",HEIGHT,":", h, PX,";z-index:", z - 1,";filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0)"]);
			dom.append(_par(ifr),shmFrm);

		} else if (!showIt && shmFrm) {
			shmFrm[ST].visibility = "hidden";
		}
    }

	/**
     * Build a geometry info object for a particular SafeFrame position, and also
     * may attach an onscroll event listener to a parent HTML element if said parent element
     * is scrollable but not the root document node / body
     *
     * @name $sf.host-_build_geom
     * @private
     * @static
     * @function
     * @return {Object} With information about the geometry around a given SafeFrame
     *
    */
	function _build_geom(posID, dest, dont_attach_scroll_evt)
	{
		var bounds, info = ParamHash(), details = {}, scr_handle, node, new_ref_node, ex, s, e;

        try {
			bounds	= dom.bounds(dest,details,TRUE);

			if (!dont_attach_scroll_evt && !details.isRoot && details.canScroll) {
				ex				= details.expRect;
				if (ex.xs || ex.ys) {
					scr_handle		= scroll_parents_attached[posID];
					new_ref_node	= details.refNode;

					if (scr_handle && scr_handle.node != new_ref_node) {
						if (scr_handle.tID) clearTimeout(scr_handle.tID);
						dom.detach(node, SCROLL, scr_handle[ONSCROLL]);
						scr_handle.node = scr_handle[ONSCROLL] 	= NULL;
						scroll_parents_attached[posID] 		  	= NULL;
						delete scroll_parents_attached[posID];
					}
					if (!scroll_parents_attached[posID]) {
						scr_handle				= {};
						scr_handle.node 		= new_ref_node;
						/** @ignore */
						scr_handle[ONSCROLL]	= function(evt)
						{
							_handle_node_scroll(evt, posID);
						};
						scroll_parents_attached[posID] = scr_handle;

						dom.attach(new_ref_node, SCROLL, scr_handle[ONSCROLL]);
					}
				}
			}
		} catch (e) {
			info = NULL;
		}

		try {
	        if (info) {
	        	info.win	= ParamHash(dom.winRect());
				info.par 	= ParamHash(details.refRect);

				ex			= ParamHash(details.expRect);
				s			= ParamHash(details.rect);
				s.iv		= ex.iv;
				s.xiv		= ex.xiv;
				s.yiv		= ex.yiv;
				delete ex.iv;
				delete ex.xiv;
				delete ex.yiv;

				info.exp	= ex;
				info.self	= s;
			}
		} catch (e) {
			info = NULL;
		}
		return info;
	}

	/**
	 * Expands a given SafeFrame based on a command from the 3rd party content
	 *
	 * @name $sf.host-_expand_safeframe
	 * @private
	 * @static
	 * @function
	 * @param {$sf.lib.lang.ParamHash} msgObj Details about how to do the expansion
	 *
	 * TODO, handle omni-directional and push
	*/

	function _expand_safeframe(msgObj, push)
    {
		var xn = FALSE, yn = FALSE, posID = (msgObj && msgObj.pos), params, params_conf, ifr, par, ifrSt, parSt,
			orWd, orHt, dx, dy, nWd, nHt, id,t,l,r,b,exp,
			z, delta, scr_handle;

		if(!posID) return;

		params			= rendered_ifrs[posID];
		params_conf		= (params && params.conf);

		if (!params || !params_conf) return;

		id		= params.dest;
		ifr		= _elt(id);
		par		= _elt(POS_REL_BOX_ID_PREFIX + "_" + posID);
		if (!ifr || !par) return;

		ifrSt	= ifr[ST];
		parSt	= par[ST];

		if (!ifrSt) return;

		scr_handle = scroll_parents_attached[posID];

		if (scr_handle && scr_handle.tID) clearTimeout(scr_handle.tID);

		_clear_geom_update_timer();

		exp 	= msgObj.exp_obj;
		orWd	= params_conf.w;
		orHt	= params_conf.h;

		if (!exp) {
	        dx 		= params.dx = _cnum(msgObj.dx);
	        dy 		= params.dy = _cnum(msgObj.dy);
	        xn		= (dx<0);
	        yn		= (dy<0);
	        nWd 	= (xn) ? (orWd + (dx * -1)) : (orWd + dx);
	        nHt 	= (yn) ? (orHt + (dy * -1)) : (orHt + dy);
		} else {
			t		= _cnum(exp.t,0,0);
			l		= _cnum(exp.l,0,0);
			r		= _cnum(exp.r,0,0);
			b		= _cnum(exp.b,0,0);
			nWd		= _cnum(orWd + l + r,0,0);
			nHt		= _cnum(orHt + t + b,0,0);
			if (t) {
				dy  = t*-1;
				yn  = TRUE;
			} else {
				dy  = 0;
			}
			if (l) {
				dx = l*-1;
				xn = TRUE;
			} else {
				dx = 0;
			}
		}

        if (nWd <= orWd && nHt <= orHt) return;

		if (_fire_pub_callback(BF_POS_MSG, posID, EXPAND_COMMAND, dx ,dy)) return; //event canceled

        ifrSt[WIDTH]	= nWd+PX;
        ifrSt[HEIGHT] 	= nHt+PX;

        if (xn)
        	ifrSt.left  = dx+PX;

        if (yn)
        	ifrSt.top 	= dy+PX;

		z 	= _cnum(params.z,0);
		if (!z)
			z = DEFAULT_ZINDEX;

		ifrSt.zIndex		= z;

        //Create Shim Iframe to avoid overlapping issues with controls in IE.
		_shim_frame(id, TRUE, nWd, nHt, z-1);

		if (push) {
        	parSt[WIDTH]  = nWd+PX;
        	parSt[HEIGHT] = nHt+PX;
        } else {
        	parSt[WIDTH]  = orWd+PX;
        	parSt[HEIGHT] = orHt+PX;
        }

        params.expanded		= TRUE;
        msgObj.dx			= dx;
        msgObj.dy			= dy;
        msgObj.w			= nWd;
        msgObj.h			= nHt;
        msgObj.cmd			= "expand";
       	msgObj.geom 		= _es(_build_geom(posID, ifr, TRUE));

		_fire_pub_callback(POS_MSG, posID, EXPAND_COMMAND, dx ,dy);
		_send_response(params, msgObj);
		ifrSt = par = ifr = params = msgObj = NULL;
    }

    /**
     * Collapse a SafeFrame after it has been expanded
     *
     * @name $sf.host-_collapse_safeframe
     * @private
     * @static
     * @function
     * @param {$sf.lib.lang.ParamHash} msgObj The details about the message send from the SafeFrame to collapse
     * @param {Boolean} [isOutside] Whether or not the collapse command came from the publisher
     * @param {Boolean} [noMsging] Whether or not to send a message of response back to the SafeFrame being collapsed
     *
     *
    */

    function _collapse_safeframe(msgObj, isOutside, noMsging)
    {
		var posID		= (msgObj && msgObj.pos),
			params		= (posID && rendered_ifrs[posID]),
			params_conf	= (params && params.conf),
			id			= (params_conf && params_conf.dest),
			ifr			= (id && _elt(id)),
			par			= (ifr && _elt(POS_REL_BOX_ID_PREFIX + "_" + posID)),
			ifrSt		= (ifr && ifr[ST]),
			parSt		= (par && par[ST]),
			scr_handle;

		if (!posID || !params || !ifr || !par) return;
		if (!params.expanded) return;

		scr_handle = scroll_parents_attached[posID];
		if (scr_handle && scr_handle.tID) clearTimeout(scr_handle.tID);
		_clear_geom_update_timer();

		if (!noMsging) {
			if (_fire_pub_callback(BF_POS_MSG, posID, COLLAPSE_COMMAND, 0, 0)) return;
		}

		ifrSt.left		=
		ifrSt.top		="0px";
		parSt[WIDTH]	=
		ifrSt[WIDTH]	= params_conf.w+PX;
		parSt[HEIGHT]	=
		ifrSt[HEIGHT] 	= params_conf.h+PX;
		ifrSt.zIndex	=
		params.dx		=
		params.dy		= 0;

		_shim_frame(id);

		if (!noMsging) {
			_fire_pub_callback(POS_MSG, posID, COLLAPSE_COMMAND, 0, 0);
			msgObj.cmd  	= (isOutside) ? "collapsed" : "collapse";
			msgObj.geom		= _es(_build_geom(posID, ifr, TRUE));
			_send_response(params, msgObj);
		}

		ifr = ifrSt = par = parSt = params = msgObj = NULL;
    }
	
	
    /**
     * Records a reported error message to $sf.info.errors and fires any listeners
     *
     * @name $sf.host-_record_error
     * @private
     * @static
     * @function
     * @param {$sf.lib.lang.ParamHash} msgObj The details about the message send from the SafeFrame having an error
     *
     *
    */
	
	function _record_error(msgObj)
	{
		var posID		= (msgObj && msgObj.pos),
			params		= (posID && rendered_ifrs[posID]),
			params_conf	= (params && params.conf),
			id			= (params_conf && params_conf.dest),
			ifr			= (id && _elt(id)),
			par			= (ifr && _elt(POS_REL_BOX_ID_PREFIX + "_" + posID)),
			ifrSt		= (ifr && ifr[ST]),
			parSt		= (par && par[ST]),
			scr_handle;
			
		if(sf && sf.info && sf.info.errs){
			sf.info.errs.push(msgObj);
		}
	
		_fire_pub_callback(POS_MSG, posID, ERROR_COMMAND, msgObj);
	}
	
	/**
	 * Returns the current document cookies as a hash
	 * @name $sf.lib._cookieHash
	 * @private
	 * @static
	 * @function
	 * @returns {Object}
	 *
	*/

	function _cookieHash()
	{
		var cooks, key, i, cookies = {}, c;

		cooks = document.cookie.split('; ');
		for(i=cooks.length-1; i>=0; i--){
			c = cooks[i].split("=");
			cookies[c[0]] = c[1];
		}
		
		return cookies;
	}

	
	/**
     * Read a host domain cookie
     *
     * @name $sf.host-_read_cookie
     * @private
     * @static
     * @function
     * @param {$sf.lib.lang.ParamHash} msgObj The details about the message send from the SafeFrame
     * @param {Boolean} [isOutside] Whether or not the read-cookie command came from the publisher
     *
     *
    */

    function _read_cookie(msgObj, isOutside)
    {
		var posID		= (msgObj && msgObj.pos),
			params		= (posID && rendered_ifrs[posID]),
			params_conf	= (params && params.conf),
			id			= (params_conf && params_conf.dest),
			ifr			= (id && _elt(id)),
			key, cookies;
			
		
		var command = "read-cookie";
		
		var canRead = params_conf.supports && params_conf.supports[command] && params_conf.supports[command] != "0";
		
		if(!canRead){
			return;
		}
		
		if (!posID || !params || !ifr) return;

		key = msgObj.cookie;
		if(!key) return;
		
		cookies = _cookieHash();

		_fire_pub_callback(POS_MSG, command, posID, 0, 0);
		msgObj.cmd  	=  command;
		msgObj.geom		= _es(_build_geom(posID, ifr, TRUE));
		msgObj.value = cookies[key];
		_send_response(params, msgObj);

		ifr = params = msgObj = NULL;
    }

	
	/**
     * Write a host domain cookie
     *
     * @name $sf.host-_write_cookie
     * @private
     * @static
     * @function
     * @param {$sf.lib.lang.ParamHash} msgObj The details about the message send from the SafeFrame
     * @param {Boolean} [isOutside] Whether or not the write-cookie command came from the publisher
     *
     *
    */

    function _write_cookie(msgObj, isOutside)
    {
		var posID		= (msgObj && msgObj.pos),
			params		= (posID && rendered_ifrs[posID]),
			params_conf	= (params && params.conf),
			id			= (params_conf && params_conf.dest),
			ifr			= (id && _elt(id)),
			key, newValue, cookies, newCookies;
			
		
		var command = "write-cookie";
		
		var canRead = params_conf.supports && params_conf.supports[command] && params_conf.supports[command] != "0";
		
		if(!canRead){
			return;
		}
		
		if (!posID || !params || !ifr) return;

		key = msgObj.cookie;
		if(!key) return;
		newValue = escape(msgObj.value);
		
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + 1);
		var c_value=newValue + "; expires="+exdate.toUTCString();
		document.cookie=key + "=" + c_value;


		_fire_pub_callback(POS_MSG, command, posID, 0, 0);
		msgObj.cmd  	=  command;
		msgObj.geom		= _es(_build_geom(posID, ifr, TRUE));
		msgObj.info 	= newValue;
		msgObj.value = "";
		_send_response(params, msgObj);

		ifr = params = msgObj = NULL;
    }

	
   /**
	 * Remove / destroy one or more SafeFrames from the publisher page
	 *
	 * @name $sf.host.nuke
	 * @static
	 * @function
	 * @public
	 * @param {String} pos_id* One or more position ids to remove from the page. If no arguments are specifed, all positions currently rendered are removed.
	 *
	*/

	function nuke()
	{
		var idx = 0, empty = TRUE, args = arguments, pos_id, pos, el_id, el, sb_rel, par;

		if (!args[LEN] || args[idx] == "*") {
			args = [];
			for (pos_id in rendered_ifrs)
			{
				args.push(pos_id);
			}
		}


		while (pos_id = args[idx++])
		{
			pos = rendered_ifrs[pos_id];
			if (pos) {
				if (pos_id in pending_ifrs) {
					clearTimeout(pending_ifrs[pos_id]);
					delete pending_ifrs[pos_id];
				}
				if (pos_id in complete_ifrs) delete complete_ifrs[pos_id];

				el_id 	= pos.dest;
				el		= (el_id && _elt(el_id));
				par		= (el && _par(el));

				if (dom.attr(par, "id").indexOf(POS_REL_BOX_ID_PREFIX) != -1) {
					sb_rel 	= par;
					par 	= _par(sb_rel);
				}

				dom.purge(el);

				if (sb_rel) dom.purge(sb_rel);


				rendered_ifrs[pos_id] = NULL;
				delete rendered_ifrs[pos_id];
				el		= dom.make("div");
				dom.attr(el,"id",el_id);
				dom.append(par,el);
			}
		}
		pos_id = "";
		for (pos_id in rendered_ifrs)
		{
			empty = FALSE;
			break;
		}
		if (empty) {
			current_status = "";
			_handle_unload();
		}
	}


	/**
	 * Render one or more $sf.host.Position objects into the page
	 *
	 * @name $sf.host.render
	 * @public
	 * @static
	 * @function
	 * @param {$sf.host.Position} pos* An instance of an $sf.host.Position object to render. Note that said object must have a corresponding $sf.host.PosConfig, as well as $sf.host.Config must have been set
	 *
	*/

	function render()
	{
		var idx 		= 0,
			args		= arguments,
			firstCSSPos = "relative",
			finalCSSPos = "absolute",
			finalCSSEnd = "top:0px;left:0px;visibility:hidden;display:none;",

		pos, pos_id, pos_conf, dest_el, new_dest_el, rel_el, par_el,
		name_params, dest_id, dest_rel_id, css_txt, w, h, st, e, pend;

		if (!config) return FALSE;
		if (!dom.ready()) {
			dom.wait(function() { render.apply(NULL, args); args = NULL });
			return NULL;
		}

		/* if an array of positions is handed in use that instead */
		if ((args[0] instanceof Array) && args[LEN] == 1) {
			args = args[0];
		}

		while (pos = args[idx++])
		{
			pos_id		= pos.id;
			pos_conf	= (pos_id) ? config.positions[pos_id] : NULL;

			if (pos_conf) {
				dest_id		= pos_conf.dest;
				dest_el		= dest_id && _elt(dest_id);

				if (dest_el) {
					w		= pos_conf.w;
					h		= pos_conf.h;

					if (!w) {
						try {
							w	= dest_el.offsetWidth;
						} catch (e) {
							w	= 0;
						}
						if (w) pos_conf.w = w;
					}
					if (!h) {
						try {
							h = dest_el.offsetHeight;
						} catch (e) {
							h = 0;
						}
						if (h) pos_conf.h = h;
					}

					if (w && h) {
						name_params	= new ParamHash();
						dest_rel_id	= POS_REL_BOX_ID_PREFIX + "_" + pos_id;
						rel_el		= _elt(dest_rel_id);
						par_el		= _par(dest_el);

						if (rel_el && par_el == rel_el) par_el	= _par(rel_el);

						_shim_frame(dest_id);

						/** @ignore */
						pend = pending_ifrs[pos_id];
						if (pend) clearTimeout(pend);

						pend = complete_ifrs[pos_id];
						if (pend) delete complete_ifrs[pos_id];

						pending_ifrs[pos_id]	= setTimeout(function()
						{
							_handle_render_timeout(pos_id);

						}, config.to);

						current_status = "rendering";

						_fire_pub_callback("onStartPosRender", pos_id, pos_conf, pos);

						css_txt	= ["position:", "", ";z-index:0;",WIDTH,":", w, PX,";",HEIGHT,":", h, PX,";", "visibility:inherit;"];

						if (!rel_el) {
							css_txt[1]			= firstCSSPos;
							rel_el				= dom.make("div");
							rel_el.id			= dest_rel_id;
							rel_el.className	= "iab_sf";
							new_dest_el			= dest_el.cloneNode(FALSE);
							dom.css(new_dest_el, css_txt);
							rel_el.appendChild(new_dest_el);
							dom.css(rel_el, css_txt);
							par_el.replaceChild(rel_el, dest_el);
							dest_el				= _elt(dest_id);
						} else {
							//Make sure to set container to right geometry in case the pos config changed
							st			= rel_el[ST];
							st.width	= w + PX;
							st.height	= h + PX;
							st			= (dest_el && dest_el[ST]);
							st.width	= w + PX;
							st.height	= h + PX;
						}

						name_params.id			= pos_id;
						name_params.dest		= dest_id;
						name_params.conf		= ParamHash(pos_conf);
						name_params.meta		= pos.meta.toString();
						name_params.html		= _es(pos.html);
						name_params.geom		= _es(_build_geom(pos_id, dest_el));
						name_params.src			= config.renderFile;
						name_params.has_focus 	= lang.cstr(document.hasFocus());

						css_txt[1]			= finalCSSPos;
						css_txt[13]			= finalCSSEnd;

						if (!win_events_attached) {
							dom.attach(win, SCROLL, 	_handle_win_geom_scroll);
							dom.attach(win, "resize", 	_handle_win_geom_resize);
							dom.attach(win, "unload",	_handle_unload);
							dom.attach(win, "focus", _handle_win_focus);
							dom.attach(win, "blur", _handle_win_blur);

							win_events_attached = TRUE;
						}

						iframes.replace({id: dest_id,name:name_params,src:config.renderFile,_pos_id: pos_id},css_txt, rel_el, _handle_frame_load, _handle_msg_evt);

						rendered_ifrs[pos_id]			= name_params;
					}
				}
			}
		}

	}


	/**
	 * Gets a copy of the Position configuration, content, and meta data for a given SafeFrame
	 *
	 * @name $sf.host.get
	 * @public
	 * @function
	 * @static
	 * @return {Object}
    */

	function get(positionId)
	{
		var obj = rendered_ifrs[positionId];
		if(!obj) return null;

		return _mix({}, obj);
	}

	/**
	 * Returns a string as to whether or not the library is busy, empty string is returned on idle
	 *
	 * @name $sf.host.status
	 * @public
	 * @function
	 * @static
	 * @return {String}
	*/

	function status()
	{
		return current_status;
	}

	if (lang) {
		if (win == top) {
			/*
			 * We got rid of the concept of a "host" file, and just put everything library wise for the host
			 * side into the main host file since it will save us some bytes
			 *
			*/

			_rect = (ieVer) ? _getRectIE : _getRectNonIE;

			lang.def("dom",
			{
				rect:			_rect,
				currentStyle:	currentStyle,
				contains:		contains,
				docRect:		docRect,
				winRect:		winRect,
				bounds:			bounds,
				overlaps:		overlaps

			}, lib, TRUE);

			/** @ignore */
			(function() {
				var e;
				if (lang) {
					lang.def("msghost",
					{
						prep:		prep_iframe_msging,
						attach:		attach_iframe_msging,
						detach:		detach_iframe_msging,
						usingHTML5:	usingHTML5,
						send:		send_msg_to_child_iframe
					}, dom, TRUE);

					dom[ATTACH](win,MSG,_check_html5_init);
					initID			= "xdm-html5-init-" + _guid();
					locHost			= (locHost.indexOf("file") == 0) ? locHost = "file" : locHost;
					try {
						win[PMSG](initID, (locHost == "file") ? "*" : locHost);
					} catch (e) {
						dom[DETACH](win,MSG,_check_html5_init);
					}
				}
			})();



			lang.def("$sf.host",
			{
				Config:		Config,
				PosConfig:	PosConfig,
				PosMeta:	PosMeta,
				Position:	Position,
				nuke:		nuke,
				get: 		get,
				render:		render,
				status:		status
			}, NULL, TRUE);

		}
	}

	
	
})(window);
