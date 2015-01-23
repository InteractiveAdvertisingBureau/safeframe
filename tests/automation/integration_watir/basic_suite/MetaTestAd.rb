
class MetaTestAd
	attr_reader :clear_btn
	attr_reader :shared_meta_btn
	attr_reader :private_meta_btn
	attr_reader :log_elem
	
	
	def initialize(browser, id)
		@b = browser
		b = @b
		if(id.nil?) then
			@id = 'sftarget'
		else
			@id = id
		end
		
		browser.iframe(:id => @id).wait_until_present
				
		@frame = b.iframe(:id => @id)
		@clear_btn = @frame.button(:class => 'clearBtn')
		@shared_meta_btn = @frame.button(:class => 'ext_sharedmeta')
		@private_meta_btn = @frame.button(:class => 'ext_privatemeta')
		@log_elem = @frame.div(:id => 'feedback')
		@shared_key_input = @frame.input(:id => 'sharedMetaKey')
		@private_key_input = @frame.input(:id => 'privateMetaKey')
		@private_section_input = @frame.input(:id => 'privateSectionKey')
	end
	
	def clear_log
		unless @clear_btn.nil?
			@clear_btn.click
		end
	end
	
	def execute_script(script)
		@frame.execute_script script	
	end
	
	def log_text
		return @log_elem.text
	end
	
	def shared_key(key)
		@shared_key_input.value = key
	end
	
	def private_keys(key, section)
		@private_key_input.value = key
		@private_section_input.value = section
	end
	
	def get_shared_values
		clear_log
		@shared_meta_btn.click
		return log_text
	end
	
	def get_private_values
		clear_log
		@private_meta_btn.click
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

