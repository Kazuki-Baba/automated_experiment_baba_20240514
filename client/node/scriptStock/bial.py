#!/usr/bin/python3

import argparse
import random
import serial
import time

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--ready', help='ready(sampling time)', nargs=1)
parser.add_argument('--off', help='off', action='store_true')
# この引数はdetailで指定しない。readyで一意に決まる。
parser.add_argument('--sample', help='sampling', nargs=1)

args = parser.parse_args()

res = None

# sirial通信開通
ser = serial.Serial()
ser.port = '/dev/ttyUSB0'
ser.baudrate = 4800
ser.bytesize = serial.EIGHTBITS
ser.stopbits = serial.STOPBITS_TWO
ser.parity = serial.PARITY_NONE


def resultDefault():
    return '-'

timeSleep = 0.5

ser.open()

if args.ready is not None:
    samplingTime = args.ready[0]

    cmd = 'CMTIME\r\n'  # timeモード
    ser.write(cmd.encode())
    time.sleep(timeSleep)

    cmd = 'CPA59940\r\n'  # 初動の待機時間設定
    ser.write(cmd.encode())
    time.sleep(timeSleep)

    cmd = 'CPN1\r\n'  # 本数は一本ずつ
    ser.write(cmd.encode())
    time.sleep(timeSleep)

    cmd = 'CPM1\r\n'  # マルチサンプルあり
    ser.write(cmd.encode())
    time.sleep(timeSleep)

    cmd = 'CPT' + samplingTime + '\r\n'  # サンプリング時間設定
    ser.write(cmd.encode())
    time.sleep(timeSleep)

    res = ser.read_all()
    res = res.decode()
    print(resultDefault())

if args.off:
    cmd = 'END\r\n'
    ser.write(cmd.encode())
    time.sleep(timeSleep)

    res = ser.read_all()
    res = res.decode()
    print(resultDefault())

if args.sample is not None:
    samplingTime = int(args.sample[0])
    cmd = 'START\r\n'  # スタート
    ser.write(cmd.encode())
    time.sleep(1)

    cmd = 'PAUSE\r\n'  # 一時停止
    ser.write(cmd.encode())
    time.sleep(1)

    cmd = 'START\r\n'
    ser.write(cmd.encode())
    time.sleep(samplingTime + 5)

    res = ser.read_all()
    res = res.decode()
    print(resultDefault())

ser.close()
