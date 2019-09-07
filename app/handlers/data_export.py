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

from lib.authentication import web_authenticated
from base import BaseHandler
import csv
from logging import info
from tornado.gen import engine, Task, coroutine
from tornado.web import asynchronous, HTTPError
from os import mkdir, remove
from os.path import isdir
from uuid import uuid4
from json import loads
from datetime import datetime, timedelta
import csv


class DataExportHandler(BaseHandler):
    SUPPORTED_METHODS = ('POST')

    @engine
    def generate_fn(self, callback=None):
        workdir = self.settings['app_path'] + '/static/export'
        try:
            if not isdir(workdir):
                mkdir(workdir)
        except Exception as e:
            info(e)
            raise HTTPError(
                status_code=500, log_message='Fail to create the working directory for data export.')
        fn = workdir + '/' + str(uuid4()) + '.csv'
        # info(fn)
        callback(fn)

    @engine
    def write_csv(self, fn=None, data=None, callback=None):
        resp = True
        lines = data['lines']
        fieldnames = ['"{}"'.format(x) for x in data['fnames']]
        try:
            with open(fn, 'w+') as f:
                f.write(';'.join(fieldnames) + '\n')
                for v in lines:
                    f.write(';'.join(['"{}"'.format(str(x).replace('"',"'").replace('\n', ' ')) if x else '' for x in v]) + '\n')
                f.close()
        except Exception as e:
            info(e)
            resp = False
        callback(resp)

    @asynchronous
    @coroutine
    @web_authenticated
    def post(self):
        response = yield Task(
            self.api_call,
            url=self.settings['API_URL'] + '/data/export/',
            method='POST',
            body=self.json_encode(self.input_data))
        if response.code == 200:
            # Create the CSV file
            fn = yield Task(self.generate_fn)
            data = loads(response.body.decode('utf-8'))['data']
            resp = yield Task(self.write_csv, fn=fn, data=data)
            if resp:
                dtexec = datetime.now() + timedelta(minutes=1)
                jobid = str(uuid4())
                self.settings['scheduler'].add_job(
                    remove_file,
                    trigger='date',
                    name='Remove file ' + fn + ' at ' + str(dtexec),
                    run_date=dtexec,
                    args=[self.settings['scheduler'], fn, jobid], coalesce=True, id=jobid)
                self.set_header('FileUrl', self.settings['APP_URL'] + '/static/export/' + fn.split('/')[-1])
                self.set_header('Content-Disposition', 'attachment; filename=export.csv')
                with open(fn, 'r') as f:
                    for line in f:
                        self.write(line)
                        yield self.flush()
                return
        self.response(response.code, loads(response.body)['message'])


def remove_file(sched, fn, jid):
    remove(fn)
