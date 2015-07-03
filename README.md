hose-dashboard
==============

Create a dashboard from your data.

Development
-----------

 * Clone this repository
 * `git sudmodule init && git submodule update` to get the `hose` submodule
 * Generate certificates by running `cd server/certs && ./genkey.sh && cd -`
 * Copy those credentials into `hose` using `cp server/certs/server.* hose/`
 * Install [docker](http://docs.docker.com/installation/ubuntulinux/#installing-docker-on-ubuntu) and [docker-compose](http://docs.docker.com/compose/#installation-and-set-up)
 * Run `docker-compose -f tools/development.yml up`
 * Visit `https://localhost` in your browser

If you make a change to `Dockerfile`, run `docker-compose -f tools/development.yml build`.
