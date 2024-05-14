#!/bin/bash

sudo mysql -u root -p -e "CREATE DATABASE main"
sudo mysql -u root -p -e "CREATE USER 'kii001'@'localhost' IDENTIFIED BY 'kyodai';"
sudo mysql -u root -p -e "GRANT ALL ON main.* TO kii001@localhost"

sudo mysql -u root -p -e "CREATE DATABASE db00"
sudo mysql -u root -p -e "GRANT ALL ON db00.* TO kii001@localhost"