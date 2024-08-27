#!/usr/bin/python3

#コマンドライン引数オプション
import argparse

parser = argparse.ArgumentParser(description ='コマンドライン引数で動作を分岐')

parser.add_argument('--get',help='流量をget', action='store_true')
parser.add_argument('--run', help='run rate [mL/min] の指定(流量)、run', nargs=1)
parser.add_argument('--off',help='電圧を0にもどす', action='store_true')


args = parser.parse_args()

#ここから実行用コード

import time
import ADS1256
import DAC8532
import RPi.GPIO as GPIO

def resultDefault():
    return '\n-'

ADC = ADS1256.ADS1256()
DAC = DAC8532.DAC8532()
ADC.ADS1256_init()


if args.get:
    ADC_Value = ADC.ADS1256_GetAll()
    voltage = ADC_Value[2]*5.0/0x7fffff # AD2
    
    #flowrate = voltage * 9.66886 + 2.64794 # 50SCCM
    flowrate = voltage * 2.5  #20 SCCM
    
    '''
    f_list = []
    
    try:
        while True:
            ADC_Value = ADC.ADS1256_GetAll()
            voltage = ADC_Value[2]*5.0/0x7fffff

            flowrate = voltage * 2.5
            f_list.append(flowrate)
            
            print(flowrate)
            time.sleep(1)

    except KeyboardInterrupt:
        print(f_list)
    '''
   

    #print(flowrate)

if args.run:
    flowrate = args.run[0]
    #voltage_input = (flowrate * 0.10458 - 0.28856) * 1.00809 # 50SCCM
    voltage_input = float(flowrate) * 25 / 100 # 20 SCCM

    DAC.DAC8532_Out_Voltage(0x30, voltage_input)
    print(resultDefault())

# これいる？
if args.off:
    DAC.DAC8532_Out_Voltage(0x30, 0)
    GPIO.cleanup()
    print(resultDefault())


