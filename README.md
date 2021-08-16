# Emby-fix-dateadded-gpl
Public GPL version. Fix the albums date added using one of its songs date added.

# Hypothesis:
  1. The files creation date and last modified date of the files, folders and sub folders are correct and like you wanted them.
  2. The server is using SSL.
  3. You have access to emby Server with a admin user
  
# Dependencies (use npm):
1. "node": "^16.6.1",
2. "request": "^2.88.2",
3. "winston": "^3.3.3",
4. "winston-daily-rotate-file": "^4.5.5"

# Configuration befor starting
1. Configure the api key in /src/data/mb-api-token.json
2. Configure "embyUserId", "embyDeviceId", "embyMusicAlbumParentId", "embyServerHost" and "embyServerPort" in /src/data/mb-device-config.json

## API key
Please follow the guide here: https://github.com/MediaBrowser/Emby/wiki/Api-Key-Authentication and paste the API key in the json file.

## embyUserId
Go into the user profile with the admin rights, check the URL, you'll see the embyUserId. Copy and paste it in the config file.
![image](https://user-images.githubusercontent.com/6174175/129600968-ec282958-555e-4c85-8fe8-ea22c8d81cce.png)

## embyDeviceId
1. Go into the dashboard
2. In the Devices section, click on Devices (as in screenshot)
3. And select the last device you used to connect with your user account (it does not really matter)
4. Check in the url, you'll see the id. Copy and paste it in the config file.
![image](https://user-images.githubusercontent.com/6174175/129601418-044b7076-4c96-4571-a8aa-5e0ab9fd5400.png)

## embyMusicAlbumParentId
Here it's all about the albums with the wrong added date.
1. From Home, go into Music library
![image](https://user-images.githubusercontent.com/6174175/129601648-5cf32abd-ea73-44d1-a1f5-e107b907c998.png)
2. Once in the music library, check the url, you should see parentId. Copy and paste this value in the config file.
![image](https://user-images.githubusercontent.com/6174175/129602289-dc326142-e8ca-4d0b-a50a-51df0e248f3d.png)

# Run
Please verify that you have the correct dependencies and the right NodeJS version.
node .\src\fix-mb-music-date_added.js
