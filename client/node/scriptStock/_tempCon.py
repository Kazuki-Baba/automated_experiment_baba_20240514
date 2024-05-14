#!/usr/bin/python3

#コマンドライン引数オプション
import argparse

parser = argparse.ArgumentParser(description ='コマンドライン引数で動作を分岐')

parser.add_argument('--get',help='温度をget', action='store_true')
parser.add_argument('--set',help='温度をset', nargs=1)
parser.add_argument('--on', help='start heating', action='store_true')
parser.add_argument('--off', help='stop heating', action='store_true')
parser.add_argument('--sstate',help='waiting for stady state. set temp and maxTime', nargs=1)
parser.add_argument('--setrun',help='温度をset&実行', nargs=1)

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

def tempGet():
    cmd = [0x02, 0x30, 0x31, 0x52, 0x50, 0x56, 0x31, 0x03] #温度読み取り{PV1}
    BCC_function(cmd)
    commandInput(cmd)
    res = commandReception(ser)
    isPv1 = res[4:7] #バイナリコードが隠れてるからresの見た目と抽出するインデックス番号が合わない!
    #print(isPv1)
    if isPv1 == 'PV1':
        temperatureRaw = res[8:12]
        temperature = 0.
        temperature = 100. * float(temperatureRaw[0]) + 10. * float(temperatureRaw[1]) + float(temperatureRaw[2]) + 0.1 * float(temperatureRaw[3])
        return temperature
    return None

if args.get:
    result = (str(tempGet()) + "\n℃")
    
    
def setTemp(t):
    #cmd = [0x02, 0x30, 0x31, 0x57, 0x53, 0x56, 0x31, 0x30, 0x30, 0x33, 0x37, 0x30, 0x03]
     #入力コード作成
    cmd = [0x02, 0x30, 0x31, 0x57, 0x53, 0x56, 0x31, 0x30, 0x30]
    ten = str(int(t // 10))
    one = str(int((t % 10) // 1))
    tenth = str(int((t % 1) * 10)) 
    cmd.append(ord(ten))
    cmd.append(ord(one))
    cmd.append(ord(tenth))
    cmd.append(0x03)
    BCC_function(cmd)
    commandInput(cmd)

if args.set:
    #setのバリデーション必要だ
    t =float(args.set[0])
    setTemp(t)
    res = commandReception(ser)
    if res:
       result = resultDefault()
       
       
def start():
    cmd = [0x02, 0x30, 0x31, 0x57, 0x52, 0x55, 0x4E, 0x30, 0x30, 0x30, 0x30, 0x31, 0x03] #実行
    BCC_function(cmd)
    commandInput(cmd)

if args.on:
    start()
    res = commandReception(ser)
    if res:
       result = resultDefault()

if args.setrun:
    t =float(args.setrun[0])
    setTemp(t)
    time.sleep(0.1)
    start()
    res = commandReception(ser)
    if res:
       result = resultDefault()

       
       
def stop():
    cmd = [0x02, 0x30, 0x31, 0x57, 0x52, 0x55, 0x4E, 0x30, 0x30, 0x30, 0x30, 0x30, 0x03] #停止
    BCC_function(cmd)
    commandInput(cmd)

if args.off:
    stop()
    res = commandReception(ser)
    if res:
       result = resultDefault()
       
if args.sstate is not None:
    tempTarget = float(args.sstate[0])
    tempErr = 0.15 #どれぐらいの誤差を許容するか
    maxNumber = 20 #何回取得したら定常とみなすか
    interval = 10 #second
    maxTime = 3600 #最大何秒定常待ちするか
    
    #温度設定
    setTemp(tempTarget)
    time.sleep(0.25)
    
    #実行
    start()
    time.sleep(0.25)  
    
    
    temp = tempGet() #初期値取得
    if temp is None:
        temp = 0
    print(temp)
    
    #一度設定温度到達を待つ
    while  temp < tempTarget:
        time.sleep(10)
        temp = tempGet()
        if temp is None:
            temp = 0
        print(temp)
     
    #複数回のサンプリングで同じ温度or一定時間経過まで待つ
    startTime = time.time()   
    i = 0
    while i < maxNumber and (time.time() - startTime) < maxTime:
        temp = tempGet()
        if temp is None:
            temp = 0
        print(str(temp) + " : " + str(temp - tempTarget))
        if abs(temp - tempTarget) > tempErr:
            i = 0
            print("reset count")
            time.sleep(interval)
            continue
        i+=1
        time.sleep(interval)
    
    result = resultDefault()



ser.close()


#(res:OK 値　単位)
if result is not None:
    print("OK")
    print(result)
else:
    print('ERROR\n\n-')

