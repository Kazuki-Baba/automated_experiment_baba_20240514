#!/usr/bin/python3
import serial
import serial.tools.list_ports
import datetime
import os
import argparse
import csv
import time
import shelve
import threading

"""
ports = list(serial.tools.list_ports.comports())
for p in ports:
    print(p)
    print(" device       :", p.device)
    print(" name         :", p.name)
    print(" description  :", p.description)
    print(" hwid         :", p.hwid)
    print(" vid          :", p.vid)
    print(" pid          :", p.pid)
    print(" serial_number:", p.serial_number)
    print(" location     :", p.location)
    print(" manufactuer  :", p.manufacturer)
    print(" product      :", p.product)
    print(" interface    :", p.interface)
    print("")
"""

parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--tare', help='tare ', action='store_true')
parser.add_argument('--get', help='return weight', action='store_true')
parser.add_argument('--setFileName', help='set file name', nargs=1)
# you may use this action
parser.add_argument('--measure', help='record weight for a certain time', action='store_true')

args = parser.parse_args()


def resultDefault():
    return '-'

def resultERROR():
    return 'ERROR'

def cmd_Convert(InputCmd):
    return InputCmd.encode()

class ElectricScale:
    output_dir = '/home/nagasawa/ElectricScaleData'
    # output_dir = 'E:\python\ElectricScaleData'
    unstable_str = "Unstable"
    saveError_str = "Fail to Save"

    def __init__(self, tty: str):
        # Initialize this class
        self.lock = threading.Lock()
        self.isPortOpen = False
        self.OpenPort(tty)

    def __del__(self):
        self.serialport.close()

    def OpenPort(self, tty: str, baud = 9600):
        # Connect to the robot arm with usb port
        try:
            self.serialport = serial.Serial(tty, baud, timeout=10, parity=serial.PARITY_EVEN, bytesize=7)
            self.isPortOpen = True
        except Exception as e:
            self.isPortOpen = False
        return self.isPortOpen
    
    def sendCommand(self, cmd:str):
        with self.lock:
            cmd = cmd_Convert(cmd)
            #print(cmd)
            self.serialport.write(cmd)
            return
    
    def readSer(self):
        res = str(self.serialport.readline())
        return res[2:17]
        

    def tare(self):
        cmd = 'Z\r\n' 
        self.sendCommand(cmd)
    
    # 送液中に計測できるように変更
    def getWeight(self):
        with self.lock:
            cmd = 'Q\r\n' # 1回出力
            self.sendCommand(cmd)
            res = self.readSer()
            # print(res)
            #head = res[0:2]
            val = float(res[3:12])
            unit = res[12:15]
            # print(head, val, unit)
            return [val, unit]

        '''
        for i in range(10):
            self.sendCommand(cmd)
            res = self.readSer()
            # print(res)
            head = res[0:2]
            val = float(res[3:12])
            unit = res[12:15]
            # print(head, val, unit)
            if(head == "ST"):
                return [val, unit]
            else:
                time.sleep(1)
        return Scale.unstable_str
        '''
    
    # Acquire 5 weight data points every second
    def measure(self):
        time_list = [] # [s]
        measured_value_list = [] # [g]
        start_time = time.time()
        for i in range(5): # Specify the number of data to be acquired
            weight = self.getWeight()
            current_time = time.time()
            elapsed_time = current_time - start_time
            measured_value_list.append(weight[0])
            time_list.append(elapsed_time)
            time.sleep(1) # Measurement Interval
        return measured_value_list, time_list

    
    def writeData(self, val, unit):
        try:
            with shelve.open('Scale_Shelf') as shelf_file:
                try:
                # 変数を取得する
                    name = shelf_file['FileName']
                except Exception as err:
                    print(err)
                    return self.saveError_str
        except Exception as err:
            print(err)
            return self.saveError_str
        os.makedirs(self.output_dir, exist_ok=True)
        start_date = datetime.datetime.now()
        formatted_date = start_date.strftime('%Y%m%d')
        formatted_date2 = start_date.strftime('%Y/%m/%d')
        formatted_time = start_date.strftime('%H:%M:%S')
        file_name = f'{name}_{formatted_date}.csv'
        output_csv_path = os.path.join(self.output_dir, file_name)
        result_list = [formatted_date2, formatted_time, val, unit]
        # print(result_list)
        try:
            with open(output_csv_path, mode='a') as file:
                writer = csv.writer(file, lineterminator='\n')
                writer.writerows([result_list])
                return "ok"
        except FileNotFoundError:
            with open(output_csv_path, mode='x') as file:
                writer = csv.writer(file, lineterminator='\n')
                writer.writerows([result_list])
                return "ok"
        except Exception as e:
            print(e)
            return self.saveError_str
    
    def set_FileName(self, name:str):
        try:
            with shelve.open('Scale_Shelf') as shelf_file:
                # 変数を保存する
                shelf_file['FileName'] = name
            return "ok"
        except Exception as e:
            print(e)
            return self.saveError_str
            



# Scale = ElectricScale('COM6')
Scale = ElectricScale("/dev/ttyUSB0")
# print(Scale.isPortOpen)

if args.tare:
    Scale.tare()
    if Scale.isPortOpen == True:
        print(resultDefault())
    else:
        print(resultERROR())


if args.get:
    res = Scale.getWeight()
    if Scale.isPortOpen == True:
        #print(res)
        if(res == Scale.unstable_str):
            print(res)
            print(resultERROR())
        else:
            print(str(res[0])+res[1])
            '''
            res2 = Scale.writeData(res[0], res[1])
            if(res2 == Scale.saveError_str):
                print(res2)
                print(resultERROR())
            else:
                print(resultDefault())
            '''
    else:
        print(resultERROR())

# Record weight change every second
if args.measure:
    measured_values, time_values = Scale.measure()
    print(measured_values)
    print(time_values)
    if Scale.isPortOpen == True:
        print(resultDefault())
    else:
        print(resultERROR())

if args.setFileName:
    name = args.setFileName[0]
    res = Scale.set_FileName(name)
    if(res == Scale.saveError_str):
        print(res)
        print(resultERROR())
    else:
        print(resultDefault())

