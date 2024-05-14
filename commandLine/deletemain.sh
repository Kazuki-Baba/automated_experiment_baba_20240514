#!/bin/bash

#rootはパスなし
sudo mysql -u root -p -e "DROP DATABASE main"
sudo mysql -u root -p -e "CREATE DATABASE main"
sudo mysql -u root -p -e "GRANT ALL ON main.* TO kii001@localhost"