#!/usr/bin/python3

# コマンドライン引数オプション
import struct
import time
import serial
import argparse
import re

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--run', help='run rate の指定(流量)、run',type = int, nargs=1)
parser.add_argument('--off', help='run rate を0に指定(流量)、停止', action="store_true")


args = parser.parse_args()

#ここから実行用コード

# serial通信開通
ser = serial.Serial()
ser.port = '/dev/ttyACM0'
ser.baudrate = 9600
ser.bytesize = serial.EIGHTBITS
ser.stopbits = serial.STOPBITS_ONE
ser.parity = serial.PARITY_NONE
ser.xonxoff = False
ser.timeout = 50



cmd = "D,00\r"
cmd = "H,00\r"
cmd = "N,00\r"
cmd = "E,00\r"
cmd = "S,00,10\r"
cmd = "L,00\r"
cmd = "A,00,6500\r"
cmd = "A,00,0\r"
cmd = "A,00,650\r"

#print(cmd.encode())

def commandInput(cmd):  #コマンド送信
    ser.write( cmd.encode() )
    ser.flush()
    time.sleep(0.05)

def commandReception(ser):   #受信
    res=ser.read_all()
    res=res.decode()
    return res

def on():
    cmd = "N,00\r"
    commandInput(cmd)
    res=commandReception(ser)
    print(res)


def off():
    cmd = "H,00\r"
    commandInput(cmd)
    res=commandReception(ser)
    print(res)

def rateSetRun(cmd):
    on()
    cmd = cmd*655
    cmd = f"A,00,{cmd}\r"
    #print(cmd)
    commandInput(cmd)
    res=commandReception(ser)
    print(res)


#rx = ser.read_all()
#rx = rx.decode()
#print(rx)

ser.open()

if args.run is not None:
    speed = args.run[0]
    rateSetRun(speed)

if args.off:
    rateSetRun(0)
    off()


#on()
#rateSetRun(1)
#off()

#commandInput(cmd)
#print(cmd)


