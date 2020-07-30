# -*- coding: utf-8 -*-
##############################################################################
#
#    Copyright (C) 2007 PRONEXO.COM  (https://www.pronexo.com)
#    All Rights Reserved.
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as
#    published by the Free Software Foundation, either version 3 of the
#    License, or (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##############################################################################
# 
{
	'name': 'Pos Proxy Services',
	'summary': 'Proxy para usar odoo con impresores fiscales Argentinos para Epson / Hasar',
	'version': '11.0.1.0.2',
	'author': "pronexo.com",
	'license': "AGPL-3",
	'maintainer': 'pronexo.com',
	'category': 'sale',
	'website': 'https://www.pronexo.com',
	'depends': [
		'point_of_sale'
	],
	'data': [
		'views/uom_view.xml',
		'views/account_journal_view.xml',
		'views/pos_config_view.xml',
		'views/templates.xml'
	],
	'qweb': [
        'static/src/xml/pos.xml',        
    ],
	'external_dependencies': {
   
    },
        'price': 485,
        'currency': 'EUR',
        'installable': True,
        'license': 'OPL-1',
        'application': True,
        'auto_install': False,
        'images': ['images/pos-proxy-service-home.png'],
        'live_test_url': 'https://www.youtube.com/watch?v=hlgGmRnw-iE'
}
