#!/usr/bin/python3

#コマンドライン引数オプション
import argparse

parser = argparse.ArgumentParser(description = 'コマンドライン引数で動作を分岐')


parser.add_argument('--changePos', help='specify the position', choices=['1','2','3','4','5','6'])


args = parser.parse_args()

#ここから実行用コード
import serial
import time


def resultDefault():
    return '-'

def resultERROR():
    return 'ERROR'

def serWrite(cmd):
    ser.write(cmd.encode())
    time.sleep(0.1)
    res = ser.read_all()
    res = res.decode()
    return res

#sirial通信開通
ser = serial.Serial()
ser.port = '/dev/ttyUSB0'
ser.baudrate = 9600
ser.bytesize = serial.EIGHTBITS
ser.stopbits = serial.STOPBITS_ONE
ser.parity = serial.PARITY_NONE

ser.open()

#ポジションが変わらない場合(ex. 1→1)にエラーが出るが、それを無視する
#その代わり、ほんまにバルブが詰まってて切り替わらない場合もエラーが出ない。
if args.changePos:
    cmd = ';01,C0,0' + args.changePos + '\r\n'
    res = serWrite(cmd)
    print(resultDefault())

"""
if args.changePos:
    cmd = ';01,C0,0' + args.changePos + '\r\n'
    res = serWrite(cmd)
    if "E" in res:
        print(resultERROR())
    else:
        print(resultDefault())
"""


ser.close()
