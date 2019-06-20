# Build package
FROM node:10.10 AS build-deps
LABEL maintainer="datapunt@amsterdam.nl"

WORKDIR /app

RUN echo && echo === Docker Step 0: install utilities ===
RUN printf "deb http://archive.debian.org/debian/ jessie main\ndeb-src http://archive.debian.org/debian/ jessie main\ndeb http://security.debian.org jessie/updates main\ndeb-src http://security.debian.org jessie/updates main" > /etc/apt/sources.list

RUN apt-get update && \
    apt-get install -y \
      netcat \
      git && \
    rm -rf /var/lib/apt/lists/*

RUN echo && echo === Docker Step 1: install dependencies ===
COPY package.json package-lock.json /app/

RUN git config --global url.https://github.com/.insteadOf git://github.com/ \
  && git config --global url."https://github.com/".insteadOf git@github.com: \
  && npm config set registry https://nexus.data.amsterdam.nl/repository/npm-group/ \
  && npm cache verify \
  && npm --verbose install

RUN echo && echo === Docker Step 2: build the project ===
COPY src /app/src
COPY .babelrc \
      webpack.* \
      /app/

ENV NODE_ENV=production
RUN npm run build

RUN echo && echo === Docker Step 3: running unittests ===
COPY scripts /app/scripts
COPY jest.config.js /app/
RUN npm run test

# Create webserver image
RUN echo && echo === Docker Step 4: create webserver container ===
FROM nginx:1.12.2-alpine
COPY default.conf /etc/nginx/conf.d/
COPY --from=build-deps /app/dist /usr/share/nginx/html/dist
COPY demo /usr/share/nginx/html/demo
COPY index.html /usr/share/nginx/html
