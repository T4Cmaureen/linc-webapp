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

from handlers.base import VersionHandler
from handlers.auth import LogoutHandler, LoginHandler, CheckAuthHandler, ResetPassword, ChangePassword
from handlers.main import MainHandler, LoginMainHandler, HomeHandler, SideMenuHandler
from handlers.main import LionMainHandler, SearchLionHandler, ImageSetMainHandler, SearchImageSetHandler
from handlers.main import ConservationistsHandler, ImageGalleryHandler, LocationHistoryHandler, CompareImagesHandler
from handlers.main import EditMetadataHandler, CVResultsMainHandler, CVRequestMainHandler, UploadImagesHandler, VerifyImageSetHandler
from handlers.main import PageAdminHandler, PageAdminUsersHandler, PageAdminOrganizationsHandler, PageAdminLionsHandler
from handlers.main import PageAdminImageSetsHandler, PageAdminImagesHandler, PageAdminCVRequestsHandler, PageAdminCVResultsHandler
from handlers.api import LionsListHandler, ImagesListHandler, ImageSetsListHandler, OrganizationsListHandler
from handlers.api import ImagesUploadHandler, ImagesHandler, LionsHandler, ImageSetsHandler
from handlers.api import OrganizationsHandler, CVResultsHandler, CVRequestHandler, UsersHandler

# Defining routes
url_patterns = [
    # Handlers for the website
    (r"/", MainHandler),
    (r"/version", VersionHandler),
    (r"/admin.html", PageAdminHandler),
    (r"/admin.users.tpl.html", PageAdminUsersHandler),
    (r"/admin.organizations.tpl.html", PageAdminOrganizationsHandler),
    (r"/admin.lions.tpl.html", PageAdminLionsHandler),
    (r"/admin.imagesets.tpl.html", PageAdminImageSetsHandler),
    (r"/admin.images.tpl.html", PageAdminImagesHandler),
    (r"/admin.cvrequests.tpl.html", PageAdminCVRequestsHandler),
    (r"/admin.cvresults.tpl.html", PageAdminCVResultsHandler),
    (r"/login.html", LoginMainHandler),
    (r"/home.html", HomeHandler),
    (r"/sidemenu.html", SideMenuHandler),
    (r"/lion.html", LionMainHandler),
    (r"/searchlion.html", SearchLionHandler),
    (r"/imageset.html", ImageSetMainHandler),
    (r"/searchimageset.html", SearchImageSetHandler),
    (r"/conservationists.html", ConservationistsHandler),
    (r"/imagegallery.html", ImageGalleryHandler),
    (r"/locationhistory.html", LocationHistoryHandler),
    (r"/metadata.html", EditMetadataHandler),
    (r"/cvresults.html", CVResultsMainHandler),
    (r"/cvrequest.html", CVRequestMainHandler),
    (r"/uploadimages.html", UploadImagesHandler),
    (r"/verify_imageset.tpl.html", VerifyImageSetHandler),
    (r"/compare.images.tpl.html", CompareImagesHandler),
    # Handlers for API comunication
    (r"/imagesets/list", ImageSetsListHandler),
    (r"/imagesets/(\w+)/(cvrequest)$", ImageSetsListHandler),
    (r"/organizations/list", OrganizationsListHandler),

    (r"/images/list", ImagesListHandler),
    (r"/images/upload", ImagesUploadHandler),

    (r"/images/?$", ImagesHandler),
    (r"/images/(.*)$", ImagesHandler),

    (r"/lions/?$", LionsHandler),
    (r"/lions/list", LionsListHandler),
    (r"/lions/(.*)$", LionsHandler),
    (r"/lions/(\w+)/(locations)$", LionsHandler),
    (r"/imagesets/?$", ImageSetsHandler),
    (r"/imagesets/(.*)$", ImageSetsHandler),

    (r"/organizations/?$", OrganizationsHandler),
    (r"/organizations/(.*)$", OrganizationsHandler),

    (r"/cvresults/?$", CVResultsHandler),
    (r"/cvresults/(\w+$)", CVResultsHandler),
    (r"/cvresults/(\w+)/(list)$", CVResultsHandler),

    (r"/cvrequests/?$", CVRequestHandler),
    (r"/cvrequests/(\w+$)", CVRequestHandler),
    (r"/login", LoginHandler),
    (r"/logout", LogoutHandler),
    (r"/auth/check", CheckAuthHandler),
    (r"/auth/recover", ResetPassword),
    (r"/auth/changepassword", ChangePassword),
    (r"/users/?$", UsersHandler),
    (r"/users/(.*)$", UsersHandler)
]
