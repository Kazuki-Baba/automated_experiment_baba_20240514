#!/bin/bash

sudo cp local.conf /etc/apache2/conf-available/
sudo ln -s /etc/apache2/conf-available/local.conf /etc/apache2/conf-enabled/
sudo service apache2 restart