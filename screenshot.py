from os import path, makedirs
from urllib.request import urlretrieve
from urllib.parse import urlsplit
from requests import get
from bs4 import BeautifulSoup
import piexif
from re import sub

def start():
    uInput = input('Enter a Steam Profile URL: ')
    if not uInput.endswith('/'):
        uInput = uInput + '/'
    if checkURL(uInput):
        pageGrab(uInput, 1)
    else:
        start()

def checkURL(url):
    if url.startswith('https://steamcommunity.com/id/' or 'https://steamcommunity.com/profiles/'):
        return 1
    else:
        print('The inserted value is not a valid Steam URL.')
        return 0

def string_to_array(string):
    stringArray = list(string)
    asciiArray = ()
    for letter in stringArray:
        asciiArray = asciiArray + (ord(letter), 0)
    asciiArray = asciiArray + (0, 0)
    return asciiArray

def set_desc(imgPath, message):
    exif_dict = piexif.load(imgPath)
    exif_dict['0th'][40092] = string_to_array(message)
    exif_bytes = piexif.dump(exif_dict)
    piexif.insert(exif_bytes, imgPath)
    return 1

hrefs = []

def pageGrab(url, n, magicalNumber=1):
    page = BeautifulSoup(get('%sscreenshots/?p=%dappid=0&sort=newestfirst&browsefilter=myfiles&view=grid' % (url, n)).content, "html.parser") #change for a faster parser?
    if(magicalNumber == 1 and len(page.select('a.pagingPageLink')) != 0):
        magicalNumber = int(page.select_one('a.pagingPageLink:nth-last-of-type(2)').getText())
    print('Analyzing page %d of %d' % (n, magicalNumber))
    for screenshot in page.select('a.profile_media_item.modalContentLink.ugc'):
        hrefs.append(screenshot['href'])
    if(len(hrefs) == 0):
        print("ERROR: The screenshots page could not be reached. This is probably due to an invalid URL or to privacy settings. Please make sure that the URL is correct and that the inserted profile's screenshots are publicly available.")
        return 0
    if(n == magicalNumber):
        for count, url in enumerate(hrefs, start=1):
            print('Download screenshot: %d of %d' % (count, len(hrefs)))
            screenshotPage = BeautifulSoup(get(url).content, "html.parser")
            folderName = '%s (%s)' % (screenshotPage.select_one('.screenshotAppName > a').getText(), screenshotPage.select_one('body > div.responsive_page_frame.with_header > div.responsive_page_content > div.responsive_page_template_content > div.apphub_HomeHeaderContent > div.apphub_HeaderTop > div.apphub_OtherSiteInfo.responsive_hidden > a')['data-appid'])
            if any(character in folderName for character in r'/[<>:"\/\\|?*]+/g'):
                folderName = sub(r'[<>:"\/\\|?*]+', '', folderName)
            screenshotURL = screenshotPage.select_one('.actualmediactn > a')['href']
            fileDir = '%s/%s.jpg' % (folderName, urlsplit(screenshotURL).path.split("/")[3])
            if not path.exists(folderName): #I believe this way of creating folders is fine because there can't be two apps with the same id (right?!)
                makedirs(folderName)
            if not path.exists(fileDir):
                urlretrieve(screenshotURL, fileDir)
                screenshotDescription = screenshotPage.select_one('div.screenshotDescription')
                if screenshotDescription is not None:
                    set_desc(fileDir, screenshotDescription.getText())
        return 1
    else:
        return pageGrab(url, n + 1, magicalNumber)

start()