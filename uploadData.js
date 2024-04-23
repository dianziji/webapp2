const MongoClient = require("mongodb").MongoClient;
const csv = require("csv-parser");
const fs = require("fs");
// MongoDB connection string
const url =
  "mongodb+srv://syang22:7LT1y9ExIy0MfhIn@cs120db.qz5se4e.mongodb.net/?retryWrites=true&w=majority&appName=cs120db";
// Database name
const dbName = "problemSet3-4";

async function uploadData() {
  const client = new MongoClient(url);

  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db(dbName);
    const collection = db.collection("places");

    const dataMap = new Map();

    // Read the CSV file and prepare the data
    fs.createReadStream("zips.csv")
      .pipe(csv(["place", "zip"]))
      .on("data", (row) => {
        const place = row.place.trim();
        const zip = row.zip.trim();
        if (dataMap.has(place)) {
          dataMap.get(place).add(zip);
        } else {
          dataMap.set(place, new Set([zip]));
        }
      })
      .on("end", async () => {
        // Process each place and their zip codes
        for (const [place, zipSet] of dataMap.entries()) {
          const zips = Array.from(zipSet);
          await collection.updateOne(
            { place: place },
            { $set: { place: place, zips: zips } },
            { upsert: true }
          );
          console.log(`Processed ${place} with zips: ${zips.join(", ")}`);
        }
        client.close();
      });
  } catch (err) {
    console.error(err);
    client.close();
  }
}

uploadData();
