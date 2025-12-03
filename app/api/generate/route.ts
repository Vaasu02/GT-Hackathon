import { NextRequest, NextResponse } from 'next/server';
import { removeBackground, generateInpaint } from '@/lib/stability';
import { generateCreativePrompts, generateCaption } from '@/lib/gemini';
import sharp from 'sharp';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const productImage = formData.get('productImage') as File;
        const logoImage = formData.get('logoImage') as File;
        const productCategory = formData.get('productCategory') as string;
        const productName = formData.get('productName') as string;

        if (!productImage || !logoImage || !productCategory) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }


        const productBuffer = Buffer.from(await productImage.arrayBuffer());
        const logoBuffer = Buffer.from(await logoImage.arrayBuffer());


        console.log('Removing background...');
        const cleanProductBuffer = await removeBackground(productBuffer);


        console.log('Generating prompts...');
        const prompts = await generateCreativePrompts(productCategory, 6);


        const canvasSize = 1024;


        const resizedProduct = await sharp(cleanProductBuffer)
            .resize(600, 600, { fit: 'inside' })
            .toBuffer();

        const productMetadata = await sharp(resizedProduct).metadata();
        const productWidth = productMetadata.width || 0;
        const productHeight = productMetadata.height || 0;


        const compositedImage = await sharp({
            create: {
                width: canvasSize,
                height: canvasSize,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([{ input: resizedProduct, gravity: 'center' }])
            .png()
            .toBuffer();


        const whiteCanvas = await sharp({
            create: {
                width: canvasSize,
                height: canvasSize,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        }).png().toBuffer();


        const alphaChannel = await sharp(compositedImage)
            .extractChannel(3)
            .toBuffer();


        const maskBuffer = await sharp(alphaChannel)
            .negate()
            .toFormat('png')
            .toBuffer();


        const results = [];

        for (const prompt of prompts) {
            console.log(`Generating variation for prompt: ${prompt}`);


            const generatedImageBuffer = await generateInpaint(compositedImage, maskBuffer, prompt);


            const resizedLogo = await sharp(logoBuffer)
                .resize(150, null)
                .toBuffer();

            const finalImageBuffer = await sharp(generatedImageBuffer)
                .composite([{
                    input: resizedLogo,
                    gravity: 'southeast',
                    blend: 'over'
                }])
                .png()
                .toBuffer();


            const caption = await generateCaption(productName, prompt);

            results.push({
                image: `data:image/png;base64,${finalImageBuffer.toString('base64')}`,
                caption,
                prompt
            });
        }

        return NextResponse.json({ results });

    } catch (error: any) {
        console.error('Generation Error:', error);

        // Handling Stability AI Payment Required (402)
        if (error.response?.status === 402) {
            return NextResponse.json(
                { error: 'Stability AI credits exhausted. Please check your API key balance.' },
                { status: 402 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Something went wrong' },
            { status: 500 }
        );
    }
}
