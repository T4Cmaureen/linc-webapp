#!/usr/bin/env python
# coding: utf-8

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
from lib.authentication import web_authenticated
from tornado.gen import engine, coroutine, Task
from handlers.base import BaseHandler
from os.path import realpath, dirname
from os import remove, mkdir, chdir, curdir
from base64 import b64encode
from json import loads, dumps
from logging import info
from uuid import uuid4 as uid
from zipfile import ZipFile
from shutil import rmtree
from datetime import datetime, timedelta
from utils.rolecheck import allowedRole
from tornadoist import ProcessMixin
import pycurl
from lib.exif import get_exif_data


class RelativesHandler(BaseHandler):
    SUPPORTED_METHODS = ("GET", "PUT", "POST", "DELETE")

    @asynchronous
    @engine
    @web_authenticated
    def get(self, lion_id=None):
        if lion_id:
            resource_url = '/lions/' + lion_id + '/relatives'
            url = self.settings['API_URL'] + resource_url
            info(url)
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(self.api, url=url, method='GET', headers=headers)
            self.set_json_output()
            if response.code == 404:
                body = loads(response.body.decode("utf-8"))
                self.finish(self.json_encode({
                            'status': 'success',
                            'message': body['message'],
                            'data': []}))
            else:
                self.set_status(response.code)
                self.finish(response.body)
        else:
            self.response(401, 'Invalid request, you must provide lion id.')

    @asynchronous
    @engine
    @web_authenticated
    def post(self, lion_id=None):
        if lion_id:
            resource_url = '/lions/' + lion_id + '/relatives'
            body = self.json_encode(self.input_data)
            url = self.settings['API_URL'] + resource_url
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(self.api, url=url, method='POST', body=body, headers=headers)
            self.set_json_output()
            self.set_status(response.code)
            self.finish(response.body)
        else:
            self.response(401, 'Invalid request, you must provide lion id.')

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, lion_id=None, rurl=None, relat_id=None):
        if lion_id and relat_id:
            resource_url = '/lions/' + lion_id + '/relatives/' + relat_id
            body = self.json_encode(self.input_data)
            url = self.settings['API_URL'] + resource_url
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(self.api, url=url, method='PUT', body=body, headers=headers)
            self.set_json_output()
            self.set_status(response.code)
            self.finish(response.body)
        elif relat_id:
            self.response(401, 'Invalid request, you must provide lion id.')
        else:
            self.response(401, 'Invalid request, you must provide relative lion id.')

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, lion_id=None, rurl=None, relat_id=None):
        if lion_id and relat_id:
            resource_url = '/lions/' + lion_id + '/relatives/' + relat_id
            body = self.json_encode({"message": "delete relation"})
            url = self.settings['API_URL'] + resource_url
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(self.api, url=url, method='DELETE', body=body, headers=headers)
            self.set_json_output()
            self.set_status(response.code)
            self.finish(response.body)
        elif relat_id:
            self.response(401, 'Invalid request, you must provide lion id.')
        else:
            self.response(401, 'Invalid request, you must provide relative lion id.')


class DataExportHandler(BaseHandler):
    SUPPORTED_METHODS = ('POST')

    @asynchronous
    @engine
    @web_authenticated
    def post(self, lions=None, imagesets=None):
        resource_url = '/data/export/'
        body = self.json_encode(self.input_data)
        url = self.settings['API_URL'] + resource_url
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(self.api, url=url, method='POST', body=body, headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish(self.json_encode({'status': 'error', 'messagem': 'Bad request'}))


class ImageSetsListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        resource_url = '/imagesets/list'
        url = self.settings['API_URL'] + resource_url
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(self.api, url=url, method='GET', headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get Image Set profile'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self, imageset_id=None, cvrequest=None):
        resource_url = '/imagesets/' + imageset_id + '/cvrequest'
        body = self.json_encode(self.input_data)
        url = self.settings['API_URL'] + resource_url
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(self.api, url=url, method='POST', body=body, headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish(self.json_encode({'status': 'error', 'messagem': 'Bad request'}))


class ImagesListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        resource_url = '/images/list'
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(self.api, url=self.settings['API_URL'] + resource_url, method='GET', headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get Images GET'})


class LionsListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        resource_url = '/lions/list'
        org_id = self.get_argument('org_id', None)
        if org_id:
            resource_url += '?org_id=' + str(org_id)
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(self.api, url=self.settings['API_URL'] + resource_url, method='GET', headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get Lions GET'})


class OrganizationsListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        resource_url = '/organizations/list'
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(self.api, url=self.settings['API_URL'] + resource_url, method='GET', headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get Organizations GET'})


class CVResultsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, res_id='', xlist=None):
        resource_url = '/cvresults/' + res_id
        if xlist:
            resource_url += '/' + xlist

        info(resource_url)
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='GET',
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get CV Results GET'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        resource_url = '/cvresults'
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='POST',
            body=self.json_encode(self.input_data),
            headers=headers)
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to access the cvresults POST'})

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, res_id=None):
        resource_url = '/cvresults/' + res_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='PUT',
            body=self.json_encode({"message": "updating resources"}),
            headers=headers)
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to access the cvresults PUT'})


class CVRequestHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, req_id=''):
        resource_url = '/cvrequests/' + req_id
        info(resource_url)
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='GET',
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get CV Requests GET'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, req_id=None):
        resource_url = '/cvrequests/' + req_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='DELETE',
            body=self.json_encode({"message": "updating resources"}),
            headers=headers)
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to delete cvresults (request) DELETE'})


class LionsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, lion_id='', locations=None):
        resource_url = '/lions'
        api = self.get_argument('api', '')
        if lion_id:
            resource_url += '/' + lion_id
            if api:
                resource_url += '?api=true'
        elif api:
            resource_url += '?api=true'
        info(resource_url)
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='GET',
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get Lions GET'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        resource_url = '/lions'
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='POST',
            body=self.json_encode(self.input_data),
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        self.finish(response.body)

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, lion_id=None):
        self.set_json_output()
        if lion_id:
            resource_url = '/lions/' + lion_id
            info(self.input_data)
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            info(data)
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(
                self.api,
                url=self.settings['API_URL'] + resource_url,
                method='PUT',
                body=self.json_encode(data),
                headers=headers)
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'fail to save lion data'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'you need to provide an lion id PUT'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, lion_id=None):
        resource_url = '/lions/' + lion_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='DELETE',
            body=self.json_encode({"message": "delete lion"}),
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to delete lion DELETE'})


class ImageSetsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, imageset_id='', param=None):
        resource_url = '/imagesets'
        if imageset_id:
            resource_url += '/' + imageset_id
        info(resource_url)
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='GET',
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get Image Sets GET'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        resource_url = '/imagesets'
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='POST',
            body=self.json_encode(self.input_data),
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to create new imageset POST'})

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, imageset_id=None):
        self.set_json_output()
        if imageset_id:
            resource_url = '/imagesets/' + imageset_id
            info(self.input_data)
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            info(data)
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(
                self.api,
                url=self.settings['API_URL'] + resource_url,
                method='PUT',
                body=self.json_encode(data),
                headers=headers)
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'fail to save imageset data'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'you need to provide an imageset id PUT'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, imageset_id=None):
        resource_url = '/imagesets/' + imageset_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='DELETE',
            body=self.json_encode({"message": "delete imageset"}),
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to delete imageset DELETE'})


class OrganizationsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, organization_id=''):
        resource_url = '/organizations'
        if organization_id:
            resource_url += '/' + organization_id
        info(resource_url)
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='GET',
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get organizations GET'})

    @asynchronous
    @engine
    @web_authenticated
    @allowedRole('admin')
    def post(self):
        resource_url = '/organizations'
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='POST',
            body=self.json_encode(self.input_data),
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to create new organization POST'})

    @asynchronous
    @coroutine
    @web_authenticated
    @allowedRole('admin')
    def put(self, organization_id=None):
        self.set_json_output()
        if organization_id:
            resource_url = '/organizations/' + organization_id
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(
                self.api,
                url=self.settings['API_URL'] + resource_url,
                method='PUT',
                body=self.json_encode(data),
                headers=headers)
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'fail to save organization data'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'you need to provide an organization id PUT'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, organization_id=None):
        resource_url = '/organizations/' + organization_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='DELETE',
            body=self.json_encode({"message": "delete organization"}),
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to delete organization DELETE'})


class UsersHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, user_id=''):
        resource_url = '/users/' + user_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='GET',
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to get Users GET'})

    @asynchronous
    @engine
    @web_authenticated
    @allowedRole('admin')
    def post(self):
        resource_url = '/users'
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='POST',
            body=self.json_encode(self.input_data),
            headers=headers)
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to create new user POST'})

    @asynchronous
    @coroutine
    @web_authenticated
    @allowedRole('admin')
    def put(self, user_id=None):
        self.set_json_output()
        if user_id:
            resource_url = '/users/' + user_id
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(
                self.api,
                url=self.settings['API_URL'] + resource_url,
                method='PUT',
                body=self.json_encode(data),
                headers=headers)
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'fail to save user data'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'you need to provide an user id PUT'})

    @asynchronous
    @coroutine
    @web_authenticated
    @allowedRole('admin')
    def delete(self, user_id=None):
        resource_url = '/users/' + user_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='DELETE',
            body=self.json_encode({"message": "delete user"}),
            headers=headers)
        self.set_status(response.code)
        self.set_json_output()
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to delete user DELETE'})


class ImagesHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, image_id=''):
        self.set_json_output()
        download = self.get_argument('download', '')
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        if download:
            resource_url = '/images?download=' + download
            response = yield Task(
                self.api,
                url=self.settings['API_URL'] + resource_url,
                method='GET',
                headers=headers)
            if response and response.code == 200:
                respdata = loads(response.body.decode('utf-8'))
                links = respdata['data']
                folder = self.settings['static_path'] + '/' + str(uid())
                mkdir(folder)
                for link in links:
                    info('Downloading: ' + link['url'])
                    # urllib.urlretrieve(link,folder+'/'+link.split('/')[-1])
                    # r = http.request('GET',link)
                    # with open(folder+'/'+link.split('/')[-1],'wb') as f:
                    #    f.write(r.data)
                    # with open(folder+'/'+link.split('/')[-1], 'wb') as f:
                    with open(folder + '/' + link['filename'], 'wb') as f:
                        c = pycurl.Curl()
                        c.setopt(pycurl.USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 6.1; it; rv:1.9.2.3) Gecko/20100401 Firefox/3.6.3 (.NET CLR 3.5.30729)')
                        c.setopt(c.URL, link['url'])
                        c.setopt(c.WRITEDATA, f)
                        c.perform()
                        c.close()
                curpath = dirname(realpath(curdir))
                chdir(folder)
                info('Creating zip file: ' + folder + '.zip')
                with ZipFile(folder + '.zip', 'w') as myzip:
                    for link in links:
                        myzip.write(link['filename'])
                chdir(curpath)
                rmtree(folder)
                dtexec = datetime.now() + timedelta(hours=1)
                jobid = str(uid())
                self.settings['scheduler'].add_job(
                    remove_file,
                    trigger='date',
                    name='Remove file ' + folder + '.zip at ' + str(dtexec),
                    run_date=dtexec,
                    args=[self.settings['scheduler'], folder + '.zip', jobid], coalesce=True, id=jobid)
                self.set_header('Content-Type', 'application/octet-stream')
                self.set_header('Content-Disposition', 'attachment; filename=' + folder.split('/')[-1] + '.zip')
                with open(folder + '.zip', 'rb') as f:
                    self.write(f.read())
                self.finish()
            else:
                self.response(500, 'fail to get urls to download the images')
                return
        else:
            resource_url = '/images/' + image_id
            response = yield Task(
                self.api,
                url=self.settings['API_URL'] + resource_url,
                method='GET',
                headers=headers)
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'fail to get Images GET'})

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, image_id=None):
        self.set_json_output()
        if image_id:
            resource_url = '/images/' + image_id
            info(self.input_data)
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            info(data)
            headers = {'Linc-Api-AuthToken': self.current_user['token']}
            response = yield Task(
                self.api,
                url=self.settings['API_URL'] + resource_url,
                method='PUT',
                body=self.json_encode(data),
                headers=headers)
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'fail to save images data'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'you need to provide an images id PUT'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, image_id=None):
        resource_url = '/images/' + image_id
        headers = {'Linc-Api-AuthToken': self.current_user['token']}
        response = yield Task(
            self.api,
            url=self.settings['API_URL'] + resource_url,
            method='DELETE',
            body=self.json_encode({"message": "delete image"}),
            headers=headers)
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'fail to delete image DELETE'})


class ImagesUploadHandler(BaseHandler, ProcessMixin):
    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        if self.request.files:
            fileinfo = self.request.files['file'][0]
            body = fileinfo['body']
            fname = fileinfo['filename']
            dirfs = dirname(realpath(__file__))
            fh = open(dirfs + '/' + fname, 'wb')
            fh.write(body)
            fh.close()
            exif_data = get_exif_data(dirfs + '/' + fname)
            with open(dirfs + '/' + fname, "rb") as imageFile:
                fileencoded = b64encode(imageFile.read())
            if fileencoded:
                remove(dirfs + '/' + fname)
                image_type = self.get_argument("image_type", "cv")
                image_tags = self.get_argument("image_tags", "[]")
                is_public = self.get_argument("is_public", '')
                is_public = (is_public.lower() == 'true')
                image_set_id = self.get_argument("image_set_id")
                iscover = self.get_argument("iscover", '')
                iscover = (iscover.lower() == 'true')
                body = {
                    "image_type": image_type,
                    "image_tags": image_tags,
                    "is_public": is_public,
                    "image_set_id": int(image_set_id),
                    "iscover": iscover,
                    "filename": fname,
                    "exif_data": exif_data
                }
                body["image"] = fileencoded.decode('utf-8')
                resource_url = '/images/upload'
                headers = {'Linc-Api-AuthToken': self.current_user['token']}
                response = yield Task(
                    self.api,
                    url=self.settings['API_URL'] + resource_url,
                    method='POST',
                    body=dumps(body),
                    headers=headers)
                if response.code in [200, 201]:
                    self.response(200, 'File successfully uploaded. You must wait the processing phase for your image.')
                elif response.code == 409:
                    self.response(409, 'The file already exists in the system.')
                elif response.code == 400:
                    self.response(400, 'The data or file sent is invalid to add the image in the system.')
                else:
                    self.response(500, 'Fail to upload image.')
        else:
            self.response(400, 'Please send a file to upload.')


def remove_file(sched, fn, jid):
    remove(fn)
