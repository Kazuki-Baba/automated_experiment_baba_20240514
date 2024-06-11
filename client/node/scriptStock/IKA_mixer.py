#!/usr/bin/python3

import struct
import time
import serial
import argparse
import re

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')
parser.add_argument('--on', help='OutputのON指示', action='store_true')
parser.add_argument('--off', help='OutputのOFF指示', action='store_true')
parser.add_argument('--name', help='機器情報の取得', action='store_true')
parser.add_argument('--rate', help='攪拌速度の調整', nargs=1)
args = parser.parse_args()

# serial通信開通
ser = serial.Serial()
ser.port = 'COM3'
ser.baudrate = 115200
ser.bytesize = serial.EIGHTBITS
ser.stopbits = serial.STOPBITS_ONE
ser.parity = serial.PARITY_NONE
ser.xonxoff = False
ser.timeout = 500

def commandInput(cmd, ser):  # コマンド送信
    print(f"Sending command: {cmd}")
    ser.write(cmd.encode())
    ser.flush()
    time.sleep(0.1)

def commandReception(ser):  # 受信
    res = ser.read_all()
    res = res.decode()
    print(f"Received response: {res}")
    return res


def on(ser):
    try:
        print(f"Before opening the port, is it open? {ser.is_open}")
        if not ser.is_open:
            ser.open()  # シリアルポートを開く
        else:
            print("The port is already open.")
        cmd = "START_4\n"
        time.sleep(1)
        commandInput(cmd, ser)
        res = commandReception(ser)
        print(res)
    finally:
        # シリアルポートを閉じないように修正
        pass

def off(ser):
    try:
        if not ser.is_open:
            ser.open()  # シリアルポートを開く
        else:
            print("ポートは既に開かれています。")
        #print("ポートを開く前に開いているか？", ser.is_open)
        cmd = "STOP_4\n"
        commandInput(cmd, ser)
        res = commandReception(ser)
        print(res)
    #finally:
        #if ser.is_open:
         #   ser.close()  # シリアルポートを閉じる
    finally:
        # シリアルポートを閉じないように修正
        pass

def name(ser):
    try:
        if not ser.is_open:
            ser.open()  # シリアルポートを開く
        else:
            print("ポートは既に開かれています。")
        #print("ポートを開く前に開いているか？", ser.is_open)
        cmd = "IN_NAME\n"
        commandInput(cmd, ser)
        res = commandReception(ser)
        print(res)
    finally:
        # シリアルポートを閉じないように修正
        pass

def rate(ser):
    try:
        if not ser.is_open:
            ser.open()  # シリアルポートを開く
        else:
            print("ポートは既に開かれています。")
        #print("ポートを開く前に開いているか？", ser.is_open)
        #cmd = "OUT_SP_4 200\n"
        #commandInput(cmd, ser)
        #res = commandReception(ser)
        #print(res)
        if args.rate is not None:
            rate = args.rate[0]
            cmd = 'OUT_SP_4 ' +rate+ '\r\n'
            commandInput(cmd, ser)
            res=commandReception(ser)
            print(res)
    finally:
        # シリアルポートを閉じないように修正
        pass

if args.on:
    on(ser)
elif args.off:
    off(ser)
elif args.name:
    name(ser)   
elif args.rate:
    rate(ser)   
else:
     if ser.is_open:
         ser.close()  # シリアルポートを閉じる