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

def viewport_diff(browser)
	btn = browser.button(:id => 'viewportSizeBtn')
	el = browser.element(:id => 'dataOutput')
	browser.scroll.to btn
	browser.driver.execute_script('windowDimensions()');
	winraw = el.text
	
	browser.driver.execute_script('viewportDimensions()');
	vpraw = el.text
	
	vpar = vpraw.split(/[w:\s|,\s|h:\s]/)
	winar = winraw.split(/[w:\s|,\s|h:\s]/)
	
	vpar.delete("")
	winar.delete("")
	dif = {"x" => (winar[0].to_i - vpar[0].to_i), "y" => (winar[1].to_i - vpar[1].to_i)}
	return dif
end

puts "================== \033[1;32mBEGIN SAFEFRAME GEOMETRY TESTS\033[0m ===================="
puts "\033[1;36m BASE TEST URL" + testpage_url("geometry_test.html") + "\033[0m\n"

RSpec.configure do |config|
  config.include Helpers
  
  config.before(:each) { 
  }
  config.before(:suite) {
	b = browser
  }
  
  config.after(:suite) { browser.close unless browser.nil? }

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
	
	it "should calculate window size diff" do
		dif = viewport_diff(browser)
		dif['x'].should be > 0
		dif['y'].should be > 10
	end
	
	it "should calculate within 30%" do
		browser.scroll.to :top
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		ad.clear_log
		
		dif = viewport_diff(browser)
		x = dif['x']
		y = dif['y']
		
		ht = 450
		head = 200
		bheight = 200 + (450/2) + y
		browser.window.resize_to(700, bheight)
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		ad.clear_log
		
		viewable = ad.inview_amount
		viewable.should be < 60
		viewable.should be > 40
		
		ad.clear_log
		browser.scroll.to browser.element(:id => 'tgtLREC2')
		Watir::Wait.until{
			ad.log_elem.text.include? "geom-update"
		}
		scrolled_viewable = ad.inview_amount
		scrolled_viewable.should be > viewable
		scrolled_viewable.should be < 100

	end
	
  end
  
  
end
