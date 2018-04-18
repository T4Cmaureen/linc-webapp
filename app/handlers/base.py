#!/usr/bin/env python
# -*- coding: utf-8 -*-

# LINC is an open source shared database and facial recognition
# system that allows for collaboration in wildlife monitoring.
# Copyright (C) 2016  Wildlifeguardians
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
# For more information or to contact visit linclion.org or email tech@linclion.org

from json import loads, dumps
from tornado.web import RequestHandler, asynchronous
from tornado.gen import engine
import string
from tornado.httpclient import AsyncHTTPClient, HTTPRequest, HTTPError
from tornado.httputil import HTTPHeaders
from logging import info


class BaseHandler(RequestHandler):
    """A class to collect common handler methods - all other handlers should
    inherit this one.
    """
    def get_current_user(self):
        cookieinfo = self.get_secure_cookie("userlogin")
        if cookieinfo:
            cookieinfo = loads(cookieinfo.decode('utf-8'))
        return cookieinfo

    def prepare(self):
        self.input_data = dict()
        if self.request.method in ['POST', 'PUT'] and \
           self.request.headers["Content-Type"].startswith("application/json"):
            try:
                if self.request.body:
                    self.input_data = loads(self.request.body.decode("utf-8"))
                for k, v in self.request.arguments.items():
                    if str(k) != str(self.request.body.decode("utf-8")):
                        self.input_data[k] = v[0].decode("utf-8")
            except ValueError:
                self.response(400, 'Fail to parse input data.')

    @asynchronous
    @engine
    def api(self, url, method, body=None, headers=None, callback=None):
        AsyncHTTPClient.configure("tornado.curl_httpclient.CurlAsyncHTTPClient")
        http_client = AsyncHTTPClient()
        dictheaders = {"content-type": "application/json"}
        if headers:
            for k, v in headers.items():
                dictheaders[k] = v
        h = HTTPHeaders(dictheaders)
        params = {
            'headers': h,
            'url': url,
            'method': method,
            'request_timeout': 720,
            'validate_cert': False}
        if method in ['POST', 'PUT']:
            params['body'] = body
        request = HTTPRequest(**params)
        try:
            response = yield http_client.fetch(request)
        except HTTPError as e:
            info('HTTTP error returned... ')
            info('Code: ' + str(e.code))
            if e.response:
                info('URL: ' + str(e.response.effective_url))
                info('Reason: ' + str(e.response.reason))
                info('Body: ' + str(e.response.body))
                response = e.response
            else:
                response = e
        except Exception as e:
            # Other errors are possible, such as IOError.
            info("Other Errors: " + str(e))
            response = e
        callback(response)

    def response(self, code, message="", data=None, headers=None):
        output_response = {'status': None, 'message': message}
        if data:
            output_response['data'] = data
        if code < 300:
            output_response['status'] = 'success'
        elif code >= 300 and code < 400:
            output_response['status'] = 'redirect'
        elif code >= 400 and code < 500:
            output_response['status'] = 'error'
        else:
            output_response['status'] = 'fail'
        if headers and isinstance(headers, dict):
            for k, v in headers.items():
                self.add_header(k, v)
        self.set_status(code)
        self.write(self.json_encode(output_response))
        self.finish()

    def sanitizestr(self, strs):
        txt = "%s%s" % (string.ascii_letters, string.digits)
        return ''.join(c for c in strs if c in txt)

    def json_encode(self, value):
        return dumps(value, default=str).replace("</", "<\\/")

    def set_default_headers(self):
        self.set_header('Content-Type', 'text/html; charset=UTF-8')

    def set_json_output(self):
        self.set_header('Content-Type', 'application/json; charset=UTF-8')

    def write_error(self, status_code=404, **kwargs):
        self.render('error.page.html', status_code=status_code)


class VersionHandler(BaseHandler):
    def get(self):
        self.set_json_output()
        self.response(200, message=self.settings['version'])
