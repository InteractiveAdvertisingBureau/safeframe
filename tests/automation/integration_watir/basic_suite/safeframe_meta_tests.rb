require 'rspec'
# require 'watir'
require 'watir-webdriver'

$: << File.dirname(__FILE__)+'/.'
require 'helpers.rb'
require 'MetaTestAd.rb'

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
  
  config.before(:each) { 
  }
  config.before(:suite) {
	b = browser
  }
  
  config.after(:suite) { browser.close unless browser.nil? }

end

describe "a test of SafeFrame meta data " do
	
	browser.goto(testpage_url "metadata_test.html")
		
	before(:all) do
		puts ''
		puts " \033[1;33m Test $sf.ext \033[0m ..."
	end
	
	ad = MetaTestAd.new(browser, 'sftarget')
		
	before(:each) do
		
	end
	  
    it "should be on Metadata methods test" do
      browser.text.should include('Metadata Tests')
    end
	
	it "should not have an Error" do
		b = browser
		b.text.should_not include('Error')
	end
	
	it "should report the shared value" do
		b = browser		
		ad.get_shared_values.should include('bar')
	end
	
	it "should report the private value" do
		b = browser		
		ad.get_private_values.should include('bar')
	end
  
end
