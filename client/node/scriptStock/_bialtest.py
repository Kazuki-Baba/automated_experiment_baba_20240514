#!/usr/bin/python3

import argparse
import random
import serial
import time

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--on', help='on', action='store_true')
parser.add_argument('--off', help='off', action='store_true')
parser.add_argument('--sample', help='溶液をサンプリング(秒)', nargs=1)

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
    return '\n-'


ser.open()

cmd = 'CPM0\r\n'  # マルチサンプルなし
ser.write(cmd.encode())
time.sleep(0.1)

if args.on:
    cmd = 'CMTIME\r\n'  # timeモード
    ser.write(cmd.encode())
    time.sleep(0.1)
    
    cmd = 'CPA59940\r\n'  # 初動の待機時間設定
    ser.write(cmd.encode())
    time.sleep(0.1)
    
    cmd = 'CPN0\r\n'  # 本数エンドレスに設定
    ser.write(cmd.encode())
    time.sleep(0.1)

    cmd = 'CPM0\r\n'  # マルチサンプルなし
    ser.write(cmd.encode())
    time.sleep(0.1)

    """
    cmd = 'CPA59940s\r\n'  # 初動の待機時間設定
    ser.write(cmd.encode())
    time.sleep(0.1)

    cmd = 'CPN0\r\n'  # 本数エンドレスに設定
    ser.write(cmd.encode())
    time.sleep(0.1)

    cmd = 'CPM0\r\n'  # マルチサンプルなし
    ser.write(cmd.encode())
    time.sleep(0.1)

    cmd = 'START\r\n'  # スタート
    ser.write(cmd.encode())
    time.sleep(1)

    cmd = 'PAUSE\r\n'  # 一時停止
    ser.write(cmd.encode())
    time.sleep(0.1)
    """


    res = ser.read_all()
    res = res.decode()
    if res:
        result = resultDefault()

if args.off:
    cmd = 'END\r\n'
    ser.write(cmd.encode())
    time.sleep(0.1)

    res = ser.read_all()
    res = res.decode()
    if res:
        result = resultDefault()

if args.sample is not None:
    samplingTime = args.sample[0]
    cmd = 'PAUSE\r\n'  # 一時停止
    ser.write(cmd.encode())
    time.sleep(0.1)

    cmd = 'CPT' + samplingTime + '\r\n'  # 一時停止
    ser.write(cmd.encode())
    time.sleep(0.1)

    cmd = 'START\r\n'
    ser.write(cmd.encode())
    time.sleep(int(samplingTime) + 10)  # サンプリング時間と猶予10秒待機

    cmd = 'PAUSE\r\n'  # 一時停止
    ser.write(cmd.encode())
    time.sleep(0.1)

    res = ser.read_all()
    res = res.decode()
    if res:
        result = resultDefault()


ser.close()

# (res:OK 値　単位)
if res is not None:
    print("OK")
    print(res)
else:
    print('ERROR\n\n-')
