#!/bin/bash

#引数でラズパイの名前を指定
mysql -u kii001 -pkyodai db00 < ../db00/20220908_setup.sql
sudo mysql -u root -p db00 -e "INSERT INTO raspberrypi_informations VALUE (default,'ラズパイ2',default)"