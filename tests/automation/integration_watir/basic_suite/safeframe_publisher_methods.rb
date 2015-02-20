# =========================================
# Publisher Methods test suite
# 
# Exercise publisher methods of the SafeFrame framework
# =========================================

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

puts "================== \033[1;32mBEGIN SAFEFRAME TESTS - PUBLISHER METHODS \033[0m ===================="
puts "\033[1;36m BASE TEST URL" + testpage_url("publisher_methods_test.html") + "\033[0m\n"

RSpec.configure do |config|
  config.include Helpers
  
  config.before(:each) { 
  }
  config.before(:suite) {
    
	b = browser
  }
  
  config.after(:suite) { browser.close unless browser.nil? }

end

describe "an integration test of SafeFrame" do
  # include Helpers
  # include VendorTestAd
  
  
  describe "that we start on publisher methods test page" do
	
	browser.goto(testpage_url "publisher_methods_test.html")
    browser.iframe(:id => 'tgtLREC2').wait_until_present
		
	before(:all) do
		puts ''
		puts " \033[1;33m Test $sf.host \033[0m ..."
	end
	
	before(:each) do
		b = browser
		b.element(:id => 'header').focus
		clearBtn = b.element(:id => 'clearLogBtn')
		clearBtn.click # sets focus to flush focus change message
	end
	  
    it "should be on external methods test" do
      browser.text.should include('Publisher Methods tests')
    end
	
	it "should list ad id in feedback" do
		b = browser
		browser.iframe(:id => 'tgtLREC2').click
		feedback = b.div(:id => 'feedback')
		feedback.text.should include('ad2LREC')
	end
	
	it "should have the ad in $sf.info.list" do
		b = browser
		clearBtn = b.element(:id => 'clearLogBtn')
		clearBtn.click
		
		data = b.element(:id => 'dataOutput')
		feedback = b.div(:id => 'feedback')
		feedback.text.should_not include('ad2LREC')
		
		infoBtn = b.element(:id => 'sfInfoBtn')
		infoBtn.click
		feedback.text.should include('$sf.info.list')
		data.text.should include('1')
	end
	
	it "should remove the ad from $sf.info.list after a nuke" do
		b = browser
		clearBtn = b.element(:id => 'clearLogBtn')
		clearBtn.click
		sfNukeBtn = b.element(:id => 'sfNukeBtn');
		sfNukeBtn.click
		
		data = b.element(:id => 'dataOutput')
		feedback = b.div(:id => 'feedback')
		
		infoBtn = b.element(:id => 'sfInfoBtn')
		infoBtn.click
		feedback.text.should include('$sf.info.list')
		data.text.should include('0')
		data.text.should_not include('1')
		
		b.element(:id => 'sfRenderAdBtn').click
		infoBtn.click
		data.text.should include('1')
	end
  end

end
