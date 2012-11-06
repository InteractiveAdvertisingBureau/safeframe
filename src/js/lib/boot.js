/*
* Copyright (c) 2012, Interactive Advertising Bureau
* All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

(function(win) {

	var FALSE						= false,
		TRUE						= true,
		NULL						= null,
		SF_DATATAG_CLASS			= "sf_data",
		SF_TAG_TYPE					= "text/x-safeframe",
		AUTO_BOOT_MAX_RETRIES		= 100,
		SF_POSELEM_WRAPPER_CLASS	= "sf_position",
		d							= (win && win.document),
		sf							= (win && win.$sf),
		lib							= (sf && sf.lib),
		lang						= (lib && lib.lang),
		dom							= (lib && lib.dom),
		_cstr						= (lang && lang.cstr),
		_guid						= (lang && lang.guid),
		_elt						= (dom && dom.elt),
		_par						= (dom && dom.par),
		_tags						= (dom && dom.tags),
		_attr						= (dom && dom.attr),
		_purge						= (dom && dom.purge),
		_ready						= (dom && dom.ready),

	inline_tags_processed	= {},
	boot_retries			= 0,
	has_booted	 			= FALSE,
	doing_auto_boot			= FALSE;


	function _log(msg,is_err)
	{
		var head_el, err_tag;

		try {
			if (lib && lib.log && win == top) {
				if (is_err) {
					lib.logger.error(msg);
				} else {
					lib.logger.log(msg);
				}
			} else {
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
	 * @return {String}
	 *
	*/

	function _create_pos_markup(src)
	{
		return _cstr(["<scr","ipt type='text/javascript', src='", src, "'></scr", "ipt>"]);
	}


	function _auto_boot()
	{
		var do_auto = TRUE, config, sf_host, host_file, head, scr_tag;

		if (has_booted) return;

		sf_host = sf && sf.host;
		if (win == top) {
			if (sf_host && !sf_host.boot) {
				sf_host.boot = boot;
			}
			try {
				config = sf_host && sf_host.Config();
			} catch (e) {
				config = NULL;
			}
			if (!config) {
				try {
					config = sf_host && sf_host.conf;
				} catch (e) {
					config = NULL;
				}
			}
			if (config) {
				if (("auto" in config) && config.auto === FALSE) do_auto = FALSE;

				if (!sf_host.render || !sf_host.Config) {
					host_file		= config.hostFile;
					if (host_file) {
						head				= _tags("head")[0];
						scr_tag				= dom.make("script");
						scr_tag.id  		= "sf_host_lib";
						scr_tag.type		= "text/javascript";
						scr_tag.className	= "sf_lib";
						scr_tag.src			=  host_file;


						if (win.ActiveXObject) {
							scr_tag.onreadystatechange	= function()
							{

								var rs = scr_tag.readyState;

								if (rs == "loaded" || rs == "complete") {

									doing_auto_boot = FALSE;
									if (do_auto) boot();
									scr_tag.onreadystatechange = NULL;
									scr_tag = head = sf_host = config = NULL;
								}
							}
						} else {
							scr_tag.onload		= function()
							{
								doing_auto_boot = FALSE;
								if (do_auto) boot();
								scr_tag.onload	= NULL;
								scr_tag = head = sf_host = config = NULL;
							}
						}
						doing_auto_boot = TRUE;
						head.appendChild(scr_tag);
						return;
					}
				}
			}

			if (do_auto) {
				if (config) {
					doing_auto_boot = TRUE;
					boot();
					doing_auto_boot = FALSE;
				} else {
					if (boot_retries++ <= AUTO_BOOT_MAX_RETRIES) setTimeout(_auto_boot,50);
				}
			}
		} else {
			boot();
		}
	}


	/**
     * Go through and remove any inline script tags that are our data-islands , which have already been boostrapped
	 *
     * @name $sf.host-_clean_up_booted_tags
     * @private
     * @function
     * @static
     *
     *
    */

    function _clean_up_booted_tags()
    {
		var script_tag_id, script_tag;

		if (dom) {
			for (script_tag_id in inline_tags_processed)
			{
				script_tag = _elt(script_tag_id);
				if (script_tag) {
					_purge(script_tag);
					delete inline_tags_processed[script_tag_id];
				}
			}
		}
    }


	/**
	 * Search for SafeFrames tags and render them. This function is called
	 * automatically whenever the SafeFrames publisher library is loaded. However a configuration
	 * can be applied to not have SafeFrames tags automatically be rendered, requiring a controlled
	 * call to this function.
	 *
	 * @name $sf.host.boot
	 * @public
	 * @function
	 * @static
	 *
	*/

	function boot()
	{
		var	script_tags		= (_tags && _tags("script")) || [],
			boot_positions 	= [],
			idx 			= 0,
			ret				= FALSE,
			sf_host			= sf && sf.host,
			sf_inline_conf	= sf_host && sf_host.conf,
			script_tag, script_tag_par, script_tag_id, data, html, pos_obj, pos_conf, pos_dest_el,
			pos_meta, pos_meta_item, typ, shared_meta, prv_meta, prv_meta_key, meta_key, sf_ocnf, err;

		if (!sf || !lang || !dom) {
			_log("SafeFrame base library not found",TRUE);
			return ret;
		}

		if (doing_auto_boot && has_booted) {
			_log("Automatic boot already invoked");
			return ret;
		}
		if (win == top) {
			try {
				sf_conf = sf_host.Config();
			} catch (err) {
				sf_conf = NULL;
			}

			if (sf_inline_conf && !sf_conf) {
				try {
					sf_conf = sf_host.Config(sf_inline_conf);
				} catch (e) {
					sf_conf = NULL;
				}
			}
			if (!sf_conf) {
				_log("No configuration found");
				return ret;
			}
		}

		while (script_tag = script_tags[idx++])
		{
			if (script_tag.className == SF_DATATAG_CLASS || _attr(script_tag, "type") == SF_TAG_TYPE) {
				has_booted 		= TRUE;
				script_tag_id 	= _attr(script_tag, "id");
				if (!script_tag_id) {
					script_tag_id = _guid("sf_data_element");
					_attr(script_tag, "id", script_tag_id);
				}

				/* ignore the tag if we already booted it */

				if (inline_tags_processed[script_tag_id]) continue;

				data	= script_tag.text || script_tag.innerHTML || script_tag.innerText;

				try {
					data = lang.trim(data);
					data = new Function("return " + data);
					data = data();
				} catch (err) {
					data = NULL;
					continue;
				}

				if (data && data.id && (data.html || data.src)) {

					if (win != top) {
						html	= data.html || "";
						html	= html || _create_pos_markup(data.src);

						if (!_ready()) {
							d.write(html);
						} else {
							_log("cannot write html content into already loaded document");
						}

					} else {
						script_tag_par	= _par(script_tag);

						if (!script_tag_par) {
							_log("can't find parent element for script tag",TRUE);
							continue;
						}

						/*
						 * Check for an existing position config
						 *
						*/
						pos_conf	= (sf_conf && sf_conf.positions[data.id]);
						if (!pos_conf) {
							/*
							 * No position config defined already so check for an inline config
							 *
							*/
							pos_conf 		= data.conf;
							pos_conf.id		= data.id;
							if (pos_conf) pos_conf = new sf_host.PosConfig(pos_conf);
						}

						if (!pos_conf) {
							_log("no position conf found pre-defined or inline for position " + data.id, TRUE);
							continue;
						}
						if (!pos_conf.dest) {
							/*
							 * we are going to auto create a destination element
							 *
							*/
							pos_conf = new sf_host.PosConfig(pos_conf,_guid(SF_POSELEM_WRAPPER_CLASS));
						}

						if (data.meta) {
							pos_meta	= data.meta;
							meta_key	= "";
							shared_meta	= {};

							/*
							 * Process meta data to be shared
							 * The 1st key that points to an object of its own, is considered
							 * private / owned data.  Any other keys are considered shared data
							 *
							 * You can't have more than one set of private / owner information unless
							 * its nested so having anything other than a structure of key = [some primtive value]
							 * or key = [obj] (1) time only, is all that makes sense
							 *
							*/

							for (meta_key in pos_meta)
							{
								pos_meta_item 	= pos_meta[meta_key];
								typ				= typeof pos_meta_item;

								if (!prv_meta && typ == "object" && pos_meta_item) {
									prv_meta 		= pos_meta_item;
									prv_meta_key	= meta_key;
								}
								if (typ != "object" && typ != "function") {
									shared_meta[meta_key] = pos_meta_item;
								}
							}
							pos_meta	= new sf_host.PosMeta(shared_meta, prv_meta_key || "", (prv_meta_key && prv_meta) ? prv_meta : NULL);

						}

						pos_obj			= new sf_host.Position(data, NULL, pos_meta, pos_conf);

						/*
						 * OK we built the position and are ready to render
						 * We set a custom attribute on the script tag so that we can ignore it
						 * in case someone else calls boot again
						 *
						 * We will remove these tags from the dom later, but we don't want to do that
						 * now b/c the page might be in the process of loading
						 *
						*/
						inline_tags_processed[script_tag_id]	= script_tag_id;
						pos_dest_el 							= _elt(pos_conf.dest);

						if (!pos_dest_el) {

							if (_ready()) {
								pos_dest_el	= dom.make("div");
								_attr(pos_dest_el, "id", pos_conf.dest);
								try {
									script_tag_par.insertBefore(pos_dest_el);
								} catch (err) {
									_log("failed auto-adding destination element " + err.message, TRUE);
									continue;
								}
							} else {
								d.write("<div id='", pos_conf.dest, "'></div>");
							}
						}

						boot_positions.push(pos_obj);
					}

				} else {
					_log("no content or id property found in the inline position object", TRUE);
				}
				/* end boot loop */
			}
		}

		if (boot_positions.length) {
			try {
				sf_host.render(boot_positions);
			} catch (e) {
				_log("failed during rendering " + e.message);
			}
		} else {
			_log("no positions to boot");
		}

		/*
		 * now we set a timer and go through and clean up any already processed tags
		 *
		*/
		dom.wait(_clean_up_booted_tags);
	}

	setTimeout(_auto_boot,50);

})(window);