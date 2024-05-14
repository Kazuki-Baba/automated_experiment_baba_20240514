#!/usr/bin/python3

#コマンドライン引数オプション
import argparse

parser = argparse.ArgumentParser(description ='コマンドライン引数で動作を分岐')

parser.add_argument('--get',help='温度をget',action='store_true')
parser.add_argument('--on', help='start heating', action='store_true')
parser.add_argument('--off', help='stop heating', action='store_true')

args = parser.parse_args()

#ここから実行用コード
import serial
import time
import struct

def resultDefault():
    return '\n-'

#sirial通信開通
ser = serial.Serial()
ser.port = '/dev/ttyUSB0'
ser.baudrate = 4800
ser.bytesize = serial.EIGHTBITS
ser.stopbits = serial.STOPBITS_TWO
ser.parity = serial.PARITY_NONE
ser.timeout = 50
ser.open()

def BCC_function(com): #BCC追加計算
    n = len(com)
    bcc = com[0]
    for i in range(1, n):
        bcc ^=  com[i]
    com.append(bcc)
    #print(com)


def commandInput(commands): #コマンド送信
    for cmd in commands:
        data = struct.pack("B", cmd) 
        #print("tx: ", data)
        ser.write(data)
    ser.flush()
    time.sleep(0.25)

def commandReception(_serial): #受信
    rx = _serial.read_all()
    rx = rx.decode()
    return rx
    #print(rx)
    

ReadingTemp = [0x02, 0x30, 0x31, 0x52, 0x50, 0x56, 0x31, 0x03] #温度読み取り{PV1}
Run = [0x02, 0x30, 0x31, 0x57, 0x52, 0x55, 0x4E, 0x30, 0x30, 0x30, 0x30, 0x31, 0x03] #実行
Stop = [0x02, 0x30, 0x31, 0x57, 0x52, 0x55, 0x4E, 0x30, 0x30, 0x30, 0x30, 0x30, 0x03] #停止
SettingExample =  [0x02, 0x30, 0x31, 0x57, 0x53, 0x56, 0x31, 0x30, 0x30, 0x33, 0x37, 0x30, 0x03]


#BCC追加
BCC_function(ReadingTemp)
BCC_function(SettingExample) 
BCC_function(Run)
BCC_function(Stop)
#commandInput(ReadingTemp)

commandInput(Run)
commandReception(ser)

time.sleep(5)

commandInput(Stop)
commandReception(ser)

if args.get:
    cmd = [0x02, 0x30, 0x31, 0x52, 0x50, 0x56, 0x31, 0x03] #温度読み取り{PV1}
    BCC_function(cmd)
    commandInput(cmd)
    res = commandReception(ser)
    #何番目の文字列を抽出するかを確認＆実行
    temperatureRaw = res[7:11]
    print(temperatureRaw)
    temperature = 0.
    temperature = 100. * float(temperatureRaw[1]) + float(temperatureRaw[2]) + float(temperatureRaw[3]) + 0.1 * float(temperatureRaw[4])
    result = temperature

if args.on:
    cmd = [0x02, 0x30, 0x31, 0x57, 0x52, 0x55, 0x4E, 0x30, 0x30, 0x30, 0x30, 0x31, 0x03] #実行
    BCC_function(cmd)
    commandInput(cmd)
    res = commandReception(ser)
    if res:
       result = resultDefault()

if args.off:
    cmd = [0x02, 0x30, 0x31, 0x57, 0x52, 0x55, 0x4E, 0x30, 0x30, 0x30, 0x30, 0x30, 0x03] #停止
    BCC_function(cmd)
    commandInput(cmd)
    res = commandReception(ser)
    if res:
       result = resultDefault()


ser.close()

#(res:OK 値　単位)
if result is not None:
    print("OK")
    print(result)
    print("℃")
else:
    print('ERROR\n\n-')