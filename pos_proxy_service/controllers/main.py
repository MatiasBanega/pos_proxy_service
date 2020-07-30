
import json
import logging
import mimetypes
import werkzeug.wrappers
import odoo
from odoo import http, SUPERUSER_ID, api
from odoo.http import request
from odoo.addons.web.controllers.main import DataSet, Session, content_disposition

try:
	from odoo.addons.report_aeroo.controllers.main import ReportController as rc_aeroo
except Exception as e:
	rc_aeroo = None



from odoo.exceptions import UserError
import werkzeug.wrappers
import datetime, ast

def default(o):
	if isinstance(o, (datetime.date, datetime.datetime)):
		return o.isoformat()


def valid_response(data, status=200):
	"""Valid Response
	This will be return when the http request was successfully processed."""

	return werkzeug.wrappers.Response(
		status=status,
		content_type="application/json; charset=utf-8",
		response=json.dumps(data, default=default),
	)

class reports(http.Controller):
	MIMETYPES = {
		'txt': 'text/plain',
		'html': 'text/html',
		'doc': 'application/vnd.ms-word',
		'odt': 'application/vnd.oasis.opendocument.text',
		'ods': 'application/vnd.oasis.opendocument.spreadsheet',
		'pdf': 'application/pdf',
		'sxw': 'application/vnd.sun.xml.writer',
		'xls': 'application/vnd.ms-excel',
	}
   
	@http.route(['/c11/orders', '/c11/orders/<db>/<order_id>'], type='http', auth="none",  csrf=False)
	def report_api(self, db, order_id):

		request.session.db = db
		request.uid = SUPERUSER_ID
		
		
		try:
			
			order = request.env['sale.order'].sudo().browse(int(order_id))	
			report = order.type_config_id.report_id
			#report = request.env['ir.actions.report'].sudo()._get_report_from_name('aeroo_report_ar_sale_order')#sale.report_saleorder
			
			print('report: ', report.report_name)
			#return self.response_test(report.report_type)
			if report.report_type == 'aeroo':

				if not order.type_config_id.to_invoice:
					return rc_aeroo.report_routes(self, report.report_name, str(order.id), report.report_type)
				else:
					for invoice in order.invoice_ids:
						return rc_aeroo.report_routes(self, report.report_name, str(invoice.id), report.report_type)
				
			
			else:			
				#report = request.env['ir.actions.report'].sudo()._get_report_from_name('sale.report_saleorder')
				pdf = None
				if not order.type_config_id.to_invoice:
					pdf = report.render_qweb_pdf([order.id])[0]
				else:
					for invoice in order.invoice_ids:
						pdf = report.render_qweb_pdf([invoice.id])[0]
						break

				pdfhttpheaders = [
					('Content-Type', 'application/pdf'),
					('Content-Length', len(pdf)),
				]
				response = request.make_response(pdf, headers=pdfhttpheaders)			

				return response
			
			
		except Exception as e:
			return werkzeug.wrappers.Response(
				status=200,
				content_type="application/json; charset=utf-8",
				response=str(e),
			)


	def response_test(self, value):
		return werkzeug.wrappers.Response(
			status=200,
			content_type="application/json; charset=utf-8",
			response=str(value),
		)
		

class methods(http.Controller):	
	
	@http.route('/restful/authenticate', methods=["GET"], type="http", auth="none", csrf=False)
	def authenticate(self, db, login, password):    
		print('authenticate get: ', db) 
		#request.session.db = db   
		request.session.authenticate(db, login, password)
		return valid_response(request.env['ir.http'].session_info())		
	@http.route("/restful/search_read", type="http", auth="user", csrf=False)
	def search_read(self, model, fields=False, offset=0, limit=False, domain=None, sort=None):
		
		print('search_read; ', fields)	
		
		if  type(fields) == str:	
			fields = ast.literal_eval(fields)
		res =  DataSet().do_search_read(model, fields=fields, offset=offset, limit=limit, domain=domain, sort=sort)
		return valid_response(res)

	@http.route("/restful/call_kw", methods=["POST"], type="http", auth="user", csrf=False)
	def call_kw(self, model, fields=False, offset=0, limit=False, domain=None, sort=None):			
		res =  DataSet().do_search_read(model, fields=fields, offset=offset, limit=limit, domain=domain, sort=sort)
		return valid_response(res)

		
		

		
