#!/usr/bin/python3
# 未完成
# configファイルを入れなおす

#コマンドライン引数オプション
import argparse

parser = argparse.ArgumentParser(description ='コマンドライン引数で動作を分岐')

parser.add_argument('--get',help='流量をget', action='store_true')
parser.add_argument('--run', help='run rate [mL/min] の指定(流量)、run',type = int, nargs=1)
parser.add_argument('--off',help='電圧を0にもどす', action='store_true')


args = parser.parse_args()

#ここから実行用コード

#import time
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
    voltage = ADC_Value[0]*5.0/0x7fffff
    
    flowrate = voltage * 20

    print(flowrate)

if args.run:
    flowrate = args.run[0]
    voltage_input = flowrate / 20
    
    DAC.DAC8532_Out_Voltage(0x30, voltage_input)
    print(resultDefault())

# これいる？
if args.off:
    GPIO.cleanup()
    print(resultDefault())


