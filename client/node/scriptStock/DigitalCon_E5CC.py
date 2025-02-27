import time
import argparse
import serial
import modbus_tk.defines as cst
from modbus_tk import modbus_rtu
from modbus_tk.exceptions import ModbusError, ModbusInvalidResponseError

# コマンドライン引数の処理
parser = argparse.ArgumentParser(description='コマンドライン引数で動作を分岐')

parser.add_argument('--off', help='恒温槽off(25℃へ戻す)', action='store_true')
parser.add_argument('--get', help='温度をget', action='store_true')
parser.add_argument('--set', help='温度をset', nargs=1)
parser.add_argument('--sstate', help='waiting for stady state. set temp and maxTime', nargs=1)
parser.add_argument('--setrun', help='温度をset&実行', nargs=1)
parser.add_argument('--status', help='check the status', action='store_true')
parser.add_argument('--setandsstate', help='温度をset & 定常待ち', nargs=1)

args = parser.parse_args()

# ModBus通信設定
PORT = '/dev/ttyUSB0'
e5cc_h = modbus_rtu.RtuMaster(serial.Serial(port=PORT, baudrate=9600, bytesize=8, parity='N', stopbits=2))
e5cc_h.set_timeout(20)
Address = 1  # ユニット番号指定

# 書き込み許可(初期設定以外の時はコメントアウト推奨)
# 動作指令の書き込み変数アドレスは0x0000
# e5cc_h.execute(Address, cst.WRITE_SINGLE_REGISTER, 0x0000, output_value=0x0001)

def commandInput(command, output):
    # e5cc_h.execute(ユニットNo, 書き込み指定, 書き込む変数のアドレス, output_value=書き込む値（16進数）)
    e5cc_h.execute(Address, cst.WRITE_SINGLE_REGISTER, command, output_value=output)
    time.sleep(0.1)

def commandReception(command):
    retry_limit = 10
    for attempt in range(retry_limit):
        try:
            res = e5cc_h.execute(Address, cst.READ_HOLDING_REGISTERS, command, 1)
            if res is not None:
                return res
            else:
                print(f"received invalid response: {res}")
        except ModbusInvalidResponseError as e:
            print(f"ModbusInvalidResponseError: {e}. retrying {attempt + 1}/{retry_limit}...")
        except ModbusError as e:
             print(f"ModbusError: {e}. retrying {attempt + 1}/{retry_limit}...")
        except serial.SerialException as e:
            print(f"Error: {e}. Retrying {attempt + 1}/{retry_limit}...")
        time.sleep(1)
    print("Failed to receive command after retries.")
    return None

def resultDefault():
    return '\n-'

def resultERROR():
    return 'ERROR'


# 現在温度読み取り
if args.get:
    A1 = commandReception(0x2000)
    if A1:
        print(A1[0] / 10)  # 小数点の分10で割って調整
    else:
        print('error')

if args.off:
    temp_reset = 250
    temp_reset16 = hex(temp_reset)
    temp_reset16_int = int(temp_reset16, 16)
    #print(temp_reset16_int)
    #print(type(temp_reset16_int))
    commandInput(0x2103, temp_reset16_int)
    A1 = commandReception(0x2013)
    if A1:
        print(resultDefault())
    else:
        print(resultERROR())

# 目標温度書き込み＋温度定常待ち
if args.setandsstate:
    t_input = float(args.setandsstate[0])
    t_10 = t_input * 10 # 小数点がなくなるようにずらす
    t_10_int = int(round(t_10))
    temp_int = int(hex(t_10_int), 16)

    commandInput(0x2103, temp_int)
    A1 = commandReception(0x2103)
    
    if A1 is None:
        print(resultERROR())
    else:
        tempErr = 0.5 # 温度の許容範囲
        sleepTime = 5.0 # 判定の間隔 [s]
        #startTime = time.time()

        while True:
            try:
                #if A2 is None:
                    #print("Command reception failed. Restarting steady state wait...")
                    #time.sleep(1)
                    #continue
                
                nowTemp = 10000
                while abs(nowTemp - t_input) >= 0.11:
                    currentTime = time.time()
                    A2 = commandReception(0x2000)
                    if A2 is None:
                        print("Command reception failed. Restarting steady state wait...")
                        time.sleep(1)
                        continue
                    nowTemp = A2[0] / 10
                    print(f'nowTemp: {nowTemp} waiting')
                    codeTime = time.time()
                    timeDiff = codeTime - currentTime
                    time.sleep(sleepTime - timeDiff)
                print('start judgement')
                count = 0
                while count <= 10:
                    currentTime = time.time()
                    A2 = commandReception(0x2000)
                    if A2 is None:
                        print("Command reception failed. Restarting steady state wait...")
                        time.sleep(1)
                        break
                    
                    nowTemp = A2[0] / 10
                    if abs(nowTemp - t_input) <= tempErr:
                        count += 1
                        print(f'nowTemp: {nowTemp}, count: {count}')
                        if count >= 10:
                            print('success')
                            break
                        codeTime = time.time()
                        timeDiff = codeTime - currentTime
                        time.sleep(sleepTime - timeDiff)
                    else:
                        count = 0
                        print(f'nowTemp: {nowTemp} again')
                        codeTime = time.time()
                        timeDiff = codeTime - currentTime
                        time.sleep(sleepTime - timeDiff)

                if count >= 10:
                    break

            except Exception as e:
                print(f"Unexpected error: {e}. Restarting steady state wait...")
                time.sleep(1)

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
        
# 定常待ちで使うアクション
if args.set:
    # 温度を16進数に変換
    t_set_input = float(args.set[0])
    t_set_10 = t_set_input * 10 # 小数点がなくなるようにずらす（20.5℃なら205へ）
    t_set_10_int = int(round(t_set_10))
    temp_set = hex(t_set_10_int)
    temp_set_int = int(temp_set, 16)
    
    commandInput(0x2103, temp_set_int)
    A1 = commandReception(0x2103)

# 他にもいるかな？
errorMsg1 = ["警報2", "警報1", "HB警報（CT2）", "HB警報（CT1）"]
errorMsg2 = ["ポテンショメータ入力異常", "入力異常", "-", "RSP入力異常", "HS(SSR故障)警報", "ADコンバータ異常"]

if args.status:
    st = commandReception(0x2001)
    stat = st[0]
    status_bits = [int(bit) for bit in f"{stat:016b}"]
    #print(st[0])
    #print(status_bits)

    status_bits1 = status_bits[2:6]
    status_bits2 = status_bits[8:14]
    #print(status_bits2)

    if not (1 in status_bits1 and 1 in status_bits2):
        print(resultDefault())
    else:
        print(resultERROR())
        for i in range(0, len(status_bits1)):
            if status_bits1[i] == 1:
                print(errorMsg1[i])
        for i in range(len(status_bits2)):
            if status_bits2[i] == 1:
                print(errorMsg2[i])
    
# ソフトリセット
# e5cc_h.execute(Address, cst.WRITE_SINGLE_REGISTER, 0x0000, output_value=0x0600)
