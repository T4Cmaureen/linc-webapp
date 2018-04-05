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

from handlers.base import BaseHandler
from lib.authentication import web_authenticated
from utils.rolecheck import allowedRole


class MainHandler(BaseHandler):
    def get(self):
        self.render('main.html')


class LoginMainHandler(BaseHandler):
    def get(self):
        self.render('login.html', xsrf=self.xsrf_token)


class HomeHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('home.html')


class SideMenuHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render(
            'side_menu.html',
            username=self.current_user['username'],
            orgname=self.current_user['orgname'],
            admin=self.current_user['admin'])


class LionMainHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('lion.html')


class SearchLionHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('search_lion.html')


class ImageSetMainHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('image_set.html')


class SearchImageSetHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('search_image_set.html')


class ConservationistsHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('conservationists.html')


class ImageGalleryHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('image_gallery.html')


class LocationHistoryHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('location_history.html')


class EditMetadataHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('metadata.html')


class CVResultsMainHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('cv_results.html')


class CVRequestMainHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('cv_request.html')


class UploadImagesHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('upload_images.html')


class VerifyImageSetHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('verify_imageset.tpl.html')


class PageAdminHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.html')


class PageAdminUsersHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.users.tpl.html')


class PageAdminOrganizationsHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.organizations.tpl.html')


class PageAdminLionsHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.lions.tpl.html')


class PageAdminImageSetsHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.imagesets.tpl.html')


class PageAdminImagesHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.images.tpl.html')


class PageAdminCVRequestsHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.cvrequests.tpl.html')


class PageAdminCVResultsHandler(BaseHandler):
    @web_authenticated
    @allowedRole('admin')
    def get(self):
        self.render('admin.cvresults.tpl.html')


class CompareImagesHandler(BaseHandler):
    @web_authenticated
    def get(self):
        self.render('compare.images.tpl.html')
