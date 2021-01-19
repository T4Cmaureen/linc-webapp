# Copyright(C) Venidera Research & Development, Inc - All Rights Reserved
# Unauthorized copying of this file, via any medium is strictly prohibited
# Proprietary and confidential
# Written by Rafael Giordano Vieira <rafael@venidera.com>

FROM python:3.8-alpine
# Capturing default arguments
ARG UI_PORT
ARG COOKIE_SECRET
ARG REDISCLOUD_URL
ARG REDIS_URL
ARG S3_ACCESS_KEY
ARG S3_SECRET_KEY
# Setting environment variables
ENV UI_PORT=${UI_PORT}
ENV COOKIE_SECRET=${COOKIE_SECRET}
ENV REDISCLOUD_URL=${REDISCLOUD_URL}
ENV REDIS_URL=${REDIS_URL}
ENV S3_ACCESS_KEY=${S3_ACCESS_KEY}
ENV S3_SECRET_KEY=${S3_SECRET_KEY}

# Creating base image
RUN apk update && apk upgrade && \
    # Installing common packages
    apk add \
        openssl \
        vim \
        bash \
        gfortran \
        curl \
        gcc \
        g++ \
        libxml2-dev \
        libxslt-dev \
        libgcc \
        linux-headers \
        musl-dev \
        libc-dev \
        python3-dev \
        libffi-dev \
        curl-dev \
        build-base \
        py-pip \
        zlib \
        tzdata \
        zlib-dev \
        lapack-dev \
        jpeg-dev \
        freetype-dev \
        lcms2-dev \
        openjpeg-dev \
        tiff-dev \
        tk-dev \
        tcl-dev \
        openssl-dev && \
    rm -rf /tmp/* /var/cache/apk/*
# Copying local repository
COPY . /linc-webapp
# Updating pip and installing the dependencies
RUN pip install --upgrade -r /linc-webapp/requirements.txt pip setuptools wheel
# Exposing port
EXPOSE ${UI_PORT}
# Creating working directory
WORKDIR /linc-webapp
# Running execution command
CMD ["/bin/bash", "-c", "python /linc-webapp/app/linc-webapp.py --port=${UI_PORT}"]
