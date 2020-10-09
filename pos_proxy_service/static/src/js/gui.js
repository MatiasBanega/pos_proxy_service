odoo.define('pos_proxy_service.gui', function (require) {
    "use strict";
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var rpc = require('web.rpc');
    var utils = require('web.utils');
    var field_utils = require('web.field_utils');

  


    gui.Gui.include({
        select_close_fiscal: function(options){
            console.info('select_close_fiscal');
            options = options || {};
            var self = this;
            var def  = new $.Deferred();

            var list = [];
           
            list.push({
                'label': "Cierre X",
                'item':  "x",
            });
            list.push({
                'label': "Cierre Z",
                'item':  "z",
            });
           

            this.show_popup('selection',{
                title: options.title || _t('Select User'),
                list: list,
                confirm: function(type){ def.resolve(type); },
                cancel: function(){ def.reject(); },
                //is_selected: function(user){ return user === self.pos.get_cashier(); },
            });

            return def.done(function(type){
                return type;
            });
        },
        
    });  


    
    
});