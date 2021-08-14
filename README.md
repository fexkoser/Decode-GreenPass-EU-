# Decode GreenPass (EU)

Decode GreenPass allows you to decode Green Pass documents (QR Code and 2D Codes)


## What's in this project?

- `README.md`: That’s this file.
- `server.js`: The main server script for the app, especially the main APIs

## API usages

### Using the GET API 'readQrFromUrl'
If the file containing the code to decode is already stored (HTTPS / CDN or local HTTP server), then the easiest way to use the API is the GET API.
Here are the parameters used by the API
- `sessionId` : refers to any id from the system using the API, will be provided "untouched" in the result
- `url` : fullpath to image containing the QrCode (JPG / PNG / GIF formats only) / Url should be encoded
- `dataNeeded` : should be set to 'raw' or 'all' (lowercase only). 
  - When set to 'raw', result will contain raw content of QR Code (or 2D-Code)
  - When set to 'all', result will contain decoded content of QR Code (or 2D-Code)

#### Example
- /readQrFromUrl?sessionId=1&url=https://gir.st/blog/img/greenpass-demo.png&dataNeeded=all

#### Limitations so far on GET API
- url parameter should be "clean" and should not be URL encoded yet -> bug fix to come soon
- 2D-Code with "all" option not yet implemented -> to be improved soon (however 2D Code with 'raw' parameter works fine)

### Using the POST API 'decode'
You can use the POST API
Here are the parameters used by the API
- `UserId` : refers to any id from the system using the API, will be provided "untouched" in the result
- `buffer` : image content containing the QrCode (see sample)
- `dataNeeded` : should be set to 'raw' or 'all' (lowercase only). 
  - When set to 'raw', result will contain raw content of QR Code (or 2D-Code)
  - When set to 'all', result will contain decoded content of QR Code (or 2D-Code)




## You built this with Glitch!

[Glitch](https://glitch.com) is a friendly community where millions of people come together to build web apps and websites.

- Need more help? [Check out our Help Center](https://help.glitch.com/) for answers to any common questions.
- Ready to make it official? [Become a paid Glitch member](https://glitch.com/pricing) to boost your app with private sharing, more storage and memory, domains and more.
