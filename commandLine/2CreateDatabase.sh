#!/bin/bash

sudo mysql -u root -p -e "CREATE DATABASE main"
sudo mysql -u root -p -e "CREATE USER 'baba'@'localhost' IDENTIFIED BY '0507';"
sudo mysql -u root -p -e "GRANT ALL ON main.* TO baba@localhost"

sudo mysql -u root -p -e "CREATE DATABASE dbserver"
sudo mysql -u root -p -e "GRANT ALL ON dbserver.* TO baba@localhost"

sudo mysql -u root -p -e "CREATE DATABASE dbclient"
sudo mysql -u root -p -e "GRANT ALL ON dbclient.* TO baba@localhost"
