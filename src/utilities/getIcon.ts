import https from 'https';
import axios from 'axios';
import fs from 'fs';
import fsPromisified from 'fs/promises';

import path from 'path';

const favIconGrabberUrls = [
  'https://www.google.com/s2/favicons?sz=64&domain_url=',
  'https://api.faviconkit.com/',
  'https://favicongrabber.com/api/grab/',
  'https://www.google.com/s2/u/0/favicons?domain=',
  'https://favicon.mohannad-otaibi.workers.dev/convert?format=png&url=',
]

const axiosInstance = axios.create({
    maxRedirects: 35, // Set the maximum number of redirects (adjust as needed)
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  
  });

  axiosInstance.interceptors.request.use((config) => {
    console.log('Request:', config.url);
    return config;
  });
  
  axiosInstance.interceptors.response.use((response) => {
    console.log('Response:', response.request.res.responseUrl);
    return response;
  });
  


  async function copyDummy(domain: string) {
    console.log('domain', domain)
    const urlObject = new URL(domain);

    const dummy = 'public/assets/images/icons/generic.svg';
    const targetDirectory = 'public/assets/images/icons';
    const iconPath = path.join(targetDirectory, `${urlObject.hostname}.png`);
    await fsPromisified.copyFile(dummy, iconPath);
    console.log(`Dummy was copied to ${iconPath}`);
    return iconPath;
  }

  
async function getIcon(url: string) {
    // check if public/assets/images/icons contains the www.site.com.png or not
    if(url === '#'){
      return 'public/assets/images/icons/generic.svg';
    }
    const targetDirectory = 'public/assets/images/icons';

    try {
      //console.log('subject url error', url);
      const urlObject = new URL(url);
      const { protocol, origin, href, host, hostname } = urlObject;
      const iconPath = path.join(targetDirectory, `${hostname}.png`);
      // if yes then do nothing
      if (fs.existsSync(iconPath)) {
        console.log('Icon already exists');
          return iconPath;
      }
      // if not then download it
      console.log('Icon does not exist');
      const iconUrl = `${favIconGrabberUrls[0]}${origin}`;
    
      console.log('Downloading icon');
      //console.log(iconUrl);
      const response = await axios.get(iconUrl, { responseType: 'stream' });
      response.data.pipe(fs.createWriteStream(iconPath));
      console.log('Icon downloaded');
      // return the path of the image
      return iconPath;
    } catch (error: any) {
      const errorObjectJson = {
        url,
        error: {
          code: error.code,
          message: error.message,
        },
      }
      let path;
      switch(error.code){
        case 'ENOTFOUND':
          path = await getIcon2(url);
          return path;
          break;
        case 'ERR_INVALID_URL':
          path = await copyDummy(url);
          return path;
        case 'ERR_BAD_REQUEST':
          path = await getIcon2(url);
          return path;
          break;
        default:
          console.error('Icon not found', errorObjectJson);
      }
    }
}

// function in case of error bad request will try to grab favicon.ico directly from the origin url without favicongrabber array
async function getIcon2(url: string) {
  // will not check if available or not, since that is already done
  const targetDirectory = 'public/assets/images/icons';
  try {
    const targetDirectory = 'public/assets/images/icons';

    const urlObject = new URL(url);
    const { origin, hostname } = urlObject;
    const iconPath = path.join(targetDirectory, `${hostname}.png`);
    const iconUrl = `${origin}/favicon.ico`;
    const response = await axios.get(iconUrl, { responseType: 'stream' });
      response.data.pipe(fs.createWriteStream(iconPath));
      console.log('Icon downloaded');
      // return the path of the image
      return iconPath;

  } catch (error: any) {
    const errorObjectJson = {
      url,
      error: {
        code: error.code,
        message: error.message,
      },
    }
        
    const path = await copyDummy(url);
    return path;
  }
}

export default getIcon;
