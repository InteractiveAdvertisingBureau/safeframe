
class VendorTestAd
	attr_reader :clear_btn
	attr_reader :supports_btn
	attr_reader :geom_btn
	attr_reader :inview_btn 
	attr_reader :status_btn
	attr_reader :log_elem
	
	
	def initialize(browser, id)
		@b = browser
		b = @b
		if(id.nil?) then
			@id = 'tgtLREC2'
		else
			@id = id
		end
		
		browser.iframe(:id => @id).wait_until_present
				
		@frame = b.iframe(:id => @id)
		@clear_btn = @frame.button(:class => 'clearBtn')
		@supports_btn = @frame.button(:class => 'ext_supports')
		@geom_btn = @frame.button(:class => 'ext_geom')
		@log_elem = @frame.div(:id => 'feedback')
		@inview_btn = @frame.button(:class => 'ext_inviewpercentage')
		@status_btn = @frame.button(:class => 'ext_status')
		@expand_btn = @frame.button(:class => 'ext_expand')
		@collapse_btn = @frame.button(:class => 'ext_collapse')
	end
	
	def clear_log
		unless @clear_btn.nil?
			@clear_btn.click
		end
	end
	
	def execute_script(script)
		@frame.execute_script script	
	end
	
	
	def inview_amount
		execute_script('getViewableAmount()')
		val = log_text.to_i
		return val
	end
	
	def log_text
		return @log_elem.text
	end
	
	def expand
		@expand_btn.click
		Watir::Wait.until{
			@log_elem.text.include? "expanded"
		}
	end
	
	def collapse
		@collapse_btn.click
		Watir::Wait.until{
			@log_elem.text.include? "collapsed"
		}
	end
	
	def supports_output
		clear_log
		@supports_btn.click
		return log_text
	end

	def geom_output
		clear_log
		@geom_btn.click
		return log_text
	end
	
	private
	def select_dropdown_val(button, group, val)
		if val.nil? then return end
		
		button.click
		dropul = group.ul(:class => 'dropdown-menu')
		dropul.li(:text => /Loading/).wait_while_present
		path = "li/a[@data-val='" + val + "']"
		state_link = dropul.element(:xpath => path)
		state_link.flash
		state_link.click
	end
	
end

