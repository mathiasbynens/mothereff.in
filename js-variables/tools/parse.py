#!/usr/bin/python
# By Yusuke Suzuki <utatane.tea@gmail.com>
# Modified by Mathias Bynens <https://mathiasbynens.be/>
# http://code.google.com/p/esprima/issues/detail?id=110

import sys
import string
import re

# https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
def highSurrogate(codePoint):
	return int(math.floor((codePoint - 0x10000) / 0x400) + 0xD800)

def lowSurrogate(codePoint):
	return int((codePoint - 0x10000) % 0x400 + 0xDC00)

def codePointToString(codePoint):
	if codePoint == 0:
		string = '\\0' # https://mathiasbynens.be/notes/javascript-escapes#single
	elif (codePoint >= 0x41 and codePoint <= 0x5A) or (codePoint >= 0x61 and codePoint <= 0x7A) or (codePoint >= 0x30 and codePoint <= 0x39): # [a-zA-Z0-9]
		string = chr(codePoint)
	elif codePoint <= 0xFF: # https://mathiasbynens.be/notes/javascript-escapes#hexadecimal
		string = '\\x' + '%02X' % codePoint
	elif codePoint <= 0xFFFF: # https://mathiasbynens.be/notes/javascript-escapes#unicode
		string = '\\u' + '%04X' % codePoint
	else: # surrogate pairs
		string = '\\u' + '%04X' % highSurrogate(codePoint) + '\\u' + '%04X' % lowSurrogate(codePoint)
	return string

class RegExpGenerator(object):
	def __init__(self, detector):
		self.detector = detector

	def generate_identifier_start(self):
		r = [ ch for ch in range(0xFFFF + 1) if self.detector.is_identifier_start(ch)]
		return self._generate_range(r)

	def generate_identifier_part(self):
		r = [ ch for ch in range(0xFFFF + 1) if self.detector.is_identifier_part(ch)]
		return self._generate_range(r)

	def generate_identifier_part_exclusive(self):
		r = [ ch for ch in range(0xFFFF + 1) if self.detector.is_identifier_part_exclusive(ch)]
		return self._generate_range(r)

	def _generate_range(self, r):
		if len(r) == 0:
			return ''

		buf = []
		start = r[0]
		end = r[0]
		predict = start + 1
		r = r[1:]

		for code in r:
			if predict == code:
				end = code
				predict = code + 1
				continue
			else:
				if start == end:
					buf.append('%s' % codePointToString(start))
				elif end == start + 1:
					buf.append('%s%s' % (codePointToString(start), codePointToString(end)))
				else:
					buf.append('%s-%s' % (codePointToString(start), codePointToString(end)))
				start = code
				end = code
				predict = code + 1

		if start == end:
			buf.append('%s' % codePointToString(start))
		elif end == start + 1:
			buf.append('%s%s' % (codePointToString(start), codePointToString(end)))
		else:
			buf.append('%s-%s' % (codePointToString(start), codePointToString(end)))

		return ''.join(buf)


class Detector(object):
	def __init__(self, data):
		self.data = data

	def is_decimal_digit(self, ch):
		return ch >= ord('0') and ch <= ord('9')

	def is_ascii(self, ch):
		return ch < 0x80

	def is_ascii_alpha(self, ch):
		v = ch | 0x20
		return v >= ord('a') and v <= ord('z')

	def is_ascii_alphanumeric(self, ch):
		return self.is_decimal_digit(ch) or self.is_ascii_alpha(ch)

	def is_identifier_start(self, ch):
		if self.is_ascii(ch):
			return ch == ord('$') or ch == ord('_') or ch == ord('\\') or self.is_ascii_alpha(ch)
		return self._is_non_ascii_identifier_start(ch)

	def is_identifier_part(self, ch):
		if self.is_ascii(ch):
			return ch == ord('$') or ch == ord('_') or ch == ord('\\') or self.is_ascii_alphanumeric(ch)
		return self._is_non_ascii_identifier_part(ch)

	def _is_non_ascii_identifier_start(self, ch):
		c = self.data[ch]
		return c == 'Lu' or c == 'Ll' or c == 'Lt' or c == 'Lm' or c == 'Lo' or c == 'Nl'

	def _is_non_ascii_identifier_part(self, ch):
		c = self.data[ch]
		return c == 'Lu' or c == 'Ll' or c == 'Lt' or c == 'Lm' or c == 'Lo' or c == 'Nl' or c == 'Mn' or c == 'Mc' or c == 'Nd' or c == 'Pc' or ch == 0x200C or ch == 0x200D

	def is_identifier_part_exclusive(self, ch):
		return self.is_identifier_part(ch) and not self.is_identifier_start(ch)

def analyze(source):
	data = []
	dictionary = {}
	with open(source) as uni:
		flag = False
		first = 0
		for line in uni:
			d = string.split(line.strip(), ';')
			val = int(d[0], 16)
			if flag:
				if re.compile('<.+, Last>').match(d[1]):
					# print '%s : u%X' % (d[1], val)
					flag = False
					for t in range(first, val+1):
						dictionary[t] = str(d[2])
				else:
					raise 'Database Exception'
			else:
				if re.compile('<.+, First>').match(d[1]):
					# print '%s : u%X' % (d[1], val)
					flag = True
					first = val
				else:
					dictionary[val] = str(d[2])
	for i in range(0xFFFF + 1):
		if dictionary.get(i) == None:
			data.append('Cn')
		else:
			data.append(dictionary[i])
	return RegExpGenerator(Detector(data))

def main(source):
	generator = analyze(source)
	#print generator.generate_identifier_start()
	print generator.generate_identifier_part_exclusive()

if __name__ == '__main__':
	main(sys.argv[1])