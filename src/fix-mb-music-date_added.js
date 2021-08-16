// @ts-check
/**
 * Main script to do everything.
 * It fixes Date Added in the metadata of the album by using the one from one of the songs.
 * Assumption: during import, the song Date Added is reflecting the real date of the file. 
 */

'use strict';
const OtherUtils = require('./utils/otherutils');
const logger = require('./utils/logutils.js')(__filename);
const ApiUtils = require('./utils/apiutils');
const fs = require('fs');

const keyfile = require('./data/mb-api-token.json');
const api_key = keyfile.apikey;
const configfile = require('./data/mb-device-config.json');

const const_api_method_get = 'GET';
const const_api_method_post = 'POST';
const const_api_method_delete = 'DELETE';

const tag_bot = 'BotFixMbDateAdded';
const user_agent = 'NodeJSBot';
const client_original = 'Emby%20Web';
const client_bot = 'NodeJSBot';
const emby_device_id = configfile.embyDeviceId;
const emby_user_id = configfile.embyUserId;
const emby_musicalbums_parentid = configfile.embyMusicAlbumParentId;

const BASE_URL = 'https://homenuc1:8920/emby/Users/' + emby_user_id;
const step_album_list = 50;



const csvSep = ',';

main();

async function main() {
    console.debug(tag_bot + ' started');
    logger.debug(tag_bot + ' started');

    let aDate = new Date();
    let aDateFileString = aDate.toISOString().split('T')[0];
    const csvLog = fs.createWriteStream(aDateFileString + '-fix-mb-music-date_added.csv', {
        flags: 'a', // 'a' means appending (old data will be preserved)
        encoding: 'utf8',
    });
    csvLog.write('nb' + csvSep + 'total' + csvSep + 'albumId' + csvSep + 'albumName' + csvSep + 'link' + csvSep + 'albumCreatedDateTime' + csvSep + 'albumCreatedDate' + csvSep + 'albumCreatedTime' + csvSep + 'albumCreatedTimestamp'
        + csvSep + 'songId' + csvSep + 'songName' + csvSep + 'songCreatedDateTime' + csvSep + 'songCreatedDate' + csvSep + 'songCreatedTime' + csvSep + 'songCreatedTimestamp'
        + csvSep + 'isDiff' + csvSep + 'updated' + csvSep + 'tag' + csvSep + 'statusCode' + csvSep + 'statusMessage' + csvSep + 'comment');
    csvLog.write('\n');

    let index_albums = 0;

    let req_get_albums_total = 'Items?SortBy=DateCreated%2CSortName' + '&SortOrder=Descending'
        + '&IncludeItemTypes=MusicAlbum' + '&Recursive=true' + '&Fields=BasicSyncInfo%2CCanDelete%2CPrimaryImageAspectRatio'
        + '&ImageTypeLimit=1' + '&EnableImageTypes=Primary%2CBackdrop%2CThumb'
        + '&StartIndex=' + index_albums + '&ParentId=' + emby_musicalbums_parentid + '&Limit=' + 1
        + '&X-Emby-Client=' + client_original + '&X-Emby-Device-Name=Chrome&X-Emby-Device-Id=' + emby_device_id
        + '&X-Emby-Client-Version=4.6.4.0&X-Emby-Token=' + api_key;

    try {
        let respOne = await getMbData(req_get_albums_total, undefined, undefined);
        let max_records_albums = respOne.data.TotalRecordCount;

        let req_get_albums = 'Items?SortBy=DateCreated%2CSortName' + '&SortOrder=Descending'
            + '&IncludeItemTypes=MusicAlbum' + '&Recursive=true' + '&Fields=BasicSyncInfo%2CCanDelete%2CPrimaryImageAspectRatio'
            + '&ImageTypeLimit=1' + '&EnableImageTypes=Primary%2CBackdrop%2CThumb'
            + '&StartIndex=' + index_albums + '&ParentId=' + emby_musicalbums_parentid + '&Limit=' + max_records_albums
            + '&X-Emby-Client=' + client_original + '&X-Emby-Device-Name=Chrome&X-Emby-Device-Id=' + emby_device_id
            + '&X-Emby-Client-Version=4.6.4.0&X-Emby-Token=' + api_key;

        let respAlbums = await getMbData(req_get_albums, undefined, undefined);
        let maxAlbumsNb = respAlbums.data.Items.length + 1;

        for (let index = 0; index < respAlbums.data.Items.length; index++) {
            const element = respAlbums.data.Items[index];

            let albumId = element.Id;
            let serverId = element.ServerId;

            //get album metadata
            let request_album_metadata = buildRequestMetadata(albumId);

            let currentNb = index + 1;

            csvLog.write(currentNb + csvSep
                + maxAlbumsNb + csvSep
                + albumId + csvSep);

            let respAlbumMetadata = await getMbData(request_album_metadata, undefined, undefined);
            let albumMetaData = respAlbumMetadata.data;

            let albumDateCreatedString = albumMetaData.DateCreated;
            let albumDateCreatedDate = new Date(albumMetaData.DateCreated);

            csvLog.write(albumMetaData.Name + csvSep
                + 'https://homenuc1:8920/web/index.html#!/item?id=' + albumId + '&serverId=' + serverId + csvSep
                + albumDateCreatedString + csvSep
                + albumDateCreatedDate.toLocaleDateString() + csvSep
                + albumDateCreatedDate.toLocaleTimeString() + csvSep
                + albumDateCreatedDate.getTime() + csvSep
            )

            console.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | link: ' + 'https://homenuc1:8920/web/index.html#!/item?id=' + albumId + '&serverId=' + serverId);
            logger.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | link: ' + 'https://homenuc1:8920/web/index.html#!/item?id=' + albumId + '&serverId=' + serverId);

            console.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | dateCreated:' + albumDateCreatedString + ' | dateCreatedDate: ' + albumDateCreatedDate.toLocaleDateString() + ' ' + albumDateCreatedDate.toLocaleTimeString() + ' | timestamp: ' + albumDateCreatedDate.getTime());
            logger.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | dateCreated:' + albumDateCreatedString + ' | dateCreatedDate: ' + albumDateCreatedDate.toLocaleDateString() + ' ' + albumDateCreatedDate.toLocaleTimeString() + ' | timestamp: ' + albumDateCreatedDate.getTime());

            //list all songs in album
            let request_songs_in_album = 'Items?ParentId=' + albumId
                + '&Fields=PrimaryImageAspectRatio%2CCanDelete' + '&ImageTypeLimit=1&EnableTotalRecordCount=false'
                + '&X-Emby-Client=Emby%20Web' + '&X-Emby-Device-Name=Chrome' + '&X-Emby-Device-Id=' + emby_device_id + '&X-Emby-Client-Version=4.6.4.0'
                + '&X-Emby-Token=' + api_key;

            let respAlbumSongs = await getMbData(request_songs_in_album, undefined, undefined);
            if (respAlbumSongs.data.Items.length == 0 || respAlbumSongs.data.Items == undefined) {
                console.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'No songs in albumId: ' + albumId + ' | ' + albumMetaData.Name);
                logger.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'No songs in albumId: ' + albumId + ' | ' + albumMetaData.Name);

                csvLog.write('N/A' + csvSep //songId
                    + 'N/A' + csvSep //songName
                    + 'N/A' + csvSep //songDateCreatedString
                    + 'N/A' + csvSep //songNameDateCreatedDate
                    + 'N/A' + csvSep //songNameDateCreatedTime
                    + 'N/A' + csvSep //songNameTimestamp
                    + 'N/A' + csvSep //idDiff
                    + 'false' + csvSep //updated
                    + '' + csvSep //tag
                    + '' + csvSep //statusCode
                    + '' + csvSep //statusMessage
                    + 'No song found in that album cannot process' + csvSep //comment
                );
            } else {
                //get metadata from the first song only.
                let request_song_metadata = buildRequestMetadata(respAlbumSongs.data.Items[0].Id);
                let respFirstSongMetaData = await getMbData(request_song_metadata, undefined, undefined);

                let songDateCreatedString = respFirstSongMetaData.data.DateCreated;
                let songDateCreatedDate = new Date(respFirstSongMetaData.data.DateCreated);

                csvLog.write(respAlbumSongs.data.Items[0].Id + csvSep
                    + respAlbumSongs.data.Items[0].Name + csvSep
                    + songDateCreatedString + csvSep
                    + songDateCreatedDate.toLocaleDateString() + csvSep
                    + songDateCreatedDate.toLocaleTimeString() + csvSep
                    + songDateCreatedDate.getTime() + csvSep
                );

                console.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'songId: ' + respAlbumSongs.data.Items[0].Id + ' | Name: ' + respAlbumSongs.data.Items[0].Name + ' | dateCreated:' + songDateCreatedString + ' | dateCreatedDate: ' + songDateCreatedDate.toLocaleDateString() + ' ' + songDateCreatedDate.toLocaleTimeString() + ' | timestamp: ' + songDateCreatedDate.getTime());
                logger.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'songId: ' + respAlbumSongs.data.Items[0].Id + ' | Name: ' + respAlbumSongs.data.Items[0].Name + ' | dateCreated:' + songDateCreatedString + ' | dateCreatedDate: ' + songDateCreatedDate.toLocaleDateString() + ' ' + songDateCreatedDate.toLocaleTimeString() + ' | timestamp: ' + songDateCreatedDate.getTime());

                // the date added in album and song is different fix album!
                if (albumDateCreatedDate.getTime() != songDateCreatedDate.getTime()) {
                    // let newAlbumMetadata = albumMetaData;
                    // newAlbumMetadata.DateCreated = songDateCreatedString;

                    csvLog.write('true' + csvSep); //isDiff

                    let newAlbumMetadata = {
                        "Id": albumId,
                        "Name": albumMetaData.Name,
                        "ChannelNumber": "",
                        "OriginalTitle": "",
                        "ForcedSortName": "",
                        "CommunityRating": "",
                        "CriticRating": "",
                        "IndexNumber": null,
                        "AirsBeforeSeasonNumber": "",
                        "AirsAfterSeasonNumber": "",
                        "AirsBeforeEpisodeNumber": "",
                        "ParentIndexNumber": null,
                        "SortParentIndexNumber": "",
                        "SortIndexNumber": "",
                        "DisplayOrder": "",
                        "Album": albumMetaData.Album,
                        "AlbumArtists": albumMetaData.AlbumArtists,
                        "ArtistItems": albumMetaData.ArtistItems,
                        "Overview": "",
                        "Status": "",
                        "Genres": [
                            ""
                        ],
                        "Tags": [],
                        "TagItems": [],
                        "Studios": albumMetaData.Studios,
                        "PremiereDate": null,
                        "DateCreated": songDateCreatedDate.toISOString(),
                        "EndDate": null,
                        "ProductionYear": "",
                        "Video3DFormat": "",
                        "OfficialRating": "",
                        "CustomRating": "",
                        "LockData": false,
                        "LockedFields": [],
                        "ProviderIds": albumMetaData.ProviderIds,
                        "PreferredMetadataLanguage": "",
                        "PreferredMetadataCountryCode": "",
                        "Taglines": []
                    }

                    newAlbumMetadata.Tags = albumMetaData.Tags == undefined ? [] : albumMetaData.Tags;
                    newAlbumMetadata.Tags.push(tag_bot);
                    newAlbumMetadata.TagItems = albumMetaData.TagItems == undefined ? [] : albumMetaData.TagItems;
                    newAlbumMetadata.TagItems.push(tag_bot);

                    let request_new_album_metadata = 'Items/' + albumId + '?X-Emby-Client=' + client_bot
                        + '&X-Emby-Device-Name=Chrome' + '&X-Emby-Device-Id=' + emby_device_id + '&X-Emby-Client-Version=4.6.4.0'
                        + '&X-Emby-Token=' + api_key;

                    console.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | Prepare change: TRUE' + ' | link: ' + 'https://homenuc1:8920/web/index.html#!/item?id=' + albumId + '&serverId=' + serverId + '\n | old dateCreated:' + albumDateCreatedString + '\n | new dateCreated: ' + newAlbumMetadata.DateCreated + ' | tag: ' + tag_bot);
                    logger.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | Prepare change: TRUE' + ' | link: ' + 'https://homenuc1:8920/web/index.html#!/item?id=' + albumId + '&serverId=' + serverId + ' | old dateCreated:' + albumDateCreatedString + ' | new dateCreated: ' + newAlbumMetadata.DateCreated + ' | tag: ' + tag_bot);

                    let respConfirmPost = await postMbMetadata(request_new_album_metadata, JSON.stringify(newAlbumMetadata), undefined, undefined);
                    //let respConfirmPost = { statusCode: 204, statusMessage: 'No content' }; //FIXME to remove

                    csvLog.write('true' + csvSep //updated
                        + tag_bot + csvSep
                        + respConfirmPost.statusCode + csvSep
                        + respConfirmPost.statusMessage + csvSep
                        + 'Changed dateAdded: ' + albumDateCreatedDate.toISOString() + ' -> ' + songDateCreatedDate.toISOString() + csvSep
                    );

                    console.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | CHANGED: TRUE' + ' | statusCode: ' + respConfirmPost.statusCode + ' | statusMessage: ' + respConfirmPost.statusMessage + ' | link: ' + 'https://homenuc1:8920/web/index.html#!/item?id=' + albumId + '&serverId=' + serverId + '\n | old dateCreated:' + albumDateCreatedString + '\n | new dateCreated: ' + newAlbumMetadata.DateCreated + ' | tag: ' + tag_bot);
                    logger.debug('[' + currentNb + '/' + maxAlbumsNb + ']' + 'albumId: ' + albumId + ' | Name: ' + albumMetaData.Name + ' | CHANGED: TRUE' + ' | statusCode: ' + respConfirmPost.statusCode + ' | statusMessage: ' + respConfirmPost.statusMessage + ' | link: ' + 'https://homenuc1:8920/web/index.html#!/item?id=' + albumId + '&serverId=' + serverId + ' | old dateCreated:' + albumDateCreatedString + ' | new dateCreated: ' + newAlbumMetadata.DateCreated + ' | tag: ' + tag_bot);

                } else {
                    // not diff date - not doing anything
                    csvLog.write('false' + csvSep // diff
                        + 'false' + csvSep // changed?
                        + '' + csvSep //Tag
                        + '' + csvSep //statusCode
                        + '' + csvSep //statusMessage
                        + 'No changes as dates are the same' + csvSep
                    );

                }
            }
            csvLog.write('\n');
        }


    } catch (error) {
        console.log(error);
    }




}


async function getMbData(request, nbRetry, retryDelay) {
    if (nbRetry == undefined) nbRetry = 3;
    if (retryDelay == undefined) retryDelay = 1000;

    let data;
    const curHttpsOptions =
    {
        hostname: 'homenuc1',
        port: 8920,
        path: '/emby/Users/' + emby_user_id + '/' + request,
        method: const_api_method_get,
        headers: {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Connection': 'keep-alive',
        },
        rejectUnauthorized: false,
        requestCert: true,
    };

    data = await ApiUtils.callHttpsRequestInterface(curHttpsOptions, nbRetry, retryDelay);
    return data;
}

async function postMbMetadata(request, body, nbRetry, retryDelay) {
    if (nbRetry == undefined) nbRetry = 3;
    if (retryDelay == undefined) retryDelay = 1000;

    var Request = require('request');

    return new Promise((resolve, reject) => {
        Request.post({
            headers: { 'content-type': 'application/json', 'Accept': '*/*', 'Connection': 'keep-alive' },
            url: 'https://homenuc1:8920/emby/' + request,
            rejectUnauthorized: false,
            body: body
        }, function (error, response, body) {
            if (error != null || error != undefined) {
                // reject(error);
                throw error;

            }
            // console.log(response);
            console.log('Post response' + ' | statusCode: ' + response.statusCode + ' | message: ' + response.statusMessage);
            resolve(response);
        });
    });

}

function buildRequestMetadata(id) {

    return '/Items/' + id +
        '?Fields=ChannelMappingInfo' + '&X-Emby-Client' + client_bot + '&X-Emby-Device-Name=Chrome'
        + '&X-Emby-Device-Id=' + emby_device_id + '&X-Emby-Client-Version=4.6.4.0'
        + '&X-Emby-Token=' + api_key;

}

