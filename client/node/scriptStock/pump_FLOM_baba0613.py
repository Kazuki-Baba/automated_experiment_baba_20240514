#!/usr/bin/python3

# コマンドライン引数オプション
import time
import serial
import argparse
import re

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--on', help='送液の開始', action='store_true')
parser.add_argument('--off', help='送液の終了', action='store_true')
parser.add_argument('--rateset', help='流量変更 (値)', nargs=1)

args = parser.parse_args()

# ここから実行用コード


# sirial通信開通
ser = serial.Serial()
ser.port = 'COM3'
ser.baudrate = 9600
ser.bytesize = serial.EIGHTBITS
ser.stopbits = serial.STOPBITS_ONE
ser.parity = serial.PARITY_NONE
ser.xonxoff = False
ser.rtscts = False
ser.dsrdtr = False



def commandInput(cmd):  #コマンド送信
    ser.write( cmd.encode() )
    ser.flush()
    time.sleep(5)

def commandReception(ser):   #受信
    res=ser.read_all()
    res=res.decode()
    return res



def on():
    cmd = ";01,G1,1\r\n"
    commandInput(cmd)
    res=commandReception(ser)
    print(res)

def off():
    cmd = ";01,G1,0\r\n"
    commandInput(cmd)
    res=commandReception(ser)
    print(res)

def rateset():
      if args.rateset is not None:
        rate = args.rateset[0]
        rate100 = float(rate) * 100
        rate100_int = int(round(rate100))
        rate_cmd = f"{rate100_int:05}"
        cmd = f";01,S3,{rate_cmd}\r\n"
        commandInput(cmd)
        res = commandReception(ser)
        print(res)





ser.open()


if args.on:
    on()
elif args.off:
    off()
elif args.rateset:
    rateset()


ser.close()  # リソースを閉じる
