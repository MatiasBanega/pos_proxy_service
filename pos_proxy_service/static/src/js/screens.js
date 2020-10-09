odoo.define('pos_proxy_service.screens', function (require) {
    "use strict";
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var utils = require('web.utils');
    var field_utils = require('web.field_utils');

    var QWeb = core.qweb;
    var round_di = utils.round_decimals;
    var round_pr = utils.round_precision;



    screens.PaymentScreenWidget.include({

        show: function(){

            if (this.pos.config.use_fiscal_printer)
                this.$('.js_invoice').addClass('oe_hidden');
            this._super();
        },        
        order_is_valid: function(force_validation) {
            var self = this;
            var order = this.pos.get_order();
            
            var valid = this._super(force_validation); 
            if (!this.pos.config.use_fiscal_printer) return valid;
            var valid_fiscal = true;
            var next_highlight =  self.$('.next').hasClass('highlight') ;
            console.info('next_highlight: ', next_highlight);
            if (!next_highlight) return false;
            console.info('valid: ', valid);
            if (valid){
                //if (order.is_to_invoice()){
                if(!this.valid_client()) valid_fiscal = false;
                else if(!this.valid_payments()) valid_fiscal = false;
                //} 

                
            }
            console.info('valid_fiscal: ', valid_fiscal);
            if (valid_fiscal){
                var response = this.pos.print_pos_ticket();
                self.$('.next').addClass('oe_hidden');
                response.done(function (res) {
                    console.info('screens response: ', res)
                    try { 
                        self.$('.next').removeClass('oe_hidden');
                    } catch (err) {
                        console.error('error: ' + err.message);                       
                    }
                    
                    if (res['response'] == true){
                        try { 
                             self.finalize_validation(); 

                        } catch (err) {
                            console.error('error finalize_validation: ' + err.message);
                            self.pos.get_order().finalize();                           
                        }
                                                            
                    }                   
                }).fail(function(error, event){ 
                  self.$('.next').removeClass('oe_hidden');

                });                     
            }
            return false;
            
        },
        valid_payments: function(){

            var paymentlines = this.pos.get_order().get_paymentlines();                
            var pagos = []; 
            var valid = true;               
            for (var i = 0; i < paymentlines.length; i++){
                var pay = paymentlines[i];                  

                if (pay.cashregister && pay.cashregister.journal && !pay.cashregister.journal.payment_afip) {
                    valid = false;
                    this.pos.message_error_printer_fiscal(pay.name + " sin tipo de pago AFIP asignado");
                    break;
                }
                    
            } 
            console.info('valid_payments: ', valid);
            return valid;
                
        },
        valid_client: function(){
            var client = this.pos.get_client();  
            /*if(!client) {
                this.pos.message_error_printer_fiscal("Debe seleccionar un cliente");
                return false;
            }  */  
            console.info('valid_client: ', client);             
            if(client && !client.l10n_ar_afip_responsibility_type_id){
                this.pos.message_error_printer_fiscal("Tipo de Responsabilidad en cliente, es requerido");
                return false;
            }    
            else if(client && !client.l10n_latam_identification_type_id){
                this.pos.message_error_printer_fiscal("AFIP Identificación en cliente, es requerido");
                return false;
            } 
            else if(client && !client.vat){
                this.pos.message_error_printer_fiscal("Numero Identificación en cliente, es requerido");
                return false;
            } 
            console.info('valid_client: ', true); 
            return true;            
        }


    });

    screens.ReceiptScreenWidget.include({ 
        handle_auto_print: function() {

            var self = this;
            if (this.pos.config.use_fiscal_printer){  
                /*self.$('.print').addClass('oe_hidden');
                self.$('.next').addClass('oe_hidden');
                self.$('.pos-sale-ticket').addClass('oe_hidden');
                var response = this.pos.print_pos_ticket();
                response.done(function (res) {
                   console.info('def print: ', res);
                   self.printer_fiscal_valid(res);
                }).fail(function(error, event){ 
                  //console.info('load_new_partners')            
                    self.lock_screen(false);
                    self.$('.print').removeClass('oe_hidden');
                    self.$('.next').removeClass('oe_hidden');

                });  */
                this.click_next();

                
                
            }else{
                this._super(); 
            }
            
        },
        print: function() {
            var self = this;
            if (this.pos.config.use_fiscal_printer){  
                self.$('.print').addClass('oe_hidden');
                var response = this.pos.print_pos_ticket();
                response.done(function (res) {
                   console.info('def print: ', res);
                   self.printer_fiscal_valid(res);
                }).fail(function(error, event){ 
                  //console.info('load_new_partners')            
                    self.$('.print').removeClass('oe_hidden');
                    self.$('.next').removeClass('oe_hidden');
                });                  
                
            }else{
                this._super(); 
            }
            
        },
        printer_fiscal_valid: function(res){
            var self = this;
            if (res['response'] == true){
                this.click_next();
                
            }else{
                self.$('.print').removeClass('oe_hidden');
                self.$('.next').removeClass('oe_hidden');
                this.lock_screen(false);
            }
        }
        
    });  


    
    
});