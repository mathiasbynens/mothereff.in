#!/usr/bin/python
# By Yusuke Suzuki <utatane.tea@gmail.com>
# Modified by Mathias Bynens <http://mathiasbynens.be/>
# http://code.google.com/p/esprima/issues/detail?id=110

import sys
import string
import re

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
					buf.append('\\u%04X' % start)
				elif end == start + 1:
					buf.append('\\u%04X\\u%04X' % (start, end))
				else:
					buf.append('\\u%04X-\\u%04X' % (start, end))
				start = code
				end = code
				predict = code + 1

		if start == end:
			buf.append('\\u%04X' % start)
		elif end == start + 1:
			buf.append('\\u%04X\\u%04X' % (start, end))
		else:
			buf.append('\\u%04X-\\u%04X' % (start, end))

		return ''.join(buf)


class Detector(object):
	def __init__(self, data):
		self.data = data

	def is_identifier_start(self, ch):
		if self.is_ascii(ch):
			return ch == ord('$') or ch == ord('_') or ch == ord('\\') or self.is_ascii_alpha(ch)
		return self._is_non_ascii_identifier_start(ch)

	def is_identifier_part(self, ch):
		if self.is_ascii(ch):
			return ch == ord('$') or ch == ord('_') or ch == ord('\\') or self.is_ascii_alphanumeric(ch)
		return self._is_non_ascii_identifier_part(ch)

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
	print generator.generate_identifier_start()
	print generator.generate_identifier_part_exclusive()
	# I manually post-process the generated regex ranges by copy-pasting each
	# of them into http://mothereff.in/js-escapes. Yes, I’m *that* guy.

if __name__ == '__main__':
	main(sys.argv[1])