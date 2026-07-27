import sharp from 'sharp';

/**
 * resize fit gambar, gaada letterbox, di kasih space transparan, stream only
 * @param {import('stream').Readable} stream
 * @param {number} size
 */
export function resizeImage(stream, size = 48) {
    return stream.pipe(
        sharp()
            .resize(size, size, {
                fit: 'contain',
                position: 'centre',
                background: {
                    r: 0,
                    g: 0,
                    b: 0,
                    alpha: 0,
                },
            })
            .png()
    );
}