def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

def multiply(a, b):
    return a * b

def divide(a, b):
    if b == 0:
        return 'Error: Division by zero'
    return a / b

if __name__ == '__main__':
    try:
        num1 = float(input('Enter first number: '))
        num2 = float(input('Enter second number: '))
        operation = input('Enter operation (+, -, *, /): ')
        if operation == '+':
            print('Result:', add(num1, num2))
        elif operation == '-':
            print('Result:', subtract(num1, num2))
        elif operation == '*':
            print('Result:', multiply(num1, num2))
        elif operation == '/':
            print('Result:', divide(num1, num2))
        else:
            print('Invalid operation')
    except ValueError:
        print('Invalid input')
