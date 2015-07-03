openssl req -nodes -newkey rsa:2048 -keyout server.key -out server.csr -subj \
	"/C=AU/ST=NSW/L=Sydney/O=NICTA/OU=ETD/CN=shipping-freight-map"
openssl x509 -req -days 9001 -in server.csr -signkey server.key -out server.crt
