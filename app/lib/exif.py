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

from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from logging import info
from datetime import datetime

tags_skip = ['MakerNote', 'UserComment']


def get_exif_data(filename):
    """ Returns a dictionary from the exif data of an PIL Image item. Also converts the GPS Tags """
    try:
        image = Image.open(filename)
    except OSError as e:
        info('The file ' + filename + ' can\'t be open as image')
        return {}
    exif_data = {}
    try:
        einfo = image._getexif()
    except Exception as e:
        info(e)
        einfo = {}
    if einfo:
        for tag, value in einfo.items():
            decoded = TAGS.get(tag, tag)
            if decoded in tags_skip:
                continue
            if decoded == "GPSInfo":
                gps_data = {}
                for t in value:
                    sub_decoded = GPSTAGS.get(t, t)
                    tvalue = value[t]
                    if isinstance(tvalue, bytes):
                        tvalue = tvalue.decode('utf-8')
                    gps_data[sub_decoded] = tvalue

                exif_data[decoded] = gps_data
            else:
                dvalue = value
                if isinstance(value, bytes):
                    dvalue = value.decode('utf-8')
                exif_data[decoded] = dvalue
            if decoded in ['DateTimeOriginal', 'DateTime', 'DateTimeDigitized']:
                date_portion = exif_data[decoded][0:10]
                time_portion = exif_data[decoded][11:]
                exif_data[decoded] = date_portion.replace(':', '/') + ' ' + time_portion
    # Adjusting the output
    output = dict()
    output['tags'] = exif_data
    coords = get_lat_lon(exif_data)
    output['latitude'] = coords[0]
    output['longitude'] = coords[1]
    edkeys = exif_data.keys()
    if 'DateTimeOriginal' in edkeys and ['DateTimeOriginal'] != '':
        output['date_stamp'] = datetime.strptime(exif_data['DateTimeOriginal'], '%Y/%m/%d %H:%M:%S').isoformat()
    elif 'DateTimeOriginal' in edkeys and exif_data['DateTimeDigitized'] != '':
        output['date_stamp'] = datetime.strptime(exif_data['DateTimeDigitized'], '%Y/%m/%d %H:%M:%S').isoformat()
    elif 'DateTimeOriginal' in edkeys and exif_data['DateTime'] != '':
        output['date_stamp'] = datetime.strptime(exif_data['DateTime'], '%Y/%m/%d %H:%M:%S').isoformat()
    else:
        output['date_stamp'] = None
    return output


def _get_if_exist(data, key):
    if key in data:
        return data[key]

    return None


def _convert_to_degress(value):
    """Helper function to convert the GPS coordinates stored in the EXIF to degress in float format"""
    d0 = value[0][0]
    d1 = value[0][1]
    d = float(d0) / float(d1)

    m0 = value[1][0]
    m1 = value[1][1]
    m = float(m0) / float(m1)

    s0 = value[2][0]
    s1 = value[2][1]
    s = float(s0) / float(s1)

    return d + (m / 60.0) + (s / 3600.0)


def get_lat_lon(exif_data):
    """ Returns the latitude and longitude, if available, from the
       provided exif_data (obtained through get_exif_data above) """
    lat = None
    lon = None

    if "GPSInfo" in exif_data:
        gps_info = exif_data["GPSInfo"]

        gps_latitude = _get_if_exist(gps_info, "GPSLatitude")
        gps_latitude_ref = _get_if_exist(gps_info, 'GPSLatitudeRef')
        gps_longitude = _get_if_exist(gps_info, 'GPSLongitude')
        gps_longitude_ref = _get_if_exist(gps_info, 'GPSLongitudeRef')

        if gps_latitude and gps_latitude_ref and gps_longitude and gps_longitude_ref:
            lat = _convert_to_degress(gps_latitude)
            if gps_latitude_ref != "N":
                lat = 0 - lat

            lon = _convert_to_degress(gps_longitude)
            if gps_longitude_ref != "E":
                lon = 0 - lon

    return lat, lon
