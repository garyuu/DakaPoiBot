import sys
import codecs
sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
from sys import argv
import random

try:
    name, inputStr = argv
except:
    inputStr = input("Input text: ")
print(inputStr, file=sys.stderr)
outputStr = ''
for i in range(len(inputStr)):
    outputStr += inputStr[i]# + ''.join(chr(0x0489))
    for j in range(random.randint(1,10)):
      symbol = random.randint(0x0300, 0x036F)
      outputStr += ''.join(chr(symbol))
print(outputStr.encode('utf-8', 'ignore').decode('utf-8'))
