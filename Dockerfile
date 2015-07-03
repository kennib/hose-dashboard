FROM node:0.12

RUN npm install beefy browserify -g

COPY package.json /usr/src/app/package.json
RUN cd /usr/src/app; npm install

COPY . /usr/src/app

WORKDIR /usr/src/app
CMD ["beefy", "index.js", "--index", "index.html"]
