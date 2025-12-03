import { NextRequest, NextResponse } from 'next/server';
import { removeBackground, generateInpaint } from '@/lib/stability';
import { generateCreativePrompts, generateCaption } from '@/lib/gemini';
import sharp from 'sharp';

export const maxDuration = 60; // Allow 60 seconds for execution (Vercel/Next.js limit)

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

        // 1. Convert inputs to Buffers
        const productBuffer = Buffer.from(await productImage.arrayBuffer());
        const logoBuffer = Buffer.from(await logoImage.arrayBuffer());

        // 2. Remove Background from Product (if needed)
        // For hackathon, we assume we always want to ensure a clean cutout
        console.log('Removing background...');
        const cleanProductBuffer = await removeBackground(productBuffer);

        // 3. Generate Prompts
        console.log('Generating prompts...');
        const prompts = await generateCreativePrompts(productCategory, 3);

        // 4. Prepare for Inpainting
        // We need to place the product on a 1024x1024 canvas and create a mask
        const canvasSize = 1024;

        // Resize product to fit nicely (e.g., 600px max dimension)
        const resizedProduct = await sharp(cleanProductBuffer)
            .resize(600, 600, { fit: 'inside' })
            .toBuffer();

        const productMetadata = await sharp(resizedProduct).metadata();
        const productWidth = productMetadata.width || 0;
        const productHeight = productMetadata.height || 0;

        // Create a transparent canvas with the product centered
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

        // Create the Mask: White background (to be filled), Black product (to be kept)
        // Stability AI Mask: "Pixels with a value of 0 (black) are preserved, while pixels with a value of 255 (white) are replaced."
        // So we want the PRODUCT to be BLACK, and the REST to be WHITE.

        // First, create a white canvas
        const whiteCanvas = await sharp({
            create: {
                width: canvasSize,
                height: canvasSize,
                channels: 3,
                background: { r: 255, g: 255, b: 255 }
            }
        }).png().toBuffer();

        // Now, we need the alpha channel of the composited image to be the mask.
        // Where alpha is > 0 (product), we want BLACK.
        // Where alpha is 0 (empty), we want WHITE.

        // Let's use sharp to extract the alpha channel
        const alphaChannel = await sharp(compositedImage)
            .extractChannel(3) // Alpha channel
            .toBuffer();

        // Invert the alpha channel: Product (opaque) becomes Black (0), Background (transparent) becomes White (255)
        const maskBuffer = await sharp(alphaChannel)
            .negate()
            .toFormat('png')
            .toBuffer();

        // 5. Generate Variations Loop
        const results = [];

        for (const prompt of prompts) {
            console.log(`Generating variation for prompt: ${prompt}`);

            // Generate Background
            const generatedImageBuffer = await generateInpaint(compositedImage, maskBuffer, prompt);

            // Overlay Logo
            // Resize logo to be small (e.g., 150px width)
            const resizedLogo = await sharp(logoBuffer)
                .resize(150, null) // Auto height
                .toBuffer();

            const finalImageBuffer = await sharp(generatedImageBuffer)
                .composite([{
                    input: resizedLogo,
                    gravity: 'southeast',
                    blend: 'over'
                    // You could add padding/offsets here if needed, but gravity southeast puts it in bottom right
                }])
                .png()
                .toBuffer();

            // Generate Caption
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
        return NextResponse.json(
            { error: error.message || 'Something went wrong' },
            { status: 500 }
        );
    }
}
