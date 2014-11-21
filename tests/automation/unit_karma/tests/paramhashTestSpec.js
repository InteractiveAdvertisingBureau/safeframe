"use strict";

describe("ParamHash", function() {
	var sf = $sf,
		lib = sf.lib,
		lang = lib.lang,
		ParamHash = lang.ParamHash;
	
	describe('simple query params', function() {
		
		it('should parse numeric querystring with no parameters', function(){
			var str = "a=1&b=2&pi=3.14";
			var ph = new lang.ParamHash(str)
			
			expect(ph.a).toEqual('1');
			expect(ph.b).toEqual('2');
			expect(ph.pi).toEqual('3.14');
		});
		
		it('should serialize and deserialize', function(){
			var ph = new lang.ParamHash();
			ph.x = 99;
			ph.y = 100;
			var str = ph.toString();
			
			var ph2 = new ParamHash(str);
						
			expect(ph.x).toEqual(parseInt(ph2.x));
		});
		
		it('should handle starting with a delimiter', function(){
			var str = "&a=1&b=2&pi=3.14";
			var ph = new ParamHash(str)
			
			expect(ph.a).toEqual('1');
			expect(ph.b).toEqual('2');
			expect(ph.pi).toEqual('3.14');
		});
		
		it('should parse a safeframe name value', function(){
			var str = "id=tgtLREC2&dest=tgtLREC2&conf=id%3Dad2LREC%26dest%3DtgtLREC2%26bg%3Dtransparent%26tgt%3D_top%26css%3D%26w%3D400%26h%3D450%26z%3D0%26supports%3Dexp-ovr%253D1%2526exp-push%253D0%2526bg%253D0%2526pin%253D0%2526read-cookie%253D0%2526write-cookie%253D0%26size%3D400x450&meta=shared%3Dcontext%253DMETA-CONTENT%252520initialized%2526foometa%253Dyou%252520foo%26non_shared%3Drmx%253DsectionID%25253D14800347%252526siteID%25253D9999&html=%253Cscript%2520type%253D%2527text/javascript%2527%252C%2520src%253D%2527/tests/automation/integration_watir/test_pages/js_writeVendorAd.js%253Fver%253D1-1-0%2526sfver%253D1-1-0%2526cookie%253D1%2526flashver%253Dundefined%2526expand%253D%2524%257Bsf_exp_ovr%257D%2526pushed%253D%2524%257Bsf_exp_push%257D%2526pinned%253D%2524%257Bsf_pin%257D%2526back%253D%2524%257Bsf_bg%257D%2526host%253D%2524%257Bhost_url%257D%2527%253E%253C/script%253E&geom=null&src=/src/html/r.html&has_focus=true&srcHost=&guid=_1416519841213_16_2&host=http%3A//localhost%3A9099&loc=http%253A//localhost%253A9099/tests/automation/integration_watir/test_pages/geometry_test.html&proxyID=&html5=1&proxyPath=";
			var ph = new ParamHash(str, null,null, true, true)
			expect(ph.id).toEqual('tgtLREC2')
		});
		
	});
	
});



