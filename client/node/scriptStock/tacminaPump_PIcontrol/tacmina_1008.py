#!/usr/bin/python3

# コマンドライン引数オプション
import struct
import time
import datetime
import serial
import argparse
import sys
import threading
import os

from ElectricScale_EKEW_baba import ElectricScale

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--run', help='run rate の指定(流量)、run', nargs=1)
parser.add_argument('--off', help='run rate を0に指定(流量)、停止', action="store_true")
parser.add_argument('--runPI', help='PI制御により、指定した流量[mL/min]で送液、電子天秤が必要, argument=(flow rate[mL/min], density [g/mL]', nargs=2)
parser.add_argument('--offPI', help='PI制御 stop', action="store_true")

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

# baba_modified_20241008
# serial_lock = threading.Lock()

obj = ElectricScale('/dev/ttyUSB0') 

"""
cmd = "D,00\r"
cmd = "H,00\r"
cmd = "N,00\r"
cmd = "E,00\r"
cmd = "S,00,10\r"
cmd = "L,00\r"
cmd = "A,00,6500\r"
cmd = "A,00,0\r"
cmd = "A,00,650\r"
"""

# baba_modified_commandInput & Reception_20241008
def commandInput(cmd):  #コマンド送信
    #with serial_lock:
    ser.write( cmd.encode() )
    ser.flush()
    time.sleep(0.05)

def commandReception(ser):   #受信
    #with serial_lock:
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
    cmd = float(cmd)*655.36
    cmd_int = round(cmd)
    cmd = f"A,00,{cmd_int}\r"
    commandInput(cmd)
    res=commandReception(ser)
    print(res)

def createStopFile():
    with open('stop.txt', 'w') as f:
        f.write('')

def deleteStopFile():
    if os.path.isfile('stop.txt'):
        os.remove('stop.txt')

def checkStopFile():
    return os.path.isfile('stop.txt')

def monitorStopFile(stopEvent):
    while not stopEvent.is_set():
        if checkStopFile():
            stopEvent.set()

def resultDefault():
    return '-'

def resultERROR():
    return 'ERROR'

def rateSetRunPI(cmd):
    cmd = float(cmd)*655.36
    cmd_int = round(cmd)
    cmd = f"A,00,{cmd_int}\r"
    commandInput(cmd)
    
def offPI():
    cmd = "H,00\r"
    commandInput(cmd)

def fonction2(F, density, obj, stopEvent):
    
    '''
    
    n : number of measures to be acquired
    F : input flow rate
    
    This function returns a time list of each measurement and a list containing these measurements corrected 
    over time

    '''
    
    Ki = 10.0             # Integration gain 20
    Kp = 5.0            # Proportional gain 25

    # Initialisation
    rho = float(density)
    offset = float(F)
    w = [obj.getWeight()[0]]                        # List containing w(0)
    
    time_list = [0]
    start_time = time.time()

    error = [0]
    P_list = [0]
    I_list = [0]
    u_list = [F]
    i = 0

    # Loop
    
    while True: 
        #time.sleep(0.05)                               # Measurement Interval
        current_time = time.time()
        time_elapsed = current_time - start_time
        time_list.append(time_elapsed)
        while True:
            try:
                w_meas = obj.getWeight()[0]
                break
            except Exception as e:
                #print(e)
                continue

        """
        res = obj.getWeightFinal()[0] # Measure at t-time
        if res.replace("+","").replace("-","").replace(".","").isdigit():
            w_meas = float(res)
        else:
            w_meas = obj.getWeight()[0]

        """

        w_calc = w[0] - float(F) * time_list[i+1]/60. * rho
        e = w_calc - w_meas                         # Error
        dt = time_list[i+1]-time_list[i]            # Discretisation step

        # PID parameters
        P = Kp * e
        #I  = Ki * e *dt
        # baba_modified_20241008
        I = I_list[-1] + e * dt
        u = offset - (P + Ki * I)
        
        w.append(w_meas)
        error.append(e)
        P_list.append(P)
        I_list.append(I)
        u_list.append(u)
                
        i = i + 1
        
        if (stopEvent.is_set()):
            break
            
        rateSetRunPI(u)                   

    return time_list, w, error, P_list, I_list, u_list        

def save_lists(time_list, w, error, P_list, I_list, u_list, file_path):
    with open(file_path, 'w') as f:
        for t, weight, err, p, i, u in zip(time_list, w, error, P_list, I_list, u_list):
            f.write(f"{t}\t{weight}\t{err}\t{p}\t{i}\t{u}\n")
        f.write(f"{time_list[-1]}\t{w[-1]}\t-\t-\t-\t-\n")


ser.open()

if args.run is not None:
    speed = args.run[0]
    rateSetRun(speed)

if args.off:
    rateSetRun(0)
    off()

if args.runPI:
    print(resultDefault())
    sys.stdout.flush()
    # いったんポンプスタートして次の動作へ移る
    
    deleteStopFile()
    F = args.runPI[0]
    sleep_time = 5 * 4 / 100
    #sleep_time = float(F) * 4 / 100
    density = args.runPI[1]
    rateSetRun(F)


    stopEvent = threading.Event()
    monitor_thread = threading.Thread(target=monitorStopFile, args=(stopEvent,))
    monitor_thread.start()

    # 次の動作に移ってから裏でPI制御（時間計測中にPI制御するみたいな）
    try:
        time.sleep(sleep_time)
        runtime = time.time() 
        time_list, w, error, P_list, I_list, u_list  = fonction2(F, density, obj, stopEvent)
        rateSetRunPI(0)
        offPI()
        deleteStopFile()
        

        endtime = time.time() - runtime
        time.sleep(1.0)

        w_end = None
        while not w_end:
            try:
                res = obj.getWeightFinal()[0]
                
                if res.replace("+", "").replace("-", "").replace(".", "").isdigit():
                    w_end = float(res)
                
                else:
                    print("Invalid format")
                    w_end = None
            except:
                w_end = None
        
        w.append(w_end)
        time_list.append(endtime)
               
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        os.makedirs('result', exist_ok=True)
        file_path = f'result/tacmina_{timestamp}.txt'
        save_lists(time_list, w, error, P_list, I_list, u_list, file_path)

        total = w[0] - w[-1]
        print(f"{total:.2f} g\n")

    except Exception as e:
        print(e)

        """
        rateSetRunPI(0)
        offPI()
        deleteStopFile()
        print(resultERROR())
        
        rateSetRunPI(0)
        offPI()
        deleteStopFile()
        
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        os.makedirs('result', exist_ok=True)
        file_path = f'result/tacmina_{timestamp}.txt'
        save_lists(time_list, w, error, P_list, I_list, u_list, file_path)

        if not w:
            print("no")
        total = w[0] - w[-1]
        print(f"{total:.2f} g\n")
        """


if args.offPI:
    """
    rateSetRunPI(0)
    offPI()
    """
    createStopFile()
    time.sleep(5)
    print(resultDefault())


