odoo.define('pos_proxy_service.models', function (require) {
"use strict";


var field_utils = require('web.field_utils');
var rpc = require('web.rpc');
var session = require('web.session');
var time = require('web.time');
var utils = require('web.utils');

var models = require('point_of_sale.models');


var posmodel_super = models.PosModel.prototype;
models.load_fields("res.partner", "l10n_ar_afip_responsibility_type_id");
models.load_fields("res.partner", "l10n_latam_identification_type_id");
/*models.load_fields("res.partner", "l10n_latam_identification_type_id");*/
models.load_fields("account.journal", "payment_afip");
models.load_fields("res.company", "l10n_ar_afip_responsibility_type_id");


var round_di = utils.round_decimals;
var round_pr = utils.round_precision;

models.PosModel = models.PosModel.extend({
    after_load_server_data: function(){
        var self = this;  
        if (this.config.use_fiscal_printer)    
            this.state_printer();
       return posmodel_super.after_load_server_data.call(this);      
     },  

    state_printer: function(){
        
        var def  = new $.Deferred();
        var self = this;
        var url = this.config.proxy_fiscal_printer + '/state_printer';
    
    
        var print_fiscal_proxy = $.ajax({
            type: "GET",             
            url: url,
           
            timeout:100000
        });

        print_fiscal_proxy.then(function(res){              
          console.info('state_printer res: ', res);    
          def.resolve(res);      
          self.message_error_printer_fiscal(res['response'])
          
         
        }).fail(function(xhr, textStatus, errorThrown){  
          self.message_error_printer_fiscal('Comunicación fallida con el Proxy')
          def.reject();
        }); 
        return def;

    },


    print_pos_fiscal_close: function(type){
        
        var def  = new $.Deferred();
        var self = this;
        var url = this.config.proxy_fiscal_printer + '/print_pos_fiscal_close';
        console.info('print_pos_fiscal_close url: ', url);
        var data =  {'type' : type};
        var print_fiscal_proxy = $.ajax({
            type: "GET",             
            url: url,
            data : data,
            timeout:100000
        });

        print_fiscal_proxy.then(function(res){              
          console.info('print_pos_fiscal_close res: ', res);    
          def.resolve(res);      
          self.message_error_printer_fiscal(res['response'])
          
         
        }).fail(function(xhr, textStatus, errorThrown){  
          self.message_error_printer_fiscal('Comunicación fallida con el Proxy')
          def.reject();
        }); 
        return def;

    },


    print_pos_ticket: function(){
    	
    	var def  = new $.Deferred();
        var self = this;
        var url = this.config.proxy_fiscal_printer + '/print_pos_ticket';
        console.info('print_pos_ticket url: ', url);
        var data =  {'vals' : JSON.stringify(self.get_values_ticket())};
        var print_fiscal_proxy = $.ajax({
            type: "GET",             
            url: url,
            data : data,
            timeout:100000
        });

        print_fiscal_proxy.then(function(res){              
          console.info('print_pos_ticket res: ', res);    
          def.resolve(res);      
          self.message_error_printer_fiscal(res['response'])
          
         
        }).fail(function(xhr, textStatus, errorThrown){  
          self.message_error_printer_fiscal('Comunicación fallida con el Proxy')
          def.reject();
      	}); 
      	return def;

    },
    get_values_ticket: function(){
        var order = this.get_order();       
        
        var type = this.get_value_type();
                   
        var cliente = this.get_values_client();
        var order_lines = this.get_order().get_orderlines();
        var items = this.get_values_items();
        var pagos = this.get_values_paymentlines();
        var descuentos = this.get_values_discount();
        //console.info('pagos: ', pagos);
        var jsonTemplate = {
            'type': type, 
            'cliente' :cliente,
            'items' :items,
            'pagos':pagos,
            'descuentos': descuentos,
            'ajustes': []// {'descripcion' : 'Ajuste 0.2', 'monto' : 0.2, 'tasa_iva' : '', 'codigo_interno' : '', 'codigo_condicion_iva' : ''} ]

        };
        console.info('jsonTemplate: ', jsonTemplate);
        return jsonTemplate;
    },
    get_value_type: function(){
        var client = this.get_client();
        var type = 83;
        if(client){
            var company_type_afip_monotributo = false;
            if (this.company.l10n_ar_afip_responsibility_type_id && this.company.l10n_ar_afip_responsibility_type_id[1] == 'Responsable Monotributo'){
                company_type_afip_monotributo = true;
            }
            if (client.l10n_ar_afip_responsibility_type_id && !company_type_afip_monotributo){
                if(client.l10n_ar_afip_responsibility_type_id[1] == 'IVA Responsable Inscripto') type = 81; //Factura A
                else if(client.l10n_ar_afip_responsibility_type_id[1] == 'Responsable Monotributo') type = 111;//Factura C
                else if(client.l10n_ar_afip_responsibility_type_id[1] == 'Consumidor Final' || client.l10n_ar_afip_responsibility_type_id[1] == 'IVA Sujeto Exento') type = 82;//Factura B
            }
            else if(company_type_afip_monotributo){
                type = 111;
            }
        }
        return type;
    },
    get_values_client: function(){
        var client = this.get_client();
        //console.info('get_values_ticket: ', client);
        if (client){
            var id_responsabilidad_iva = 'E';
            if (client.l10n_ar_afip_responsibility_type_id){
                if(client.l10n_ar_afip_responsibility_type_id[1] == 'IVA Responsable Inscripto') id_responsabilidad_iva = 'I'; 
                else if(client.l10n_ar_afip_responsibility_type_id[1] == 'Responsable Monotributo') id_responsabilidad_iva = 'M';
                else if(client.l10n_ar_afip_responsibility_type_id[1] == 'Consumidor Final') id_responsabilidad_iva = 'F';
                else if(client.l10n_ar_afip_responsibility_type_id[1] == 'IVA Sujeto Exento') id_responsabilidad_iva = 'E';
            }
            /*id_tipo_documento = {
                'D' : 'DNI' , 
                'L' : 'CUIL' , 
                'T' : 'CUIT' , 
                'C' : 'Cédula de Identidad' ,
                'P' : 'Pasaporte' , 
                'V' : 'Libreta Cívica' , 
                'E' : 'Libreta de Enrolamiento '
            } */
            var id_tipo_documento = 'T';
            if (client.l10n_latam_identification_type_id){

                if(client.l10n_latam_identification_type_id[1] == 'CUIT') id_tipo_documento = 'T';
                if(client.l10n_latam_identification_type_id[1] == 'DNI') id_tipo_documento = 'D';
                if(client.l10n_latam_identification_type_id[1] == 'CUIL') id_tipo_documento = 'L';
                if(client.l10n_latam_identification_type_id[1] == 'PAS') id_tipo_documento = 'P';
                //if(client.l10n_latam_identification_type_id[1] == 'PAS') id_tipo_documento = 'P';
            }
            var street = '';
            var city = '';
            var l10n_latam_identification_type_id = '';
            if (client.street) street = client.street;
            if(client.city) city = client.city;
            if(client.l10n_latam_identification_type_id) l10n_latam_identification_type_id = client.l10n_latam_identification_type_id;
            return {
                'nombre_o_razon_social1' : client.name,
                'nombre_o_razon_social2' : '',
                'domicilio1' : street,
                'domicilio2' : city,
                'domicilio3' : '',
                'id_tipo_documento' : id_tipo_documento,
                'numero_documento' : l10n_latam_identification_type_id,
                'id_responsabilidad_iva' : id_responsabilidad_iva,
                'documento_asociado1' : '',
                'documento_asociado2' : '',
                'documento_asociado3' : '',
                'cheque_reintegro_turista' : ''
            };
        }
        return {};
    },
    get_values_items: function(){
       var order_lines = this.get_order().get_orderlines();
       var items = [];
        /*[
                {'description' : 'Lenovo Idpad', 'description_extra1' : 'I7', 'qty' : 1, 'price' : 0.05, 'iva' : 21, 
                'unit_measure' : '7', 'code_intern' : 'pl758'},
                /*{'description' : 'Mouse Optico Logitech', 'description_extra1' : 'Af56', 'qty' : 1, 'price' : 0.03, 'iva' : 21, 
                'unit_measure' : '7', 'code_intern' : 'LP'},
                {'description' : 'Audifonos Logitech', 'description_extra1' : 'kk7', 'qty' : 1, 'price' : 0.05, 'iva' : 21, 
                'unit_measure' : '7', 'code_intern' : 'pl758'}*/
            //]
        for (var i = 0; i < order_lines.length; i++) {
            var line = order_lines[i];
            var taxes = line.get_taxes();
            var iva = 0; //Tasa de iva ninguno
            var code_intern = '';
            var unit_measure = 0;//Sin unidad de medida
            
            for (var k = 0; k < taxes.length; k++){
                if (taxes[k]){
                    iva = taxes[k].amount;
                    break;
                }
            }

            var uom = line.get_unit()
            if (uom) unit_measure = parseInt(uom.afip_uom);
            if(line.product.barcode) code_intern = line.product.barcode;
            else if(line.product.default_code) code_intern = line.product.default_code;

            if(code_intern == '') code_intern = '11111';
            
            var price_total = line.get_all_prices()['priceWithTax'];
            var item_vals = {
                'description' : line.product.display_name,
                'description_extra1' : '',
                'qty' : line.quantity,
                'price' : price_total,
                'iva' : iva,
                'unit_measure' : String(unit_measure),
                'code_intern' : code_intern
            };
            items.push(item_vals);
        }
        return items;
    },
    get_values_paymentlines: function(){
        var paymentlines = this.get_order().get_paymentlines();
        //console.info('paymentlines: ', paymentlines);
        var pagos = [];
         /*[      
                {'codigo_forma_pago' : 20,
                'cantidad_cuotas' : 3, 'monto' : 0.02345, 'descripcion_cupones' : 'Cupones', 'descripcion' : 'Descripcion test', 'descripcion_extra1' : 'des1', 'descripcion_extra2' : 'des2'}
            ]*/
        for (var i = 0; i < paymentlines.length; i++){
            var pay = paymentlines[i];
            var payment_afip = 99;//Otras Formas de pago

            if (pay.cashregister && pay.cashregister.journal && pay.cashregister.journal.payment_afip) payment_afip = pay.cashregister.journal.payment_afip;

            var pay_vals = {
                'codigo_forma_pago' : payment_afip,
                'cantidad_cuotas': '',
                'monto' : pay.amount,
                'descripcion_cupones' : '',
                'descripcion' : pay.name,
                'descripcion_extra1' : '',
                'descripcion_extra2' : ''
            }
            pagos.push(pay_vals);
        }
        return pagos;

    },
    get_values_discount: function(){
        var order_lines = this.get_order().get_orderlines();
        var rounding = this.currency.rounding;
        var sum_amount_discount = 0;

        for (var i = 0; i < order_lines.length; i++){
            var line = order_lines[i];
            var base_price = line.get_base_price()
            var price_line_bruto = round_pr(line.get_unit_price() * line.get_quantity(), rounding);
            var discount = price_line_bruto - base_price;
            //console.info('discount: ', discount);
            sum_amount_discount += discount;
        }
        if (sum_amount_discount == 0) return [];
        vals = [      
            {'descripcion' : 'Descuentos', 'monto' : sum_amount_discount, 'tasa_iva' : '', 'codigo_interno' : '', 'codigo_condicion_iva' : ''}
        ];
        return vals;
    },
    message_error_printer_fiscal: function(error){
        var self= this;
        if (error != true){
            self.gui.show_popup('error', {
                'title': 'Error Impresora Fiscal',
                'body':  error,
            });
        }
    }
    
});



});

