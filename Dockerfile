FROM node:0.12

RUN npm install beefy browserify -g

COPY . /usr/src/app

WORKDIR /usr/src/app
CMD ["beefy", "index.js", "--live"]
