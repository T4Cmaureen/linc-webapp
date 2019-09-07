#!/usr/bin/env python3.6
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

from tornado.web import asynchronous
from tornado.gen import coroutine
from lib.authentication import web_authenticated
from tornado.gen import engine, Task
from handlers.base import BaseHandler
from json import dumps, loads
from logging import info


class CheckAuthHandler(BaseHandler):
    SUPPORTED_METHODS = ("GET")

    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        resource_url = self.settings['API_URL'] + '/auth/check'
        response = yield Task(self.api_call, url=resource_url, method='GET')
        self.set_json_output()
        if response.code != 200:
            resource_url = self.settings['API_URL'] + '/auth/login'
            body = self.json_encode({'username': self.current_user['username']})
            response = yield Task(self.api_call, url=resource_url, method='POST', body=body)
            if response and response.code == 200:
                data = loads(response.body.decode('utf-8'))['data']
                obj = {
                    'username': self.current_user['username'],
                    'orgname': data['orgname'],
                    'admin': (data['role'] == 'admin'),
                    'token': data['token'],
                    'id': data['id'],
                    'organization_id': data['organization_id']
                }
                self.set_secure_cookie("userlogin", dumps(obj))
                self.response(200, 'The system executed an automatic new login on the API.', obj)
                return
        elif response.code == 200:
            self.response(200, 'Token valid for the current user.')
            return
        self.response(401, 'Fail to get user authentication.')


class LoginHandler(BaseHandler):
    SUPPORTED_METHODS = ("POST")

    @asynchronous
    @engine
    def post(self):
        if 'username' in self.input_data.keys() and \
           'password' in self.input_data.keys():
            # Check authentication with the API
            body = {'username': self.input_data['username'],
                    'password': self.input_data['password']}
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/auth/login',
                method='POST',
                body=self.json_encode(body))
            resp = loads(response.body.decode('utf-8'))
            if 200 <= response.code < 300:
                data = resp['data']
                obj = {
                    'username': self.input_data['username'],
                    'orgname': data['orgname'],
                    'admin': (data['role'] == 'admin'),
                    'token': data['token'],
                    'id': data['id'],
                    'organization_id': data['organization_id']
                }
                self.set_secure_cookie("userlogin", dumps(obj))
                # this will be acquired with the api
                self.response(response.code, resp['message'], obj)
            elif response.code == 412:
                self.set_status(response.code)
                output_response = {
                    'data': resp['data'],
                    'status': 'error',
                    'message': resp['message']
                }
                self.write(self.json_encode(output_response))
                self.finish()
            else:
                self.response(response.code, resp['message'])
        else:
            self.response(401, 'Invalid request, you must provide username and password to login.')


class AgreementAuthHandler(BaseHandler):
    SUPPORTED_METHODS = ("POST", "DELETE")

    @asynchronous
    @engine
    def post(self):
        if 'username' in self.input_data.keys() and \
           'agree_code' in self.input_data.keys():

            # Check authentication with the API
            body = {
                'username': self.input_data['username'],
                'agree_code': self.input_data['agree_code']
            }
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/auth/agree',
                method='POST',
                body=self.json_encode(body))
            resp = loads(response.body.decode('utf-8'))
            if 200 <= response.code < 300:
                data = resp['data']
                obj = {
                    'username': self.input_data['username'],
                    'orgname': data['orgname'],
                    'admin': (data['role'] == 'admin'),
                    'token': data['token'],
                    'id': data['id'],
                    'organization_id': data['organization_id']
                }
                self.set_secure_cookie("userlogin", dumps(obj))
                # this will be acquired with the api
                self.response(response.code, resp['message'], obj)
            elif response.code == 412:
                self.set_status(response.code)
                output_response = {
                    'data': resp['data'],
                    'status': 'error',
                    'message': resp['message']
                }
                self.write(self.json_encode(output_response))
                self.finish()
            else:
                self.response(response.code, resp['message'])
        else:
            self.response(401, 'Invalid request, you must provide username and password to login.')

    @asynchronous
    @engine
    @web_authenticated
    def delete(self, user_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/auth/agree/{}'.format(user_id),
            method='DELETE')
        self.set_status(response.code)
        if response.code in [200, 201]:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to delete cv results.'})


class LogoutHandler(BaseHandler):
    SUPPORTED_METHODS = ("POST")

    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        info(self.current_user)
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/auth/logout',
            method='POST',
            body='{}')
        if response and response.code in [200, 201]:
            self.clear_cookie("userlogin")
            self.response(200, 'Logout ok.')
        else:
            self.response(500, 'Fail to logout.')

class RecoveryHandler(BaseHandler):
    SUPPORTED_METHODS = ("GET", "POST")

    @asynchronous
    @coroutine
    def get(self, code=None):
        self.set_default_headers()
        title = 'Invalid request'
        msg = 'A code is required to use this resource.'
        if code:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/auth/recovery/' + code,
                method='GET')
            if hasattr(response, 'message'):
                message = response.message
            elif hasattr(response, 'body'):
                message = loads(response.body.decode('utf-8'))['message']
            else:
                message = ''
            if response.code in [200, 201]:
                body = loads(response.body.decode('utf-8'))
                data = body['data']
                info(data)
                title = data['title']
                msg = data['message']
            elif response.code == 400:
                msg = message
        redirect = "5;url=" + self.settings['login_url']
        info("message: {} redirect: {}".format(redirect))
        self.render('message.html', message=msg, title=title, redirect=redirect)
        return

    @asynchronous
    @coroutine
    def post(self):
        if 'email' in self.input_data.keys() and 'password' in self.input_data.keys():
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/auth/recovery',
                method='POST',
                body=self.json_encode(
                    {'email': self.input_data['email'],
                     'password': self.input_data['password']}))
            body = loads(response.body.decode('utf-8'))
            self.response(response.code, body['message'])
        else:
            self.response(400, 'An email and password is required to restart user\'s passwords.')


class ChangePassword(BaseHandler):
    SUPPORTED_METHODS = ("POST")

    @asynchronous
    @coroutine
    @web_authenticated
    def post(self):
        if 'new_password' in self.input_data.keys():
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/auth/changepassword',
                method='POST',
                body=self.json_encode({'new_password': self.input_data['new_password']}))
            resp = loads(response.body.decode('utf-8'))
            self.response(response.code, resp['message'])
        else:
            self.response(400, 'Fail to change the password.')


class RequestAccessEmailHandler(BaseHandler):
    SUPPORTED_METHODS = ("POST")

    @asynchronous
    @coroutine
    def post(self):
        if 'email' in self.input_data.keys():
            url = self.settings['API_URL'] + '/auth/requestaccess'
            body = {
                'email': self.input_data['email'],
                'fullname': self.input_data['fullname'],
                'organization': self.input_data['organization'],
                'geographical': self.input_data['geographical']}
            info(url)
            info(body)
            response = yield Task(self.api_call, url=url, method='POST', body=self.json_encode(body))
            resp = loads(response.body.decode('utf-8'))
            self.response(response.code, resp['message'])
        else:
            self.response(400, resp['message'])
