// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import Foundation

class PortUtils {
	static func isPortFree(_ port: in_port_t) -> Bool {
		let socketFileDescriptor = socket(AF_INET, SOCK_STREAM, 0)
		if socketFileDescriptor == -1 {
			return false
		}

		var addr = sockaddr_in()
		let sizeOfSockkAddr = MemoryLayout<sockaddr_in>.size
		addr.sin_len = __uint8_t(sizeOfSockkAddr)
		addr.sin_family = sa_family_t(AF_INET)
		addr.sin_port = Int(OSHostByteOrder()) == OSLittleEndian ? _OSSwapInt16(port) : port
		addr.sin_addr = in_addr(s_addr: inet_addr("127.0.0.1"))
		addr.sin_zero = (0, 0, 0, 0, 0, 0, 0, 0)
		var bind_addr = sockaddr()
		memcpy(&bind_addr, &addr, Int(sizeOfSockkAddr))

		if Darwin.bind(socketFileDescriptor, &bind_addr, socklen_t(sizeOfSockkAddr)) == -1 {
			release(socket: socketFileDescriptor)
			return false
		}
		if listen(socketFileDescriptor, SOMAXCONN ) == -1 {
			release(socket: socketFileDescriptor)
			return false
		}
		release(socket: socketFileDescriptor)
		return true
	}

	private static func release(socket: Int32) {
		Darwin.shutdown(socket, SHUT_RDWR)
		close(socket)
	}

	static func getFreePort() -> in_port_t {
		var portNum: in_port_t = 0
		for i in 50000..<65000 {
			let isFree = isPortFree(in_port_t(i))
			if isFree {
				portNum = in_port_t(i)
				return portNum
			}
		}

		return in_port_t(0)
	}
}
