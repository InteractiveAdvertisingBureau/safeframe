require 'rspec'
# require 'watir'
require 'watir-webdriver'
require 'watir-scroll'

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

puts "================== \033[1;32mBEGIN SAFEFRAME GEOMETRY TESTS\033[0m ===================="
puts "\033[1;36m BASE TEST URL" + testpage_url("geometry_test.html") + "\033[0m\n"

RSpec.configure do |config|
  config.include Helpers
  # config.include VendorTestAd
  
  config.before(:each) { 
  }
  config.before(:suite) {
	# browser.goto(logout_url)
    
	#login
	b = browser
  }
  
  # config.after(:suite) { browser.close unless browser.nil? }

end

describe "geometry and viewability tests for SafeFrame" do
  # include Helpers
  # include VendorTestAd
  
  # ======== Visibility calculation tests =============
  describe "Visibility calculations through scroll and resize" do
	
	before(:all) do
		puts ''
		puts " \033[1;33m Test viewability through resize and scroll \033[0m ..."
	end
	
	browser.goto(testpage_url "geometry_test.html")		
	ad = VendorTestAd.new(browser, 'tgtLREC2')
	
	before(:each) do
	end
	  
    it "should be 100% visible " do
		browser.window.resize_to(1000,800)
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		browser.scroll.to :top
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		inview = ad.inview_amount
		inview.should be 100
    end  
  
    it "should be 0% visible when scrolled out of view" do
		browser.scroll.to browser.div(:class => 'footer')
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		inview = ad.inview_amount
		inview.should be 0
    end  
  end
  
  
end
