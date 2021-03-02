// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class LineReader {
    private static appendBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer) {
        const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
        tmp.set(new Uint8Array(buffer1), 0)
        tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
        return tmp.buffer
    }

    private static arrayBufferIndexOf(buffer: ArrayBuffer, charCode: number): number {
        const view = new Uint8Array(buffer)
        for (let i = 0; i < view.byteLength; ++i) {
            if (view[i] === charCode) {
                return i
            }
        }

        return -1
    }

    static readFile(file: File, callback: (line: string, completed: boolean) => void): void {
        let buffer = new ArrayBuffer(0)

        const chunkSize = 1024 * 1000
        let offset = 0
        const fr = new FileReader()
        const decoder = new TextDecoder()

        fr.onload = () => {
            const chunk = fr.result as ArrayBuffer
            buffer = LineReader.appendBuffer(buffer, chunk)

            const newlineChar = 10 // '\n'
            let newlineIndex = LineReader.arrayBufferIndexOf(buffer, newlineChar)
            while (newlineIndex >= 0) {
                const result = decoder.decode(buffer.slice(0, newlineIndex))
                buffer = buffer.slice(newlineIndex + 1)
                callback(result, false)
                newlineIndex = LineReader.arrayBufferIndexOf(buffer, newlineChar)
            }

            offset += chunkSize
            if (offset >= file.size) {
                // Completed

                if (buffer.byteLength > 0) {
                    // Handle last line
                    callback(decoder.decode(buffer), false)
                }

                callback('', true)
                return
            }

            seek()
        }

        fr.onerror = () => {
            callback('', true)
        }

        seek()

        function seek() {
            const slice = file.slice(offset, offset + chunkSize)

            // Need to read as an ArrayBuffer (instead of text) to handle unicode boundaries
            fr.readAsArrayBuffer(slice)
        }
    }
}

export {LineReader}
