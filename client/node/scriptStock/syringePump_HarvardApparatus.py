#!/usr/bin/python3

# コマンドライン引数オプション
import time
import serial
import argparse
import re

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--irate', help='infusion rateの指定(流量 単位)', nargs=2)
# --irate a b => args.irate = ['a','b']
parser.add_argument('--wrate', help='withdraw rateの指定(流量 単位)', nargs=2)
parser.add_argument('--irun', help='infusion run', action='store_true')
parser.add_argument('--wrun', help='withdraw run', action='store_true')
parser.add_argument('--off', help='stop the pump action', action='store_true')
parser.add_argument('--iraterun', help='infusion rateの指定(流量 単位)、run', nargs=2)
parser.add_argument('--status', help='check whether the motor is stalled or not', action='store_true')


args = parser.parse_args()

# ここから実行用コード

unitDictionary = {'mL/min': 'm/m', 'mL/s': 'm/s',
                  'μL/min': 'u/m', 'μL/s': 'u/m', 'nL/min': 'n/m', 'nL/s': 'n/s'}


def unitConversion(uni):
    if uni in unitDictionary:
        newUni = unitDictionary[uni]
        return newUni

# sirial通信開通
ser = serial.Serial()
ser.port = '/dev/ttyACM0'
ser.baudrate = 115200
ser.bytesize = serial.EIGHTBITS
ser.stopbits = serial.STOPBITS_ONE
ser.parity = serial.PARITY_NONE
ser.xonxoff = False
ser.rtscts = False
ser.dsrdtr = False

def resultDefault():
    return '-'

def serWrite(cmd):
    ser.write(cmd.encode())
    time.sleep(0.1)
    res = ser.read_all()
    res = res.decode()
    return res

ser.open()

if args.irate is not None:
    speed = args.irate[0]
    unit = unitConversion(args.irate[1])
    cmd = 'irate ' + speed + ' ' + unit + '\r\n'
    result = serWrite(cmd)
    print(resultDefault())

if args.iraterun is not None:
    speed = args.iraterun[0]
    unit = unitConversion(args.iraterun[1])
    cmd = 'irate ' + speed + ' ' + unit + '\r\n'
    res = serWrite(cmd)

    cmd = 'irun\r\n'
    res = serWrite(cmd)
    print(resultDefault())


if args.wrate is not None:
    speed = args.wrate[0]
    unit = unitConversion(args.wrate[1])
    cmd = 'wrate ' + speed + ' ' + unit + '\r\n'
    result = serWrite(cmd)
    print(resultDefault())

if args.irun:
    cmd = 'irun\r\n'
    res = serWrite(cmd)
    print(resultDefault())

if args.wrun:
    cmd = 'wrun\r\n'
    res = serWrite(cmd)
    print(resultDefault())

if args.off:
    cmd = 'stop\r\n'
    res = serWrite(cmd)
    print(resultDefault())

if args.status:
    cmd = 'status\r\n'
    res = serWrite(cmd)
    sixFlags = re.search(r'[iI].*[T.]',res)
    stallFlag = sixFlags.group()[2] #モーターがストールしてたら"S",してなかったら"."
    if stallFlag == "S":
        print("ERROR")
    else:
        print(resultDefault())

ser.close()

time.sleep(0.1)
