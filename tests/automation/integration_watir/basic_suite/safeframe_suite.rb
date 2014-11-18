require 'rspec'
# require 'watir'
require 'watir-webdriver'

$: << File.dirname(__FILE__)+'/.'
require 'helpers.rb'
require 'VendorTestAd.rb'

browser = Watir::Browser.new #:phantomjs

if ARGV.length > 1
	URL_BASE = ARGV[2]
else
	URL_BASE = "http://localhost:9099"
end

TESTPAGE_PATH = "/tests/automation/integration_watir/test_pages/"

def testpage_url(page)
	return URL_BASE + TESTPAGE_PATH + page
end

puts "================== \033[1;32mBEGIN SAFEFRAME TESTS\033[0m ===================="
puts "\033[1;36m BASE TEST URL" + testpage_url("external_methods_test.html") + "\033[0m\n"

RSpec.configure do |config|
  config.include Helpers
  # config.include VendorTestAd
  
  config.before(:each) { 
  }
  config.before(:suite) {
	b = browser
  }
  
  config.after(:suite) { browser.close unless browser.nil? }

end

describe "an integration test of SafeFrame" do
  
  describe "that we start on external methods test page" do
	
	browser.goto(testpage_url "external_methods_test.html")
		
	before(:all) do
		puts ''
		puts " \033[1;33m Test $sf.ext \033[0m ..."
	end
	
	ad = VendorTestAd.new(browser, 'tgtLREC2')
		
	before(:each) do
		
	end
	  
    it "should be on external methods test" do
      browser.text.should include('External method tests')
    end
	
	it "should clear ad log" do
		b = browser
		ad.log_text.should include('META-CONTENT initialized')
		ad.clear_log
		ad.log_text.should_not include('META-CONTENT initialized')
	end
	
	it "should not have an Error" do
		b = browser
		b.text.should_not include('Error')
	end
	
	it "should support overlay expansion" do
		supports = ad.supports_output
		supports.should include("exp-ovr: 1");
		supports.should include("exp-push: 0");
	end
	
	it "should have geometry data" do
		geom = ad.geom_output
		geom.should_not include("Geometry missing");
		geom.should include("win");
		geom.should include("par");
		geom.should include("self");
	end
	
	it "should report correct ad width in geom" do
		geom = ad.geom_output
		geom.should_not include("Geometry missing");
		geom.should include("self");
		geom.should include("w: 400, h: 450");
	end

	
	it "should report correct window size" do
		b = browser
		ad.clear_log
		ad.log_text.should_not include("geom-update")
		ad.log_text.should_not include("Window dimensions")
		b.window.resize_to(800,600)
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		b.button( :id => 'viewportSizeBtn').click
		
		geom = ad.geom_output
		geom.should_not include("Geometry missing");
		geom.should include("win");
		#"w: 800, h: 600"
		geom.should include(b.element(:id => 'dataOutput').text);
		geom.should_not include("w: 1024, h: 768");
		ad.clear_log
		b.window.resize_to(1024,768)
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		b.button( :id => 'viewportSizeBtn').click
		geom = ad.geom_output
		geom.should include(b.element(:id => 'dataOutput').text);
	end
	
	it "should report 100% in view when visible" do
		b = browser
		b.window.resize_to(1024,768);
		ad.clear_log
		ad.log_text.should_not include('100')
		ad.inview_btn.click
		ad.log_text.should include('100')
	end
	
	it "should report < 100% in view when partially out of frame" do
		b = browser
		b.window.resize_to(1024,250);
		ad.clear_log
		ad.log_text.should_not include('100')
		ad.inview_btn.click
		percent = ad.log_text.to_i
		
		percent.should be < 100		
		b.window.resize_to(1024,768);
	end
	
  end

  # ======== Expand and Collapse Tests ==============
  describe "expand and collapse operate as expected" do
  
	browser.goto(testpage_url "external_methods_test.html")
	
	before(:all) do
		puts ''
		puts " \033[1;33m Test $sf.ext.expand() and  $sf.ext.collapse() \033[0m ..."
	end
	
	ad = VendorTestAd.new(browser, 'tgtLREC2')
	
	before(:each) do
		
	end
	  
    it "should report status of collapsed initially " do
		ad.clear_log
		ad.status_btn.click
		ad.log_text.should include('collapsed')
    end
	
    it "should report expanded status" do
		ad.clear_log
		ad.expand
		ad.clear_log
		ad.status_btn.click
		ad.log_text.should_not include('collapsed')
		ad.log_text.should include('expanded')
    end
    it "should report expanded status" do
		ad.clear_log
		ad.expand
		ad.clear_log
		ad.collapse
		ad.clear_log
		ad.status_btn.click
		ad.log_text.should include('collapsed')
		ad.log_text.should_not include('expanded')
    end
  end
  
end
