/* jslint node: true, esversion: 2017 */
/* globals process */
"use strict";

const { BlobServiceClient } = require("@azure/storage-blob");

const containerName = "content"; 
const blobName = "posts.json";    

async function getBlobClient(connectionString) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    // WICHTIG: Hier stand vorher .getBlobClient - jetzt .getBlockBlobClient
    return blobServiceClient.getContainerClient(containerName).getBlockBlobClient(blobName);
}

module.exports = async function (context, req) {
    const headline = req.body.headline;
    const url = req.body.url;

    if (!headline || !url) {
        context.res = { status: 400, body: "Bitte headline und url angeben." };
        return;
    }
    
    const connectionString = process.env.STORAGE_CONNECTION_STRING;
    if (!connectionString) {
        context.res = { status: 500, body: "Storage-Verbindung nicht konfiguriert." };
        return;
    }

    try {
        const blobClient = await getBlobClient(connectionString);
        
        let posts = [];
        // 1. Versuchen, bestehende Posts zu laden
        try {
            const downloadBlockBlobResponse = await blobClient.downloadToBuffer();
            posts = JSON.parse(downloadBlockBlobResponse.toString());
        } catch (error) {
            context.log("posts.json nicht gefunden oder leer, erstelle neue Datei.");
        }

        // 2. Neuen Post hinzufügen
        posts.unshift({
            headline: headline,
            url: url,
            timestamp: new Date().toISOString()
        });

        // 3. Aktualisierte Liste zurückschreiben
        const data = JSON.stringify(posts, null, 2);
        
        // Jetzt funktioniert .upload(), weil blobClient ein BlockBlobClient ist
        await blobClient.upload(data, Buffer.byteLength(data), {
            blobHTTPHeaders: { blobContentType: "application/json" }
        });

        context.res = { status: 200, body: "Erfolgreich gesendet." };

    } catch (error) {
        context.res = { status: 500, body: "Fehler beim Schreiben des Blobs: " + error.message };
    }
};
