import axios from 'axios';

const STABILITY_API_URL = 'https://api.stability.ai/v2beta/stable-image/generate/core';
const STABILITY_INPAINT_URL = 'https://api.stability.ai/v2beta/stable-image/edit/inpaint';
const REMOVE_BG_URL = 'https://api.stability.ai/v2beta/stable-image/edit/remove-background';

export const stabilityClient = axios.create({
    headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: 'image/*',
    },
    responseType: 'arraybuffer',
});

export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer as any]));
    formData.append('output_format', 'png');

    const response = await axios.postForm(REMOVE_BG_URL, formData, {
        headers: {
            Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
            Accept: 'image/*',
        },
        responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
}

export async function generateInpaint(
    imageBuffer: Buffer,
    maskBuffer: Buffer,
    prompt: string
): Promise<Buffer> {
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer as any]));
    formData.append('mask', new Blob([maskBuffer as any]));
    formData.append('prompt', prompt);
    formData.append('output_format', 'png');
    formData.append('mode', 'mask');

    const response = await axios.postForm(STABILITY_INPAINT_URL, formData, {
        headers: {
            Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
            Accept: 'image/*',
        },
        responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
}
