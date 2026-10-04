const text = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.slice(start, end));
export function verifyImage(bytes: Uint8Array, mime: string) {
  if (bytes.length < 24 || bytes.length > 2 * 1024 * 1024)
    throw Error("INVALID_IMAGE_SIZE");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0,
    height = 0;
  if (
    mime === "image/png" &&
    Array.from(bytes.slice(0, 8)).join(",") === "137,80,78,71,13,10,26,10"
  ) {
    if (text(bytes, 12, 16) !== "IHDR" || view.getUint32(8) !== 13)
      throw Error("INVALID_IMAGE_CONTENT");
    width = view.getUint32(16);
    height = view.getUint32(20);
    let position = 8,
      hasData = false,
      ended = false;
    while (position + 12 <= bytes.length) {
      const size = view.getUint32(position),
        kind = text(bytes, position + 4, position + 8);
      if (size > bytes.length - position - 12 || kind === "acTL")
        throw Error("INVALID_IMAGE_CONTENT");
      if (kind === "IDAT") hasData = true;
      position += size + 12;
      if (kind === "IEND") {
        ended = true;
        break;
      }
    }
    if (!hasData || !ended || position !== bytes.length)
      throw Error("INVALID_IMAGE_CONTENT");
  } else if (
    mime === "image/jpeg" &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217
  ) {
    let position = 2;
    while (position + 4 < bytes.length) {
      if (bytes[position++] !== 255) throw Error("INVALID_IMAGE_CONTENT");
      let marker = bytes[position++];
      while (marker === 255) marker = bytes[position++];
      if (marker === 218 || marker === 217) break;
      const size = view.getUint16(position);
      if (size < 2 || position + size > bytes.length)
        throw Error("INVALID_IMAGE_CONTENT");
      if (
        [
          192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207,
        ].includes(marker)
      ) {
        if (size < 8) throw Error("INVALID_IMAGE_CONTENT");
        height = view.getUint16(position + 3);
        width = view.getUint16(position + 5);
        break;
      }
      position += size;
    }
  } else if (
    mime === "image/webp" &&
    text(bytes, 0, 4) === "RIFF" &&
    text(bytes, 8, 12) === "WEBP" &&
    view.getUint32(4, true) + 8 === bytes.length
  ) {
    const kind = text(bytes, 12, 16);
    if (view.getUint32(16, true) > bytes.length - 20)
      throw Error("INVALID_IMAGE_CONTENT");
    if (kind === "VP8X" && bytes.length >= 30) {
      if (bytes[20] & 2) throw Error("ANIMATED_IMAGE_REJECTED");
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (kind === "VP8L" && bytes.length >= 25 && bytes[20] === 47) {
      const bits = view.getUint32(21, true);
      width = (bits & 16383) + 1;
      height = ((bits >>> 14) & 16383) + 1;
    } else if (
      kind === "VP8 " &&
      bytes.length >= 30 &&
      text(bytes, 23, 26) === "\u009d\u0001\u002a"
    ) {
      width = view.getUint16(26, true) & 16383;
      height = view.getUint16(28, true) & 16383;
    }
  } else throw Error("INVALID_IMAGE_CONTENT");
  if (
    width < 1 ||
    height < 1 ||
    width > 8192 ||
    height > 8192 ||
    width * height > 20000000
  )
    throw Error("INVALID_IMAGE_DIMENSIONS");
  return mime;
}
