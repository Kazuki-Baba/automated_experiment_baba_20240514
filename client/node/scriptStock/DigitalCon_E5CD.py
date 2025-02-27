#!/usr/bin/python3

# コマンドライン引数オプション
# パッケージインポート
import time
import argparse
import serial
import modbus_tk.defines as cst
from modbus_tk import modbus_rtu

# いつもの
parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--off', help='恒温槽off', action='store_true')
parser.add_argument('--get', help='温度をget', action='store_true')
parser.add_argument('--setrun', help='温度をset&実行', nargs=1)

args = parser.parse_args()

# ここから実行用コード

def resultDefault():
    return '\n-'

def resultERROR():
    return 'ERROR'

# ModBus通信設定
PORT = '/dev/ttyUSB0'
e5cc_h = modbus_rtu.RtuMaster(serial.Serial(port=PORT, baudrate=9600, bytesize=8, parity='N', stopbits=2))
e5cc_h.set_timeout(20)
Address = 1 # ユニット番号指定

# 書き込み許可(初期設定以外の時はコメントアウト推奨)
# 動作指令の書き込み変数アドレスは0x0000
# e5cc_h.execute(Address, cst.WRITE_SINGLE_REGISTER, 0x0000, output_value=0x0001)

def commandInput(command, output):  # コマンド送信
    # e5cc_h.execute(ユニットNo, 書き込み指定, 書き込む変数のアドレス, output_value=書き込む値（16進数）)
    e5cc_h.execute(Address, cst.WRITE_SINGLE_REGISTER, command, output_value=output)
    time.sleep(0.1)

def commandReception(command):  # 受信
    # e5cc_h.execute(ユニットNo, 読み取り指定, 読み取る変数のアドレス, 変数の個数)
    res = e5cc_h.execute(Address, cst.READ_HOLDING_REGISTERS, command, 1)
    return res


# 現在温度読み取り
if args.get:
    A1 = commandReception(0x2000)
    print(A1[0] / 10) # 小数点の分10で割って調整

# 恒温槽off（室温２５℃へ戻す）
if args.off:
    temp_reset = 250
    temp_reset16 = hex(temp_reset)
    temp_reset16_int = int(temp_reset16)
    commandInput(0x2103, temp_reset16_int)
    A1 = commandReception(0x2103)
    if A1:
        print(resultDefault())
    else:
        print(resultERROR())

# 目標温度書き込み
if args.setrun:
    # 温度を16進数に変換
    t_input = float(args.setrun[0])
    t_10 = t_input * 10 # 小数点がなくなるようにずらす（20.5℃なら205へ）
    t_10_int = int(round(t_10)) # 桁落ちしないようにround追加、確認はまだ
    temp = hex(t_10_int)
    temp_int = int(temp, 16)
    
    commandInput(0x2103, temp_int)
    A1 = commandReception(0x2103)
    if A1:
        print(resultDefault())
    else:
        print(resultERROR())

# ソフトリセット
# e5cc_h.execute(Address, cst.WRITE_SINGLE_REGISTER, 0x0000, output_value=0x0600)
