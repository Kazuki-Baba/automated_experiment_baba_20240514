#!/usr/bin/python3

#コマンドライン引数オプション
import argparse

parser = argparse.ArgumentParser(description ='コマンドライン引数で動作を分岐')

parser.add_argument('--get',help='温度をget',action='store_true')
parser.add_argument('--hontai',help='本体属性読み取り',action='store_true')
parser.add_argument('--set',help='温度をset(整数)', type = int)

args = parser.parse_args()

#ここから実行用コード
import serial
import time

#sirial通信開通
ser = serial.Serial()
ser.port = '/dev/ttyUSB0'
ser.baudrate = 9600
ser.bytesize = serial.SEVENBITS
ser.stopbits = serial.STOPBITS_TWO
ser.parity = serial.PARITY_EVEN
ser.timeout = 500
ser.open()

#get(温度取得)コード
if args.get:
    print('getしたい')

    #STX
    cmd = '\x02'
    #ノードNo.+サブアドレス+SID
    cmd +='01000'
    #コマンドテキスト
    cmd +='0101800000'
    cmd +='00'
    cmd +='0001'
    #ETX
    cmd += '\x03'

    n = len(cmd)

    #BCC
    bcc = cmd.encode()[1]
    for i in range(2, n):
        #  print(i, cmd[i], bcc)
         t = cmd.encode()[i]
         bcc ^= t

    cmd += chr(bcc)


    #print(cmd.encode())


    nw = ser.write(cmd.encode())
    # ser.flush()
    #print("wrote: " , nw)


    time.sleep(0.1)

    res = ser.read_all()

    res2 = res.decode()
    target = '0101'
    idx = res2.find(target)
    r = res2[idx+8:idx+12]

    '''
    print(res)

    print(r)
    '''

    # 温度を10進数で表示
    print(int(r,16))

#hontai(本体属性読み取り)コード
if args.hontai:
    #STX
    cmd = '\x02'
    #ノードNo.+サブアドレス+SID
    cmd +='01000'
    #コマンドテキスト
    cmd +='0503'
    #ETX
    cmd += '\x03'

    n = len(cmd)

    #BCC
    bcc = cmd.encode()[1]
    for i in range(2, n):
        #  print(i, cmd[i], bcc)
         t = cmd.encode()[i]
         bcc ^= t

    cmd += chr(bcc)

    nw = ser.write(cmd.encode())

    time.sleep(0.1)

    res = ser.read_all()

    res2 = res.decode()
    target = '0503'
    idx = res2.find(target)
    r = res2[idx+8:idx+18]

    # 温度を10進数で表示
    print(r)    

#set(温度設定コード) 製作中
if args.set is not None:
    print(args.set)

ser.close()    
