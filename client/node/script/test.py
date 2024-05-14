#!/usr/bin/python3

import argparse
import random

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--on', help='on', action='store_true')
parser.add_argument('--off', help='off', action='store_true')
parser.add_argument('--get', help='return random integer from range (1,100)', action='store_true')


args = parser.parse_args()

res = None

unitDictionary = {'mL/min': 'm/m', 'mL/s': 'm/s',
                  'μL/min': 'u/m', 'μL/s': 'u/m', 'nL/min': 'n/m', 'nL/s': 'n/s'}


def unitConversion(uni):
    if uni in unitDictionary:
        newUni = unitDictionary[uni]
        return newUni


if args.on:
    res = '-'

if args.off:
    res = '-'


if args.get:
    res = random.randrange(1, 100, 1)


# (res:OK 値　単位)
if res is not None:
    print(res)
else:
    print('ERROR')

