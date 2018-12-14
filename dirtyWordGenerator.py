from sys import argv
import random

try:
    name, inputStr = argv
except:
    inputStr = input("Input text: ")
outputStr = ""
for i in range(len(inputStr)):
    outputStr += inputStr[i] + ''.join(chr(0x0489))
    for j in range(random.randint(1,2)):
      symbol = random.randint(0x0300, 0x0370)
      outputStr += ''.join(chr(symbol))
print(outputStr.encode('utf-8', 'ignore').decode('utf-8'))
