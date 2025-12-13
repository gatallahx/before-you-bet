import base64

RSA_KEY_STRING = """"""

key_bytes = RSA_KEY_STRING.encode('utf-8')

base64_bytes = base64.b64encode(key_bytes)

base64_string = base64_bytes.decode('ascii')

print(base64_string)