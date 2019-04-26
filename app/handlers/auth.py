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
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        resource_url = self.settings['API_URL'] + '/auth/check'
        response = yield Task(self.api_call, url=resource_url, method='GET')
        self.set_json_output()
        if response.code != 200:
            resource_url = self.settings['API_URL'] + '/auth/login'
            body = self.json_encode(
                {'username': self.current_user['username'],
                 'password': self.current_user['password']})
            response = yield Task(self.api_call, url=resource_url, method='POST', body=body)
            if response and response.code == 200:
                data = loads(response.body.decode('utf-8'))['data']
                obj = {'username': self.current_user['username'],
                       'orgname': data['orgname'],
                       'admin': (data['role'] == 'admin'),
                       'token': data['token'],
                       'id': data['id'],
                       'organization_id': data['organization_id'],
                       'password': self.current_user['password']}
                self.set_secure_cookie("userlogin", dumps(obj))
                del obj['password']
                self.response(200, 'The system executed an automatic new login on the API.', obj)
                return
        elif response.code == 200:
            self.response(200, 'Token valid for the current user.')
            return
        self.response(401, 'Fail to get user authentication.')


class LoginHandler(BaseHandler):
    @asynchronous
    @engine
    def post(self):
        if self.input_data['username'] and self.input_data['password']:
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
                obj = {'username': self.input_data['username'],
                       'orgname': data['orgname'],
                       'admin': (data['role'] == 'admin'),
                       'token': data['token'],
                       'id': data['id'],
                       'organization_id': data['organization_id'],
                       'password': self.input_data['password']}
                self.set_secure_cookie("userlogin", dumps(obj))
                del obj['password']
                # this will be acquired with the api
                self.response(response.code, resp['message'], obj)
            else:
                self.response(response.code, resp['message'])
        else:
            self.response(401, 'Invalid request, you must provide username and password to login.')


class LogoutHandler(BaseHandler):
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


class ResetPassword(BaseHandler):
    @asynchronous
    @coroutine
    def post(self):
        if 'email' in self.input_data.keys():
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/auth/recover',
                method='POST',
                body=self.json_encode({'email': self.input_data['email']}))
            resp = loads(response.body.decode('utf-8'))
            self.response(response.code, resp['message'])
        else:
            self.response(400, 'An email is required to restart user\'s passwords.')


class ChangePassword(BaseHandler):
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
