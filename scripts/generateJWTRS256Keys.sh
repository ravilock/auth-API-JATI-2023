#!/bin/bash
ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key
echo "Don't add passphrase"
openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub
