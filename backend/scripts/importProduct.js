import "dotenv/config";
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import productModel from "../models/productModel.js";
import connectDB from "../config/mongodb.js";
import connectCloudinary from "../config/cloudinary.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --------------------------------------------------
// PATHS
// --------------------------------------------------

const assetsFile = path.resolve(
    __dirname,
    "../../frontend/src/assets/assets.js"
);

const assetsDirectory = path.dirname(assetsFile);


// --------------------------------------------------
// READ PRODUCTS FROM assets.js
// --------------------------------------------------

const loadProductsFromAssets = () => {

    console.log("Reading assets.js...");

    let source = fs.readFileSync(assetsFile, "utf-8");

    /*
      assets.js contains imports like:

      import p_img1 from './p_img1.png'

      Node.js cannot directly import PNG files.

      So we convert:

      import p_img1 from './p_img1.png'

      into:

      const p_img1 = './p_img1.png'
    */

    source = source.replace(
        /import\s+(\w+)\s+from\s+['"](\.\/[^'"]+\.png)['"]\s*;?/g,
        (_, variableName, imagePath) => {
            return `const ${variableName} = ${JSON.stringify(imagePath)};`;
        }
    );


    /*
      Convert:

      export const assets =
      export const products =

      into normal variables.
    */

    source = source.replace(
        /export\s+const\s+/g,
        "const "
    );


    /*
      Expose products to our VM.
    */

    source += `
        globalThis.__products = products;
    `;


    const context = {};

    vm.runInNewContext(source, context);

    return context.__products;
};


// --------------------------------------------------
// UPLOAD IMAGE TO CLOUDINARY
// --------------------------------------------------

const uploadImage = async (imagePath) => {

    const result = await cloudinary.uploader.upload(
        imagePath,
        {
            resource_type: "image",
        }
    );

    return result.secure_url;
};


// --------------------------------------------------
// MAIN IMPORT FUNCTION
// --------------------------------------------------

const importProducts = async () => {

    try {

        console.log("\n====================================");
        console.log("      PRODUCT IMPORT STARTING");
        console.log("====================================\n");


        // ------------------------------------------
        // Connect MongoDB
        // ------------------------------------------

        console.log("Connecting to MongoDB...");

        await connectDB();

        console.log("MongoDB connected.\n");


        // ------------------------------------------
        // Configure Cloudinary
        // ------------------------------------------

        console.log("Connecting to Cloudinary...");

        await connectCloudinary();

        console.log("Cloudinary configured.\n");


        // ------------------------------------------
        // Load products
        // ------------------------------------------

        const products = loadProductsFromAssets();

        console.log(`Found ${products.length} products.\n`);


        if (!products.length) {
            throw new Error("No products found in assets.js");
        }


        // ------------------------------------------
        // Prepare products
        // ------------------------------------------

        const productsToInsert = [];


        for (let i = 0; i < products.length; i++) {

            const product = products[i];

            console.log(
                `[${i + 1}/${products.length}] ${product.name}`
            );


            // --------------------------------------
            // Check if product already exists
            // --------------------------------------

            const existingProduct = await productModel.findOne({
                name: product.name,
                price: Number(product.price),
                date: Number(product.date)
            });


            if (existingProduct) {

                console.log("   ↳ Already exists. Skipping.\n");

                continue;
            }


            // --------------------------------------
            // Upload images
            // --------------------------------------

            const imageUrls = [];


            for (const imageReference of product.image) {

                /*
                  imageReference will be something like:

                  "./p_img1.png"

                  or:

                  "./p_img2_1.png"
                */

                const imagePath = path.resolve(
                    assetsDirectory,
                    imageReference
                );


                if (!fs.existsSync(imagePath)) {

                    throw new Error(
                        `Image not found: ${imagePath}`
                    );

                }


                console.log(
                    `   ↳ Uploading ${path.basename(imagePath)}...`
                );


                const imageUrl = await uploadImage(imagePath);

                imageUrls.push(imageUrl);


                console.log("   ↳ Upload complete.");
            }


            // --------------------------------------
            // Convert product format
            // --------------------------------------

            const productData = {

                name: product.name,

                description: product.description,

                price: Number(product.price),

                image: imageUrls,

                category: product.category,

                subCategory: product.subCategory,

                sizes: product.sizes,

                bestSeller: Boolean(product.bestseller),

                date: Number(product.date)

            };


            productsToInsert.push(productData);


            console.log("   ↳ Product prepared.\n");
        }


        // ------------------------------------------
        // Insert into MongoDB
        // ------------------------------------------

        if (productsToInsert.length === 0) {

            console.log(
                "\nNo new products to insert."
            );

        } else {

            console.log(
                `\nInserting ${productsToInsert.length} products into MongoDB...`
            );


            await productModel.insertMany(
                productsToInsert
            );


            console.log(
                `Successfully inserted ${productsToInsert.length} products.`
            );
        }


        // ------------------------------------------
        // Finished
        // ------------------------------------------

        console.log("\n====================================");
        console.log("       PRODUCT IMPORT COMPLETE");
        console.log("====================================\n");


    } catch (error) {

        console.error("\nIMPORT FAILED");
        console.error(error);

        process.exitCode = 1;

    } finally {

        await mongoose.connection.close();

        console.log("MongoDB connection closed.");

    }
};


importProducts();