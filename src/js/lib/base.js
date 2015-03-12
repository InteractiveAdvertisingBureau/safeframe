/*
* Copyright (c) 2012, Interactive Advertising Bureau
* All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
"use strict";
/**
 * @fileOverview This file contains the base library functionality need for both the publisher/host and vendor/client sides of the SafeFrames library.  Contains JavaScript language extensions and base level dom reading / manipulation
 * @author <a href="mailto:ssnider@yahoo-inc.com">Sean Snider</a>
 * @version 1.1.0
*/


/**
 * @namespace $sf  Defines the base $sf namespace.  This file should be the 1st file whenever including any SafeFrames js files
 *
*/

/*
 * Whenever you define a top level namespace, you need to put a "var" keyword statement in front of it.
 * This is b/c in Internet Explorer, elements with ID attributes can be treated as global variable. In turn
 * someone could have been dumb and have an element in the page named "$sf".
*/

if (window["$sf"]) {
	try {
		$sf.ver = "1-1-1";
		$sf.specVersion = "1.1";
	} catch (sf_lib_err) {

	}
} else {
	var $sf = { 
		ver: "1-1-1",
		specVersion: "1.1"
	};

};


/**
 * @namespace $sf.lib Defines the helper library functions and clases used througout the SafeFrames implementation
 * @name $sf.lib
 *
*/



/**
 * @namespace $sf.env Defines object / properties / functions that include information about the environment
 * @name $sf.env
 *
*/

/*
 * We always use a common pattern of enclosing our code within an anonymous function wrapper
 * such that we don't create any global variables (other than namespaces).
 *
*/

/** @ignore */
(function(win) {

	/*
	 * Below we have some internal private variables. .
	 * We always define variables at the top of any given function, using comma notation
	 * if at all possible to reduce size.
	 *
	 * Often times here we have representations of values that are constants or constant strings.
	 *
	 * Note that we purposefully use escape / unescape functions rather than encodeURIComponent/decodeURIComponent
	 * The reasons are that we want values that would not be ascii escaped by the newer function to get escaped,
	 * and because escape / unescape are so legacy and ancient that they are actually very very fast.
	 *
	*/

	var q						= "?",
		a						= "&",
		eq						= "=",
		OBJ						= "object",
		FUNC					= "function",
		STR						= "string",
		NUM						= "number",
		RP						= "replace",
		LEN     				= "length",
		DOC						= "document",
		PROTO					= "prototype",
		N     					= (win && win.Number),
		M      					= (win && win.Math),
		d						= (win && win[DOC]),
		nav						= (win && win.navigator),
		ua						= (nav && nav.userAgent) || "",
		TLC						= "toLowerCase",
		GT						= "getAttribute",
		ST						= "setAttribute",
		RM						= "removeAttribute",
		GTE						= "getElementsByTagName",
		DCLDED					= "DOMContentLoaded",
		S						= (win && win.String),
		back_slash				= S.fromCharCode(92),
		two_slashes				= back_slash+back_slash,
		dbl_quote				= S.fromCharCode(34),
		esc_dbl_quote			= back_slash+dbl_quote,
		plus_char				= S.fromCharCode(43),
		scrip_str				= 'scr'+dbl_quote+plus_char+dbl_quote+'ipt',
		BLANK_URL				= "about:blank",
		NODE_TYPE				= "nodeType",
		IFRAME					= "iframe",
		EMPTYSTR				= "",
		APPLY					= "apply",
		GC						= "CollectGarbage",
		ie_attach				= "attachEvent",
		w3c_attach				= "addEventListener",
		ie_detach				= "detachEvent",
		w3c_detach				= "removeEventListener",
		use_attach				= "",
		use_detach				= "",
		use_ie_old_attach		= FALSE,
		IAB_LIB					= "$sf.lib",
		IAB_ENV					= "$sf.env",
		IAB_INF					= "$sf.info",
		IE_GC_INTERVAL			= 3000,
		TRUE					= true,
		FALSE					= false,
		NULL					= null,
		EVT_CNCL_METHODS		=
		{
			"preventDefault": 				0,
			"stopImmediatePropagation":		0,
			"stopPropagation":				0,
			"preventBubble":				0
		},

		NUM_MAX 					= (N && N.MAX_VALUE),
		NUM_MIN 					= (-1 * NUM_MAX),
		_es     					= (win && win.escape),
		_ue     					= (win && win.unescape),
		isIE11 						= !(window.ActiveXObject) && "ActiveXObject" in window,
		isIE						= !isIE11 && (win && ("ActiveXObject" in win)),
		next_id						= 0,
		useOldStyleAttrMethods		= FALSE,
		gc_timer_id					= 0,
		dom_is_ready				= NULL,
		dom_last_known_tag_count	= 0,
		dom_last_known_child_node	= NULL,
		dom_ready_chk_max_tries		= 300,
		dom_ready_chk_try_interval	= 50,
		dom_ready_chk_tries			= 0,
		dom_ready_chk_timer_id		= 0,
		iframe_next_id				= 0,
		iframe_cbs_attached			= {},
		evt_tgt_prop_a				= "",
		evt_tgt_prop_b				= "",
		iframe_msg_host_lib			= NULL,
		cached_ua					= NULL,


		/* private function variable references, we have lang set these private variables so that the dom lib below can access them quickly */

		_cstr, _cnum, _callable,
		lang, dom,
		iframes, logger, info,

		/* public functions that are dynamically defined based on whether IE is being used */

		gc;



	/**
	 * @namespace $sf.lib.lang Defines helper functions / objects for JavaScript common needs, such as type conversion and object serialization
	 * @name $sf.lib.lang
	 *
	*/
	(function() {

		var proto;

		/**
		 * A function reference that does nothing.
		 *
		 * @memberOf $sf.lib.lang
		 * @exports noop as $sf.lib.lang.noop
		 * @static
		 * @function
		 * @public
		 * @return undefined
		 *
		*/
		function noop() {}


		/**
		 * Forces type conversion of any JavaScript variable to a string value.
		 * Note that "falsy" values or values that cannot be converted will be returned
		 * as an empty string ("").
		 *
		 * @memberOf $sf.lib.lang
		 * @exports cstr as $sf.lib.lang.cstr
		 * @static
		 * @public
		 * @function
		 * @param {*} str  Any object that needs to be converted to a string value.
		 * @return {String}  The normalized string value.
		*/

		function cstr(str)
		{
			var typ = typeof str;
			if (typ == STR) return str;
			if (typ == NUM && !str) return "0";
			if (typ == OBJ && str && str.join) return str.join("");
			if (str === false) return 'false';
			if (str === true) return 'true';
			return (str) ? S(str) : "";
		}

		/**
		 * Forces type conversion of any JavaScript variable to a boolean.
		 * "Falsy" values such as "", 0, null, and undefined all return false
		 * String values of  "0", "false", "no", "undefined", "null" also return false
		 *
		 * @memberOf $sf.lib.lang
		 * @exports cbool as $sf.lib.lang.cbool
		 * @static
		 * @public
		 * @function
		 * @param {*} val Any JavaScript reference / value
		 * @return {Boolean} The normalized boolean value
		 *
		*/

		function cbool(val)
		{
			return (!val || val == "0" || val == "false" || val == "no" || val == "undefined" || val == "null") ? FALSE : TRUE;
		}


		/**
		 * Forces type convertion of any JavaScript variable to a number.
		 * Values / objects that cannot be converted, will be returned as NaN, unless
		 * a default value is specified, in which case the default value is used.
		 *
		 * @memberOf $sf.lib.lang
		 * @exports cnum as $sf.lib.lang.cnum
		 * @static
		 * @public
		 * @function
		 * @param {*} val Any JavaScript reference / value
		 * @param {*} [defVal] use this value if original value cannot be converted to a number, or if value is less than min value, or if value is less than max value.
		 * @param {Number} [minVal] specifies the lowest numerical value, if original value is less than this value, the defVal will be returned.
		 * @param {Number} [maxVal] specifies the greatest numerical value, if original value is greater than this value, the defVal will be returned.
		 * @return {Number|NaN|*} the converted value, otherwise NaN or default value
		 *
		*/

		function cnum(val, defVal, minVal, maxVal)
		{
			var e;

			if (typeof val != NUM)  {
				try {
					if (!val) {
						val = N.NaN;
					} else {
						val = parseFloat(val);
					}
				} catch (e) {
					val = N.NaN;
				}
			}

			if (maxVal == NULL)	{ maxVal = NUM_MAX; }
			if (minVal == NULL)	{ minVal = NUM_MIN; }

			return ((isNaN(val) || val < minVal || val > maxVal) && defVal != NULL) ? defVal : val;
		}

		/**
		 * Checks that a function reference can be called safely.  Sometimes function references are part
		 * of objects that may have been garbage collected (such as a function reference from another window or dom element).
		 * This method checks the reference by making sure it has a constructor and toString properties.
		 *
		 * Note that this doesn't mean that the function itself when called (or its subsquent call stack), can't throw an error. . .
		 * simply that you are able to call it. . .
		 *
		 * @memberOf $sf.lib.lang
		 * @exports callable as $sf.lib.lang.callable
		 * @static
		 * @public
		 * @function
		 * @param {Function} A reference to a JavaScript function
		 * @return {Boolean} true if function can be called safely, otherwise false.
		 *
		*/

		function callable(f)
		{
			var e;

			try {
				f = (f && typeof f == FUNC && f.toString() && (new f.constructor())) ? f : NULL;
			} catch (e) {
				f = NULL;
			}
			return !!(f);
		}

		/**
		 * Generate a unique id string
		 *
		 * @memberOf $sf.lib.lang
		 * @exports guid as $sf.lib.lang.guid
		 * @static
		 * @public
		 * @function
		 * @param {String} [prefix] a substring to use a prefix
		 * @return {String} unique id string
		 *
		*/

		function guid(prefix)
		{
			return cstr([prefix||"","_",time(),"_",rand(),"_",next_id++]);
		}


		/**
		 * Mixed the properties of one object into another object.
		 * Note that this function is recursive
		 *
		 * @memberOf $sf.lib.lang
		 * @exports mix as $sf.lib.lang.mix
		 * @static
		 * @public
		 * @function
		 * @param {Object}  r  The object that will receive properties
		 * @param {Object}  s  The object that will deliever properties
		 * @param {Boolean} [owned] Whether or not to skip over properties that are part of the object prototype
		 * @param {Boolean} [skipFuncs] Whether or not to skip over function references
		 * @param {Boolean} [no_ovr] Whether or not to overwrite properties that may have already been filled out
		 * @return {Object} The receiver object passed in with potentially new properties added
		 *
		*/

		function mix(r, s, owned, skipFuncs,no_ovr)
		{
			var item, p,typ;

			if (!s || !r) return r;

			for (p in s)
			{
				item = s[p];
				typ  = typeof item;
				if (owned && !s.hasOwnProperty(p)) continue;
				if (no_ovr && (p in r)) continue;
				if (skipFuncs && typ == FUNC) continue;
				if (typ == OBJ && item) {
					if (item.slice) {
						item = mix([],item);
					} else {
						item = mix({},item);
					}
				}
				r[p] = item;
			}
			return r;
		}

		/**
		 * Return the current time in milliseconds, from the epoch
		 *
		 * @memberOf $sf.lib.lang
		 * @exports time as $sf.lib.lang.time
		 * @public
		 * @function
		 * @static
		 * @return {Number} current time
		 *
		*/

		function time() { return (new Date()).getTime(); }


		/**
		 * Return a random integer anywhere from 0 to 99
		 *
		 * @memberOf $sf.lib.lang
		 * @exports rand as $sf.lib.lang.rand
		 * @public
		 * @static
		 * @function
		 * @return {Number} random number
		 *
		*/

		function rand() { return M.round(M.random()*100); }


		/**
		 * Trim the begining and ending whitespace from a string.
		 * Note that this function will convert an argument to a string first
		 * for type safety purposes. If string cannot be converted, and empty string is returned
		 *
		 * @memberOf $sf.lib.lang
		 * @exports trim as $sf.lib.lang.trim
		 * @return {String} trimmed string
		 * @public
		 * @function
		 * @static
		 *
		*/

		function trim(str)
		{
			var ret = cstr(str);

			return (ret && ret[RP](/^\s\s*/, '')[RP](/\s\s*$/, ''));
		};

		/**
		 * Define a JavaScript Namespace within a given context
		 *
		 * @memberOf $sf.lib.lang
		 * @exports def as $sf.lib.lang.def
		 * @param {String} str_ns  The name of the namespace in dot notation as a string (e.g. "Foo.bar")
		 * @param {Object} [aug] defines the object at the end of the namespace.  If namespace is already specified, and this object is provided, the namespace will be augmented with properties from this object. If nothing is passed in, defaults to using an empty object.
		 * @param {Object} [root] the root object from which the namespace is defined.  If not passed in defaults to the global/window object
		 * @param {Boolean} [no_ovr] if true, properties already defined on root with the same name will be ignored
		 * @public
		 * @function
		 * @static
		 * @return {Object} The object at the end of the namespace
		 *
		*/

		function def(str_ns, aug, root,no_ovr)
		{
			var obj = (root && typeof root == OBJ) ? root : win,
				idx = 0,
				per = ".",
				ret = NULL,
				ar, item;

			if (str_ns) {
				str_ns 	= cstr(str_ns);
				aug 	= (aug && typeof aug == OBJ)  ? aug : NULL;
				if (str_ns.indexOf(per)) {
					ar = str_ns.split(per);
					while (item = ar[idx++])
					{
						item 		= trim(item);
						if (idx == ar[LEN]) {
							if (obj[item] && aug) {
								ret = obj[item] = mix(obj[item],aug,FALSE,NULL,no_ovr);
							} else {
								if (no_ovr && (item in obj)) {
									ret = obj[item];
								} else {
									ret = obj[item]	= obj[item] || aug || {};
								}
							}
						} else {
							if (no_ovr && (item in obj)) {
								ret = obj[item];
							} else {
								ret = obj[item]	= obj[item] || {};
							}
						}
						obj = obj[item];
					}
				} else {
					if (obj[str_ns] && aug) {
						ret = obj[str_ns] = mix(obj[str_ns], aug,FALSE,NULL,no_ovr);
					} else {
						ret = obj[str_ns] = obj[str_ns] || aug || {};
					}
				}
			}
			return ret;
		}

		/**
		 * Checks for the existence of a JavaScript namespace
		 * as opposed to def, which will automatically define the namespace
		 * with a given context.
		 *
		 * @memberOf $sf.lib.lang
		 * @exports ns as $sf.lib.lang.ns
		 * @param {String} str_ns  A string with . or [] notation of a JavaScript namesace (e.g. "foo.bar.show", or "foo['bar']['show']").
		 * @param {Object} [root] the root object to check within. .defaults to global / window
		 * @return {*} The endpoint reference of the namespace or false if not found
		 * @public
		 * @function
		 * @static
		 *
		*/

		function ns(str_ns, root)
		{
			var exp 	= /(\[(.{1,})\])|(\.\w+)/gm,
				exp2 	= /\[(('|")?)((\s|.)*?)(('|")?)\]/gm,
				exp3 	= /(\[.*)|(\..*)/g,
				exp4 	= /\./gm,
				idx 	= 0,
				rootStr	= "",
				exists	= TRUE,
				obj, matches, prop;


			obj = root = root || win;

			if (str_ns) {
				str_ns = cstr(str_ns);
				if (str_ns) {
					str_ns	= trim(str_ns);
					matches	= str_ns.match(exp);
					if (matches) {
						rootStr	= str_ns[RP](exp3, "");
						matches.unshift(rootStr);
						while (prop = matches[idx++])
						{
							prop = prop[RP](exp2, "$3")[RP](exp4, "");
							if (!obj[prop]) {
								exists = FALSE;
								break;
							}
							obj 	= obj[prop];
						}
					} else {
						prop = str_ns;
						obj	 = obj[prop];
					}
				} else {
					exists = FALSE;
				}
			} else {
				exists = FALSE;
			}
			return (exists && obj) || FALSE;
		}


		/**
		 * @function
		 * Tests to see if the object passed in is an array
		 *
		*/
		function isArray(obj){
			if(obj == null){
				return false;
			}
			if(typeof obj === "string"){
				return false;
			}
			if(obj[LEN] != null && obj.constructor == Array){
				return true;
			}
			return false;
		}

		/**
		 * Returns an escaped backslash for processing strings with HTML or JavaScript content
		 *
		 * @name $sf.lib.lang-_escaped_backslash
		 * @function
		 * @static
		 * @private
		 *
		*/

		function _escaped_backslash() { return two_slashes; }

		/**
		 * Returns an escaped double-quote for processing strings with HTML or JavaScript content
		 *
		 * @name $sf.lib.lang-_escaped_dbl_quote
		 * @function
		 * @static
		 * @private
		 *
		*/

		function _escaped_dbl_quote() { return esc_dbl_quote; }

		/**
		 * Returns an escaped return character for processing strings with HTML or JavaScript content
		 *
		 * @name $sf.lib.lang-_escaped_return
		 * @function
		 * @static
		 * @private
		 *
		*/

		function _escaped_return()  { return "\\r"; }

		/**
		 * Returns an escaped new line character for processing strings with HTML or JavaScript content
		 *
		 * @name $sf.lib.lang-_escaped_new_line
		 * @function
		 * @static
		 * @private
		 *
		*/

		function _escaped_new_line()  { return "\\n"; }


		/**
		 * Returns a seperated SCRIPT tag ("<script>" becomes "<scr"+"ipt>") for processing strings with HTML or JavaScript content
		 * Assumes a regular expression of: /<(\/)*script([^>]*)>/gi
		 *
		 * @name $sf.lib.lang-_escaped_new_line
		 * @function
		 * @static
		 * @private

		 *
		*/

		function _safe_script_tag(main_match, back_slash, attrs)	  { return cstr(["<",back_slash,scrip_str,attrs,">"]); }

		/**
		 * Given a string of HTML escape quote marks and seperate script tags so that browsers don't get tripped up
		 * during processing.
		 *
		 * @memberOf $sf.lib.lang
		 * @exports jssafe_html as $sf.lib.lang.jssafe_html
		 * @param {String} str A string of HTML markup to be processed
		 * @return {String}
		 * @function
		 * @static
		 * @public
		 *
		*/

		function jssafe_html(str)
		{
			var new_str	= cstr(str);
			if (new_str) {
				new_str = new_str.replace(/(<noscript[^>]*>)(\s*?|.*?)(<\/noscript>)/gim, "");
				new_str	= new_str.replace(/\\/g, _escaped_backslash);
				new_str	= new_str.replace(/\"/g, _escaped_dbl_quote);
				new_str = new_str.replace(/\n/g, _escaped_new_line);
				new_str	= new_str.replace(/\r/g, _escaped_return);
				new_str	= new_str.replace(/<(\/)*script([^>]*)>/gi, _safe_script_tag);
				new_str	= new_str.replace(/\t/gi, ' ' );
				new_str	= cstr([dbl_quote,new_str,dbl_quote]);
				new_str	= dbl_quote + new_str + dbl_quote;
			}
			return new_str;
		}

	function es(str) { return escape(str); }
	function ues(str) { return unescape(str); }
	
	/**
	 * Calls indexOf method on strings, mainly used to save space during
	 * compression
	 *
	 * @name _indexOf
	 * @function
	 * @private
	 * @ignore
	 * @param {String} haystack the string to search
	 * @param {String} needle the substring being looked for
	 * @param {Boolean} useLast Whether or not to search from the end instead of the begining
	 * @return {Number} the index of the substring in the given string or -1 if not found
	 *
	*/

	function _indexOf(haystack, needle, useLast)
	{
		return (useLast) ? haystack.lastIndexOf(needle) : haystack.indexOf(needle);
	}


	/**
	 * Intantiable class used to convert a delimited string into an object.<br />
	 * For example querystrings: "name_1=value_1&name_2=value_2" ==> {name_1:value_1,name_2:value_2};<br/>
	 *
	 * Note that unescaped property values
	 * that are added into this object, that also contain the same sPropDelim and sValueDelim strings will be recursively
	 * converted into their own ParamHash objects.  Therefore if you do not want this recursion to occur, you must make sure
	 * that the values are encoded/escaped properly.
	 *
	 * This class is required for nearly all SafeFrame classes to work properly.<br /><br />
	 *
	 * @class
	 * @name ParamHash
	 * @memberOf sf.lib.lang
	 * @param {String} sString  The delimited string to be converted
	 * @param {String} sPropDelim  The substring delimiter used to seperate properties. Default is "&".
	 * @param {String} sValueDelim  The substring delimited used to seperate values.  Default is "=".
	 * @param {Boolean} bNoOverwrite  If true, when a name is encountered more than 1 time in the string it will be ignored.
	 * @param {Boolean} bRecurse  If true, when a value of a property that is parsed also has both the sPropDelim
	 *                            and sValueDelim inside, convert that value to another ParamHash object automatically
	 */
	function ParamHash(sString, sPropDelim, sValueDelim, bNoOverwrite, bRecurse)
	{
		var idx, idx2, idx3, sTemp, sTemp2, sTemp3, me = this, pairs, nv, nm, added, cnt, doAdd = FALSE, obj, len, len2;

		if (!(me instanceof ParamHash)) return new ParamHash(sString, sPropDelim, sValueDelim, bNoOverwrite,bRecurse);
		if (!arguments[LEN]) return me;

		if (sString && typeof sString == OBJ) return mix(new ParamHash(EMPTYSTR,sPropDelim,sValueDelim,bNoOverwrite,bRecurse),sString);

		sString 	= cstr(sString);
		sPropDelim	= cstr(sPropDelim) || a;
		sValueDelim	= cstr(sValueDelim) || eq;

		if (!sString) return me;
		if (sPropDelim != q && sValueDelim != q && sString.charAt(0) == q) sString = sString.substring(1);

		if (sString.charAt(0) == sPropDelim) sString = sString.substring(1);

		pairs = sString.split(sPropDelim);
		cnt   = pairs[LEN];
		idx   = 0;
		while (cnt--)
		{
			sTemp	= pairs[idx++];
			added	= FALSE;
			doAdd	= FALSE;
			if (sTemp) {
				nv	= sTemp.split(sValueDelim);
				len	= nv[LEN];
				if (len > 2) {
					nm		= ues(nv[0]);
					nv.shift();

					if (bRecurse) {
						/* Its possible that someone screws up and doesn't have a value encoded properly and but have multiple delimiters
						 * As if recursion was going to take place. So here we know that's the case and try to handle it if we can detect
						 * the end points as well
						*/

						sTemp2	= nm+sValueDelim;
						idx2	= _indexOf(sString,sTemp2);
						len		= sTemp2[LEN];
						sTemp3	= sString.substring(idx2+len);
						sTemp2	= sPropDelim+sPropDelim;
						len2	= sTemp2[LEN];
						idx3	= _indexOf(sTemp3,sTemp2);
						if (idx3 != -1) {
							sTemp3 = sString.substr(idx2+len, idx3+len2);
							obj	   = new ParamHash(sTemp3, sPropDelim, sValueDelim, bNoOverwrite, bRecurse);
							sTemp3 = EMPTYSTR;
							len	   = 0;
							for (sTemp3 in obj) len++;

							if (len > 0) idx += (len-1);
							sTemp = obj;
						} else {
							sTemp  = ues(nv.join(sValueDelim));
						}

					} else {
						sTemp	= ues(nv.join(sValueDelim));
					}
					doAdd	= TRUE;
				} else if (len == 2) {
					nm		= ues(nv[0]);
					sTemp	= ues(nv[1]);
					doAdd	= TRUE;
				}
				if (doAdd) {
					if (bNoOverwrite) {
						if (!(nm in me)) {
							me[nm] = sTemp
							added	 = TRUE;
						};
					} else {
						me[nm]	= sTemp;
						added		= TRUE;
					};
					if (bRecurse && added && nm && sTemp && typeof sTemp != OBJ && (_indexOf(sTemp,sPropDelim) >= 0 || _indexOf(sTemp,sValueDelim) >= 0)) {
						me[nm] = new ParamHash(sTemp, sPropDelim, sValueDelim, bNoOverwrite, bRecurse);
					}
				}
			}
		};
	}

	proto = ParamHash[PROTO];

	/** @ignore */
	function _param_hash_tostring(sPropDelim, sValueDelim, escapeProp, dontEscapeValue)
	{
		var prop, buffer = [], me = this, itemType, item;

		sPropDelim 	= sPropDelim || a;
		sValueDelim	= sValueDelim || eq;

		for (prop in me)
		{
			item		= me[prop];
			itemType	= typeof item;

			if (item && itemType == FUNC) continue;
			if (item && itemType == OBJ) {
				if (item.tagName || item.nodeType) {
					item = "#node";
				} else {
					item = _param_hash_tostring[APPLY](item, [sPropDelim,sValueDelim,escapeProp,dontEscapeValue]);
				}
			}
			if (escapeProp) prop = es(prop);
			if (!dontEscapeValue) item = es(item);

			buffer.push(prop, sValueDelim, item, sPropDelim);
		}
		if (buffer[LEN]) buffer[buffer[LEN]-1] = "";
		return cstr(buffer);
	}

	/**
	 * Converts a ParamHash object back into a string using the property and value delimiters specifed (defaults to "&" and "=").
	 * Again this method works recursively.  If an object is found as a property, it will convert that object into a ParamHash string
	 * and then escape it. Note also that this class's valueOf method is equal to this method.
	 *
	 * @name toString
	 * @memberOf lang.ParamHash
	 * @function
	 * @param {String} sPropDelim  The substring delimiter used to seperate properties. Default is "&".
	 * @param {String} sValueDelim  The substring delimited used to seperate values.  Default is "=".
	 * @return {String} the encoded string representation of the object.
	 *
	*/
	proto.toString = proto.valueOf = _param_hash_tostring;


		lang = def(IAB_LIB + ".lang",
		{
			ParamHash:		ParamHash,
			cstr:			cstr,
			cnum:			cnum,
			cbool:			cbool,
			noop:			noop,
			trim:			trim,
			callable:		callable,
			guid:			guid,
			mix:			mix,
			time:			time,
			rand:			rand,
			def:			def,
			ns:				ns,
			jssafe_html: 	jssafe_html,
			isArray:		isArray
		});


		/**
		 * Whether or not we are running within an Internet Explorer browser environment
		 *
		 * @name $sf.env.isIE
		 * @type {Boolean}
		 * @static
		 * @public
		 *
		*/

		def("$sf.env", {isIE: isIE} );

		_cstr 		= cstr;
		_cnum 		= cnum;
		_callable	= callable;

	})();

	/**
	 * @namespace $sf.env.ua  Stores browser / user-agent information
	 * @name $sf.env.ua
	 * @requires $sf.lib.lang
	 *
	*/

	(function() {

		/**
		 * Convert a version string into a numeric value
		 *
		 * @name $sf.env.ua-_numberify
		 * @static
		 * @private
		 * @function
		 * @param {String} s The string representing a version number (e.g. 'major.minor.revision')
		 * @returns {Number}
		 *
		*/

		function _numberify(s)
		{
			 var c = 0;

			 return parseFloat(s.replace(/\./g, function()
			 {
			 	return (c++ == 1) ? "" : ".";
			 }));
		}

		/**
		 * Wrapper method for returning values from a regular expression match safely.
		 *
		 * @name $sf.env.ua-_matchIt
		 * @static
		 * @private
		 * @function
		 * @param {String} str The string to match against
		 * @param {RegExp} regEx The regular expression to use for matching
		 * @param {Number} [idx] The index number of a match to pull from
		 * @returns {String}
		 *
		*/

		function _matchIt(str, regEx, idx)
		{
			var m = str && str.match(regEx);

			return (idx == NULL) ? m : ((m && m[idx]) || NULL);
		}

		/**
		 * Wrapper method for testing a string against a regular expression
		 *
		 * @name $sf.env.ua-_testIt
		 * @static
		 * @private
		 * @function
		 * @param {RegExp} regEx The regular expression to test with
		 * @param {String} str The string to test against
		 * @param {Boolean}
		 *
		*/

		function _testIt(regEx,str)
		{
			return regEx.test(str);
		}


		/**
		 * Parse a user-agent string from the browser and gather pertinent browser, and OS information
		 *
		 * @name $sf.env.ua.parse
		 * @static
		 * @public
		 * @function
		 * @param {String} [subUA] An alternate user-agent string to parse. If no valid string is passed in, function will return an object based on the known user-agent
		 * @returns {Object} <b>parsed</b> Browser and OS information<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.ie  The major version number of the Internet Explorer browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.opera The major version number of the Opera browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.gecko The major version number of the Gecko (Firefox) browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.webkit The major version number of the WebKit browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.safari The major version number of the Safari browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.chrome The major version number of the Chrome browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.air The major version number of the AIR SDK being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.ipod Whether or not an iPod device is being used 1 for true, 0 for false.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.ipad Whether or not an iPad device is being used 1 for true, 0 for false.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.iphone Whether or not an iPhone device is being used 1 for true, 0 for false.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.android The major version number of the Android OS being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.webos The major version number of the WebOS being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.silk The major version number of the Silk browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.nodejs The major version number of the NodeJS environment being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.phantomjs The major version number of the PhantomJS environment being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {String} <b>parsed</b>.mobile A string representing whether or not the browser / os is a mobile device  and it's type. Possible values are 'windows', 'android', 'symbos', 'linux', 'macintosh', 'rhino', 'gecko', 'Apple', 'chrome'.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.ios The major version number of the iOS being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Boolean} <b>parsed</b>.accel Whether or not the browser / environment in question is hardware accelerated.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @returns {Number} <b>parsed</b>.cajaVersion The major version number of the CAJA environment or 0 if not.
		 *
		*/

		function parse_ua(subUA)
		{
	     	var ret = {}, match, date = new Date();

			if (!subUA && cached_ua) return cached_ua;

			ret.ie		 =
			ret.opera	 =
			ret.gecko 	 =
			ret.webkit	 =
			ret.safari	 =
			ret.chrome	 =
			ret.air		 =
			ret.ipod	 =
			ret.ipad	 =
			ret.iphone	 =
			ret.android  =
			ret.webos	 =
			ret.silk 	 =
			ret.nodejs	 =
			ret.phantomjs = 0;

			ret.mobile	=
			ret.ios		=
			ret.os		= NULL;
			ret.accel 	= false;

			ret.caja	= nav && nav.cajaVersion;
			ret.cks		= FALSE;
			subUA		= subUA || ua || "";

			if (subUA) {
		        if (_testIt(/windows|win32/i,subUA)) {
		            ret.os = 'windows';
		        } else if (_testIt(/macintosh|mac_powerpc/i,subUA)) {
		            ret.os = 'macintosh';
		        } else if (_testIt(/android/i,subUA)) {
		        	ret.os = 'android';
		        } else if (_testIt(/symbos/i, subUA)) {
		        	ret.os = 'symbos'
		        } else if (_testIt(/linux/i, subUA)) {
		        	ret.os = 'linux';
		        } else if (_testIt(/rhino/i,subUA)) {
		            ret.os = 'rhino';
		        }

		        // Modern KHTML browsers should qualify as Safari X-Grade
		        if (_testIt(/KHTML/,subUA)) {
		            ret.webkit = 1;
		        }

		        if (_testIt(/IEMobile|XBLWP7/, subUA)) {
	            	ret.mobile = 'windows';
	        	}
			    if (_testIt(/Fennec/, subUA)) {
					ret.mobile = 'gecko';
				}

		        // Modern WebKit browsers are at least X-Grade
		        match = _matchIt(subUA, /AppleWebKit\/([^\s]*)/, 1);
				if (match) {
		            ret.webkit = _numberify(match);
		            ret.safari = ret.webkit;

		            if (_testIt(/PhantomJS/, subUA)) {
	                	match = _matchIt(subUA, /PhantomJS\/([^\s]*)/, 1);
	                	if (match) {
	                    	ret.phantomjs = _numberify(match);
	                	}
	            	}

		            // Mobile browser check
		            if (_testIt(/ Mobile\//,subUA) || _testIt(/iPad|iPod|iPhone/, subUA)) {
		                ret.mobile = 'Apple'; // iPhone or iPod Touch

		                match 		= _matchIt(subUA, /OS ([^\s]*)/, 1);
		                match 		= match && _numberify(match.replace('_', '.'));
		                ret.ios 	= match;
		                ret.ipad 	= ret.ipod = ret.iphone = 0;

		                match 		= _matchIt(subUA,/iPad|iPod|iPhone/,0);
		                if (match) {
		                	ret[match[TLC]()] = ret.ios;
		                }

		            } else {
		            	match	= _matchIt(subUA, /NokiaN[^\/]*|Android \d\.\d|webOS\/\d\.\d/, 0);
		                if (match) {
		                    // Nokia N-series, Android, webOS, ex: NokiaN95
		                    ret.mobile = match;
		                }
		                if (_testIt(/webOS/,subUA)) {
		                    ret.mobile 	= 'WebOS';
		                    match 		= _matchIt(subUA, /webOS\/([^\s]*);/, 1);
		                    if (match) {
		                        ret.webos = _numberify(match);
		                    }
		                }
		                if (_testIt(/ Android/,subUA)) {
		                    ret.mobile 	= 'Android';
		                    match 		= _matchIt(subUA, /Android ([^\s]*);/, 1);
		                    if (match) {
		                        ret.android = _numberify(match);
		                    }
		                }

		                if (_testIt(/Silk/, subUA)) {
		                    match = _matchIt(subUA, /Silk\/([^\s]*)\)/, 1);
		                    if (match) {
		                        ret.silk = _numberify(match);
		                    }
		                    if (!ret.android) {
		                        ret.android = 2.34; //Hack for desktop mode in Kindle
		                        ret.os = 'Android';
		                    }
		                    if (_testIt(/Accelerated=true/, subUA)) {
		                        ret.accel = true;
		                    }
		                }
		            }

		            match = subUA.match(/(Chrome|CrMo)\/([^\s]*)/);
		            if (match && match[1] && match[2]) {
		                ret.chrome = _numberify(match[2]); // Chrome
		                ret.safari = 0; //Reset safari back to 0
		                if (match[1] === 'CrMo') {
		                    ret.mobile = 'chrome';
		                }
		            } else {
		                match = _matchIt(subUA,/AdobeAIR\/([^\s]*)/);
		                if (match) {
		                    ret.air = match[0]; // Adobe AIR 1.0 or better
		                }
		            }

		        }

		        if (!ret.webkit) {
		            match = _matchIt(subUA, /Opera[\s\/]([^\s]*)/, 1);
	            	if (match) {
	            		ret.opera	= _numberify(match);
	            		match		= _matchIt(subUA, /Opera Mini[^;]*/, 0);
	                	if (match) {
	                    	ret.mobile = match; // ex: Opera Mini/2.0.4509/1316
	                	}
		            } else { // not opera or webkit
	    				match = _matchIt(subUA, /MSIE\s([^;]*)/, 1);
	                	if (match) {
		                    ret.ie = _numberify(match);
						} else { // not opera, webkit, or ie
	                    	match = _matchIt(subUA, /Gecko\/([^\s]*)/);

		                    if (match) {
	    	                    ret.gecko = 1; // Gecko detected, look for revision

	                        	match	= _matchIt(subUA, /rv:([^\s\)]*)/, 1);
	                        	if (match) {
	                        		ret.gecko = _numberify(match);
	                        	}
	                        }
	                    }
	                }
	            }
	        }

	        try {
        		date.setTime(date.getTime() + 1000);
        		d.cookie = cstr(["sf_ck_tst=test; expires=", date.toGMTString(), "; path=/"]);
        		if (d.cookie.indexOf("sf_ck_tst") != -1) ret.cks = TRUE;
	        } catch (e) {
	        	ret.cks = FALSE;
	        }

			try {
		        if (typeof process == OBJ) {

		            if (process.versions && process.versions.node) {
		                //NodeJS
		                ret.os = process.platform;
		                ret.nodejs = numberify(process.versions.node);
		            }
		        }
			} catch (e) {
				ret.nodejs = 0;
			}

			return ret;
	    }

	    /**
		 * The major version number of the Internet Explorer browser being used, or 0 if not.
		 *
		 * @name $sf.env.ua.ie
		 * @type {Number}
		 * @public
		 * @static
		 *
		*/

		/**
		 * The major version number of the Opera browser being used, or 0 if not.<br />&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
		 * @name $sf.env.ua.opera
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the Gecko (Firefox) browser being used, or 0 if not.
		 * @name $sf.env.ua.gecko
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the WebKit browser being used, or 0 if not.
		 * @name $sf.env.ua.webkit
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the Safari browser being used, or 0 if not.
		 * @name $sf.env.ua.safari
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the Chrome browser being used, or 0 if not.
		 * @name $sf.env.ua.chrome
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the AIR SDK being used, or 0 if not.
		 * @name $sf.env.ua.air
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * Whether or not an iPod device is being used, 0 for false, &gt; 0 == true
		 * @name $sf.env.ua.ipod
		 * @type {Number}
		 * @public
		 * @static
		 *
		*/

		/**
		 * Whether or not an iPad device is being used, 0 for false, &gt; 0 == true
		 * @name $sf.env.ua.ipad
		 * @type {Number}
		 * @public
		 * @static
		 *
		*/

		/**
		 * Whether or not an iPhone device is being used, 0 for false, &gt; 0 == true
		 * @name $sf.env.ua.iphone
		 * @type {Number}
		 * @public
		 * @static
		 *
		*/

		/**
		 * The major version number of the Android OS being used, or 0 if not.
		 * @name $sf.env.ua.android
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the WebOS being used, or 0 if not.
		 * @name $sf.env.ua.webos
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the Silk browser being used, or 0 if not.
		 * @name $sf.env.ua.silk
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the NodeJS environment being used, or 0 if not.
		 * @name $sf.env.ua.nodejs
		 * @type {Number}
		 * @public
		 * @static
		*/


		/**
		 * The major version number of the PhantomJS environment being used, or 0 if not.
		 * @name $sf.env.ua.phantomjs
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * A string representing whether or not the browser / os is a mobile device  and it's type. Possible values are 'windows', 'android', 'symbos', 'linux', 'macintosh', 'rhino', 'gecko', 'Apple', 'chrome'.
		 *
		 * @name $sf.env.ua.mobile
		 * @type {String}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the iOS being used, or 0 if not.
		 * @name $sf.env.ua.ios
		 * @type {Number}
		 * @public
		 * @static
		*/

		/**
		 * Whether or not the browser / environment in question is hardware accelerated.
		 * @name $sf.env.ua.accel
		 * @type {Boolean}
		 * @public
		 * @static
		*/

		/**
		 * The major version number of the CAJA environment or 0 if not
		 * @name $sf.env.ua.cajaVersion
		 * @type {Number}
		 * @public
		 * @static
		*/

    	cached_ua			= parse_ua();
    	cached_ua.parse		= parse_ua;
    	lang.def(IAB_ENV + ".ua", cached_ua, NULL, TRUE);


	})();


	/**
	 * @namespace $sf.lib.dom Defines helper functions / objects for common browser web-page / DOM interactions
	 * @name $sf.lib.dom
	 * @requires $sf.lib.lang
	 *
	*/

	(function() {

		/**
		 * Clear out the timer function used as a fallback when ready state of the DOM
		 * cannot be directly detected
		 *
		 * @name $sf.lib.dom-_clear_ready_timer_check
		 * @private
		 * @static
		 * @function
		 *
		*/

	   	function _clear_ready_timer_check()
	   	{
	   		if (dom_ready_chk_timer_id) {
				clearTimeout(dom_ready_chk_timer_id);
				dom_ready_chk_timer_id = 0;
			}
		}


		function _handle_dom_load_evt(evt)
		{
			detach(win, "load", _handle_dom_load_evt);
			detach(win, DCLDED, _handle_dom_load_evt);
			dom_is_ready = TRUE;
		}

	   	/**
	   	 * Checks to see if the DOM is ready to be manipulated, without the need for event hooking.
	   	 * Often times you'll see folks use the onload event or DOMContentLoaded event.  However
	   	 * the problem with those, is that your JavaScript code may have been loaded asynchronously,
	   	 * after either one of those events have fired, and in which case you still don't know if the DOM is really
	   	 * ready.  Most modern browsers (including IE), implement a document.readyState property that we can
	   	 * check, but not all.  In the case where this property is not implemented, we do a series of node
	   	 * checks and tag counts via timers.  Of course this means that on the very 1st call, we will always
	   	 * appear to be not ready eventhough the DOM itself may be in a ready state, but our timeout interval
	   	 * is small enough that this is OK.
	   	 *
	   	 * @name $sf.lib.dom-_ready_state_check
	   	 * @private
	   	 * @static
	   	 * @function
	   	 *
	   	*/

		function _ready_state_check()
		{
			var b, kids, tag_cnt, lst, e;

			_clear_ready_timer_check();

			if (dom_ready_chk_tries >= dom_ready_chk_max_tries) {
				dom_last_known_child_node	= NULL;
				dom_is_ready 				= TRUE;
			}
			if (dom_is_ready === NULL) {
				try {
					b 				= (d && d.body);
					kids			= (b && tags("*",b));
					tag_cnt			= (kids && kids[LEN]);
					lst				= (b && b.lastChild);
				} catch (e) {
					dom_last_known_tag_count 	= 0;
					dom_last_known_child_node	= NULL;
				}

				if (dom_last_known_tag_count && tag_cnt == dom_last_known_tag_count && lst == dom_last_known_child_node) {
					dom_last_known_child_node 	= NULL;
					dom_is_ready 				= TRUE;
				} else {
					dom_last_known_tag_count 	= tag_cnt;
					dom_last_known_child_node	= lst;
					dom_ready_chk_tries		   += 1;
					dom_ready_chk_timer_id		= setTimeout(_ready_state_check, dom_ready_chk_try_interval);
				}
			} else {
				dom_last_known_child_node 	= NULL;
			}
		}

		/**
		 * Detach onload handlers on iframes that we have created
		 *
		 * @name $sf.lib.dom.iframes-_unbind_iframe_onload
		 * @private
		 * @static
		 * @function
		 * @param {HTMLElement} el the iframe element to unbind from
		 *
		*/

		function _unbind_iframe_onload(el)
		{
			var id = attr(el,"id"), oldCB;

			oldCB = (id && iframe_cbs_attached[id]);
			if (oldCB) {
				detach(el, "load", oldCB);
				iframe_cbs_attached[id] = NULL;
				delete iframe_cbs_attached[id];
			}
		}

		/**
		 * A default onload event handler for IFrames. We don't
		 * want to attach to onload events for IFrames via attributes
		 * b/c we don't want others to see what handlers are there.
		 * In turn we also make sure the "this" reference for the outside
		 * handle gets set properly, and it allows us to make sure
		 * that unbinding of the event handler also gets handled always
		 * so as not to create memory leak issues.
		 *
		 * @name $sf.lib.dom.iframes-_bind_iframe_onload
		 * @private
		 * @static
		 * @function
		 * @param {HTMLElement} el the iframe element to bind too
		 * @param {Function} cb The onload handler from the outside
		 *
		*/

		function _bind_iframe_onload(el, cb)
		{
			var newCB, id;

			if (_callable(cb)) {

				/** @ignore */
				newCB = function(evt)
				{
					var tgt = evtTgt(evt), e;

					_unbind_iframe_onload(tgt);

					if (tgt && cb) {
						try {
							cb.call(tgt, evt);
						} catch (e) { }
					}

					tgt = el = cb = newCB = id = NULL;
				};

				id = attr(el,"id");
				_unbind_iframe_onload(el);

				if (id) iframe_cbs_attached[id]	= newCB;
				attach(el, "load", newCB);
			}

			newCB = NULL;
		}

		/**
		 * Return the element reference passed in, and if its a string value passed
		 * in use that to lookup the element by id attribute.
		 *
		 * @name $sf.lib.dom-_byID
		 * @private
		 * @static
		 * @function
		 * @param {HTMLElement|String} el  the element id / element reference
		 * @return {HTMLElement|el}
		 *
		*/

		function _byID(el)
		{
			return (el && typeof el == STR) ? elt(el) || el : el;
		}

		/**
		 * A proxy wrapper for calling into the cross-domain messaging host library
		 *
		 * @name $sf.lib.dom.iframes-_call_xmsg_host
		 * @private
		 * @static
		 * @function
		 * @param {String} methName The method name in the msg host library to call
		 * @param {*} arg1 An arbitrary argument to pass to said method as the 1st arg
		 * @param {*} arg2 An arbitrary argument to pass to said method as the 2nd arg
		 * @param {*} arg3 An arbitrary argument to pass to said method as the 3rd arg
		 * @return {*} whatever comes back from the method
		 *
		*/

		function _call_xmsg_host(methName, arg1, arg2, arg3)
		{
			var e;
			try {
				if (!iframe_msg_host_lib) iframe_msg_host_lib = dom.msghost;
			} catch (e) {
				iframe_msg_host_lib = NULL;
			}

			if (win != top) return;

			return methName && iframe_msg_host_lib && iframe_msg_host_lib[methName] && iframe_msg_host_lib[methName](arg1,arg2,arg3);
		}


		/**
		 * Retrieve a document for a given HTML Element
		 *
		 * @memberOf $sf.lib.dom
		 * @exports doc as $sf.lib.dom.doc
		 * @static
		 * @public
		 * @function
		 * @param {HTMLElement} el the HTML element for which you wish to find it's parent document
		 * @return {Document|null} null if nothing found
		 *
		*/

		function doc(el)
		{
			var d = NULL;
			try {
				if (el) {
					if (el[NODE_TYPE] == 9) {
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
		 * Retrieve the host window object for a given HTML Element/document. Note that this is NOT the same as $sf.lib.dom.iframes.view, which
		 * returns the window reference INSIDE the IFRAME element.
		 *
		 * @memberOf $sf.lib.dom
		 * @exports view as $sf.lib.dom.view
		 * @public
		 * @static
		 * @function
		 * @param {HTMLElement|HTMLDocument} el the HTML element/document for which you wish to find it's parent window
		 * @return {Document|null} null if nothing found
		 *
		*/

		function view(el)
		{
			var w = NULL, d, prop1 = "parentWindow", prop2 = "defaultView";

			try {
				if (el) {
					w = el[prop1] || el[prop2] || NULL;
					if (!w) {
						d = doc(el);
						w = (d && (d[prop1] || d[prop2])) || NULL;
					}
				}
			} catch (e) {
				w = NULL;
			}
			return w;
		}


		/**
		 * Retrieve an element by its ID. . basically a short hand wrapper around document.getElementById.
		 *
		 * @memberOf $sf.lib.dom
		 * @exports elt as $sf.lib.dom.elt
		 * @public
		 * @static
		 * @function
		 * @param {String} id (Required) the id of the HTML element to find
		 * @param {HTMLElement|HTMLWindow|HTMLDocument} [par] The parent element,document,window to look for the given element
		 * @return {HTMLElement|null} null if nothing found
		*/

		function elt (id)
		{
			var args = arguments, len = args[LEN], dc;
			if (len > 1) {
				dc = doc(args[1]);
			} else {
				dc = d;
			}
			return (dc && dc.getElementById(id)) || NULL;
		}

		/**
		 * A wrapper around retrieving the tagName of an HTML element (normalizes values to lower case strings).
		 *
		 * @memberOf $sf.lib.dom
		 * @exports tagName as $sf.lib.dom.tagName
		 * @static
		 * @public
		 * @function
		 * @param {HTMLElement} el The HTML element for which to get the tag name.
		 * @return {String} The tag name in all lower case of an HTML element, if it cannot be successfully retrieved, alwasys returns an empty string (which will evaluate to FALSE).
		 *
		*/

		function tagName(el)
		{
			return (el && el[NODE_TYPE] == 1 && el.tagName[TLC]()) || "";
		}

		/**
		 * A wrapper around retrieving a list of tags by name.
		 *
		 * @memberOf $sf.lib.dom
		 * @exports tags as $sf.lib.dom.tags
		 * @static
		 * @public
		 * @function
		 * @param {String} name The name of the tags that you wish to look for, note that you can pass in "*" to find all.
		 * @param {HTMLElement|Document} [parNode] the parent node that you wish to look in
		 * @return {HTMLElementCollection} List of tags found. Note that is NOT a real JavaScript Array
		 *
		*/

		function tags(name, parNode)
		{
			var ret = [], e;

			try {
				if (parNode && parNode[GTE]) {
					ret = parNode[GTE](name) || ret;
				} else {
					ret = d[GTE](name) || ret;
				}
			} catch (e) {
				ret = [];
			}
			return ret;
		}


		/**
		 * Retrive the parent element of an HTML element
		 *
		 * @memberOf $sf.lib.dom
		 * @exports par as $sf.lib.dom.par
		 * @public
		 * @static
		 * @function
		 * @param {HTMLElement} el the HTML element to check
		 * return {HTMLElement} the new reference to the parent element or null
		 *
		*/

		function par(el) { return el && (el.parentNode || el.parentElement); }


		/**
		 * Retrieve/Set/Delete an element's attribute. Note that this handle's
		 * slight differences in the way HTML attributes are handled across browsers
		 * as well as being shorthand
		 *
		 * @memberOf $sf.lib.dom
		 * @exports attr as $sf.lib.dom.attr
		 * @static
		 * @public
		 * @function
		 * @param {HTMLElement} el the HTML element to manipulate
		 * @param {String} attrName the attribute to set/get
		 * @param {String} [attrVal], if specified will set the value of the attribute for this element.  Passing null will remove the attribute completely
		 * @return {String} the value of the attribute normalized to a string (may be empty)
		*/
		/*
		 * Note that we probably could have 2 differnet functions here instead of forking internally
		 * but the functions are essentially the same, and it just creates a lot of dead code
		 *
		*/

		function attr(el,attrName,attrVal)
		{
			var e;
			try {
				if (arguments[LEN] > 2) {
					if (attrVal === NULL) {
						if (useOldStyleAttrMethods) {
							el[RM](attrName, 0);
						} else {
							el[RM](attrName);
						}
					} else {
						attrVal = _cstr(attrVal);
						if (attrName[TLC]() == "class") {
							el.className = attrVal;
						} else {
							if (useOldStyleAttrMethods) {
								el[ST](attrName, attrVal, 0);
							} else {
								el[ST](attrName, attrVal);
							}
						}
					}
				} else {
					if (useOldStyleAttrMethods) {
						attrVal = _cstr(el[GT](attrName, 0));
					} else {
						attrVal = _cstr(el[GT](attrName));
					}
				}
			} catch (e) {
				attrVal = "";
			}
			return attrVal;
		}

		/**
		 * Set/Get the CSS text of an HTML element
		 *
		 * @memberOf $sf.lib.dom
		 * @exports css as $sf.lib.dom.css
		 * @public
		 * @static
		 * @function
		 * @param {HTMLElement} el the HTML element to manipulate
		 * @param {String} [val] the CSS string to set if specified (e.g. "background-color:transparent;position:absolute;top:0px;left:0px").
		 * @return {String} the value of the attribute normalized to a string (may be empty)
		*/

		function css(el, val)
		{
			var st;

			try {
				st	= el.style;

				if (arguments[LEN] > 1) {
					st.cssText = _cstr(val);
				} else {
					val = st.cssText;
				}
			} catch (e) {
				val = "";
			}
			return val;
		}

		/**
		 * Make a new element
		 *
		 * @name $sf.lib.dom.make
		 * @exports make_element as $sf.lib.dom.make
		 * @static
		 * @public
		 * @function
		 * @param {String} tagName
		 * @param {Document|HTMLElement|Window} [parent] element, document, or window to make the tag in, optional.
		 * @return {HTMLElement}
		 *
		*/

		function make_element(tagName, par)
		{
			return ((arguments[LEN]>1 && doc(par)) || d).createElement(tagName);
		}


		/**
		 * Append and HTMLElement to another HTMLElement
		 *
		 * @memberOf $sf.lib.dom
		 * @exports append as $sf.lib.dom.append
		 * @public
		 * @static
		 * @function
		 * @param {HTMLElement} parNode the HTML element to manipulate
		 * @param {HTMLElement} child (Required) the new HTML element to add to the parent
		 * return {HTMLElement|Boolean} the new reference to the child element that was appended, or FALSE if failure
		 *
		*/

		function append(parNode,child)
		{
			var success = FALSE, e;
			try {
				if (parNode) success = parNode.appendChild(child);
			} catch (e) {
				success = FALSE;
			}
			return success;
		}


		/**
		 * A wrapper method for removing elements from a document rather than calling parentNode.removeChild raw.
		 * Has special processing to ensure that contents of IFRAME tags gets released from memory as well
		 *
		 * @memberOf $sf.lib.dom
		 * @exports purge as $sf.lib.dom.purge
		 * @static
		 * @public
		 * @function
		 * @param {HTMLElement} node The HTML element to be removed from the dom
		 * @return {Boolean} Whether or not the element was successfully removed
		 *
		*/

		function purge(node)
		{
			var success = FALSE, parNode, isIFrame = (tagName(node) == IFRAME), e;

			if (isIFrame) {
				/*
				 * If it's an iframe we want to make sure to call into
				 * our other internal libraries and unbind anything that
				 * we might have attached.
				*/

				_call_xmsg_host("detach", node)
				_unbind_iframe_onload(node);


				/*
				 * We also want to unload / nuke the contents
				 * but with IE unfornately we cannot set the "src"
				 * attribute b/c that will lead to the annoying click / navigation sound
				 *
				*/

				if (!isIE) attr(node,"src",BLANK_URL);

			}

			try {
				parNode = par(node);
				if (parNode) {
					parNode.removeChild(node);
					success = TRUE;

					/*
					 * Since we can't set the "src" attribute for IE,
					 * we just call into the garbage collector
					 *
					*/
					if (isIE && isIFrame) gc();
				}
			} catch (e) { }

			node = parNode = NULL;
			return success;
		}

		/**
		 * Attach an event handler to an HTMLElement.  Note normalize event names to lower case / w3c standards.
		 * See example.
		 *
		 * @memberOf $sf.lib.dom
		 * @exports attach as $sf.lib.dom.attach
		 * @public
		 * @static
		 * @function
		 * @param {HTMLElement} el the HTML element to attach an event handler too
		 * @param {String} name the name of the event to listen too
		 * @param {Function} cb the function used to handle the particular event
		 *
		 * @example
		 * var el = $sf.lib.dom.elt("my_element");
		 * function handle_click(evt)
		 * {
		 *      alert('i was clicked');
		 * }
		 *
		 * $sf.lib.dom.attach(el,"click",handle_click);
		 *
		*/
		/*
		 * It seems a shame to have to fork at run time, but again, it would add a fair amount
		 * of function body weight just to change one line of code.
		 *
		*/

		function attach(obj, name, cb)
		{
			try {
				if (use_ie_old_attach) {
					obj[use_attach]("on"+name,cb);
				} else {
					obj[use_attach](name,cb,FALSE);
				}
			} catch (e) {

			}
			obj = cb = NULL;
		}

		/**
		 * Detach an event handler to an HTMLElement
		 *
		 * @memberOf $sf.lib.dom
		 * @exports detach as $sf.lib.dom.detach
		 * @public
		 * @static
		 * @function
		 * @param {HTMLElement} el the HTML element to attach an event handler too
		 * @param {String} namethe name of the event to listen too
		 * @param {Function} cb the function used to handle the particular event
		 *
		*/

		function detach(obj, name, cb)
		{
			try {
				if (use_ie_old_attach) {
					obj.detachEvent("on"+name, cb);
				} else {
					obj.removeEventListener(name, cb, FALSE);
				}
			} catch (e) {

			}
			obj = cb = NULL;
		}

		/**
		 * Returns whether or not the DOM is ready to be manipulated
		 *
		 * @memberOf $sf.lib.dom
		 * @exports ready as $sf.lib.dom.ready
		 * @public
		 * @static
		 * @function
		 * @return {Boolean}
		 *
		*/

		function ready()
		{
			var rs;

			_clear_ready_timer_check();

			if (dom_is_ready) {
				dom_last_known_child_node = NULL;
				return TRUE;
			}

			rs = d.readyState;

			if (rs) {
				dom_last_known_child_node = NULL;
				if (rs == "loaded" || rs == "complete") {
					dom_is_ready = TRUE;
				} else {
					dom_is_ready = FALSE;
				}
			}

			/*
			 * there is no document.readyState property available, so kick off our timer function
			 * that will check.
			 *
			*/

			dom_last_known_child_node	= NULL;
			dom_ready_chk_tries			=
			dom_last_known_tag_count	= 0;
			_ready_state_check();
			return !!(dom_is_ready);
		}


		/**
		 * Fire off a particular function when it is detected that the DOM is ready
		 * Useful when you don't know for sure if the DOM of the browser is ready or not, so this will detect and fire
		 * your function for you.
		 *
		 * @memberOf $sf.lib.dom
		 * @exports wait as $sf.lib.dom.wait
		 * @public
		 * @static
		 * @function
		 * @param {Function} cb A function reference to be called when the DOM is ready
		 *
		*/

		function wait(cb)
		{
			var rdy = ready(), e;
			if (rdy) {
				try {
					if (lang.callable(cb)) cb();
				} catch (e) {
					e = NULL;
				}
				return;
			}
			setTimeout(function() { wait(cb); cb = NULL; }, dom_ready_chk_try_interval+1);
		}


		/**
		 * Cancel the the default action of a particular DOM event
		 *
		 * @memberOf $sf.lib.dom
		 * @exports evtCncl as $sf.lib.dom.evtCncl
		 * @public
		 * @static
		 * @function
		 * @param {HTMLEvent} evt  The raw HTML event
		 *
		*/

		function evtCncl(evt)
		{
			var prop = "", e;

			evt = evt || win.event;

			if (evt) {
				/* old school ie, cancel event and bubble
				   however we also use this for when event handling overrides
				   take place so that we can cancel things
				*/
				try {
					evt.returnValue = FALSE;
				} catch (e) { }
				try {
					evt.cancelBubble = TRUE;
				} catch (e) {  };
				try {
					evt.stopped		 = TRUE; //custom
				} catch (e) { };

				for (prop in EVT_CNCL_METHODS)
				{
					if (EVT_CNCL_METHODS[prop]) {
						try {
							evt[prop]();
						} catch (e) { }
					}
				}
			}
			return FALSE;
		}

		/**
		 * Return the target/srcElement of an event from an HTML element
		 *
		 * @memberOf $sf.lib.dom
		 * @exports evtTgt as $sf.lib.dom.evtTgt
		 * @public
		 * @static
		 * @function
		 * @param {HTMLEvent} evt The raw HTML event
		 *
		*/

		function evtTgt(evt)
		{
			var tgt = NULL;

			try {
				evt = evt || win.event;
				tgt = (evt) ?  (evt[evt_tgt_prop_a] || evt[evt_tgt_prop_b]) : NULL;
			} catch (e) {
				tgt = NULL;
			}
			return tgt;
		}


		/**
		 * @namespace $sf.lib.dom.iframes Defines helper functions for dealing specifically with IFRAME tags, which is key to SafeFrames tech in a browser.
		 * @name $sf.lib.dom.iframes
		 * @requires $sf.lib.lang
		 *
		*/


		/**
		 * Clones an iframe. . .
		 * This code creates / clones iframe tags in a very specific way to ensure both optimal performance and stability.
		 * We use string buffers to build markup internally, which is typically faster than using all DOM APIs.  Also
		 * we allow the usage of the "name" attribute as a data pipeline, which in turn allows for synchronous downward
		 * x-domain messaging.
		 *
		 * @name $sf.lib.dom.iframes.clone
		 * @static
		 * @public
		 * @function
		 * @param {HTMLElement/String} el  An iframe element or id of an iframe element to clone
		 * @param {Object} [attrs]  A hash map of other attributes to be set on the iframe.  Do not set style properties for the frame here, see the next argument for that.
		 * @param {String} [cssText]  The style string (as in what you would use in HTML markup, e.g. "background-color:red;border:solid 3px blue;"), to use for this iframe
		 * @param {Function} [cb]  An optional callback function to specify for when the iframe loads.
		 * @param {Function} [xmsgCB] An optional call back for receiving messages from the iframe
		 * @return {HTMLElement}  the iframe node if succesfully created or NULL.  Note that this does not insert the iframe into the document for you. . .
		 *
		*/
		function clone_iframe(el, attrs, cssText, cb, xmsgCB)
		{
			return _clone_iframe(el, attrs, cssText, cb, xmsgCB);
		}


		/** @ignore */
		function _clone_iframe(el, attrs, cssText, cb, xmsgCB, iframe_skip_clone)
		{
			var bufferHTML 	= ["<", IFRAME, " "],
				xmsgPipe	= "",
				prop, temp, cl, newCl, html, attrStr;

			if (!iframe_skip_clone) {
				el 		= _byID(el);
				if (tagName(el) != IFRAME) return NULL;

				cl 			= el.cloneNode(FALSE);
			} else {
				cl = el;
			}
			attrs		= attrs || {};

			if ("src" in attrs) {
				attr(cl,"src",NULL);
			} else {
				attrs.src = attr(el,"src") || BLANK_URL;
			}
			if ("name" in attrs) {
				attr(cl,"name",NULL);
			} else {
				attrs.name = attr(el,"name");
			}
			if (!attrs.src) attrs.src = BLANK_URL;

			xmsgPipe = xmsgCB && _call_xmsg_host("prep",attrs);

			if (!iframe_skip_clone) {
				attr(cl,"width",	NULL);
				attr(cl,"height",	NULL);
			}

			if (cssText) {
				//Lucky for us that duplicate style props will override each other so long as i put mine after. .

				temp = css(cl);
				if (temp && temp.charAt(temp[LEN]-1) != ";")
					temp += ";";

				css(cl, [temp,_cstr(cssText)]);
			}

			temp	= make_element("div");
			append(temp,cl);

			html	= temp.innerHTML;
			attrStr	= html.replace(/<iframe(.*?)>(.*?)<\/iframe>/gim, "$1");

			bufferHTML.push("name=\"", attrs.name, "\" ", attrStr, "></", IFRAME, ">");

			delete attrs.name; //delete it so that we are not calling setAttribute with "name" since IE doesn't like that

			temp.innerHTML 	= _cstr(bufferHTML);
			newCl	 		= temp.firstChild;
			for (prop in attrs)
			{
				attr(newCl,prop,attrs[prop]);
			}

			if (!attr(newCl,"id")) {
				attr(newCl,"id", "sf_" + IFRAME + "_" + iframe_next_id);
				iframe_next_id++;
			}

			attr(newCl,"FRAMEBORDER","no");
			attr(newCl,"SCROLLING","no");
			attr(newCl,"ALLOWTRANSPARENCY",TRUE);
			attr(newCl,"HIDEFOCUS",TRUE);
			attr(newCl,"TABINDEX",-1);
			attr(newCl,"MARGINWIDTH",0);
			attr(newCl,"MARGINHEIGHT",0);

			_bind_iframe_onload(newCl,cb);

			if (xmsgPipe) _call_xmsg_host("attach",newCl,xmsgPipe,xmsgCB);

			xmsgPipe = xmsgCB = cl = cb = el = temp = null;

			return newCl;
		}


		/**
		 * Make a new iframe
		 *
		 * @name $sf.lib.dom.iframes.make
		 * @static
		 * @public
		 * @function
		 * @param {Object} attrs  A hash map of other attributes to be set on the iframe.  Do not set style properties for the frame here, see the next argument for that.
		 * @param {String} [cssText]  The style string (as in what you would use in HTML markup, e.g. "background-color:red;border:solid 3px blue;"), to use for this iframe
		 * @param {Function} [cb]  An callback function to specify for when the iframe loads.
		 * @param {Function} [xmsgCB] An call back for receiving messages from the iframe
		 * @return {HTMLElement}  the iframe node if succesfully created or NULL.  Note that this does not insert the iframe into the document for you. . .
		 *
		*/

		function make_iframe(attrs, cssText, cb, xmsgCB)
		{
			return _clone_iframe(make_element(IFRAME), attrs, cssText, cb, xmsgCB, TRUE);
		}

		/**
		 * A method to insert or replace an HTML tag with an IFRAME tag, with a new URL and attributes.
		 *
		 * Used for 3 reasons:
		 *<ol>
		 * <li>It avoids click sounds on IE.</li>
		 * <li>It allows always resetting the window.name property of the iframes underlying HTMLWindow object, unforunately IE will not let you set this attribute on a clone.</li>
		 * <li>It ensures that event handlers in the underlying document for unloading are executed.</li>
		 * <li>Changing the src attribute directly will result in a browser history update, which we do not want.</li>
		 *</ol>
	     *
		 * We could just change location.href property or call location.replace, however that is not always  possible since
		 * the frame could be x-domain.
		 *
		 * @name $sf.lib.dom.iframes.replace
		 * @function
		 * @static
		 * @public
		 * @param {Object} attrs  A hash map of other attributes to be set on the iframe.  Do not set style properties for the frame here, see the next argument for that.
		 * @param {String} [cssText]  The style string (as in what you would use in HTML markup, e.g. "background-color:red;border:solid 3px blue;"), to use for this iframe
		 * @param {HTMLElement|String} [parRef]  An parent element or parent element id, to be used only if a new iframe is created, the iframe will be append to that parent, if not specified document body is used
		 * @param {Function} [cb]  An callback function to specify for when the iframe loads.
		 * @param {Function} [xmsgCB] An call back for receiving messages from the iframe
		 *
		 * @return {HTMLElement} a reference to the newly created iframe element if successfully inserted, otherwise NULL.
		*/

		function replace_iframe(attrs, cssText, parRef, cb, xmsgCB)
		{
			var cl, el, frameEl, elID, tgn, parNode, e;

			attrs		= attrs || {};
			elID		= attrs.id;
			el			= elID && _byID(elID);
			tgn			= tagName(el);
			el			= (tgn) ? el : NULL;
			frameEl		= (tgn == IFRAME) ? el : NULL;

			if (frameEl) {

				_call_xmsg_host("detach",frameEl);
				_unbind_iframe_onload(frameEl);

				parNode = par(frameEl);
				cl		= clone_iframe(frameEl, attrs, cssText, cb, xmsgCB);

				//remove these attrs, since they will be reset
				attr(cl, "onload",NULL);
				attr(cl, "onreadystatechange",NULL);
			} else {
				if (parRef) {
					parRef = _byID(parRef);
					if (tagName(parRef)) parNode = parRef;
				}
				if (!parNode && el) parNode = par(el);

				cssText	= _cstr(cssText) || css(el) || "";
				cl		= make_iframe(attrs, cssText, cb, xmsgCB);
			}

			try {
				if (!parNode) {
					append(d.body,cl);
				} else {
					if (frameEl) {
						parNode.replaceChild(cl, frameEl);
					} else {
						if (el) {
							parNode.replaceChild(cl,el);
						} else {
							append(parNode,cl);
						}
					}
				}
			} catch (e) { }

			cl = el = attrs = frameEl = parNode = cb = NULL;
			return elt(elID);
		}


		/**
		 * Retrieve the window reference inside of an IFRAME. Not to be confused with $sf.lib.dom.view which
		 * returns the parent window reference of an element.
		 *
		 * Note that even in cross-domain scenarios, you are supposed to able to get access to the window reference.
		 * In a cross-domain scenario, you would not be able to then acesss most properties / methods / objects of that
		 * window, but the reference itself is allowed.
		 *
		 * @name $sf.lib.dom.iframes.view
		 * @public
		 * @static
		 * @function
		 * @param {HTMLElement} el The iframe element to safely get back the window
		 * @return {HTMLWindow} the window reference inside the iframe.
		 *
		*/

		function iframe_view(el)
		{
			var win, elWin, elDoc, frame_list, frame, fe, idx = 0, e, err;
			try {
				win = el.contentWindow || NULL;

				/*
				 * We are allowed access, but sometimes, non-ie browser will report NULL
				 * so in this case we loop through the window frames to see if that is really
				   the case
				*/

				if (!win) {
					elDoc		= doc(el);
					elWin		= (elDoc && view(elDoc));
					frame_list	= (elWin && elWin.frames) || [];
					while (frame = frame_list[idx++])
					{
						try {
							fe = frame.frameElement;
						} catch (err) {
							fe = NULL;
						}
						if (fe && fe == el) {
							win = frame;
							break;
						}
					}
				}
			} catch (e) {
				win = NULL;
			}
			return win;
		}

		/**
		 * Write an entry to the console log and fire any log listeners
		 *
		 * @message  The log message
		*/

		function logInfo(message)
		{
			if(win.console && console.log){
				console.log(message);
			}
		}

		/**
		 * Write an entry to the console error log and fire any log listeners
		 *
		 * @message  The log message
		*/

		function logError(message)
		{
			if(win.console && console.error){
				console.error(message);
			}
			else if(win.console && console.log){
				console.log(message);
			}
		}

		/*
		 * Do some internal intialization below.  Some variable aren't really used beyond this intialization phase, hence
		 * why we have a 2ndary inner function.  We also want to have some functions defined differently based on the browser
		 * for run-time performance reasons (however we only do this if the function body is significantly different, otherwise
		 * we just fork internally inside a functional wrapper).
		 *
		*/
		/** @ignore */
		(function() {
			var obj, ATTR_NAME = "SCROLLING", CREATE_EVENT = "createEvent", EVT_TYPE = "UIEvent", prop, err;

			if (isIE) {
				evt_tgt_prop_a	= "srcElement";
				evt_tgt_prop_b	= "target";
				obj				= make_element(IFRAME);

				attr(obj,ATTR_NAME, "no");

				useOldStyleAttrMethods = (attr(obj,ATTR_NAME) != "no");

				if (GC in win) {
					/*
					 * While this method is technically public, we do not document it.
					 * IE has a super-secret method to call the garbage collector.  It was implemented
					 * b/c IE, due to its own issues with internal reference counting, did not always trigger
					 * garabage collection properly.  This happens to be the case often when dealing with one
					 * or more IFRAMEs.  Often times you will find that an IFRAME that is removed from the dom
					 * actually never gets unloaded (and thereby never fires the onunload event either).
					 *
					 * Calling IE's internal method helps make sure this happens.
					 *
					*/

					/** @ignore */
					gc		= function()
					{
						if (gc_timer_id) clearTimeout(gc_timer_id);
						gc_timer_id = setTimeout(function() { try { win[GC](); } catch (e) {} }, IE_GC_INTERVAL);
					}

				} else {
					gc		= _lang.noop;
				}
			} else {
				evt_tgt_prop_a	= "target";
				evt_tgt_prop_b	= "currentTarget";
			}

			if (win[w3c_attach] && !isIE) {
				use_attach = w3c_attach;
				use_detach = w3c_detach;
			} else if (isIE) {
				use_ie_old_attach 	= TRUE;
				use_attach 			= ie_attach;
				use_detach 			= ie_detach;
			}

			/*
			 * We have a method for cancelling event propagation / bubbling
			 * which will even work in cases where cancelling is typically not allowed
			 * so long as we have control over the handlers
			 *
			 * In turn we want to be able to call the proper supported methods
			 * regardless of browser type, so we look at the w3c style of creating
			 * events and if that can be used, then we want to make sure and call those
			 * cancelling methods that are supported
			 *
			*/

			obj = NULL;
			try {
				obj = d[CREATE_EVENT](EVT_TYPE);
			} catch (err) {
				obj = NULL;
			}
			if (!obj) {
				try {
					obj = d[CREATE_EVENT](EVT_TYPE+"s");
				} catch (err) {
					obj = NULL;
				}
			}
			if (obj) {
				for (prop in EVT_CNCL_METHODS)
				{
					if (obj[prop]) EVT_CNCL_METHODS[prop] = 1;
				}
			}

			obj = NULL;

			/* we attach load event handlers to also allow us to know as soon as
			 * possible when dom is ready.  this script may have been loaded async
			 * though, which is why our ready check does some other things to check for
			 * certain
			 *
			*/

			attach(win, "load",  _handle_dom_load_evt);
			attach(win, DCLDED,	 _handle_dom_load_evt);

			dom = lang.def(IAB_LIB + ".dom",
			{

				/* DOM Query function */

				doc:			doc,
				view:			view,
				elt:			elt,
				tagName:		tagName,
				tags:			tags,
				par:			par,

				/* DOM manipulate functions */

				make: 			make_element,
				css:			css,
				attr:			attr,
				gc:				gc,
				append:			append,
				purge:			purge,

				/* DOM event functions */

				attach:			attach,
				detach:			detach,
				ready:			ready,
				wait:			wait,
				evtCncl:		evtCncl,
				evtTgt:			evtTgt

			}, NULL, TRUE);

		})();


		iframes = lang.def(IAB_LIB + ".dom.iframes",
		{
			make:		make_iframe,
			clone:		clone_iframe,
			replace:	replace_iframe,
			view:		iframe_view

		}, NULL, TRUE);

		logger = lang.def(IAB_LIB + ".logger",
		{
			log:	logInfo,
			error: 	logError
		}, NULL, TRUE);

		info = lang.def(IAB_INF,
		{
			errs:	[],
			list: 	[]
		}, NULL, TRUE);


		// Add Javascript shims
		//IE doesn't support string.trim
		if(!S[PROTO].trim) S[PROTO].trim = lang.trim;

	})();

})(window);


