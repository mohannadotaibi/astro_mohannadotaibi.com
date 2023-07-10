import https from "https";
import axios from "axios";
import fsPromisified from "fs/promises";
import fs from "fs";
import path from "path";
import icojs from 'icojs';
import sharp from 'sharp';


const favIconGrabberUrls = [
  "https://www.google.com/s2/favicons?sz=64&domain_url=",
  "https://api.faviconkit.com/",
  "https://favicongrabber.com/api/grab/",
  "https://www.google.com/s2/u/0/favicons?domain=",
  "https://favicon.mohannad-otaibi.workers.dev/convert?format=png&url=",
];

const axiosInstance = axios.create({
  maxRedirects: 35,
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

async function copyDummy(domain: string) {
  const urlObject = new URL(domain);
  const dummy = "public/assets/images/icons/generic.png";
  const targetDirectory = "public/assets/images/icons";
  const iconPath = path.join(targetDirectory, `${urlObject.hostname}.png`);

  await fsPromisified.copyFile(dummy, iconPath);
  return iconPath;
}

async function downloadIcon(iconUrl: string, iconPath: string) {
  const response = await axiosInstance.get(iconUrl, { responseType: "arraybuffer" });
  const buffer = Buffer.from(response.data);

  // check if the file is ico file by checking the stream or buffer content, if yes, convert to png
  const isIco = await icojs.isICO(buffer);
  console.log("isIco", isIco);
  if (isIco) {
    
    console.log("Converting ico to png");
    const frames = await icojs.parse(buffer);
    const firstFrame = frames[0];

    const pngBuffer = await sharp(firstFrame.buffer).png().toBuffer();

    // Save the PNG buffer as a file
    await sharp(pngBuffer).toFile(iconPath);
 
  }
  else{
    await fsPromisified.writeFile(iconPath, buffer);
  }

}

async function getIcon(url: string) {
    if (url === "#") {
        return "public/assets/images/icons/generic.png";
    }

    const targetDirectory = "public/assets/images/icons";
    const urlObject = new URL(url);
    const { origin, hostname } = urlObject;
    const iconPath = path.join(targetDirectory, `${hostname}.png`);

    if (fs.existsSync(iconPath)) {
      return iconPath;
    }

    try {             
        const iconUrl = `${favIconGrabberUrls[0]}${origin}`;
        await downloadIcon(iconUrl, iconPath);
        return iconPath;
    } 
    catch (error: any) {
      console.error("Error downloading icon:", iconPath, error.code, error.message);
      try {
        const iconUrl = `${origin}/favicon.ico`;
        await downloadIcon(iconUrl, iconPath);
        return iconPath;
      } 
      catch (error: any) {
        console.error("Error downloading fallback icon:", iconPath, error.code, error.message);
        return copyDummy(url);
      }
  
    }
}

export default getIcon;
