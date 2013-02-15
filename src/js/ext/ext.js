/*
* Copyright (c) 2012, Interactive Advertising Bureau
* All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

/**
 * @fileOverview This file contains JavaScript code that handles the HTML document where HTML is rendered for a SafeFrame, as well as defining the External Vendor/Client API.
 * @author <a href="mailto:ssnider@yahoo-inc.com">Sean Snider</a>
 * @author <a href="mailto:ccole[AT]emination.com">Chris Cole</a>
 * @version 1.0
*/


/**
 * @namespace $sf.ext The external vendor / client API for functionality inside a SafeFrame
 * @name $sf.ext
 *
*/

/** @ignore */
(function(win) {

var NULL					= null,
	TRUE					= true,
	FALSE					= false,
	LOAD					= "load",
	ON_STR					= "on",
	MSG						= "message",
	UNLOAD					= "un"+LOAD,
	ONUNLOAD				= ON_STR+UNLOAD,
	ONMSG					= ON_STR+MSG,
	ONLOAD					= ON_STR+LOAD,
	DG						= "__defineGetter__",
	DS						= "__defineSetter__",
	DP						= "__defineProperty__",
	W3C_ATTACH				= "addEventListener",
	W3C_DETACH				= "removeEventListener",
	IE_ATTACH				= "attachEvent",
	IE_DETACH				= "detachEvent",
	TOLOWERCASE				= "toLowerCase",
	EXPAND_COMMAND 			= "exp-ovr",
    COLLAPSE_COMMAND 		= "collapse",
    NOTIFY_GEOM_UPDATE		= "geom-update",
    NOTIFY_EXPAND			= "expand",
    NOTIFY_COLLAPSE			= COLLAPSE_COMMAND,
    NOTIFY_COLLAPSED		= (NOTIFY_COLLAPSE + "d"),
    NOTIFY_FAILURE			= "failed",
	NOTIFY_READ_COOKIE		= "read-cookie",
	NOTIFY_WRITE_COOKIE		= "write-cookie",
    OUR_TAG_CLS_NAME		= "sf",
    MAX_MSG_WAIT_TIME		= 4000,
	DOM_WATCH_INTERVAL		= 3000,
	GUID_VALID_TIME			= 30000,
	OBJ						= "object",

	d						= (win && win.document),
	par 					= (win && win.parent),
	sf						= (win && win.$sf),
	lib						= (sf && sf.lib),
	env						= (sf && sf.env),
	lang					= (lib && lib.lang),
	ParamHash				= (lang && lang.ParamHash),
	dom						= (lib && lib.dom),
	iframes					= (dom && dom.iframes),
	msgclient_fb			= (dom && dom.msgclient_fb),
	isIE					= (env && env.isIE),
	_ue						= (win && win.unescape),
	_cstr					= (lang && lang.cstr),
	_cnum					= (lang && lang.cnum),
	_append					= (dom && dom.append),
	_tags					= (dom && dom.tags),
	_elt					= (dom && dom.elt),
	_purge					= (dom && dom.purge),
	_attach					= (dom && dom.attach),
	_detach					= (dom && dom.detach),
	_attr					= (dom && dom.attr),

	loaded						= FALSE,
	is_expanded					= FALSE,
	force_collapse				= FALSE,
	is_registered				= FALSE,
	init_width					= 0,
	init_height					= 0,
	sandbox_cb					= NULL,
	pending_msg					= NULL,
	geom_info					= NULL,
	pos_meta					= NULL,
	guid						= "",
	host_cname					= "",
	can_use_html5				= FALSE,
	frame_id					= "",
	pos_id						= "",
	err_msg_timer_id			= 0,
	orphan_timer_id				= 0,
	inline_handler_timer_id		= 0,
	err_msgs					= [],
	unload_handlers				= [],

	render_params, render_conf, ie_old_attach, w3c_old_attach, ie_old_detach, w3c_old_detach;


	/*
	 * --BEGIN-Intenral HTML Document handling
	 *
	*/


	/**
	 * Creates and appends a style sheet for any custom CSS passed
	 *
	 * @name $sf.ext-_create_stylesheet
	 * @function
	 * @static
	 * @private
	 * @param {String} cssText A string of CSS rules, or a URL string
	 * @param {String} [id] The id attribute of the tag created and appended
	 *
	*/

	function _create_stylesheet(cssText, id)
	{
		var oHead, oSS, oTxt, e;

		try {
			oHead		= _tags("head")[0];

			if (cssText.search(/\{[^\}]*}/g) == -1) {
				oSS			= dom.make("link");
				oSS.type	= "text/css";
				oSS.rel		= "stylesheet";
				oSS.href	= cssText;

			} else {
				oSS			= dom.make("style");
				oSS.type	= "text/css";

				if (isIE) {
					oSS.styleSheet.cssText	= cssText;
				} else {
					oTxt	= d.createTextNode(cssText);
					_append(oSS, oTxt);
				}
			}
			if (id) oSS.id = id;

			_append(oHead,oSS);
		} catch (e) {
				//log
		}
	}

	/**
	 * Fires of unload event handlers and performs the necessary clean up when a SafeFrame is destroyed
	 *
	 * @name $sf.ext-_destruction
	 * @function
	 * @static
	 * @private
	 * @param {HTMLEvent} [evt] The raw dom event object if it exists
	 *
	*/

	function _destruction(evt)
	{
		 //note we are re-grabbing the window ref, b/c in IE sometimes unload doesn't fire when the iframe
		 //is removed from the dom (usually do to references hanging), and the window object has now changed

		var handler, w = window, success = 1, e;

		try {
			evt	= evt || w.event || {};
		} catch (e) {
			evt = {type:UNLOAD};
		}

		while (handler = unload_handlers.shift())
		{
			try {
				handler(evt);
			} catch (e) {

			}
		};

		try {
			if (ie_old_attach) {
				w[IE_ATTACH] = ie_old_attach;
				w[IE_DETACH] = ie_old_detach;
			}
		} catch (e) {  }

		try {
			if (w3c_old_attach) {
				w[W3C_ATTACH] = w3c_old_attach;
				w[W3C_DETACH] = w3c_old_detach;
			}
		} catch (e) {  }

		if (!loaded) _detach(w,LOAD,_handle_load);

		_detach(w,UNLOAD,_handle_unload);


		try { w.onerror = NULL; } catch (e) { }

		try {
		   if (err_msg_timer_id) {
		        clearTimeout(err_msg_timer_id);
		        err_msg_timer_id = 0;
		   }
		} catch (e) { }

		try {
		    if (orphan_timer_id) {
		        clearTimeout(orphan_timer_id);
		        orphan_timer_id = 0;
		    }
		} catch (e) { }

		try {
			if (inline_handler_timer_id) {
				clearTimeout(inline_handler_timer_id);
				inline_handler_timer_id = 0;
			}
		} catch (e) { }

		w = ie_old_attach = w3c_old_attach = ie_old_detach = w3c_old_detach = d = _ue = par = handler = grand_par = NULL;
		return success;
	}


	/**
	 * Maintains that the window.onmessage property remains unset.
	 * We don't want content in our document listening to HTML5 messages.
	 * We override attaching to listeners below to maintain that functionality,
	 * however IE won't let you override properties directly hangning off of the
	 * window object, so we have a timer as a fallback for that purpose
	 *
	 * @name $sf.ext-_reset_inline_handlers
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _reset_inline_handlers()
	{
		var e;

		try {
			if (inline_handler_timer_id) {
				clearTimeout(inline_handler_timer_id);
				inline_handler_timer_id = 0;
			}
		} catch (e) { }


		try {
			if (isIE && win.onmessage) win.onmessage = NULL;
		} catch (e) { }

		try {
			win.onerror = _handle_err;
		} catch (e) {  }

		inline_handler_timer_id = setTimeout(_reset_inline_handlers, DOM_WATCH_INTERVAL);
	}

	/**
	 * Clears out the HTML document (which will force an unload event as well).
	 *
	 * @name $sf.ext-_nuke_doc
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _nuke_doc()
	{
		var e;
		try {
			document.open("text/html", "replace");
			document.write("");
			document.close();
		} catch (e) { }
	}

	/**
	 * Iteratively checks to see if the IFRAME HTML document is no longer
	 * attached to the main dom, doing this by checking that our internal
	 * window reference is still valid. . .as well as running the checks to make
	 * sure invalid iframes (iframes from origin) are not created.
	 *
	 * If we detect that the IFRAME has been removed from the main dom of the
	 * publisher, then we call to destroy the HTML document, forcing onunload
	 * event and subsquent cleanup
	 *
	 * @name $sf.ext-_check_orphaned
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _check_orphaned()
	{
		var is_orphaned = FALSE, e;

		_detect_bad_iframe();

		/*
		 * This method checks to see if the win reference has become the top level frame
		 * /window refrence.  In IE when calling parNode.removeChild(iframeNode), the
		 * underlying iframe document is not unloaded right away, or potentially ever.
		 * This causes the JS code inside the frame to continue running. However, when
		 * an iframe is removed from the main DOM, the window reference changes to point
		 * at the top level, eventhough it was nested in the main dom.  So we can detect
		 * this change, and swap the location of the frame to force the document to unload
		 * properly. Note this method runs in a timer continually, but only in
		 * IE browsers.
		 *
		*/
		if (!isIE) return;

		try {
			if (orphan_timer_id && orphan_timer_id != -1) {
				clearTimeout(orphan_timer_id);
				orphan_timer_id = 0;
			}
		} catch (e) { }

		try {
			is_orphaned = (win == top && orphan_timer_id != -1);
		} catch (e) {
			is_orphaned = FALSE;
		}
		if (is_orphaned) {
			orphan_timer_id = -1;
			_destruction();
			_nuke_doc();
			return;
		}

		try {
			if (!orphan_timer_id) orphan_timer_id = setTimeout(_check_orphaned, DOM_WATCH_INTERVAL);
		} catch (e) { }
	}


	/**
	 * Detect whether or not an IFRAME tag has been inserted into the DOM that has the same
	 * origin / cname as the publisher, which should not be allowed as it's a security issue
	 * If said IFRAME tag(s) are found, remove them.
	 *
	 * @name $sf.ext-_detect_bad_iframe
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _detect_bad_iframe()
	{
		/* detect iframe policy files that may be created by ad-interax and/or double click and nuke them */

		var iframes = _tags("iframe"), idx = 0, srcHost = "", written = FALSE, tag;


		if (host_cname) {
			while (tag = iframes[idx++])
			{
				srcHost = _attr(tag, "src");
				srcHost	= (srcHost && srcHost.length >= 9) ? srcHost.substring(0, srcHost.indexOf("/",9))[TOLOWERCASE]() : "";
				if (srcHost && srcHost == host_cname && tag.className != OUR_TAG_CLS_NAME) {
					try {
						_purge(tag);
					} catch (e) { }
				}
			}
		}
	}

	/**
	 * Make sure that all hyperlinks in the document are set with the property "target" attribute
	 * such that links will navigate to the right window properly.
	 *
	 * @name $sf.ext-_set_hyperlink_targets
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _set_hyperlink_targets()
	{
		var idx = 0, ttgt = ((render_conf && render_conf.tgt) || "_top"), ln, atgt, lns;

		lns				= _tags("a");
		if (ttgt == "_self") ttgt = "_top";

		while (ln = lns[idx++])
		{
			atgt = _attr(ln,"target");
			if (atgt != ttgt) {
				_attr(ln,"target",ttgt);
			}
			if (idx > 10) break;
		}
	}


	/**
	 * Handle the onunload event from the HTML document of the IFRAME, which in turn will trigger clean up
	 *
	 * @name $sf.ext-_handle_unload
	 * @function
	 * @static
	 * @private
	 * @param {HTMLEvent} evt The raw DOM event object
	 *
	*/

	function _handle_unload(evt)
	{
		_destruction(evt);

		_nuke_doc();
	}

	/**
	 * Handle the load event from the HTML document of the IFRAME, which will also setup
	 * to make sure link targets are set properly
	 *
	 * @name $sf.ext-_handle_load
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _handle_load()
	{
		if (loaded) return;
		loaded = TRUE;

		_detach(win,LOAD,_handle_load);
		_set_hyperlink_targets();
	}


	/**
	 * Handle onmessage HTML5 x-domain events. We always cancel the event
	 * never allowing it to go to other listeners besides our own, as we don't allow HTML5 messaging
	 * beyond us and the publisher / host.
	 *
	 * @name $sf.ext-_handle_msg
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _handle_msg(evt)
	{
		var str, src, org, e, msg_params, msg_guid, msg_obj;

		/** TODO, also validate origin */

		try {
			str	= evt.data;
			src	= evt.source;
			org = evt.origin;
		} catch (e) { }

		dom.evtCncl(evt);

		if (str && src && src == top) {
			msg_params	= ParamHash(str,NULL,NULL,TRUE,TRUE);
			msg_guid	= msg_params.guid;
			msg_obj		= msg_params.msg;
			if (guid == msg_guid && msg_obj && typeof msg_obj == OBJ) {
				try {
					/** @ignore */
					setTimeout(function()
					{
						_receive_msg(msg_obj, evt);
						msg_params = evt = msg_guid = msg_obj = NULL;
					},1);
				} catch (e) { }
			}
		}
	}

	/**
	 * This SafeFrames implementation internally handles all event attachment to maintain that the listener order
	 * for events that it cares about (onload, onunload, onbeforeunload, onmessage).
	 * This is done to make sure that proper clean up and intialization happens, as well as to enforce
	 * security.
	 *
	 * For events that it SafeFrames does not care about we allow the attachment listeners
	 * to proceed as normal, so we call the raw attachEvent / addEventListener functions.
	 *
	 * @name $sf.ext-_call_raw_evt_func
	 * @function
	 * @static
	 * @private
	 * @param {String} type The name of the event for which to attach/detach a listener
	 * @param {Function} f The callback function to use as a listener for said event
	 * @param {Boolean} [remove] If set to true, remove/detach this function as a listener, otherwise add
	 *
	 *
	*/

	function _call_raw_evt_func(type, f, remove)
	{
		var bOK = FALSE, ie_f, w3c_f, e;
		if (remove) {
			ie_f 	= ie_old_detach || w3c_old_detach;
			w3c_f	= w3c_old_detach;
		} else {
			ie_f	= ie_old_attach || w3c_old_attach;
			w3c_f	= w3c_old_attach;
		}

		if (ie_f) {
			try {
				ie_f(type, f);
				bOK = TRUE;
			} catch (e) {
				bOK = FALSE;
			}
			if (!bOK) {
				try {
					ie_f.call(win, type, f);
					bOK = TRUE;
				} catch (e) {
					bOK = FALSE;
				}
			}
		}
		if (w3c_f && !bOK) {
			try {
				w3c_f.call(win, type, f, FALSE);
			} catch (e) {

			}
		}
	}

	/**
	 * Override default event attachment, and send load, beforeunload, and unload handlers into our
	 * own ques, so that we can enforce the proper firing order.  if message event is passed in,
	 * we do not allow attachment, since we do not want n-party code listening to HTML5 messages
	 *
	 * @name $sf.ext-_attach_override
	 * @function
	 * @static
	 * @private
	 * @param {String} type the event name to listen too
	 * @param {Function} f The function to be called whenever the event fires
	 *
	*/

	function _attach_override(type, f)
	{
		var bDoDefault = FALSE;

		type = _cstr(type)[TOLOWERCASE]();

		switch (type)
		{
			case UNLOAD:
			case ONUNLOAD:
				unload_handlers.push(f);
			break;
			case MSG:
			case ONMSG:
				//noop
			break;
			default:
				bDoDefault = TRUE;
			break;
		}
		if (bDoDefault) _call_raw_evt_func(type, f);
	}

	/**
	 * Override default event detachment, and remove load, beforeunload, and unload handlers
	 * from our own que.  if message event is passed in, we do nothing (since we don't alllow
	 * attachment either).  If not one of those event types, then we call the default event detachment
	 *
	 * @name $sf.ext-_detach_override
	 * @function
	 * @static
	 * @private
	 * @param {String} type the event name to unlisten too
	 * @param {Function} f The function to no longer be called for the specific event
	 *
	*/

	function _detach_override(type, f)
	{
		var idx = 0, handler, handlers;

		type = _cstr(type)[TOLOWERCASE]();

		switch (type)
		{
			case UNLOAD:
			case ONUNLOAD:
				handlers = unload_handlers;
			break;
			case MSG:
			case ONMSG:
				//noop
			break;
		}
		if (handlers) {
			if (handlers.length) {
				while (handler = handlers[idx])
				{
					if (handler === f) {
						handlers.splice(idx,1);
						break;
					}
					idx++;
				}
			}
		} else {
			_call_raw_evt_func(type, f, TRUE);
		}
	}

	/**
	 * Report any internal uncaught JavaScript errors up to the publisher / host
	 *
	 * @name $sf.ext-_report_errs
	 * @static
	 * @function
	 * @private
	 *
	*/

	function _report_errs()
	{
		var e;

		try {
			if (errMsgTimerID) {
				clearTimeout(errMsgTimerID);
				errMsgTimerID = 0;
			}
		} catch (e) { }

		err_msgs.length = 0;
	}

	/**
	 * Handle any uncaught JavaScript errors
	 *
	 * @name $sf.ext-_handle_err
	 * @static
	 * @function
	 * @private
	 * @param {String} a The the error message / description string
	 * @param {String} b The URL / file that the JavaScript error occured within
	 * @param {Number} c The line number that the error occured on. . .
	 *
	*/

	function _handle_err(a, b, c)
	{
		var e;

		err_msgs.push(_cstr(["Error occurred inside SafeFrame:\nMessage: ", a, "\nURL:", b, "\nLine:", c]));

		try {
			if (errMsgTimerID) {
				clearTimeout(errMsgTimerID);
				errMsgTimerID = 0;
			}
			errMsgTimerID = setTimeout(_report_errs, DOM_WATCH_INTERVAL);
		} catch (e) { }

		return TRUE;
	}


	/**
	 * Override native window methods and properties so that we can control
	 * how the events that we need to manage
	 *
	 * @name $sf.ext-_setup_win_evt_props
	 * @static
	 * @function
	 * @private
	 * @param {Object} obj The window object / prototype
	 *
	*/

	function _setup_win_evt_props(obj)
	{
		var n = lang.noop, O = Object, nobj = {get:n,set:n}, ret = FALSE;

		if (obj) {
			if (ie_old_attach) {
				obj[IE_ATTACH] = _attach_override;
				obj[IE_DETACH] = _detach_override;
			}

			if (w3c_old_attach) {
				obj[W3C_ATTACH] = _attach_override;
				obj[W3C_DETACH] = _detach_override;
			}
			if (obj[DG]) {
				try {
					obj[DG](ONLOAD, n);
					obj[DS](ONLOAD, n);
					obj[DG](ONUNLOAD, n);
					obj[DS](ONUNLOAD, n);
					obj[DG](ONMSG, n);
					obj[DS](ONMSG, n);
					ret = TRUE;
				} catch (e) {
					ret = FALSE;
				}
			}
			if (!ret && O[DP]) {
				try {
					O[DP](obj, ONLOAD, nobj);
					O[DP](obj, ONUNLOAD, nobj);
					O[DP](obj, ONMSG, nobg);
					ret = TRUE;
				} catch (e) {
					ret = FALSE;
				}
			}
		}
		return ret;
	}

	/**
	 * Intialize / setup the safeframe, the environment according to the configuration found within the serialized
	 * window.name property.
	 *
	 * @name $sf.ext-_construction
	 * @param {Object} [details] An optional object to pass in status / error information into
	 * @static
	 * @private
	 * @function
	*/

	function _construction(details)
	{
		var cont = FALSE, ret = TRUE, el, nm, temp, cur_time, guid_time, time_delta, e;

		details = (details && (details instanceof Object)) ? details : {};

		/* 1st read window.name property */

		try {
			nm = win.name;
		} catch (e) { }

		/* 2nd, erase property so that it cannot be abused */

		try {
			win.name = "";
		} catch (e) { }


		if (!nm) {
			details.status = 500.101;
			return cont;
		}


		/* now check the following
		 *
		 * a.) This code MUST be run in the context of a child window, only 1 level down from the top
		 * b.) The string from window.name must deserialize into our ParamHash object properly
		 *  i.) a "guid", "conf", "html" set of properties must exist
		 *  ii.) a guid property must consist of a unique string, where a section includes a time stamp from the epoch, which much be within 5 secs of the current time
		 *       otherwise someone could just be trying to abuse us
		 *
		 * we cannot truly validate the guid per-se, b/c we cannot message back up to the publisher in a synchronous way, and
		 * we need to stay synchronous here so that the content in question is allowed to do document.write calls etc.
		 * but the time/format check is pretty solid
		 *
		*/

		try {
			if (top == par) {
				render_params	= ParamHash(nm, NULL,NULL,TRUE,TRUE);
				cur_time		= lang.time();
				guid			= render_params.guid;
				guid_time		= _cnum(guid.replace(/[^_]*_(\d+)_\d+_\d+/g, "$1"), 0);
				time_delta		= cur_time - guid_time;
				cont			= (guid && guid_time && time_delta > 0 && time_delta < GUID_VALID_TIME);

				// Decode the publisher uri
				if (render_params.loc) render_params.loc = unescape(render_params.loc);
				if (!cont) details.status = 500.104;
			} else {
				details.status = 500.102;
			}
		} catch (e) {
			render_params = guid = NULL;
			cont 			= FALSE;
			details.status	= 500.103;
		}
		if (cont) {
			try {
				render_conf		= render_params.conf;
				frame_id		=
				win.name		= render_conf.dest;
				pos_id			= render_conf.id;
				pos_meta		= render_params.meta;
				host_cname		= render_params.host;
				geom_info		= render_params.geom;
				can_use_html5	= lang.cbool(render_params.html5);
				temp			= render_conf.bg;

				if (geom_info) {
					geom_info = ParamHash(_ue(geom_info), NULL,NULL,TRUE,TRUE);
					if (!geom_info.self || !geom_info.exp) geom_info = NULL;
				}


				if (!host_cname) {
					host_cname	= d.referrer;
					host_cname	= host_cname.substring(0,host_cname.indexOf("/",9));
				}

				if (temp) { _create_stylesheet(_cstr(["#sf_body { background-color: ",temp, "; }"]), "sf_bg_css"); }

				temp		= render_conf.tgt;
				if (temp == "_self") render_conf.tgt = "_top";
				if (!temp) render_conf.tgt 			 = "_top";

				if (temp != "_top") {

					while (_purge(_tags("base")[0]));

					el = dom.make("base");
					_attr(el,"target",temp);
					_append(_tags("head")[0], el);
				}

				if (isIE) {
					ie_old_attach = win[IE_ATTACH];
					ie_old_detach = win[IE_DETACH];
				}

				w3c_old_attach	= win[W3C_ATTACH];
				w3c_old_detach	= win[W3C_DETACH];

				/*
				 * Here we setup unload handlers of our own to make sure
				 * unload / before unload events are fired in order, and that
				 * we clean up all our own intenral stuff
				 * Also since we are in an iframe, we don't want navigation
				 * to ever occur within this frame, so we also write / replace
				 * the document on unload as a precaution against some one tryint
				 * to navigate us
				 *
				*/

				_attach(win, UNLOAD, _handle_unload);
				_attach(win, LOAD, _handle_load);
				_attach(win, MSG, _handle_msg);

				_setup_win_evt_props(win);
				_setup_win_evt_props(win.__proto__);
				_setup_win_evt_props(win.Window && win.Window.prototype);

			} catch (e) {
				details.status = 500.105;
				render_params = render_conf = guid = NULL;
				ret = FALSE;
			}
		} else {
			render_params = guid = NULL;
			ret = FALSE;
		}
		return ret;
	}

	/**
	 * Render the HTML and CSS content passed in through the window.name message via a document.write
	 *
	 * @name $sf.ext-_render
	 * @function
	 * @static
	 * @private
	 *
	*/

	function _render()
	{
		/* The internal method that does the document.write of ad content */

		var html, css;

		css	 = _cstr(render_conf && render_conf.css);
		html = _cstr(render_params && render_params.html);
		if (css) {
			css 	= _ue(css);
			_create_stylesheet(css, "sf_custom_css");
		}

		if (html) {
			html	= _ue(html);
			try {
				d.write(html);

				_check_orphaned();
				_reset_inline_handlers();
			} catch (e) {
				_handle_err("Error while rendering content: " + e[MSG]);
			}
		}
	}

	/*
	 * --END-Internal HTML Document handling
	 *
	*/


	/*
	 * --BEGIN-External Vendor/Client API
	 *
	*/

	/**
	 * Call into the fallback x-msging library client if possible when no HTML5 style messaging
	 * exists
	 *
	 * @name $sf.ext-_call_client_fb
	 * @function
	 * @private
	 * @static
	 * @param {String} methName The name of the message in the library to call
	 * @param {*} [arg1] An arbitrary argument to hand into the library
	 * @param {*} [arg2] An arbitrary argument to hand into the library
	 *
	*/

	function _call_client_fb(methName, arg1, arg2)
	{
		if (msgclient_fb) msg_clientfb = dom.msgclient_fb;
		return (methName && msgclient_fb && msgclient_fb[methName] && msgclient_fb[methName](arg1,arg2));
	}

	/**
	 * Process a validated message to notify the contents of the SafeFrame of state updates
	 *
	 * @name $sf.ext-_receive_msg
	 * @function
	 * @private
	 * @static
	 * @param {$sf.lib.lang.ParamHash} params The message parameter hash object containing information about what has occured
	 * @param {HTMLEvent} [evt] The raw DOM event from the x-domain message
	 * @return {Boolean} Whether or not the message received could be handled
	 *
	*/

	function _receive_msg(params, evt)
	{
		var ret = FALSE, msg, cmd, g, e, data = {};

		if (params) {
			g	   	= params.geom || "";
			cmd		= params.cmd;
			if (g) geom_info = ParamHash(_ue(g),NULL,NULL,TRUE,TRUE);
		}
		
		data.cmd = cmd;
		data.value = data.info = params && params.value;
		data.reason = params && params.reason;

		//OK firefox is doing really weird stuff with switch statements and I can't seem to figure
		//it out so i'm switching to if / else

		if (cmd == NOTIFY_COLLAPSED) {
			//collapse happened from outside, rather thant by virture of API
			//close the channel now. . .

			ret		= TRUE;
			if (is_expanded) {
				pending_msg		= NULL;
				is_expanded		= FALSE;
				force_collapse 	= TRUE;
				_collapse();
				force_collapse = FALSE;
				_fire_sandbox_callback(NOTIFY_COLLAPSED);
			}

		} 
		else if (cmd == NOTIFY_COLLAPSE) {
			//Y.SandBox.vendor.collapse was called, notify
			ret		= TRUE;
			if (is_expanded) {
				pending_msg 	= NULL;
				is_expanded  	= FALSE;
				_fire_sandbox_callback(NOTIFY_COLLAPSED);
			}
		} 
		else if (cmd == NOTIFY_EXPAND) {
			ret		= TRUE;
			if (pending_msg) {
				pending_msg		= NULL;
				is_expanded 	= TRUE;
				_fire_sandbox_callback(NOTIFY_EXPAND+"ed");
			}
		} 
		else if (cmd == NOTIFY_GEOM_UPDATE) {
			_fire_sandbox_callback(NOTIFY_GEOM_UPDATE);
		} 
		else if (cmd == NOTIFY_READ_COOKIE) {
			ret		= TRUE;
			if (pending_msg) {
				pending_msg		= NULL;
				is_expanded 	= TRUE;
				data = params && params.value;
				_fire_sandbox_callback(NOTIFY_READ_COOKIE, data);
			}
		} 
		else if (cmd == NOTIFY_WRITE_COOKIE) {
			ret		= TRUE;
			if (pending_msg) {
				pending_msg		= NULL;
				is_expanded 	= TRUE;
				_fire_sandbox_callback(NOTIFY_WRITE_COOKIE, data);
			}
		}
		else if (cmd == NOTIFY_FAILURE) {
			ret		= TRUE;
			if (pending_msg) {
				pending_msg		= NULL;
				is_expanded 	= TRUE;
				_fire_sandbox_callback(NOTIFY_FAILURE, data);
			}
		}
		
		params = NULL;
		return ret;
	}

	/**
	 * Send a command message up to the SafeFrames publisher / host code
	 *
	 * @name $sf.ext-_send_msg
	 * @private
	 * @function
	 * @static
	 * @param {String} str An encoded string (query-string/$sf.lib.lang.ParamHash format) that contains the command message to send
	 * @param {String} cmd The command to be sent itself (note that this string should also be present in the 1st argument)
	 *
	 *
	*/

	function _send_msg(str, cmd)
	{
		var id = lang.guid("sf_pnd_cmd"), frame_id = render_params.dest, sent = FALSE, sent_time = lang.time(), params;

		if (!str || !cmd || pending_msg) return;

		params 		= ParamHash({msg:str,id:frame_id,guid:guid,cmd:cmd});
		pending_msg	= {id:id,sent:sent_time,cmd:cmd};

		setTimeout(function()
		{
			if (pending_msg && pending_msg.id == id) {
				if (cmd == EXPAND_COMMAND || cmd == "exp-push") {
					force_collapse = TRUE;
					_collapse();
					force_collapse = FALSE;
				}
				_fire_sandbox_callback(NOTIFY_FAILURE+":"+cmd+":timeout");
			}
			id = sent = sent_time = cmd = str = pending_msg = params = NULL;

		}, MAX_MSG_WAIT_TIME);

		if (can_use_html5) {
			try {
				top.postMessage(params.toString(), ((host_cname == "file" || host_cname == "") ? "*" : host_cname));
				sent = TRUE;
			} catch (e) {
				sent = FALSE;
			}
		}

		if (!sent) _call_client_fb("send", params);
	}


	/**
	 * Fire a notification off to the SafeFrame contents if a callback function was specified
	 *
	 * @name $sf.ext-_fire_sandbox_callback
	 * @private
	 * @function
	 * @static
	 * @param {String} msg The status update / message to send
	 * @param {Object} data The data from the response
	 *
	*/

	function _fire_sandbox_callback(msg, data)
	{
		var e;
		try {
			sandbox_cb(msg, data);
		} catch (e) { }
	}

	/**
	 * Set the alignment of our internal DIV whenever expansion occurs uni-directionaly
	 *
	 * @name $sf.ext-_set_alignment
	 * @private
	 * @function
	 * @static
	 * @param {Boolean} xn Whether or not horizontal axis is growing to the left or right (xn == true == left)
	 * @param {Boolean} yn Whether or not vertical axis is growing to the top or bottom (yn == true == top)
	 *
	*/

	function _set_alignment(xn, yn)
    {
    	var fcDiv = _elt("sf_align"), fcDivStyle=fcDiv.style,
    		xTxt, yTxt, preTxt = "position:absolute;";

		/*
		 * Previously we had a CSS style sheet with a rule that said "#fcDiv {position:absolute;left:0px;top:0px}"
		 * This caused an issue where although we are setting the alignment properly, it doesn't seem
		 * to work / take effect in all cases (this was true in ALL browsers btw, which is odd).
		 *
		 * Now in our HTML template, we removed the CSS rule, and simply added the style inline.
		 * Then here we change it to exactly what we want, which seems to resolve the problem
		 *
		 * However, I think the flaky-ness is more due to the fact that we are using "right/bottom"
		 * CSS positioning rather than, just left / top
		 *
		 * We could also just change it to have left == _initWidth when xn is true
		 * And/Or top == _initHeight when yn is true
		 *
		 * But for now we will just set the x/y to what we want exactly and remove the other items
		 *
		 *
		*/


		if (xn) {
			xTxt	= "right:0px;";
		} else {
			xTxt	= "left:0px;";
		}
		if (yn) {
			yTxt	= "bottom:0px;";
		} else {
			yTxt	= "top:0px;";
		}


		fcDivStyle.cssText = (preTxt+xTxt+yTxt);
		fcDiv = fcDivStyle = NULL;
	}

	/**
	 * Internal function for collapsing the SafeFrame, which checks that there is
	 * not some other pending state which may get in the way
	 *
	 * @name $sf.ext._collapse
	 * @private
	 * @function
	 * @static
	 *
	*/

	function _collapse()
	{
		if (!force_collapse && (!is_registered || !is_expanded || pending_msg)) return FALSE;
		_set_alignment(0, 0);
		return TRUE;
	}

	/**
	 * Intialize the SafeFrame external vendor/client API, so that other features may be used
	 * This method MUST be called prior to using any other rich-media functionality (like expansion).
	 *
	 * @name $sf.ext.register
	 * @public
	 * @function
	 * @static
	 * @param {Number} initWidth The initial width (in pixels) expected of the content within the SafeFrame container
	 * @param {Number} initHeight The initial height (in pixels) expected of the content within the SafeFrame container
	 * @param {Function} [notify] A callback function that content can specify to be notified of status updates
	 *
	*/

	function register(initWidth, initHeight, notify)
    {
		if (is_registered || !guid) return;

		initWidth	= _cnum(initWidth, 0, 0);
		initHeight	= _cnum(initHeight, 0, 0);

		init_width 		= initWidth;
		init_height 	= initHeight;
		is_registered	= TRUE;

		if (lang.callable(notify)) {
			sandbox_cb	= notify;
		} else {
			sandbox_cb 	= NULL;
		}
    }

   /**
     * Make a request to expand the SafeFrame container to a certain size. Note that you may only call $sf.ext.expand
     * to expand to the largest size needed, followed by calling collapse (and then repeat the same process if needed).
     * Tweening or animation done, should be reserved for your own content, and you cannot make multiple calls to expand
     * without a corresponding collapse.
     *
     * Note that when setting t, l, b, and r offset values, expansion will not cause the content inside the SafeFrame
     * to hold it's current alignment, whereas using dx/dy or only setting partial offfsets (e.g {t:100,l:100} ==  dx:-100,dy:-100) will cause expansion to
     * hold it's current alignment.
     *
     * @name $sf.ext.expand
     * @public
     * @static
     * @function
     * @param {Number|Object} deltaXorDesc If a number is specifed, SafeFrame will grow in size by this amount in pixels along the horizontal axis. Specifiy a negative value to grow to the left, and a postive value to grow to the right. <br />
     *                                     If an object is specified, it should contain "t","l","r","b" properties (top,left,bottom,right) for the amount in pixels to grow the container in each dimension
     * @param {Number} deltaXorDesc.t Specifies to shift the top position of the SafeFrame container by the number of pixels specified, relative to original location (negative values not allowed).
     * @param {Number} deltaXorDesc.l Specifies to shift the left position of the SafeFrame container by the number of pixels specified, relative to original location (negative values not allowed).
     * @param {Number} deltaXorDesc.b Specifies to shift the bottom position of the SafeFrame container by the number of pixels specified, relative to the original location (negative values not allowed).
     * @param {Number} deltaXorDesc.r Specifies to shift the left position of the SafeFrame container by the number of pixels specified, relative to the original location (negative values not allowed).
     * @param {Boolean}deltaXorDesc.push  When expanding, push other page content rather than doing an overlay.  Note that setting this value to true will only work if the publisher / host explicitly allows push expansion
     * 					                  Check $sf.ext.supports("exp-push"), ahead of time to verify

     * @param {Number} deltaY If a number is specifed, SafeFrame will grow in size by this amount in pixels along the vertical axis. Specifiy a negative value to grow to the top, and a postive value to grow to the bottom. <br />
     *						  Note that this value is ignored if deltaXorDesc is passed in as an object.
     *
     * @param {Boolean} push When expanding, push other page content rather than doing an overlay.  Note that setting this value to true will only work if the publisher / host explicitly allows push expansion
     * 					     Check $sf.ext.supports("exp-push"), ahead of time to verify
     *
     *
     * @return {Boolean} true/false if the request to expand the container was sent. This does not mean that expansion is complete as expansion is an asynchronous process. Pass in a callback function to $sf.ext.register to get status updates.
     *
    */

    /*
     * TODO, only supprting deltaX/Y as numbers right now. . .need to enable object mode
     *
    */
 function expand(deltaXorDesc, deltaY, p)
    {
		var xn = FALSE, yn = FALSE, doAlign = FALSE,
			cmd_nm  = (p) ? "exp-push" : EXPAND_COMMAND,
			cmd_str = ["cmd=", cmd_nm, "&pos=", pos_id],
			dx = 0, dy = 0, r, b, t, l, align_el, align_el_st, align_buffer;

		if (!is_registered || pending_msg) return;
		if (p && !supports("exp-push")) return;

		if (deltaXorDesc && typeof deltaXorDesc == OBJ) {
			r = _cnum(deltaXorDesc.r,0,0);
			b = _cnum(deltaXorDesc.b,0,0);
			t = _cnum(deltaXorDesc.t,0,0);
			l = _cnum(deltaXorDesc.l,0,0);

			if (deltaXorDesc.push) {
				if (!supports("exp-push")) return;
				cmd_nm 		= "exp-push";
				cmd_str[1]	= cmd_nm;
			}

			if (!r && l) {
				xn 		= TRUE;
				dx		= -1 * l;
			}
			if (r && !l) {
				dx		= r;
			}

			if (!b && t) {
				yn 		= TRUE;
				dy		= -1 * t;
			}
			if (b && !t) {
				dy		= b;
			}
			if ((t && b) || (l && r)) {
				doAlign = FALSE;
			} else {
				doAlign = TRUE;
			}

			if (doAlign) {
				_set_alignment(xn,yn);
				cmd_str.push("&dx=", dx, "&dy=", dy);
				_send_msg(_cstr(cmd_str), cmd_nm);
			} else {
				/*
				 * We may want to remove this. . . its my attempt
				 * at setting the alignment in a omni-directional expansion
				 * case
				 *
				*/

				align_el 	= _elt("sf_align");
				align_el_st	= (align_el && align_el.style);
				align_buffer = ["position:absolute;"];

				if (t && b) {
					align_buffer.push("top:", t, "px;");
				} else if (t) {
					align_buffer.push("bottom:0px;");
				} else if (b) {
					align_buffer.push("top:0px;");
				}
				if (l && r) {
					align_buffer.push("left:", l, "px;");
				} else if (l) {
					align_buffer.push("right:0px;");
				} else if (b) {
					align_buffer.push("left:0px;");
				}
				if (align_el_st) {
					align_el_st.cssText = _cstr(align_buffer);
				}
				cmd_str.push("&exp_obj=", escape(ParamHash(deltaXorDesc)));
				_send_msg(_cstr(cmd_str), cmd_nm);
			}
		} else {
			deltaXorDesc = _cnum(deltaXorDesc, 0);
			deltaY = _cnum(deltaY, 0);
			if (deltaXorDesc <= 0 && deltaY <= 0) return;

			xn	= (deltaXorDesc <= 0);
			yn	= (deltaY <= 0);
			_set_alignment(xn, yn);
			cmd_str.push("&dx=", deltaXorDesc, "&dy=", deltaY);
			_send_msg(_cstr(cmd_str), cmd_nm);
		}

		return TRUE;
	}

	/**
	 * Collapse the SafeFrame container after having called to expand. If no previous call to expand has been made, this call will do nothing.
	 *
	 * @name $sf.ext.collapse
	 * @public
	 * @static
	 * @function
	 *
	*/

	function collapse()
	{
		if (_collapse()) _send_msg(_cstr(["cmd=",COLLAPSE_COMMAND,"&pos=", pos_id]), COLLAPSE_COMMAND);
	}

	/**
	 * Return geometric information about the SafeFrame container and it's status within a page
	 *
	 * @name $sf.ext.geom
	 * @public
	 * @static
	 * @function
	 * @return {Object} geom_info
	 *
	*/

	function geom()
	{
		return geom_info;
	}

	/**
	 * Return meta-data information that may have been specified by the publisher / host.
	 *
	 * @name $sf.ext.meta
	 * @public
	 * @static
	 * @function
	 * @param {String} propName the key name of the meta-data value to be retrieved
	 * @param {String} [owner_key] the super key name of the data to be retrieved
	 * @return {String} The value of some meta-data that may have been specified by the publisher / host or "".
	 *
	*/

	function meta(propName, owner_key)
	{
		var ret = "", shared;
		if (pos_meta) {
			if (owner_key) {
				if (owner_key in pos_meta) {
					ret = _cstr(pos_meta[owner_key][propName]);
				}
				else if (pos_meta.non_shared && owner_key in pos_meta.non_shared) {
					ret = _cstr(pos_meta.non_shared[owner_key][propName]);
				}
			} else {
				shared	= pos_meta.shared;
				if (shared && typeof shared == OBJ) {
					ret = _cstr(shared[propName]);
				}
			}
		}
		return ret;
	}

	/**
	 * Return the current status of the SafeFrame container, in cases where
	 * a command may be pending. If an empty string is returned ("") container is idle.
	 *
	 * @name $sf.ext.status
	 * @public
	 * @static
	 * @function
	 * @return {String} of any pending status, otherwise empty string.
	 *
	*/
	function status()
	{
		return (pending_msg && pending_msg.cmd) || "";
	}

	/**
	 * Requests the host read or write a cookie to the host domain.
	 * The host domain must grant permission for the cookie to be written.
	 *
	 * @name $sf.ext.cookie
	 * @public
	 * @static
	 * @function
	 * @param {String} [cookieName] The name of the cookie to set or read
	 * @param {Object} [cookieData] An object hash containing the value and an optional expires
	 * @return {Number}
	 *
	*/
	function cookie(cookieName, cookieData)
	{
		var isRead = (cookieData == NULL);
		
		var cmd_nm = isRead ? "read-cookie" : "write-cookie";
	
		var cmd_str = ["cmd=", cmd_nm, "&pos=", pos_id, "&cookie=", cookieName];
		if(!isRead){
			cmd_str.push("&value=");
			cmd_str.push(cookieData.value);
		}
		_send_msg(_cstr(cmd_str), cmd_nm);
	}

	/**
	 * Send a message to the host
	 *
	 * @name $sf.ext.message
	 * @public
	 * @static
	 * @function
	 *
	*/

	function message(content)
	{
		_send_msg(_cstr(["cmd=","msg","&pos=", pos_id, "&msg=", content]), "msg");
	}

	/**
	 * Return the percentage that the SafeFrame container is viewable within the browser window
	 *
	 * @name $sf.ext.inViewPercentage
	 * @public
	 * @static
	 * @function
	 * @return {Number}
	 *
	*/
	function inViewPercentage()
	{
		var iv = _cnum(geom_info && geom_info.self && geom_info.self.iv,-1,0),
			tv;

		if (iv >= 0) {
			tv = Math.floor(iv*100);
		}
		return tv;
	}

	/**
	 * Return whether or not a particular feature is supported, or an object containing
	 * key/value pairs denoting all features and whether or not they are supported
	 *
	 * By default SafeFrames version 1 supports the following feature:
	 *
	 * "exp-ovr": Expansion of the container by overlaying on top of other content
	 *
	 * Later in other versions there are expexted to be more feature with their own
	 * string name, that can be checked by the content in the SafeFrame, so that
	 * it knows what things can be done.
	 *
	 * @name $sf.ext.supports
	 * @public
	 * @static
	 * @function
	 * @param {String} [key] If specifed, checks to see if that specific feature has been enabled
	 * @return {Boolean|Object}
	 *
	*/

	function supports(key)
	{
		var conf = render_params.conf, sup = (conf && conf.supports) || FALSE;

		if (sup) {
			key = _cstr(key);
			if (key) {
				sup = sup[key] || FALSE;
				if(sup == "0") sup = FALSE;
			} else {
				sup = lang.mix({}, sup);
			}
		}
		return sup;
	}


	/*
	 * --END-External Vendor/Client API
	 *
	*/

	(function() {

		var err_info = {}, head_el, err_comment, e;

		if (lang && dom) {
			if (_construction(err_info)) {
				lang.def("ext",
				{
					register:	register,
					expand:		expand,
					collapse:	collapse,
					geom:		geom,
					meta:		meta,
					status:		status,
					supports:	supports,
					cookie: 	cookie,
					message: 	message,
					inViewPercentage: inViewPercentage
				}, sf, TRUE);

				// QUESTION - IS this just leftover?
				// lang.def("Y.SandBox.vendor", sf.vend);
				_render();

			} else {
				try {
					head_el 			= _tags("head")[0];
					err_comment			= dom.make("script");
					err_comment.type	= "text/plain";
					err_comment.text	= "<!-- Construction of SafeFrame failed: " + (err_info.status || "unknown") + " -->";
					_append(head_el, err_comment);
				} catch (e) {  }
			}
		}

	})();

})(window);

