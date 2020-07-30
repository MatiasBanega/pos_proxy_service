odoo.define('pos_proxy_service.chrome', function (require) {
    "use strict";
    var chrome = require('point_of_sale.chrome');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var utils = require('web.utils');
    var field_utils = require('web.field_utils');

  


    chrome.UsernameWidget.include({
        renderElement: function(){
            var self = this;
            this._super();
            
            this.$el.click(function(){
                //console.info('UsernameWidget this: ', this.innerText);
                if(this.innerText == 'Cierres Fiscales'){
                    self.click_close_fiscal();
                }else{
                    self.click_username();
                } 
            });
        },
        click_close_fiscal: function(){
            var self = this;
            this.gui.select_close_fiscal({
                'security':     true,
                'current_user': this.pos.get_cashier(),
                'title':      'Tipo de Cierre',
            }).then(function(type){
                console.info('click_close_fiscal type: ', type);
                if (type == 'z'){
                    var con = confirm("¿Esta seguro de imprimir cierre Z?");
                    if (!con){
                        return;
                    }
                }
                
                var response = self.pos.print_pos_fiscal_close(type);
                response.done(function (res) {
                   console.info('def click_close_fiscal: ', res);
                  
                }).fail(function(error, event){ 
                  
                });  
                self.renderElement();
            });
        },
       
        
    });  


    
    
});