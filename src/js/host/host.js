/*
* Copyright (c) 2012, Interactive Advertising Bureau
* All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
"use strict";

/**
 * @namespace $sf.host Defines the Publisher side api, and helper functions
 * @name $sf.host
 * @author <a href="mailto:ssnider@yahoo-inc.com">Sean Snider</a>
 * @author <a href="mailto:ccole[AT]emination.com">Chris Cole</a>
 * @version 1.1.2
 *
*/

/* =====================
* FIXES
* #8 (IE 11 expand fails intermittently) 18-11-2015
====================== */

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
		MESSAGE_COMMAND 		= "msg",
		BACKGROUND_COMMAND 		= "bg",
 		NOTIFY_EXPAND			= "expand",
		NOTIFY_GEOM_UPDATE		= "geom-update",
		NOTIFY_COLLAPSE			= COLLAPSE_COMMAND,
		NOTIFY_FOCUS_CHANGE		= "focus-change",
		NOTIFY_MESSAGE 			= MESSAGE_COMMAND,
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
		SCRW				= SCROLL+"Width",
		SCRH				= SCROLL+"Height",
		SCRT				= SCROLL+"Top",
		SCRL				= SCROLL+"Left",
		OFFSET				= "offset",
		OFF_PAR				= OFFSET+"Parent",
		OFF_TOP				= OFFSET+"Top",
		OFF_LEFT			= OFFSET+"Left",
		OFSW				= OFFSET+"Width",
		OFSH				= OFFSET+"Height",
		CLW					= "clientWidth",
		CLH					= "clientHeight",
		INNRW				= "innerWidth",
		INNRH				= "innerHeight",
		ONSCROLL				= "onscroll",
		COMPAT_MODE				= "compatMode",
		DOC_EL					= "documentElement",
		DOC						= "document",
		NODE_TYPE				= "nodeType",
		CONTAINS				= "contains",
		COMPARE_DOC_POS			= "compareDocumentPosition",
		EL_FROM_PT				= "elementFromPoint",
		PAR_NODE				= "parentNode",
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
		initID,
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
		
	var FLASHX = "ShockwaveFlash.ShockwaveFlash",
		flashActiveXVersions = [
		FLASHX+".11",
		FLASHX+".8",
		FLASHX+".7",
		FLASHX+".6",
		FLASHX
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
	 * @param {boolean} [conf.auto] Whether or not to have SafeFrames automatically boostrap an render any SafeFrames tags within the page
	 * @param {string} conf.cdn The protocol,host name, and port parts of a URI, that is a 2ndary origin, used with SafeFrames to render content. For example JS files would be loaded from conf.cdn+"/"+conf.root+"/"+conf.version+"/[filename]"
	 * @param {boolean} [conf.debug] Whether or not debug mode is on or off
	 * @param {string} conf.root The root path part of the URI that is a 2ndary origin, used with SafeFrames to render content. For example the HTML file for rendering content into would beloaded from conf.cdn+"/"+conf.root+"/"+conf.version+"/"+conf.renderFile
	 * @param {string} conf.renderFile The filename (may also include path info), for which to render content into via a SafeFrame.
	 * @param {string} [conf.msgFile] The filename (may also include path info), for which to use as a proxy for x-domain messaging whenever HTML5 messaging is not available. Only required if supporting older browsers.
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
	 * @param {Object|string} posIDorObj The id of the $sf.host.PosConfig instance, or an object containing all settings that are to be used for the instance.
	 * @param {string} [posIDorObj.id] The id of the $sf.host.PosConfig instance, if not specified one will be generated automatically.
	 * @param {string} [posIDorObj.dest] The HTML element id attribute of the HTML element in the document where a SafeFrame will be rendered. Said element MUST exist within the page prior to a render.
	 * @param {string} [posIDorObj.bg] The color of the background to be used inside the SafeFrame. Default equals "transparent".
	 * @param {string} [posIDorObj.tgt] The name of the target window where hyperlinks inside a SafeFrame will navigate too...Note that "_self" is not allowed and always converted to "_top". Allowed values are any string value not prefixed with "_", or "_top" or "_blank".
	 * @param {string} [posIDorObj.css] A string of CSS rules, or a URL that points to a CSS style sheet to be used inside the SafeFrame
	 * @param {Number} [posIDorObj.w] The width of the SafeFrame, specified in pixels. Cannot be specified in em, % or another values.
	 * @param {Number} [posIDorObj.h] The height of the SafeFrame, specified in pixels. Cannot be specified in em, % or another values.
	 * @param {string} [posIDorObj.size] A string formated as "widthXheight", that defines the width and height of the SafeFrame. The delimiter character "X" is can be specified as lower or upper case.
	 * @param {string} [posIDorObj.z] The z-index of the SafeFrame.
	 * @param {Object} [posIDorObj.supports] An object containing key/value pairs for what features/actions are supported by the SafeFrame, and its corresponding value represents a boolean detereming whether that feature can be used.  Currently supported keys are "exp-ovr" == SafeFrame can expand in overlay mode, "exp-push" == SafeFrame can expand in push mode, and "bg" == SafeFrame can change the background of the publisher / host.
	 * @param {string} [destID] The HTML element id attribute of the HTML element in the document where a SafeFrame will be rendered. Said element MUST exist within the page prior to a render.
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
	 * @param {string} [owner_key] A key name to be used to hold pseudo private keys / values of meta data.
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


		shared 		= {
			sf_ver : _cstr(sf.ver),
			flash_ver: _get_flash_version(),
			ck_on: _cookies_enabled_test() ? '1' : '0'
		};
		non_shared	= {};

		if (shared_obj && typeof shared_obj == OBJ) shared = _mix(shared, shared_obj);

		if (owner_key && typeof owner_key == STR){
			if (owned_obj && typeof owned_obj == OBJ) non_shared[owner_key] = owned_obj;
		}


		/**
		 * A method retrieves a meta data value from this object.
		 *
		 * @exports get_value as $sf.host.PosMeta#value
		 * @param {string} propKey The name of the value to retrieve
		 * @param {string} [owner_key] The name of the owner key of the meta data value. By default, it is assumed to be shared, so nothing needs to be passed in unless looking for a specific proprietary value
		 * @return {String|Number|Boolean}
		 * @default {string} ""
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


	
	/** @ignore */
	/* Internal logging method */
	function _log(msg,is_err)
	{
		var head_el, err_tag;

		try {
			if(!lib) lib = (sf && sf.lib); // insure we have lib
			
			if (lib && lib.logger && win == top) {
				if (is_err) {
					lib.logger.error(msg);
					sf.info.errs.push(msg);
				} else {
					lib.logger.log(msg);
				}
			} else {
				// Append error message as comment to header
				head_el 		= d.getElementsByTagName("head")[0];
				err_tag			= d.createElement("script");
				err_tag.type	= "text/plain";
				err_tag.text	= "<!-- SafeFrame " + ((is_err) ? "error" : "log") + ": " + (msg || "unknown") + " -->";
				head_el.appendChild(head_el, err_tag);
			}
		} catch (e) {  }
	}


	
	/**
	 * Create the HTML markup for a position if a src property was used
	 *
	 * @name $sf.host-_create_pos_markup
	 * @function
	 * @private
	 * @static
	 * @return {string}
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
	* Get the flash version number
	*/
	function _get_flash_version(){
		var mimeObj;
		if(flash_ver !== NULL && flash_ver != undefined){
			return flash_ver;
		}
		
		if(navigator.plugins && navigator.plugins.length>0){
			var mimeTypes = navigator.mimeTypes;
            if(mimeTypes && mimeTypes[FLASH_MIME] && mimeTypes[FLASH_MIME].enabledPlugin && mimeTypes[FLASH_MIME].enabledPlugin.description){
				mimeObj = mimeTypes[FLASH_MIME].enabledPlugin;
				if(mimeObj.version){
					flash_ver = mimeObj.version;
				}
				else if(mimeObj.description){
					flash_ver = mimeObj.description.replace(/\D+/g, ",").match(/^,?(.+),?$/)[1];
				}
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
	 * @param {string} [posIDorObj.id] The id of the position which maps to its configuration.
	 * @param {string} [posIDorObj.html] The HTML content to be rendered inside the SafeFrame. Note that HTML strings which have SCRIPT tags or other special characters may need to be properly escaped in order to avoid JavaScript syntax errors.
	 * @param {string} [posIDorObj.src] An optional URL to be used for redering inside the SafeFrame which will automatically generate a SCRIPT tag with the specified URL.
	 * @param {$sf.host.PosMeta} [posIDorObj.meta] An optional instance of the $sf.host.PosMeta object to be passed along into the SafeFrame
	 * @param {Object} [posIDorObj.conf] An optional representation of an $sf.host.PosConfig object to be used as the configuration for the SafeFrame position.
	 * @param {string} [html] The HTML content to be rendered inside the SafeFrame. Note that HTML strings which have SCRIPT tags or other special characters may need to be properly escaped in order to avoid JavaScript syntax errors.
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
		
		if(meta != null && !(meta instanceof PosMeta)){
			meta = new PosMeta(meta);
		}
		
		me.meta = meta || me.meta || new PosMeta();
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
	 * Retrieve a document for a given HTML Element
	 *
	 * @name doc
	 * @memberOf $sf.lib.dom-
	 * @public
	 * @function
	 * @param {HTMLElement} el (Required) the HTML element for which you wish to find it's parent document
	 * @return {Document|null} null if nothing found
	 *
	*/

	function doc(el)
	{
		var d = NULL, n_type;
		try {
			if (el) {
				n_type	= _get_node_type(el);

				if (n_type == 9) {
					d = el;
				} else {
					d = el[DOC] || el.ownerDocument || NULL;
				}
			}
		} catch (e) {
			d = NULL;
		}
		return d;
	}	
	/**
	 * Retrive the parent element of an HTML element
	 *
	 * @name par
	 * @public
	 * @function
	 * @param {HTMLElement} el (Required) the HTML element to check
	 * return {HTMLElement} the new reference to the parent element or null
	 *
	*/
	function par(el) { return el && (el[PAR_NODE] || el.parentElement); }
	
	function _is_element(el) { return _get_node_type(el) === 1; }

	function _get_node_type(el)
	{
		var n_type = _cnum((el && el.nodeType), -1);
		return n_type;
	}
	/**
	 * A wrapper around retrieving the tagName of an HTML element (normalizes values to lower case strings).
	 *
	 * @name tagName
	 * @memberOf $sf.lib.dom
	 * @public
	 * @function
	 * @param {HTMLElement} el The HTML element for which to get the tag name.
	 * @return {String} The tag name in all lower case of an HTML element, if it cannot be successfully retrieved, alwasys returns an empty string (which will evaluate to FALSE).
	 *
	*/

	function tagName(el)
	{
		return (_get_node_type(el) === 1 && el.tagName.toLowerCase()) || "";
	}

    /**
     * Returns whether or not a value is specified in pixels
     * @name $sf.lib.dom-_isPX
     * @private
     * @static
     * @function
     * @param {string} val A css value of size
     * @returns {boolean}
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

	function _calcBorders(el, rect, style)
   	{
     	var t = 0, l = 0, re = /^t(?:able|d|h|r|head|foot)$/i;
		var style = style || currentStyle(el);
		
		if (style) {
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
   		var pos = {x:0,y:0,w:0,h:0}, 
			def = {scrollLeft:0,scrollTop:0,scrollWidth:0,scrollHeight:0}, 
			d, de, dv, db, offsetX = 0, offsetY = 0;

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
   	 * Get an object detailing where a given element is within a web page
   	 *
   	 * @name $sf.lib.dom.rect
   	 * @public
   	 * @function
   	 * @param {HTMLElement} el The element to check
   	 * @return {Object} t,l,r,b,w,h,z info
   	 *
   	*/

	function rect(el)
    {
    	var r			= {t:0,l:0,r:0,b:0,w:0,h:0,z:0},
    		BOUNDING	= "getBoundingClientRect",
    		scrollTop	= 0,
    		scrollLeft	= 0,
    		w			= 0,
    		h			= 0,
    		bCheck		= FALSE,
    		d			= doc(el) || win[DOC],
    		compatMode	= d[COMPAT_MODE],
    		docMode		= d.documentMode || 0,
    		root, scroll, parentNode, last_par, cur_st, par_cur_st,
    		offX, offY, box, e, use_brute,
			errmsg;

    	if (_is_element(el)) {

    		try {
    			cur_st		= currentStyle(el);
    			root		= _docNode(el);
    			scroll		= _get_doc_scroll(el);
	    		r.l			= el[OFF_LEFT] || 0;
	    		r.t			= el[OFF_TOP] || 0;
	    		parentNode	= el;
	    		last_par	= NULL;
				bCheck		= (geckVer || wbVer > 519);
				use_brute	= (el === root);

				/*
				 * reintroducted using bounding box native call for 2 reasons
				 * 1.) performance
				 * 2.) we get wonky results when there are fixed position elements for some
				 * 	   reason.  previously i removed it to avoid scroll top/left issues but i think
				 * 	   that was due to a bug in the impl. Note that for root node, we still use brute
				 * 	   force
				 * 3.) The issues mentioned, are caused when you want to measure one element
				 *	   with respect to another element that is acting as the view port.
				 *	   In the case where said other element is scrollable, getBoundingClientRect
				 *	   will return negative values if it is scrolled.  We re-add in the scroll_top
				 *     or scroll left, but b/c the values are negative in that case we just
				 *	   end up normalizing to 0.
				 *
				 * 	   With brute force we never end up substracting out the scroll top or left
				 *	   b/c the loop bails since at the root level there are not offset parents or
				 *	   parent nodes.
				 *
				 *  The idea is to have top/left report scroll top and scroll left as there top/left
				 *  position always rather than normalizing to just the relative numbers which
				 *  allows for comparison much easier.
				 *
				 *
				*/

    			if (!use_brute && BOUNDING && el[BOUNDING]) {
                	if (isIE) {
						if (!docMode || (docMode > 0 && docMode < 8) || compatMode === BACK_COMPAT) {
							offX = root.clientLeft;
							offY = root.clientTop;
                        }
					}
					box 	= el[BOUNDING]();
					r.t		= box.top;
					r.l		= box.left;

					if (offX || offY) {
						r.l -= offX;
						r.t -= offY;
					}
					if (scroll.y || scroll.x) {
						if (!ua.ios || ua.ios >= 4.2) {
							r.l += scroll.x;
							r.t += scroll.y;
						}
					}
				} else {
        			while ((parentNode = parentNode[OFF_PAR]))
        			{
        				if (!_is_element(parentNode) || last_par === parentNode) break;

        				offX = parentNode[OFF_LEFT];
        				offY = parentNode[OFF_TOP];

        				r.t += offY;
        				r.l += offX;
        				if (bCheck)  r = _calcBorders(parentNode, r);

        				last_par = parentNode;
        			}

					if (cur_st["position"]  != "fixed") {
						parentNode 	= el;
						last_par	= NULL;

						while ((parentNode = parentNode[PAR_NODE]))
						{
							if (!_is_element(parentNode) || last_par === parentNode) break;
							if (parentNode == root) break;

							scrollTop 	= parentNode[SCRT];
							scrollLeft	= parentNode[SCRL];

							if (geckVer) {
								//Firefox does something funky with borders when overflow is not visible.
								par_cur_st = currentStyle(parentNode);
								if (par_cur_st[OVER] != "visible") {
									r = _calcBorders(parentNode, r, par_cur_st);
								}
							}
							if (scrollTop || scrollLeft) {
								r.l -= scrollLeft;
								r.t -= scrollTop;
							}
							last_par = parentNode;
						}

						r.l += scroll.x;
						r.t += scroll.y;
					} else {
						r.l += scroll.x;
						r.t += scroll.y;
					}
				}
				if (el == root) {
					h = el[CLH];
					w = el[CLW];
				} else {
					h = el[OFSH];
					w = el[OFSW];
				}

				r.b = r.t + h;
				r.r = r.l + w;
				r.w = _max(w, 0);
				r.h = _max(h, 0);
				r.z = cur_st["zIndex"];
			} catch (e) {
				if(!e || !e[MSG]){
					e = {message: 'null exception'};
				}
				errmsg = "sf Exception in rect calculation tag - " + tagName(el) + ' : ' + e[MSG];
				_log(errmsg, TRUE);
				r = {t:0,l:0,r:0,b:0,w:0,h:0,z:0};
			}
		}
		return r;
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
	 * @returns {boolean}
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
						if (needle == dc[DOC_EL]) break;
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
	 * @param {string} [attr] The style attribute (in JavaScript notation, e.g. 'backgroundColor' rather than 'background-color') to fetch.
	 * @return {HTMLStyleObject} An HTMLStyleObject containing all current style attribute values
	 * @return {string} The value of an style attribute (only if attr parameter is specified).
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
	 * Get the rectangle represent the amount of room a current element could
	 * theoretically grow to
	 *
	 * @name $sf.lib.dom.bounds
	 * @function
	 * @public
	 * @param {HTMLElement} el The element to be checking
	 * @param {Object} [details] An object that you can pass in, which will be filled out with values noting details of the boundary calculation.
	 * @param {Boolean} [check_3D=false] Also check element in regards to any elements overlapping in 3D space
	 * @param {Number} [def_w=0] A default width of the given element for cases where width of an element may not be set due to visibility or timing issues
	 * @param {Number} [def_h=0] A default height of the given element for cases where width of an element may not be set due to visibility or timing issues
	 * @return {Object} t,l,r,b,xs,ys,xiv,yiv,iv,w,h} deailing boundaries of an element
	 *
	*/

	function bounds(el, details, check_3D, def_w, def_h)
	{
		var pe					= el && par(el),
			root				= _docNode(el),
			el_rect				= rect(el),
			root_rect			= rect(root),
			root_scroll			= _get_doc_scroll(root),
			doc_rect			= docRect(el),
			clip_rect			= {t:0,l:0,r:0,b:0,w:0,h:0},
			exp_rect			= {t:0,l:0,r:0,b:0,xs:0,ys:0,xiv:0,yiv:0,iv:0,w:0,h:0},
			scroll_nodes		= [],
			is_root				= FALSE,
			clip_nodes			=
			{
				left:			NULL,
				right:			NULL,
				top:			NULL,
				bottom:			NULL
			},
			clip_top,clip_left,clip_right,clip_bottom,xsb_h,ysb_w,
			cur_st, w, h, t, l, r, b, scroll_width, offset_width, client_width,
			scroll_height, offset_height, client_height,over_x_val,
			over_y_val, ovr_val, clip, iv_w, iv_h,
			ot, ob, oh, ol,or,ow,ovr_cnt, ovr_pt_cnt,
			ovr_iv, cur_iv, ovr_pts, par_rect, added_scroll_node;

		details = (details && typeof details == "object") ? details : {};
		def_w	= _cnum(def_w,0,0);
		def_h	= _cnum(def_h,0,0);

		if (!el_rect.h && def_h) {
			el_rect.h = def_h;
			el_rect.b = el_rect.t+def_h;
		}
		if (!el_rect.w && def_w) {
			el_rect.w = def_w;
			el_rect.r = el_rect.l+def_w;
		}

		if (pe) {
			/*
			 * Here we are looping through parent nodes to check if any of them have clip / overflow
			 * settings which would create a new boundary point (as opposed to the body of the document)
			 *
			 * Ideally I would have liked to break the logic out that finds said reference node, away
			 * from the calculation part. . however during optimization phases, it was quick to store
			 * off variables for from dom properties for width / height
			 *
			 * We used to stop once we found one node that clipped us, but that can cause issues
			 * with various dom structures, so now we must walk up all parents to make sure and
			 * get anything that could be clipping us
			*/
			clip_top	= root_rect.t;
			clip_left	= root_rect.l;
			clip_right	= root_rect.r;
			clip_bottom	= root_rect.b;

			while (cur_st = currentStyle(pe))
			{
				if (cur_st["display"] == "block" ||
					cur_st["position"] == "absolute" ||
					cur_st["float"] != "none" ||
					cur_st["clear"] != "none") {

					is_root				= (pe == root);
					par_rect			= rect(pe);
					t					= par_rect.t;
					l					= par_rect.l;
					r					= par_rect.r;
					b					= par_rect.b;
					over_x_val			= cur_st[OVER+"X"];
					over_y_val			= cur_st[OVER+"Y"];
					ovr_val				= cur_st[OVER];
					clip				= (is_root) ? [-1,-1,-1,-1] : _getClip(cur_st);
					added_scroll_node	= FALSE;

					if (is_root) {
						scroll_width	= root_scroll.w;
						scroll_height	= root_scroll.h;
					} else {
						scroll_width	= pe[SCRW];
						scroll_height	= pe[SCRH];
					}

					offset_width	= pe[OFSW];
					offset_height	= pe[OFSH];
					client_width	= pe[CLW];
					client_height	= pe[CLH];

					if (!ysb_w && offset_width > client_width) ysb_w = (offset_width - client_width);
					if (!xsb_h && offset_height > client_height) xsb_h = (offset_height - client_height);

					if (is_root) {
						if (scroll_width > client_width) {
							//scrolling is on
							l = 0;
							r = ((win[INNRW] || 0) || offset_width)+root_scroll.x;

							if (l > clip_left) clip_left = l;
							if (r < clip_right) clip_right = r;
						}

						if (scroll_height > client_height) {
							t		= 0;
							b		= ((win[INNRH] || 0) || offset_height)+root_scroll.y;
							if (t > clip_top) clip_top = t;
							if (b < clip_bottom) clip_bottom = b;
						}
					} else {
						if (ysb_w && ((r-l) == offset_width)) r -= ysb_w;
						if (xsb_h && ((b-t) == offset_height)) b -= xsb_h;

						if (over_x_val == HIDDEN || over_x_val == SCROLL || over_x_val == AUTO ||
							ovr_val == HIDDEN || ovr_val == SCROLL || ovr_val == AUTO) {

							if (l > clip_left) {
								clip_left 			= l;
								clip_nodes.left 	= pe;
							}
							if (r < clip_right) {
								clip_right 			= r;
								clip_nodes.right	= pe;
							}

							if (over_x_val == SCROLL || ovr_val == SCROLL) {
								scroll_nodes.push(pe);
								added_scroll_node = TRUE;

							} else if ((over_x_val == AUTO || ovr_val == AUTO) && (scroll_width > client_width)) {
								scroll_nodes.push(pe);
								added_scroll_node = TRUE;
							}

						}
						if (clip[3] > 0) {
							ol = l+clip[3];
							if (ol > clip_left) {
								clip_left 		= ol;
								clip_nodes.left	= pe;
							}
						}
						if (clip[1] > 0) {
							or 	= r+clip[1];
							if (or < clip_right) {
								clip_right 			= or;
								clip_nodes.right	= pe;
							}
						}

						if (over_y_val == HIDDEN || over_y_val == SCROLL || over_y_val == AUTO ||
							ovr_val == HIDDEN || ovr_val == SCROLL || ovr_val == AUTO) {

							if (t > clip_top) {
								clip_top 		= t;
								clip_nodes.top	= pe;
							}
							if (b < clip_bottom) {
								clip_bottom 		= b;
								clip_nodes.bottom	= pe;
							}

							if (!added_scroll_node) {
								if (over_y_val == SCROLL || ovr_val == SCROLL) {
									scroll_nodes.push(pe);
									added_scroll_node = TRUE;

								} else if ((over_y_val == AUTO || ovr_val == AUTO) && (scroll_height > client_height)) {
									scroll_nodes.push(pe);
									added_scroll_node = TRUE;

								}
							}

						}
						if (clip[0] > 0) {
							ot 	= t+clip[0];
							if (ot > clip_top) {
								clip_top		= ot;
								clip_nodes.top	= pe;
							}
						}

						if (clip[2] > 0) {
							ob = par_rect.t+clip[2];
							if (ob < clip_bottom) {
								clip_bottom 		= ob;
								clip_nodes.bottom 	= pe;
							}
						}

					}
				}

				if (pe == root) break;
				pe = par(pe);
				if (!pe || !tagName(pe)) break;
			}
		}

		clip_rect	=
		{
			t:	_max(clip_top, 		0),
			l:	_max(clip_left,		0),
			r:	_max(clip_right,	0),
			b:	_max(clip_bottom,	0)
		};
		clip_rect.w = _max(clip_rect.r - clip_rect.l, 0);
		clip_rect.h = _max(clip_rect.b - clip_rect.t, 0);
		l			= el_rect.l;
		r			= el_rect.r;
		t			= el_rect.t;
		b			= el_rect.b;
		w			= r-l;
		h			= b-t;
		ol			= clip_rect.l;
		or			= clip_rect.r;
		ot			= clip_rect.t;
		ob			= clip_rect.b;
		ow			= or-ol;
		oh			= ob-ot;
		iv_h		= (_min(b,ob)-_max(t,ot));
		iv_h		= (iv_h < 0) ? 0 : iv_h;
		iv_h		= (iv_h > h) ? h : iv_h;
		iv_w		= (_min(r,or)-_max(l,ol));
		iv_w		= (iv_w < 0) ? 0 : iv_w;
		iv_w		= (iv_w > w) ? w : iv_w;

		if (ot < t) {
			if (ob <= t) {
				exp_rect.t = 0;
			} else {
				exp_rect.t = _max(t - ot,0);
			}
		} else {
			exp_rect.t = 0;
		}
		if (ob > b) {
			if (b <= ot) {
				exp_rect.b = 0;
			} else {
				exp_rect.b = _max(ob - b, 0);
			}
		} else {
			exp_rect.b = 0;
		}
		if (ol < l) {
			if (or <= l) {
				exp_rect.l = 0;
			} else if (ob <= t) {
				exp_rect.l = 0;
			} else if (b <= ot) {
				exp_rect.l = 0;
			} else {
				exp_rect.l = _max(l - ol, 0);
			}
		} else {
			exp_rect.l = 0;
		}

		if (or > r) {
			if (r <= ol) {
				exp_rect.r = 0;
			} else if (ob <= t) {
				exp_rect.r = 0;
			} else {
				exp_rect.r = _max(or -r, 0);
			}
		} else {
			exp_rect.r = 0;
		}
		exp_rect.w 		= _max(exp_rect.r - exp_rect.l, 0);
		exp_rect.h 		= _max(exp_rect.b - exp_rect.t, 0);
		exp_rect.xiv 	= (w > 0) ? _cnum((iv_w / w)[TFXD](2)) : 0;
		exp_rect.yiv 	= (h > 0) ? _cnum((iv_h / h)[TFXD](2)) : 0;
		exp_rect.iv	 	= (w > 0 || h > 0) ? _cnum(((iv_w * iv_h) / (w * h))[TFXD](2)) : 0;
		exp_rect.civ 	= 0;

		if (check_3D) {
			cur_iv		= exp_rect.iv;
			if (cur_iv > .49) {
				ovr_pts		= overlaps(el,def_w,def_h);
				ovr_cnt		= ovr_pts[LEN];
				ovr_pt_cnt	= _cnum(ovr_pts.on, 0);

				if (ovr_pt_cnt) {
					ovr_iv			= 1- _cnum((ovr_pt_cnt/ovr_cnt)[TFXD](2),0);
					exp_rect.civ	=
					exp_rect.iv		= ovr_iv;
				}
			}
		}

		details.rect		= el_rect;
		details.clipRect	= clip_rect; /* formerally 'refRect' */
		details.docRect		= doc_rect;

		if (!scroll_nodes[LEN]) {
			if (root_rect.b >= clip_rect.b || root_rect.r >= clip_rect.r) {
				details.isRoot		= TRUE;
				exp_rect.xs			= !!(doc_rect.w > root_rect.w && xsb_h);
				exp_rect.ys			= !!(doc_rect.h > root_rect.h && ysb_w);
				details.canScroll	= (doc_rect.w > root_rect.w || doc_rect.h > root_rect.h);
			} else {
				exp_rect.ys			=
				exp_rect.xs			=
				details.isRoot		=
				details.canScroll	= FALSE;
			}
		} else {
			details.isRoot		= FALSE;
			details.canScroll	= TRUE;
			exp_rect.xs			= !!(xsb_h);
			exp_rect.ys			= !!(ysb_w);
		}

		details.scrollNodes	= scroll_nodes;
		details.clipNodes	= clip_nodes;
		details.expRect		= exp_rect;

		return exp_rect;
	}

	/**
	 * Checks whether an element has other elements that are overlapping in 3D space
	 *
	 * @name $sf.lib.dom.overlaps
	 * @function
	 * @public
	 * @param {HTMLElement} el The element to check
	 * @param {Number} [def_w=0] A default width of the given element for cases where width of an element may not be set due to visibility or timing issues
	 * @param {Number} [def_h=0] A default height of the given element for cases where width of an element may not be set due to visibility or timing issues
	 * @return {Object[]} array of objects decribing the point at which the element was checked to see if it is being overlapped
	 *
	 *
	*/

	function overlaps(el,def_w,def_h)
    {
    	var el_rect		= rect(el),
    		dc			= doc(el),
    		root		= _docNode(dc),
    		t	 		= el_rect.t,
    		l	 		= el_rect.l,
    		factor		= INTERSECT_FACTOR,
    		points		= [],
    		idx			= 0,
    		w,h,baseW,baseH,curW,curH,x, y, pt, id,
    		checkEl, maxX, maxY,
    		scr_l, scr_t, ds;

    	points.on	= 0;
		def_w		= _cnum(def_w,0,0);
       	def_h		= _cnum(def_h,0,0);

		if (t && !el_rect.h && def_h) {
       		el_rect.h = def_h;
       		el_rect.b = t+def_h;
       	}
       	if (l && !el_rect.w && def_w) {
       		el_rect.w = def_w;
       		elrect.r = l+def_w;
       	}

       	w			= el_rect.w;
       	h			= el_rect.h;
       	baseW		= _round(w/factor);
       	baseH		= _round(h/factor);
       	curW		= baseW;
       	curH		= baseH;

       	if (w <= 1 || h <= 1 || baseW < 1 || baseH < 1) return points;

    	ds			= _get_doc_scroll();
   		scr_t		= ds.y;
   		scr_l		= ds.x;
   		maxX 		= l+w;
    	maxY 		= t+h;

    	if (dc && root && dc[EL_FROM_PT]) {
    		while (curW < w)
			{
				curH	= baseH;
				while (curH < h)
				{
					x		= l+curW;
					y		= t+curH;

					if (x <= maxX && y <= maxY) points.push({x:x,y:y,on:0});

					curH += baseH;
				}
				curW  += baseW;
			}

			while (pt = points[idx++])
			{
				x		= _max(pt.x-scr_l,0);
				x		= _min(x,pt.x);
				y		= _max(pt.y-scr_t,0);
				y		= _min(y,pt.y);

				if (x == 0) {
					pt.on = "!x-offscreen";
					points.on++;
					continue;
				}
				if (y == 0) {
					pt.on = "!y-offscreen";
					points.on++;
					continue;
				}

				checkEl = dc[EL_FROM_PT](x,y);
				if (checkEl && checkEl !== root && checkEl !== el && !contains(checkEl, el)) {
					id	= _attr(checkEl,"id");
					if (!id) {
						id = _guid("geom_inter");
						_attr(checkEl,"id",id);
					}
					pt.on	 	= id;
					points.on++;
				}
			}
		}
		return points;
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
	 * @param {string} methName The method name in the msg host library to call
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
		var fn;
		var evtname = 'on' + MSG;
		var supported = (evtname in win);
		if(supported){
			canUseHTML5	= TRUE;
			return;
		}
		else{
			fn = function(){};
			dom[ATTACH](win,MSG,fn);
			if(typeof(win[evtname]) === 'function'){
				canUseHTML5	= TRUE;
				dom[DETACH](win, MSG, fn);
				return;
			}
			canUseHTML5	= FALSE;
		}
		
		/*
		if (!canUseHTML5 && evt && evt.data == initID) {
			canUseHTML5	= TRUE;
			dom.evtCncl(evt);
			dom[DETACH](win, MSG, _check_html5_init);
		}
		*/
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
	 * @param {string} tgtID The HTML id attribute of the iframe element for which to send a message
	 * @param {string} data The string of data to send to the given iframe
	 * @returns {boolean} Whether or not message was send succesfully (note that this does not mean message was handled / recevied, only that sending was ok).
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
	 * @returns {boolean}
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
	 * @param {string} attrs.id The IFRAME HTML id attribute
	 * @param {string} attrs.src The URL / src attribute of the IFRAME
	 * @param {string} [attrs.guid] The guid / signature to use to validate that messages sent/ received can be accepted. If not specified, one will be created automatically.
	 * @param {string} [attrs.name] The IFRAME HTML name attribute which will be used to send an intial message to the HTML document inside the IFRAME.
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
	 * @param {string} cb_name The callback name to fire
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
	 * @param {string} pos_id The position id that has taken too long
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
     * @param {boolean} is_win_scroll Whether or not we are updating due to the main window being scrolled
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
     * @param {boolean} in_focus True when the window has gained focus
     *
    */

    function _update_focus(in_focus)
    {
    	var posID, params, msgObj, id, ifr, data;
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
     * @return {boolean} return whether or not the message was handled
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
					case COLLAPSE_COMMAND:
						_collapse_safeframe(msgObj);
						ret = TRUE;
					break;
					case MESSAGE_COMMAND:
						_notify_message(msgObj);
						ret = TRUE;
					break;
					case ERROR_COMMAND:
						_record_error(msgObj);
						ret = TRUE;
					break;
					case BACKGROUND_COMMAND:
						_set_background(msgObj);
						ret = TRUE;
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
		var el = this, pos_id = _attr(el, "_pos_id"), all_renders_done = TRUE;

		if (pending_ifrs[pos_id]) {
			clearTimeout(pending_ifrs[pos_id]);
			delete pending_ifrs[pos_id];
			complete_ifrs[pos_id]	= pos_id;
			_attr(el, "_pos_id", NULL);
			_attr(el, "name", NULL);
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
			_log("Exception in build_geom: " + (e && e[MSG] || 'NULL'), TRUE);
		}

		try {
	        if (info) {
	        	info.win	= ParamHash(dom.winRect());
				info.par 	= ParamHash(details.clipRect);

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
			_log("build_geom info error: " + (e && e[MSG] || 'NULL'), TRUE);
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
     * @param {boolean} [isOutside] Whether or not the collapse command came from the publisher
     * @param {boolean} [noMsging] Whether or not to send a message of response back to the SafeFrame being collapsed
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
	* Builds the background data and sets default values.
	*
	* @static
	* @function
	* @param {$sf.lib.lang.ParamHash} bgData The details about the message send from the SafeFrame to set background
	*/
	function _buildBgData(bgData){
		var k, v, i;
		var bg = {};
		var panes = [], p, objKey;
		var topKeys = {
			'color'    : null,
			'href'     : null,
			'imgsrc'   : null,
			'posX'     : 50,
			'posY'     : 0,
			'repeatX'  : false,
			'repeatY'  : false,
			'fixed'    : false,
			't'        : 0,
			'b'        : '800px',
			'l'        : null,
			'r'        : null
		};
		
		var paneKeys = {
			'href'     : null,
			'imgsrc'   : null,
			'posX'     : 100,
			'posY'     : 0,
			'repeatX'  : false,
			'repeatY'  : false,
			'fixed'    : false,
			't'        : 0,
			'b'        : '800px',
			'l'        : null,
			'r'        : null			
		};
		
		for(k in topKeys){
			if(bgData.hasOwnProperty(k)){
				bg[k] = bgData[k];
			}
			else{
				bg[k] = topKeys[k];
			}
		}
		
		panes = [bgData['left_pane'], bgData['right_pane'] ];
		for(i=0;i<panes.length;i++){
			p = panes[i];
			if(p){
				objKey = i == 0 ? 'left_pane' : 'right_pane';
				bg[objKey] = {};
				for(k in paneKeys){
					if(p.hasOwnProperty(k)){
						bg[objKey][k] = p[k];
					}
					else{
						bg[objKey][k] = paneKeys[k];
					}
				}
			}
		}
		
		//bg = bgData;
		
		return bg;
	}
	
	/**
     * Set background based on ad request
     *
     * @name $sf.host-_set_background
     * @private
     * @static
     * @function
     * @param {$sf.lib.lang.ParamHash} msgObj The details about the message send from the SafeFrame to set background
	*/
	function _set_background(msgObj){
		var xn = FALSE, yn = FALSE, posID = (msgObj && msgObj.pos), params, params_conf, 
			id, bgData, bodyEl, htmlEl, applyIf, topElems = [],
			ifr, par, ifrSt, parSt, s,
			z, delta, scr_handle;
			
		var color, hasTopImg, hasLRImages, pane, pData, pArr;

		if(!posID) return;

		params			= rendered_ifrs[posID];
		params_conf		= (params && params.conf);
		bgData 			= _buildBgData(msgObj.msg);

		if (!params || !params_conf) return;

		id		= params.dest;
		ifr		= _elt(id);
		par		= _elt(POS_REL_BOX_ID_PREFIX + "_" + posID);
		if (!ifr || !par) return;

		ifrSt	= ifr[ST];
		parSt	= par[ST];

		if (!ifrSt) return;
		
		// inner convenience method
		applyIf = function(dataObj, optKey, cssKey, elements, itemTemplate){
			var i, data;
			if(dataObj[optKey] != null){
				if(itemTemplate){
					data = itemTemplate.replace(/\{0\}/gi, dataObj[optKey]);
				}
				else{
					data = dataObj[optKey];
				}
				for(i=0;i<elements.length;i++){					
					elements[i].style[cssKey] = data;
				}
			}
		}		
		

		scr_handle = scroll_parents_attached[posID];

		if (scr_handle && scr_handle.tID) clearTimeout(scr_handle.tID);

		_clear_geom_update_timer();
		
		bodyEl = win[DOC].getElementsByTagName('BODY')[0];
		topElems.push(bodyEl);
		htmlEl = win[DOC].getElementsByTagName('HTML');
		if(htmlEl && htmlEl.length > 0){
			htmlEl = htmlEl[0];
			topElems.push(htmlEl);
		}
		
		hasTopImg = bgData['imgsrc'] != null && bgData['imgsrc'] != '';
		hasLRImages = (typeof(bgData['left_pane']) === 'object' || typeof(bgData['right_pane']) === 'object');
		
		if(hasLRImages){
			bodyEl.style.backgroundColor='transparent';
			applyIf(bgData, 'color', 'backgroundColor', [htmlEl]);
		}
		else{
			applyIf(bgData, 'color', 'backgroundColor', topElems);
		}
		applyIf(bgData, 'imgsrc', 'backgroundImage', topElems, 'url({0})');
		
		// apply top image
		if(hasTopImg){
			if(bgData.repeatX || bgData.repeatY){
				if(bgData.repeatX && bgData.repeatY){					
				}
				else{
					bgData['bgrepeat'] = bgData.repeatX ? 'repeatX' : 'repeatY';
					applyIf(bgData, 'bgrepeat', 'backgroundRepeat', topElems);
				}
			}
			else{
				bgData['bgrepeat'] = 'no-repeat';
				applyIf(bgData, 'bgrepeat', 'backgroundRepeat', topElems);
			}
		}
		
		// Left and right rail images
		if(hasLRImages){
			var createPane = function(styleStr, paneData){
				pane = document.createElement('DIV');
				pArr = [pane];
				sf.lib.dom.css(pane, styleStr);
				applyIf(pData, 'imgsrc', 'backgroundImage', pArr, 'url({0})');
				
				bodyEl.insertBefore(pane, bodyEl.firstChild);
			}
			
			pData = bgData['left_pane'];
			if(pData){
				s = 'position:absolute;z-index:-1;left:0;top:0;height:800px;width:1000px;';
				createPane(s, pData);
			}
			pData = bgData['right_pane'];
			if(pData){
				s = 'position:absolute;z-index:-1;right:0;top:0;height:800px;width:1000px;background-position:right center;';
				createPane(s, pData);
			}
			
		}

		if (_fire_pub_callback(BF_POS_MSG, posID, BACKGROUND_COMMAND)) return; //event canceled

        params.expanded		= TRUE;
        msgObj.dx			= dx;
        msgObj.dy			= dy;
        msgObj.w			= nWd;
        msgObj.h			= nHt;
        msgObj.cmd			= "bg";
       	msgObj.geom 		= _es(_build_geom(posID, ifr, TRUE));

		_fire_pub_callback(POS_MSG, posID, EXPAND_COMMAND, dx ,dy);
		_send_response(params, msgObj);
		ifrSt = par = ifr = params = msgObj = NULL;
	}
	
	
	
    /**
     * Notify publisher that a message has been sent and return the appropriate callback
     *
     * @name $sf.host-_record_error
     * @private
     * @static
     * @function
     * @param {$sf.lib.lang.ParamHash} msgObj The details about the message send from the SafeFrame
     *
     *
    */
	function _notify_message(msgObj, noMsging){
		var posID		= (msgObj && msgObj.pos),
			params		= (posID && rendered_ifrs[posID]),
			params_conf	= (params && params.conf),
			id			= (params_conf && params_conf.dest),
			ifr			= (id && _elt(id)),
			par			= (ifr && _elt(POS_REL_BOX_ID_PREFIX + "_" + posID)),
			ifrSt		= (ifr && ifr[ST]),
			parSt		= (par && par[ST]),
			scr_handle;
			
		_fire_pub_callback(POS_MSG, msgObj.pos, NOTIFY_MESSAGE, msgObj.msg);
		
		if (!noMsging) {
			msgObj.cmd  	= "msg";
			msgObj.geom		= _es(_build_geom(posID, ifr, TRUE));
			_send_response(params, msgObj);
		}
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
     * @param {boolean} [isOutside] Whether or not the read-cookie command came from the publisher
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
     * @param {boolean} [isOutside] Whether or not the write-cookie command came from the publisher
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
	 * @param {string} pos_id* One or more position ids to remove from the page. If no arguments are specifed, all positions currently rendered are removed.
	 *
	*/

	function nuke()
	{
		var idx = 0, empty = TRUE, args = arguments, 
			pos_id, pos, el_id, el, sb_rel, par, adpos, i;

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
				
				for(i=$sf.info.list.length - 1; i >= 0; i--){
					adpos = $sf.info.list[i];
					if(adpos && adpos.id === pos_id){
						$sf.info.list.splice(i, 1);
						break;
					}
				}
				
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
		name_params, dest_id, dest_rel_id, css_txt, w, h, st, e, pend,
		pos_data;

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
						pos_data = $sf.lib.lang.mix({}, name_params, false, true);
						delete pos_data['geom'];
						delete pos_data['has_focus'];
						$sf.info.list.push(pos_data);
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
	 * @return {string}
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

			// _rect = (ieVer) ? _getRectIE : _getRectNonIE;

			lang.def("dom",
			{
				rect:			rect,
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

					initID			= "xdm-html5-init-" + _guid();
					locHost			= (locHost.indexOf("file") == 0) ? locHost = "file" : locHost;
					_check_html5_init({foo:'bar', data: initID});
					
					/*
					dom[ATTACH](win,MSG,_check_html5_init);
					try {
						win[PMSG](initID, (locHost == "file") ? "*" : locHost);
					} catch (e) {
						dom[DETACH](win,MSG,_check_html5_init);
					}
					*/
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
