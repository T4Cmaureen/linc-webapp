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
    def get(self, lion_id=''):
        if lion_id:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/lions/{}/relatives'.format(lion_id),
                method='GET')
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
    def post(self, lion_id=''):
        if lion_id:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/lions/{}/relatives'.format(lion_id),
                method='POST',
                body=self.json_encode(self.input_data))
            self.set_json_output()
            self.set_status(response.code)
            self.finish(response.body)
        else:
            self.response(401, 'Invalid request, you must provide lion id.')

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, lion_id='', rurl=None, relat_id=''):
        if lion_id and relat_id:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/lions/{}/relatives/{}'.format(lion_id, relat_id),
                method='PUT',
                body=self.json_encode(self.input_data))
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
    def delete(self, lion_id='', rurl=None, relat_id=''):
        if lion_id and relat_id:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/lions/{}/relatives/{}'.format(lion_id, relat_id),
                method='DELETE')
            self.set_json_output()
            self.set_status(response.code)
            self.finish(response.body)
        elif relat_id:
            self.response(401, 'Invalid request, you must provide a lion id.')
        else:
            self.response(401, 'Invalid request, you must provide a relative lion id.')


class ImageSetsReqHandler(BaseHandler):
    SUPPORTED_METHODS = ('GET')

    @asynchronous
    @coroutine
    @web_authenticated
    def get(self, imageset_id='', cvrequirements=None):
        if imageset_id:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/imagesets/{}/cvrequirements'.format(imageset_id),
                method='GET')
            self.set_json_output()
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish(
                    {'status': 'error', 'message': 'Fail to get image set requirements..'})
        else:
            self.response(400, 'Invalid request.')


class ImageSetsListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/imagesets/list',
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get image sets list.'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self, imageset_id='', cvrequest=None):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/imagesets/{}/cvrequest'.format(imageset_id),
            method='POST',
            body=self.json_encode(self.input_data))
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish(self.json_encode({'status': 'error', 'messagem': 'Bad request.'}))


class ImagesListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/images/list',
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get the images list.'})


class LionsListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        resource_url = self.settings['API_URL'] + '/lions/list'
        org_id = self.get_argument('org_id', None)
        if org_id:
            resource_url += '?org_id=' + str(org_id)
        response = yield Task(
            self.api_call,
            url=resource_url,
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get lions data.'})


class OrganizationsListHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/organizations/list',
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get organizations data.'})


class CVResultsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, res_id='', xlist=None):
        resource_url = self.settings['API_URL'] + '/cvresults/{}'.format(res_id)
        if xlist:
            resource_url += '/' + xlist
        response = yield Task(
            self.api_call,
            url=resource_url,
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get cv results data.'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/cvresults',
            method='POST',
            body=self.json_encode(self.input_data))
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to submit cv results data.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, res_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/cvresults/{}'.format(res_id),
            method='PUT',
            body=self.json_encode({"message": "updating resources"}))
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to submit data to cvresults.'})


class CVRequestHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, req_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/cvrequests/' + req_id,
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get cv requests data.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, req_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/cvrequests/{}'.format(req_id),
            method='DELETE')
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to delete cv results.'})


class LionsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, lion_id='', locations=None):
        resource_url = self.settings['API_URL'] + '/lions'
        api = self.get_argument('api', '')
        if lion_id:
            resource_url += '/' + lion_id
            if api:
                resource_url += '?api=true'
        elif api:
            resource_url += '?api=true'
        info(resource_url)
        response = yield Task(
            self.api_call,
            url=resource_url,
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get lions data.'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/lions',
            method='POST',
            body=self.json_encode(self.input_data))
        self.set_json_output()
        self.set_status(response.code)
        self.finish(response.body)

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, lion_id=''):
        self.set_json_output()
        if lion_id:
            resource_url = '/lions/' + lion_id
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            info(data)
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + resource_url,
                method='PUT',
                body=self.json_encode(data))
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'Fail to update lion data.'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'You must provide a lion id.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, lion_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/lions/{}'.format(lion_id),
            method='DELETE')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to delete lion.'})


class ImageSetsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, imageset_id='', param=None):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/imagesets/{}'.format(imageset_id),
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get image set data.'})

    @asynchronous
    @engine
    @web_authenticated
    def post(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/imagesets',
            method='POST',
            body=self.json_encode(self.input_data))
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to submit image set data.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, imageset_id=''):
        self.set_json_output()
        if imageset_id:
            info(self.input_data)
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            info(data)
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/imagesets/{}'.format(imageset_id),
                method='PUT',
                body=self.json_encode(data))
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'Fail to submit image set data.'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'You must provide an image set id.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, imageset_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/imagesets/{}'.format(imageset_id),
            method='DELETE')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to delete image set.'})


class OrganizationsHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, organization_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/organizations/{}'.format(organization_id),
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get organization data.'})

    @asynchronous
    @engine
    @web_authenticated
    @allowedRole('admin')
    def post(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/organizations',
            method='POST',
            body=self.json_encode(self.input_data))
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to create a new organization.'})

    @asynchronous
    @coroutine
    @web_authenticated
    @allowedRole('admin')
    def put(self, organization_id=''):
        self.set_json_output()
        if organization_id:
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/organizations/{}'.format(organization_id),
                method='PUT',
                body=self.json_encode(data))
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'Fail to update organization data.'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'You must provide an organization id.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, organization_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/organizations/{}'.format(organization_id),
            method='DELETE')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to delete organization.'})


class UsersHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, user_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/users/{}'.format(user_id),
            method='GET')
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to get users data.'})

    @asynchronous
    @engine
    @web_authenticated
    @allowedRole('admin')
    def post(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/users',
            method='POST',
            body=self.json_encode(self.input_data))
        self.set_json_output()
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to create the new user.'})

    @asynchronous
    @coroutine
    @web_authenticated
    @allowedRole('admin')
    def put(self, user_id=''):
        self.set_json_output()
        if user_id:
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/users/{}'.format(user_id),
                method='PUT',
                body=self.json_encode(data))
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'Fail to update user data.'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'You must provide an user id.'})

    @asynchronous
    @coroutine
    @web_authenticated
    @allowedRole('admin')
    def delete(self, user_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/users/{}'.format(user_id),
            method='DELETE')
        self.set_status(response.code)
        self.set_json_output()
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to delete user.'})


class ImagesHandler(BaseHandler):
    @asynchronous
    @engine
    @web_authenticated
    def get(self, image_id=''):
        self.set_json_output()
        download = self.get_argument('download', '')
        if download:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/images?download={}'.format(download),
                method='GET')
            if response and response.code == 200:
                respdata = loads(response.body.decode('utf-8'))
                links = respdata['data']
                folder = self.settings['static_path'] + '/' + str(uid())
                mkdir(folder)
                for link in links:
                    info('Downloading: ' + link['url'])
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
                self.response(500, 'Fail to get urls to download the images.')
                return
        else:
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/images/{}'.format(image_id),
                method='GET')
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'Fail to get images data.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def put(self, image_id=''):
        self.set_json_output()
        if image_id:
            data = dict(self.input_data)
            if "_xsrf" in data.keys():
                del data["_xsrf"]
            info(data)
            response = yield Task(
                self.api_call,
                url=self.settings['API_URL'] + '/images/{}'.format(image_id),
                method='PUT',
                body=self.json_encode(data))
            self.set_status(response.code)
            if response.code == 200:
                self.finish(response.body)
            else:
                self.finish({'status': 'error', 'message': 'Fail to update image data.'})
        else:
            self.set_status(400)
            self.finish({'status': 'error', 'message': 'You must provide an image id.'})

    @asynchronous
    @coroutine
    @web_authenticated
    def delete(self, image_id=''):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/images/{}'.format(image_id),
            method='DELETE')
        self.set_status(response.code)
        if response.code == 200:
            self.finish(response.body)
        else:
            self.finish({'status': 'error', 'message': 'Fail to delete image.'})


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
                tagsl = self.get_argument("image_tags", [])
                if ',' in tagsl and not isinstance(tagsl, list):
                    tagsl = [x for x in tagsl.split(',') if x.strip() != '']
                else:
                    tagsl = []
                image_tags = tagsl
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
                response = yield Task(
                    self.api_call,
                    url=self.settings['API_URL'] + '/images/upload',
                    method='POST',
                    body=dumps(body))
                if response.code in [200, 201]:
                    self.response(200, 'File successfully uploaded. You must wait the processing phase for your image.')
                elif response.code == 409:
                    self.response(409, 'The file already exists in the system.')
                elif response.code == 400:
                    self.response(400, 'The data or file sent is invalid.')
                else:
                    self.response(500, 'Fail to upload image.')
        else:
            self.response(400, 'Please send a file to upload.')


def remove_file(sched, fn, jid):
    remove(fn)
