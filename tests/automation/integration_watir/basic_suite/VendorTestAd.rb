
class VendorTestAd
	attr_reader :clear_btn
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
		@log_elem = @frame.div(:id => 'feedback')
	end
	
	def clear_log
		unless @clear_btn.nil?
			@clear_btn.click
		end
	end
	
	def log_text
		return @log_elem.text
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

