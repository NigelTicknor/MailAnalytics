from node:16.14-alpine as builder

workdir /root/app/

add package.json .
add package-lock.json .

RUN apk add --no-cache  \
		pixman-dev \
		jpeg-dev \
		cairo-dev \
		giflib-dev \
		pango-dev \
		libtool \
        python3 \
        make \
        g++ \
		pkgconfig \
		autoconf \
		automake

RUN npm install

FROM node:16.14-alpine

workdir /root/app/

RUN apk add --no-cache  \
		pixman-dev \
		jpeg-dev \
		cairo-dev \
		giflib-dev \
		pango-dev

run apk add terminus-font ttf-inconsolata ttf-dejavu font-noto font-noto-cjk ttf-font-awesome font-noto-extra

copy --from=builder /root/app/node_modules ./node_modules

add src/ .

cmd node /root/app/server.js