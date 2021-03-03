// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

class LineReader {
    private static appendBuffer(buffer1: Uint8Array, buffer2: Uint8Array): Uint8Array {
        const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
        tmp.set(buffer1, 0)
        tmp.set(buffer2, buffer1.byteLength)

        return tmp
    }

    private static arrayBufferIndexOf(buffer: Uint8Array, charCode: number): number {
        for (let i = 0; i < buffer.byteLength; ++i) {
            if (buffer[i] === charCode) {
                return i
            }
        }

        return -1
    }

    static readFile(file: File, callback: (line: string, completed: boolean) => Promise<void>): void {
        let buffer = new Uint8Array(0)

        const chunkSize = 1024 * 1000
        let offset = 0
        const fr = new FileReader()
        const decoder = new TextDecoder()

        fr.onload = async () => {
            const chunk = new Uint8Array(fr.result as ArrayBuffer)
            buffer = LineReader.appendBuffer(buffer, chunk)

            const newlineChar = 10 // '\n'
            let newlineIndex = LineReader.arrayBufferIndexOf(buffer, newlineChar)
            while (newlineIndex >= 0) {
                const result = decoder.decode(buffer.slice(0, newlineIndex))
                buffer = buffer.slice(newlineIndex + 1)

                // eslint-disable-next-line no-await-in-loop
                await callback(result, false)
                newlineIndex = LineReader.arrayBufferIndexOf(buffer, newlineChar)
            }

            offset += chunkSize
            if (offset >= file.size) {
                // Completed

                if (buffer.byteLength > 0) {
                    // Handle last line
                    await callback(decoder.decode(buffer), false)
                }

                await callback('', true)
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
