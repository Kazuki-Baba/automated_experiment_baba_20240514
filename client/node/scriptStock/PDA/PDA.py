#!/usr/bin/python3

#コマンドライン引数オプション
import argparse

parser = argparse.ArgumentParser(description ='コマンドライン引数で動作を分岐')

parser.add_argument('--get',help='電圧（濃度）をget', action='store_true')
parser.add_argument('--on', help='PDAを発火', action="store_true")

args = parser.parse_args()

#ここから実行用コード
import serial
#import spidev
import time
#import config
import ADS1256
import RPi.GPIO as GPIO

def resultDefault():
    return '\n-'

GPIO_PIN = 18

# GPIOのモードをセットアップ（GPIOの番号を指定するように設定）
GPIO.setmode(GPIO.BCM)
# HPLCとつながったGPIOピンを出力モードに設定
GPIO.setup(GPIO_PIN, GPIO.OUT)

ADC = ADS1256.ADS1256()
ADC.ADS1256_init()

try:
    if args.get:
    ADC_Value = ADC.ADS1256_GetAll()
    voltage = ADC_Value[1]*5.0/0x7fffff
    
    conc = 0.2746 * voltage -0.0621

    print(conc)
    
    if args.on:
        # HPLCを発火（GPIO.HIGHはTrue, 1と同義）
        GPIO.output(GPIO_PIN, GPIO.HIGH)
        time.sleep(1) # 安定するまで待機
    
    # 電流を止める（GPIO.LOWはFalse, 0と同義）
    GPIO.output(GPIO_PIN, GPIO.LOW)

finally:
    # GPIOを解放
    GPIO.cleanup()



