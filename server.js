const path = require("path"); // Included by Glitch by default

const base45 = require("base45");
const cbor = require("cbor");
const pako = require("pako");
const multer = require("fastify-multer");

const upload = multer({});

const twoddoc = require('./2ddoc');

// Generated by Glitch at setup - BEGIN

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // set this to true for detailed logging:
  logger: true
});

// Setup our static files
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// point-of-view is a templating manager for fastify
fastify.register(require("point-of-view"), {
  engine: {
    handlebars: require("handlebars")
  }
});
// Generated by Glitch at setup - END


fastify.register(multer.contentParser);

fastify.route({
  method: "POST",
  url: "/decode",
  /*schema: {
    body: {
      type : 'object',
      properties : {
        sessionId: { type: 'integer' },
        //url: { type: 'string' },
        dataNeeded: { type: 'string', "enum": ["all", "raw"] }
      }
    }
  },*/
  preHandler: upload.single("greenpasscode"),
  handler: function(request, reply) {
    const imgBuffer = request.file.buffer;
    const dataWanted = request.body.dataNeeded;
    const sessionId = request.body.sessionId;
    async function decodeImportedImage(imageBuffer, dataNeeded, sessionId) {
      await imageBuffer;

      const imagePromise = new Promise((resolve, reject) => {
        try {
          const Jimp = require("jimp");
          new Jimp(imageBuffer, async (err, image) => {
            const width = image.bitmap.width;
            const height = image.bitmap.height;

            if (width > height) {
              if (width > 400) {
                await image.resize(400, Jimp.AUTO);
              }

              if (image.bitmap.height < 400) {
                await image.resize(Jimp.AUTO, 400);
              }
            } else {
              if (height > 400) {
                await image.resize(Jimp.AUTO, 400);
              }

              if (image.bitmap.width < 400) {
                await image.resize(400, Jimp.AUTO);
              }
            }

            if (image && image.bitmap) return resolve(image.bitmap);
            else return resolve();
          });
        } catch (e) {
          return resolve();
        }
      });

      const imageData = await imagePromise;
      console.log(imageData);
      if (!imageData) return false;

      const {
        MultiFormatReader,
        BarcodeFormat,
        DecodeHintType,
        RGBLuminanceSource,
        BinaryBitmap,
        HybridBinarizer
      } = require("@zxing/library");
      const formats = [BarcodeFormat.QR_CODE];
      const hints = new Map();

      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new MultiFormatReader();
      reader.setHints(hints);

      const len = imageData.width * imageData.height;
      const luminancesUint8Array = new Uint8ClampedArray(len);

      for (let i = 0; i < len; i++) {
        luminancesUint8Array[i] =
          ((imageData.data[i * 4] +
            imageData.data[i * 4 + 1] * 2 +
            imageData.data[i * 4 + 2]) /
            4) &
          0xff;
      }

      const luminanceSource = new RGBLuminanceSource(
        luminancesUint8Array,
        imageData.width,
        imageData.height
      );
      const binaryBitmap = new BinaryBitmap(
        new HybridBinarizer(luminanceSource)
      );
      const decoded = reader.decode(binaryBitmap);
      if (!decoded || !decoded.text) return false;

      console.log(decoded.text);
      const decodedUrl = decoded.text;
      console.log(decodedUrl);
      //reply.send(decodedUrl);
      if (dataNeeded == "raw") {
        reply.send({
          sessionId: sessionId,
          response: decodedUrl
        });
      }
      if (dataNeeded == "all") {
        if (decodedUrl.startsWith("HC1:")) {
          let greenpassBody = decodedUrl.slice(4);

          let greenpassBodyDecoded = base45.decode(greenpassBody);

          let output = pako.inflate(greenpassBodyDecoded);

          const results = cbor.decodeAllSync(output);

          [headers1, headers2, cbor_data, signature] = results[0].value;

          const greenpassData = cbor.decodeAllSync(cbor_data);

          reply.send({
            sessionId: sessionId,
            data: greenpassData[0].get(-260).get(1),
            raw: decodedUrl
          });
        } else {
          reply.send({
            sessionId: sessionId,
            response: await twoddoc.parse(decodedUrl)
          });
          
        }
      } else {
        reply.send({
          sessionId: sessionId,
          response: decodedUrl
        });
      }
    }
    decodeImportedImage(imgBuffer, dataWanted, sessionId);
  }
});

// Our main GET home page route, pulls from src/pages/index.hbs
fastify.get("/", function(request, reply) {
  // params is an object we'll pass to our handlebars template
  let params = {
    greeting: "Hello Decode Green Pass (from GET) !"
  };
  // request.query.paramName <-- a querystring example
  reply.view("/src/pages/index.hbs", params);
});

// A POST route to handle form submissions
fastify.post("/", function(request, reply) {
  let params = {
    greeting: "Hello Decode Green Pass (from POST) !"
  };
  // request.body.paramName <-- a form post example
  reply.view("/src/pages/index.hbs", params);
});


const getOptions = {
  schema: {
    query: {
      sessionId: { type: 'integer' },
      url: { type: 'string' },
      dataNeeded: { type: 'string', "enum": ["all", "raw"] }
    }
  }
};

fastify.get("/readQrFromUrl", getOptions, async (request, reply) => {
  const url = request.query.url;

  const sessionId = request.query.sessionId;
  const dataNeeded = request.query.dataNeeded;
  try {
    if (!url) return "no url provided";
    const extension =
      url.substr(-4).toLowerCase() === "jpeg"
        ? "jpg"
        : url.substr(-3).toLowerCase();
    if (extension !== "jpg" && extension !== "png" && extension !== "gif")
      return "wrong extension : jpg, png or gif only supported";
    const requestPromise = new Promise((resolve, reject) => {
      try {
        const request = require("request").defaults({ encoding: null });
        request.get(url, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            return resolve(body);
          } else {
            return resolve();
          }
        });
      } catch (e) {
        return resolve();
      }
    });

    const imageBuffer = await requestPromise;
    console.log(imageBuffer);
    if (!imageBuffer) return "cant load image buffer";

    const imagePromise = new Promise((resolve, reject) => {
      try {
        const Jimp = require("jimp");
        new Jimp(imageBuffer, async (err, image) => {
          const width = image.bitmap.width;
          const height = image.bitmap.height;

          if (width > height) {
            if (width > 400) {
              await image.resize(400, Jimp.AUTO);
            }

            if (image.bitmap.height < 400) {
              await image.resize(Jimp.AUTO, 400);
            }
          } else {
            if (height > 400) {
              await image.resize(Jimp.AUTO, 400);
            }

            if (image.bitmap.width < 400) {
              await image.resize(400, Jimp.AUTO);
            }
          }

          if (image && image.bitmap) return resolve(image.bitmap);
          else return resolve();
        });
      } catch (e) {
        return resolve();
      }
    });

    const imageData = await imagePromise;
    console.log(imageData);
    if (!imageData) return "cant load image data";

    const {
      MultiFormatReader,
      BarcodeFormat,
      DecodeHintType,
      RGBLuminanceSource,
      BinaryBitmap,
      HybridBinarizer
    } = require("@zxing/library");

    const formats = [BarcodeFormat.QR_CODE];
    const hints = new Map();

    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const len = imageData.width * imageData.height;
    const luminancesUint8Array = new Uint8ClampedArray(len);

    for (let i = 0; i < len; i++) {
      luminancesUint8Array[i] =
        ((imageData.data[i * 4] +
          imageData.data[i * 4 + 1] * 2 +
          imageData.data[i * 4 + 2]) /
          4) &
        0xff;
    }

    const luminanceSource = new RGBLuminanceSource(
      luminancesUint8Array,
      imageData.width,
      imageData.height
    );
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const decoded = reader.decode(binaryBitmap);
    if (!decoded || !decoded.text) return "no qr code detected";

    console.log(decoded.text);
    const decodedUrl = decoded.text;

    if (dataNeeded == "raw") {
      return {
        sessionId: sessionId,
        response: decodedUrl
      };
    }
    if (dataNeeded == "all") {
      if (decodedUrl.startsWith("HC1:")) {
        let greenpassBody = decodedUrl.slice(4);

        let greenpassBodyDecoded = base45.decode(greenpassBody);

        let output = pako.inflate(greenpassBodyDecoded);

        const results = cbor.decodeAllSync(output);

        [headers1, headers2, cbor_data, signature] = results[0].value;

        const greenpassData = cbor.decodeAllSync(cbor_data);

        console.log(greenpassData[0].get(-260).get(1));
        return {
          sessionId: sessionId,
          data: greenpassData[0].get(-260).get(1),
          raw: decodedUrl
        };
      } else {        
        reply.send({
            sessionId: sessionId,
            response: await twoddoc.parse(decodedUrl)
          });
      }
    }
  } catch (err) {
    console.log(err);
    return err;
  }
});

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
