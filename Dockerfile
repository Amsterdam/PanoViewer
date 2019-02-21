FROM node:10.10
LABEL maintainer="datapunt@amsterdam.nl"

EXPOSE 80

RUN apt-get update && apt-get upgrade -y --no-install-recommends \
  && apt-get install -y bzip2 git nginx unzip xz-utils \
  && rm -rf /var/lib/apt/lists/*

RUN echo 'deb http://deb.debian.org/debian jessie-backports main' > /etc/apt/sources.list.d/jessie-backports.list

ENV LANG C.UTF-8

COPY . /app
WORKDIR /app

ENV PATH=./node_modules/.bin/:~/node_modules/.bin/:$PATH
RUN git config --global url.https://github.com/.insteadOf git://github.com/ \
  && git config --global url."https://github.com/".insteadOf git@github.com: \
  && npm config set registry https://repo.datapunt.amsterdam.nl/repository/npm-group/ \
  && npm --production=false \
         --unsafe-perm \
         --verbose \
         install \
  && npm run build

RUN mv demo /var/www/html/
RUN mv index.html LICENSE README.md /var/www/html
RUN mv dist /var/www/html/

COPY default.conf /etc/nginx/conf.d/
RUN rm /etc/nginx/sites-enabled/default

# forward request and error logs to docker log collector
RUN ln -sf /dev/stdout /var/log/nginx/access.log \
	&& ln -sf /dev/stderr /var/log/nginx/error.log

CMD ["nginx", "-g", "daemon off;"]
